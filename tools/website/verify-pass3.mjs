import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import vm from 'node:vm';
import { content, directory, renderDefault, renderRebel } from './build.mjs';
import { renderPress, renderStory, renderOurStory, renderSitemap } from './pages.mjs';
import { storyCopy, header, historyStrip, historyTimeline, manifestoLine, dates } from './shared.mjs';

let assertions = 0;
const check = (value, label) => { assert.ok(value, label); assertions++; };
const normal = html => html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const body = html => html.match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
const extractCopy = html => [...html.matchAll(/<div class="history-copy" data-history-copy>([\s\S]*?)<\/div>/g)].map(match => match[1]).join('\n');
const pages = { 'index.html': renderDefault(content), 'rebel.html': renderRebel(content), 'press.html': renderPress(content), 'story.html': renderStory(content), 'our-story.html': renderOurStory(content) };
const press = pages['press.html'];
const story = pages['story.html'];
const ourStory = story;
const home = pages['index.html'];
const pressBody = normal(body(press));
const source = readFileSync(path.join(directory, 'source/press-before-pass3.html'), 'utf8');

for (const [file, html] of Object.entries(pages)) {
  check(readFileSync(path.join(directory, file), 'utf8') === html, 'Generated page current: ' + file);
  check(!html.includes('—'), 'No rendered em dashes: ' + file);
  check((html.match(/<h1\b/g) || []).length === 1, 'One H1: ' + file);
  check(html.includes('class="skip-link"') && html.includes('id="main-content"'), 'Skip link: ' + file);
  check(!html.includes('[CONFIRM:'), 'No public placeholder: ' + file);
  check(!html.includes('Ten friends started it.') && !html.includes('about ten friends') && !html.includes('About 10 riders'), 'No conflicting founder count: ' + file);
  for (const match of html.matchAll(/(?:src|poster|href|data-src)="([^\"]+)"/g)) {
    const url = match[1];
    if (/^(?:https?:|mailto:|#|data:)/.test(url)) continue;
    const [filePath] = url.split(/[?#]/);
    check(existsSync(path.resolve(directory, filePath)), file + ' local asset/link exists: ' + url);
    const anchor = url.split('#')[1];
    if (anchor && filePath.endsWith('.html')) check(readFileSync(path.resolve(directory, filePath), 'utf8').includes(`id="${anchor}"`), 'Cross-page anchor exists: ' + url);
  }
}

const d = dates(content);
for (const value of [d.dateLabel, d.time, content.cost]) check((pressBody.match(new RegExp(value, 'g')) || []).length === 2, 'Press hero and essentials contain the only two instances of ' + value);
const outsideStatus = body(press).replace(/<aside class="press-status"[\s\S]*?<\/aside>/, '');
check(!/to be announced/i.test(outsideStatus), 'Pending wording occurs only inside the single press status block');
check((press.match(/id="ride-status"/g) || []).length === 1, 'Only one press announcement block');
check(press.includes(content.announcementStatus.summary), 'Editable announcement summary appears on press page');
check(!home.includes(content.announcementStatus.summary), 'Requested announcement summary removed from homepage');
check(press.includes(header(content, { page: 'press', themeable: false })), 'Press uses shared navigation component');
check(!press.includes('class="mode-toggle"') && !press.includes('mode-boot.js') && press.includes('data-theme-fixed="default"'), 'Press remains cream with no Rebel toggle');
check(press.includes('data-copy-target="press-description"') && press.includes('role="status"'), 'Description copy control and status feedback');
check(press.includes(`How to refer to us:</strong> ${content.eventName}; also ${content.shortName}.`), 'Both naming forms are explicit');
check(press.includes('id="quotes" aria-labelledby="quotes-title" hidden'), 'Empty quotes block hidden');
check(press.includes(`“${manifestoLine(content)}”`) && press.includes(`${content.shortName} · From the ride’s story`), 'Pull quote uses site copy and ride attribution');
check(content.press.angles.length === 4 && press.includes('Four ways into the story'), 'Four principal story angles');
check(press.includes(historyStrip(content, 'press-origins')), 'Shared three-part strip appears under story angle');
for (const item of content.history.strip) {
  check(home.includes(item.photo.src) && press.includes(item.photo.src), 'Shared city photo retained with original credit: ' + item.place);
  check(item.photo.alt && item.photo.credit && item.photo.width && item.photo.height, 'Photo alt, credit, and stable dimensions: ' + item.place);
}
check(home.includes('Photo: Peter Field') && home.includes('Photo: Jim Henderson / CC0') && !home.includes('Getty Images'), 'Historical credits include the CC0 New York replacement');
check(content.history.strip[1].photo.license === 'CC0 1.0' && content.history.strip[1].photo.sourceUrl.includes('Santacon_2010_Bethesda'), 'Verified CC0 source and license retained in shared data');
check(content.history.imageRights.status === 'confirmed_by_user', 'Publication rights confirmed by the user');
check(home.includes('class="decorated-bike-photo"><img src="../../assets/decorated-bike-rider.jpg"') && !home.includes('sarah-mayer-2024-ladona-12.jpg'), 'Original decorated-bike photo retained, replacement request superseded');
check(readFileSync(path.join(directory, 'pages.css'), 'utf8').includes('.decorated-bike-photo img{object-position:center bottom}'), 'Original bike photo crops down toward the bicycle');
check(press.includes('Drinking is optional. If you drink, have a sober driver or call a ride. Riders go at their own pace.'), 'Exact covering-the-ride safety line');
check(press.includes(content.press.contactName) && press.includes(content.links.contact), 'Existing ride-day contact retained');
check(press.includes('data-everything-download hidden') && !content.press.everythingBundle.enabled, 'Unavailable everything bundle stays hidden');
check(press.includes(`datetime="${content.press.lastUpdated}"`), 'Editable coverage update date');

for (const id of ['poster', 'photos', 'broll', 'logos', 'coverage']) {
  const original = source.match(new RegExp(`<section id="${id}"[\\s\\S]*?<\\/section>`))[0];
  const updated = press.match(new RegExp(`<section id="${id}"[\\s\\S]*?<\\/section>`))[0];
  for (const match of original.matchAll(/(?:src|poster|href)="([^\"]+)"/g)) {
    const url = match[1];
    check(updated.includes(`"${/^(assets|downloads)\//.test(url) ? '../../' : ''}${url}"`), 'Retained press media/link: ' + url);
  }
  for (const match of original.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)) check(normal(updated).includes(normal(match[1])), 'Retained media/rights paragraph: ' + id);
}
for (const broadcaster of ['fox9', 'kstp5']) check(press.includes(`../../assets/coverage/${broadcaster}-2025.mp4`) && existsSync(path.resolve(directory, `../../assets/coverage/${broadcaster}-2025.mp4`)), 'Playable local TV embed exists: ' + broadcaster);
check(!press.includes('data-ambient'), 'Newsroom videos retain native playback, no ambient autoplay');

const combinedHistory = extractCopy(story);
check(combinedHistory === extractCopy(storyCopy(content)), 'Reorganized histories reconstruct all 15 final paragraphs byte for byte');
check((combinedHistory.match(/<p\b/g) || []).length === 15 && !pages['our-story.html'].includes('data-history-copy'), 'All 15 paragraphs appear once on one page, old page only redirects');
check(!home.includes('data-history-copy') && !home.includes('story-disclosure') && !home.includes('history-timeline'), 'No giant inline history, accordion, or timeline on home');
check(story.includes('<em>Fight Club</em>'), 'Fight Club italics preserved');
for (const [index, anchor] of Object.entries(content.history.anchors)) check((Number(index) < 8 ? story : ourStory).includes(`<p id="${anchor}">${content.copy.historyParagraphs[index]}</p>`), 'Correct destination paragraph anchor: ' + anchor);
for (const beat of content.history.timeline) {
  const part = content.history.stories.minneapolis.timelineYears.includes(beat.year) ? 'minneapolis' : 'santacon';
  const url = 'story.html';
  const timeline = historyTimeline(content, part);
  check(timeline.includes(`<strong>${beat.year}:</strong> <span>${beat.text}</span>`) && !timeline.includes('<a ') && pages[url].includes(`id="${beat.anchor}"`), 'Dates and summaries retained as plain text, without jump links: ' + beat.year);
}
const expectedBeats = ['1977: The Suicide Club forms in San Francisco.', '1986: Its alumni start the Cacophony Society.', '1994: A busload of cheap-suit Santas hits San Francisco.', 'Then: SantaCon goes global, and drunk.', '2012: Brent rides the Milwaukee Santa Cycle Rampage.', '2013: The first Minneapolis ride.', '2025: 178 riders. Kindness wins.'];
check(JSON.stringify(content.history.timeline.map(beat => `${beat.year}: ${beat.text}`)) === JSON.stringify(expectedBeats), 'Exact seven requested timeline beats');
for (const page of [home, pages['rebel.html']]) check((page.match(/class="history-cards"/g) || []).length === 1 && (page.match(/class="history-path"/g) || []).length === 2, 'One shared card section and exactly two story panels in each theme');
check(home.indexOf('id="history"') > home.indexOf('id="vibe"'), 'History stays below the event sections in both themes');
check(home.includes('id="santa-mayhem"') && home.includes('id="origins"'), 'Old homepage history anchors still land in the new section');
check(story.includes('id="minneapolis"') && !story.includes('data-local-story=') && pages['our-story.html'].includes('destination.hash = location.hash'), 'Combined page keeps local fragments and legacy URL preserves existing bookmarks');
check(!story.includes('Continue to the Milwaukee ride and Minneapolis beginning') && !story.includes('Read about Minneapolis and kindness') && !story.includes('class="legacy-story-links"'), 'Requested redundant history links removed');
check(home.includes('href="story.html#minneapolis"') && home.includes('href="story.html"'), 'Both homepage panels link to the same page at the appropriate starting point');
check(story.includes(`<title>${content.history.stories.santacon.title} | ${content.eventName}</title>`), 'Bigger-story title');
for (const card of content.history.homepage.cards) check(home.includes(card.label) && home.includes(card.headline) && home.includes(card.description), 'Exact requested homepage card copy: ' + card.label);
check(home.includes(content.history.homepage.narrative) && home.includes('class="display history-rebellion"'), 'Exact bridge copy and prominent red statement');
check(ourStory.includes('class="then-now"') && ourStory.includes('class="first-ride-grid"') && ourStory.includes('class="artifact-grid early-posters"'), 'Then/Now, original ride photos and posters retained with Minneapolis history');
check(ourStory.includes('../../assets/trail-ride-2024.mp4') && ourStory.includes('Photo: Sarah Mayer'), 'Trail video and credited additional photographs preserved');
for (const tag of ['name="description"', 'rel="canonical"', 'property="og:title"', 'property="og:description"', 'property="og:url"', 'property="og:image"', 'name="twitter:title"', 'name="twitter:description"', 'name="twitter:image"']) check(story.includes(tag), 'Story SEO tag: ' + tag);
check(story.includes(`href="${content.links.canonical}story.html"`), 'Story canonical uses HTML URL pattern');
check(renderSitemap(content).includes(`<loc>${content.links.canonical}story.html</loc>`), 'Local sitemap includes story');
check(!renderSitemap(content).includes('our-story.html') && !renderSitemap(content).includes('#minneapolis'), 'Sitemap indexes only the combined history destination');
check(story.includes('id="sticky-rsvp"') && story.includes('class="mode-toggle"'), 'Story reuses sticky RSVP and mode switch');
const styles = readFileSync(path.join(directory, 'pages.css'), 'utf8');
check(styles.includes('@media print') && styles.includes('color-scheme:light') && styles.includes('.print-url{display:block}'), 'Black/white print rules and footer URL');
check(styles.includes('body.story-page .site-header') && styles.includes('body.story-page video'), 'Print hides navigation and videos');

const fixture = structuredClone(content);
Object.assign(fixture.announcementStatus, {
  summary: 'Fixture route is confirmed. Details are below.',
  startLocation: { status: 'confirmed', name: 'Fixture venue', address: '123 Test Street', mapUrl: 'https://example.com/fixture-map' },
  departure: { status: 'confirmed', time: '10:30 AM' },
  finish: { status: 'confirmed', time: '6 PM', endDate: '2026-12-05T18:00:00-06:00' },
  toyCollection: { status: 'confirmed', stopNumber: 2 }
});
fixture.announcementStatus.stops.forEach((stop, index) => Object.assign(stop, { status: 'confirmed', name: 'Fixture brewery ' + (index + 1), time: '11:00 AM' }));
const updatedPress = renderPress(fixture);
for (const render of [renderDefault, renderRebel, renderPress]) {
  const updated = render(fixture);
  for (const value of ['Fixture venue', '10:30 AM', '6 PM', 'Fixture brewery 1']) check(updated.includes(value), 'Shared announcement update propagates: ' + value);
}
check(updatedPress.includes(fixture.announcementStatus.summary), 'Shared announcement summary still updates the press page');
check(!updatedPress.includes('to be announced'), 'Confirmed status removes pending language everywhere on press');
check(updatedPress.match(/class="covering-meetup">([\s\S]*?)<\/p>/)[1].includes('Fixture venue') && updatedPress.match(/class="covering-meetup">([\s\S]*?)<\/p>/)[1].includes('10:30 AM'), 'Covering box updates confirmed start and departure');
fixture.quotes = [{ text: manifestoLine(content), attribution: content.shortName }];
check(!renderPress(fixture).includes('id="quotes" aria-labelledby="quotes-title" hidden'), 'Quote block appears when supplied quotes exist');
fixture.press.everythingBundle = { enabled: true, url: '../../downloads/Santa_Cycle_Rampage_Photos.zip' };
check(renderPress(fixture).includes('data-everything-download href="../../downloads/Santa_Cycle_Rampage_Photos.zip" download'), 'Bundle flag enables an existing configured download');
fixture.foundingSentence = '[CONFIRM: founding fact]';
check(!renderPress(fixture).includes('class="founding-sentence"') && !renderDefault(fixture).includes('class="founding-sentence"'), 'Unconfirmed founding field is never public');
check(content.foundingSentence === 'In 2013, Brent called up a couple of friends, and ten Santas rode that first year.', 'User-confirmed exact founding sentence');
check(press.includes(content.foundingSentence) && ourStory.includes(content.foundingSentence), 'Confirmed founding sentence retained in press and Our Story');

const boot = readFileSync(path.join(directory, 'mode-boot.js'), 'utf8');
for (const [query, expected] of [['', 'default'], ['?mode=rebel', 'rebel'], ['?mode=default', 'default']]) {
  const root = { dataset: { pageMode: 'default', defaultFirst: 'true' } };
  vm.runInNewContext(boot, { document: { documentElement: root }, location: { search: query, href: 'http://localhost/story.html' + query }, localStorage: { getItem: () => 'rebel', setItem() {} }, URL, URLSearchParams });
  check(root.dataset.siteMode === expected, 'Story defaults cream; explicit mode works: ' + query);
}

const digest = createHash('sha256').update(combinedHistory).digest('hex');
console.log(`${assertions} checks passed. Recombined history diff: no differences, 15 preserved paragraphs, SHA256 ${digest}.`);
