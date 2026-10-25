import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { directory, content, renderDefault, renderRebel } from './build.mjs';
import { renderPress, renderSitemap } from './pages.mjs';
import { renderStory, renderOurStory } from './stories.mjs';

const target = process.argv[2];
const repository = path.resolve(directory, '../..');
if (!target || !path.isAbsolute(target) || path.resolve(target) === repository || !existsSync(path.join(target, '.git'))) throw new Error('Provide a separate absolute Git worktree path. Never builds over the working checkout.');
const git = (...args) => execFileSync('git', ['-C', target, ...args], { encoding: 'utf8' }).trim();
const baseline = git('rev-parse', 'HEAD');
const previousManifest = path.join(target, 'tools/website/release-manifest.json');
if (git('status', '--porcelain') && (!existsSync(previousManifest) || JSON.parse(readFileSync(previousManifest)).baseline !== baseline)) throw new Error('Release worktree must be clean or contain this generated release');
const files = new Set();
function write(relative, data) {
  mkdirSync(path.dirname(path.join(target, relative)), { recursive: true });
  writeFileSync(path.join(target, relative), data);
  files.add(relative);
}
function copy(source, relative) {
  mkdirSync(path.dirname(path.join(target, relative)), { recursive: true });
  copyFileSync(source, path.join(target, relative));
  files.add(relative);
}
const runtime = ['default.css', 'components.css', 'rebel.css', 'pages.css', 'mode-boot.js', 'site.js', 'email-signup.js'];
const versions = {};
for (const name of runtime) {
  const text = readFileSync(path.join(directory, name), 'utf8').replaceAll('santa-claude-test-mode', 'santa-site-mode');
  write('site-assets/' + name, text);
  versions[name] = createHash('sha256').update(text).digest('hex').slice(0, 10);
}
const liveHome = execFileSync('git', ['-C', target, 'show', baseline + ':index.html'], { encoding: 'utf8' });
const analytics = liveHome.match(/<script\b[^>]*src="https:\/\/static\.cloudflareinsights\.com\/beacon\.min\.js"[^>]*><\/script>/)?.[0];
if (!analytics) throw new Error('Existing analytics not found; review before release');
const pages = {
  'index.html': renderDefault(content), 'rebel.html': renderRebel(content),
  'press.html': renderPress(content), 'story.html': renderStory(content), 'our-story.html': renderOurStory(content)
};
for (const [name, original] of Object.entries(pages)) {
  let html = original.replaceAll('../../', '').replaceAll(' | Local redesign test', '')
    .replace('content="noindex,nofollow"', `content="${['rebel.html', 'our-story.html'].includes(name) ? 'noindex,follow' : 'index,follow'}"`);
  for (const resource of runtime) html = html.replaceAll(new RegExp(`((?:src|href)=")${resource.replace('.', '\\.')}\\?v=[a-f0-9]+"`, 'g'), `$1site-assets/${resource}?v=${versions[resource]}"`);
  html = html.replace('</body>', analytics + '</body>');
  if (html.includes('build-stamp') || html.includes('Local redesign test') || html.includes('../../')) throw new Error('Test artifacts remain in ' + name);
  write(name, html);
}
write('sitemap.xml', renderSitemap(content));
const robots = execFileSync('git', ['-C', target, 'show', baseline + ':robots.txt'], { encoding: 'utf8' });
write('robots.txt', robots.includes('Disallow: /tools/website/') ? robots : robots.replace('Allow: /', 'Allow: /\nDisallow: /tools/website/'));

// Only add media absent from the live tree. Existing deployed media stays untouched.
const tracked = new Set(git('ls-tree', '-r', '--name-only', baseline).split('\n'));
const references = new Set();
for (const html of Object.keys(pages).map(name => readFileSync(path.join(target, name), 'utf8'))) {
  for (const match of html.matchAll(/(?:src|poster|href|data-src)="([^"#]+)"/g)) {
    if (/^(?:https?:|mailto:|data:)/.test(match[1])) continue;
    const relative = match[1].split(/[?#]/)[0];
    if (!relative) continue;
    if (relative.includes('..') || path.isAbsolute(relative)) throw new Error('Unsafe release reference: ' + relative);
    references.add(relative);
    if (files.has(relative) || tracked.has(relative)) continue;
    const source = relative.startsWith('assets/history/') ? path.join(directory, relative) : path.join(repository, relative);
    if (!existsSync(source)) throw new Error('Missing release dependency: ' + relative);
    copy(source, relative);
  }
}
// Keep the editable shared source and repeatable build with the release, not QA output.
for (const name of readdirSync(directory)) if (/\.(?:mjs|cjs|js|css|json)$/.test(name)) copy(path.join(directory, name), 'tools/website/' + name);
copy(path.join(directory, 'release-tests.cjs'), 'tests/site-mode.test.cjs');
for (const name of ['current-site.html', 'press-before-pass3.html']) copy(path.join(directory, 'source', name), 'tools/website/source/' + name);
for (const { photo } of content.history.strip) if (photo.src.startsWith('assets/history/')) copy(path.join(directory, photo.src), 'tools/website/' + photo.src);
write('tools/website/LAUNCH.md', `# Website release\n\nShared editable content is event-data.json and faq-data.json.\n\nBuild and check source with Node:\n\n    node tools/website/build.mjs\n    node tools/website/verify.mjs\n    node tools/website/verify-pass3.mjs\n    node tools/website/verify-email.mjs\n\nFor publication, use a separate clean worktree at current origin/main, then run:\n\n    node tools/website/prepare-release.mjs /absolute/path/to/release-worktree\n\nStage only files listed by the release manifest. Do not publish local QA outputs. Preserve current media, CNAME, analytics, and the existing calendar. No API credentials are used. A user reported the local MailerLite signup worked; the welcome automation is separate and was not activated by this release.\n\nRollback baseline: ${baseline}. Reverting the release commit restores the earlier website.\n`);
write('SITE_MODES.md', '# Website modes and source\n\nDefault is the fresh-visitor landing mode. Rebel uses the same page structure, facts, media and FAQ, with a dark theme and editorial copy overrides. Use ?mode=rebel, ?mode=default, or rebel.html for direct links. The toggle remembers the choice and switches in place. Standalone histories default to cream unless a mode is explicitly supplied. Press stays cream.\n\nEditable shared source and release instructions: tools/website/LAUNCH.md. Published styles and scripts: site-assets/. The MailerLite signup uses a direct CORS POST and inline response messages, without API credentials. Welcome-email automation is separate and has not been activated by this release.\n\nRun production checks with node --test tests/site-mode.test.cjs.\n');
const manifest = { baseline, files: [...files].sort(), references: [...references].sort(), publicPages: Object.keys(pages), signupTest: 'User reported local website signup worked', published: false };
writeFileSync(path.join(target, 'tools/website/release-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ target, baseline, files: manifest.files.length + 1, references: references.size, newMedia: manifest.files.filter(name => name.startsWith('assets/')) }, null, 2));
