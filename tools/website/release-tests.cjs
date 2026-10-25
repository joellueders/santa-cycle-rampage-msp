const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { test } = require('node:test');
const root = path.resolve(__dirname, '..');
const page = name => fs.readFileSync(path.join(root, name), 'utf8');
const html = page('index.html');
const boot = page('site-assets/mode-boot.js');
function visit(query = '', saved = null, blocked = false) {
  const document = { documentElement: { dataset: { pageMode: 'default' } } };
  vm.runInNewContext(boot, { document, location: { href: 'https://santacyclerampagemsp.org/' + query, search: query }, URL, URLSearchParams, localStorage: { getItem: () => { if (blocked) throw Error('Blocked'); return saved; }, setItem() {} } });
  return document.documentElement.dataset.siteMode;
}
test('fresh visits, direct mode links, remembered choice and blocked storage work', () => {
  assert.equal(visit(), 'default');
  assert.equal(visit('?mode=rebel'), 'rebel');
  assert.equal(visit('?mode=default', 'rebel'), 'default');
  assert.equal(visit('', 'rebel'), 'rebel');
  assert.equal(visit('', 'rebel', true), 'default');
});
test('shared event, calendar, media and reduced FAQ remain present', () => {
  assert.equal((html.match(/id="when-where"/g) || []).length, 1);
  assert.equal((html.match(/id="video-hero"/g) || []).length, 1);
  assert.equal((html.match(/<details data-faq-id=/g) || []).length, 6);
  assert.match(html, /href="santa-cycle-rampage-2026\.ics" download/);
  const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(schema.startDate, '2026-12-05T10:00:00-06:00');
  assert.equal(schema.isAccessibleForFree, true);
  assert.equal(schema.location, undefined);
  assert.equal(schema.endDate, undefined);
  assert.match(html, /Rebel Mode/);
  assert.match(html, /Fudge that! There’s something/);
});
test('all public pages have production metadata and no visible version stamp', () => {
  for (const name of ['index.html', 'rebel.html', 'press.html', 'story.html', 'our-story.html']) {
    const text = page(name);
    assert.doesNotMatch(text, /Local redesign test|class="build-stamp"|\.\.\//);
    assert.match(text, /static\.cloudflareinsights\.com\/beacon\.min\.js/);
    assert.match(text, /<link rel="canonical" href="https:\/\/santacyclerampagemsp.org\//);
    if (name !== 'rebel.html') assert.match(text, /name="robots" content="index,follow"/);
    assert.doesNotMatch(text, /class="badge"/);
  }
});
test('signup stays inline and uses the direct provider endpoint', () => {
  assert.equal((html.match(/>Keep me posted<\/button>/g) || []).length, 2);
  assert.match(html, /action="https:\/\/assets.mailerlite.com\/jsonp\/2739403\/forms\/202239538838374374\/subscribe"/);
  const controller = page('site-assets/email-signup.js');
  assert.match(controller, /event.preventDefault\(\)/);
  assert.match(controller, /redirect: 'error'/);
  assert.match(controller, /result.success === true/);
});
test('history pages have distinct copy and no removed navigation/section', () => {
  assert.match(page('story.html'), /The Strange History of Groups of People in Santa Suits/);
  assert.doesNotMatch(page('story.html'), /Continue to the Milwaukee ride|Read about Minneapolis and kindness/);
  assert.doesNotMatch(page('our-story.html'), /The whole idea|local-idea-title/);
  for (const name of ['story.html', 'our-story.html']) {
    const timeline = page(name).match(/<ol class="history-timeline"[\s\S]*?<\/ol>/)[0];
    assert.doesNotMatch(timeline, /<a\b/);
  }
});
test('local dependencies and cross-page anchors resolve', () => {
  const tracked = new Set(execFileSync('git', ['-C', root, 'ls-tree', '-r', '--name-only', 'HEAD'], { encoding: 'utf8' }).trim().split('\n'));
  for (const name of ['index.html', 'rebel.html', 'press.html', 'story.html', 'our-story.html']) {
    for (const match of page(name).matchAll(/(?:src|poster|href|data-src)="([^"#]+)"/g)) {
      if (/^(?:https?:|mailto:|data:)/.test(match[1])) continue;
      const [filePart, fragment] = match[1].split('#');
      const relative = filePart.split('?')[0];
      assert.ok(fs.existsSync(path.join(root, relative)) || tracked.has(relative), name + ': ' + relative);
      if (fragment && relative.endsWith('.html')) assert.ok(page(relative).includes(`id="${fragment}"`), 'Missing anchor ' + match[1]);
    }
  }
});
