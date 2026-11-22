const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const root = path.resolve(__dirname, '..');
const page = name => fs.readFileSync(path.join(root, name), 'utf8');
const html = page('index.html');
const boot = page('site-assets/mode-boot.js');
function visit(file, query = '', saved = null, blocked = false) {
  const source = page(file);
  const dataset = source.includes('data-default-first="true"') ? { defaultFirst: 'true' } : {};
  const document = { documentElement: { dataset } };
  const pathname = file === 'index.html' ? '' : file;
  vm.runInNewContext(boot, { document, location: { href: 'https://santacyclerampagemsp.org/' + pathname + query, search: query }, URL, URLSearchParams, localStorage: { getItem: () => { if (blocked) throw Error('Blocked'); return saved; }, setItem() {} } });
  return document.documentElement.dataset.siteMode;
}
test('the homepage opens in regular mode and the Rebel link and query select the requested mode', () => {
  assert.equal(visit('index.html'), 'default');
  assert.equal(visit('index.html', '?mode=rebel'), 'rebel');
  assert.equal(visit('index.html', '?mode=default', 'rebel'), 'default');
  assert.equal(visit('rebel.html', '', 'default'), 'rebel');
  assert.equal(visit('rebel.html', '?mode=default'), 'default');
  assert.equal(visit('rebel.html', '', null, true), 'rebel');
});
test('shared event, calendar, media and reduced FAQ remain present', () => {
  assert.equal((html.match(/id="when-where"/g) || []).length, 1);
  assert.equal((html.match(/id="video-hero"/g) || []).length, 1);
  assert.equal((html.match(/<details data-faq-id=/g) || []).length, 6);
  assert.match(html, /href="santa-cycle-rampage-2026\.ics" download/);
  const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(schema.startDate, '2026-12-05T10:00:00-06:00');
  assert.equal(schema.isAccessibleForFree, true);
  assert.equal(schema.location.name, "Cuzzy's");
  assert.equal(schema.endDate, undefined);
  assert.match(html, /Rebel Mode/);
  assert.match(html, /Fudge that! There’s something/);
  assert.match(html, /THEY WANT US<\/span><span>CHEERLESS<\/span>/);
  assert.match(html, /data-monster-media data-takeover="video"/);
  assert.match(html, /assets\/monster\/hero-monster-user\.png/);
});
test('all public pages have production metadata and no visible version stamp', () => {
  for (const name of ['index.html', 'rebel.html', 'press.html', 'story.html', 'our-story.html']) {
    const text = page(name);
    assert.doesNotMatch(text, /Local redesign test|class="build-stamp"|\.\.\//);
    assert.match(text, /static\.cloudflareinsights\.com\/beacon\.min\.js/);
    assert.match(text, /<link rel="canonical" href="https:\/\/santacyclerampagemsp.org\//);
    if (!['rebel.html', 'our-story.html'].includes(name)) assert.match(text, /name="robots" content="index,follow"/);
    assert.doesNotMatch(text, /class="badge"/);
  }
});
test('all nine archive cutouts are decorative, lazy loaded and Rebel-only', () => {
  const cast = JSON.parse(page('tools/website/cutout-cast.json'));
  assert.equal(cast.length, 9);
  for (const name of ['index.html', 'rebel.html']) {
    const text = page(name);
    const figures = [...text.matchAll(/<figure class="site-cutout [^"]+" aria-hidden="true">[\s\S]*?<\/figure>/g)];
    assert.equal(figures.length, 9);
    for (const [figure] of figures) {
      assert.match(figure, /rebel-only/);
      assert.match(figure, /alt="" loading="lazy" decoding="async"/);
    }
    for (const item of cast) assert.equal(text.split(`data-media-source="assets/monster/${item.file}"`).length - 1, 1);
  }
  assert.match(page('site-assets/cutout-cast.css'), /\.site-cutout \{ display: none; \}/);
});
test('cutout print layers stay decorative without failed duplicate alpha-mask requests', () => {
  const text = page('rebel.html');
  assert.equal((text.match(/class="cutout-print"/g) || []).length, 9);
  assert.doesNotMatch(text, /--cast-art/);
  const css = page('site-assets/cutout-cast.css');
  assert.match(css, /filter: url\('#screenprint'\)/);
  assert.doesNotMatch(css, /--cast-art|\.cutout-print::after/);
  assert.match(css, /\.cast-flow::before/);
  assert.match(css, /\.cast-flow::after/);
  assert.doesNotMatch(css, /\.site-cutout::(?:before|after)/);
  assert.equal((text.match(/class="cast-flow rebel-only" aria-hidden="true"/g) || []).length, 8);
  const gifts = text.match(/<section class="content-section gifts-section"[\s\S]*?<\/section>/)[0];
  assert.equal((gifts.match(/class="cast-flow /g) || []).length, 1);
  for (const [figure] of text.matchAll(/<figure class="site-cutout [\s\S]*?<\/figure>/g)) assert.doesNotMatch(figure, /class="cast-flow /);
  const cutoutRule = css.match(/html\[data-site-mode="rebel"\] \.site-cutout \{([\s\S]*?)\}/)[1];
  assert.doesNotMatch(cutoutRule, /overflow: (?:clip|hidden)/);
  assert.match(css, /pointer-events: none/);
  assert.doesNotMatch(css, /@keyframes|animation\s*:|transition\s*:/);
});
test('signup stays inline and uses the direct provider endpoint', () => {
  assert.equal((html.match(/>Keep me posted<\/button>/g) || []).length, 2);
  assert.match(html, /action="https:\/\/assets.mailerlite.com\/jsonp\/2739403\/forms\/202239538838374374\/subscribe"/);
  const controller = page('site-assets/email-signup.js');
  assert.match(controller, /event.preventDefault\(\)/);
  assert.match(controller, /redirect: 'error'/);
  assert.match(controller, /result.success === true/);
});
test('one continuous history page and old bookmarks forward correctly', () => {
  assert.match(page('story.html'), /The Strange History of Groups of People in Santa Suits/);
  assert.doesNotMatch(page('story.html'), /Continue to the Milwaukee ride|Read about Minneapolis and kindness/);
  assert.doesNotMatch(page('our-story.html'), /The whole idea|local-idea-title/);
  assert.match(html, /href="story.html#minneapolis"/);
  assert.match(page('story.html'), /id="minneapolis"/);
  assert.match(page('our-story.html'), /location.replace\(destination.href\)/);
  assert.match(page('our-story.html'), /destination.hash = location.hash/);
  for (const match of page('story.html').matchAll(/<ol class="history-timeline"[\s\S]*?<\/ol>/g)) {
    const timeline = match[0];
    assert.doesNotMatch(timeline, /<a\b/);
  }
  assert.doesNotMatch(page('story.html'), /Getty Images|new-york-santacon\.png/);
  assert.match(page('story.html'), /Photo: Jim Henderson \/ CC0/);
  const schedule = html.match(/<section class="content-section schedule-section"[\s\S]*?<\/section>/)[0];
  assert.doesNotMatch(schedule, /Location TBA|TBA EARLY|Stops announced|to be announced/);
});
test('local dependencies and cross-page anchors resolve', () => {
  for (const name of ['index.html', 'rebel.html', 'press.html', 'story.html', 'our-story.html']) {
    for (const match of page(name).matchAll(/(?:src|poster|href|data-src)="([^"#]+)"/g)) {
      if (/^(?:https?:|mailto:|data:)/.test(match[1])) continue;
      const [filePart, fragment] = match[1].split('#');
      const relative = filePart.split('?')[0];
      assert.ok(fs.existsSync(path.join(root, relative)), name + ': ' + relative);
      if (fragment && relative.endsWith('.html')) assert.ok(page(relative).includes(`id="${fragment}"`), 'Missing anchor ' + match[1]);
    }
  }
});

test('homepage uses one shared set of step rows and the requested nav anchors', () => {
  for (const name of ['index.html', 'rebel.html']) {
    const text = page(name);
    assert.equal((text.match(/data-step-rows/g) || []).length, 1);
    assert.doesNotMatch(text, /ride-chips|data-ride-steps|how-section|How it works/);
    const nav = text.match(/<nav class="desktop-nav"[\s\S]*?<\/nav>/)[0];
    assert.deepEqual([...nav.matchAll(/<a href="([^"]+)"[^>]*>(.*?)<\/a>/g)].map(x => [x[1], x[2]]), [['#what','What is this?'],['#schedule','Schedule'],['#toy','Toy drive'],['#faq','FAQ'],['#history','History'],['press.html','Press']]);
    for (const id of ['what','schedule','toy','faq','history']) assert.ok(text.includes(`id="${id}"`));
    assert.match(text, /<mark class="lights-reminder">bring front and rear lights<\/mark>/);
    assert.match(text, /meet at 10 AM for breakfast\. Note: Many riders join/);
    assert.match(text.replace(/<[^>]+>/g, ''), /Drinking is optional\./);
  }
});
test('both themes end with the correctly credited trail farewell video', () => {
  for (const name of ['index.html', 'rebel.html']) {
    const join = page(name).match(/<section class="content-section join-section"[\s\S]*?<\/section>/)[0];
    assert.match(join, /class="wide-film farewell-film"/);
    assert.match(join, /data-media-source="assets\/trail-ride-2024.mp4"/);
    assert.match(join, /Footage: Mike Binkley/);
  }
  assert.match(page('story.html'), /Footage: Mike Binkley/);
});

test('both homepage entry points show seven linked stops that match the calendar', () => {
  assert.doesNotMatch(page('site-assets/site.js'), /schedule-card/, 'The runtime must leave the linked schedule in the page');
  const calendar = page('santa-cycle-rampage-2026.ics').replace(/\r\n[ \t]/g, '');
  const description = calendar.match(/^DESCRIPTION:([^\r\n]+)/m)[1];
  const meetup = description.match(/^Meet at (.+?) at (\d+(?::\d{2})? [AP]M)\./);
  const arrivals = description.match(/Approximate arrival times: ([^.]+)\./)[1].split('; ');
  const normalizeName = name => name.normalize('NFD').replace(/\p{Diacritic}/gu, '').replaceAll('’', "'");
  const normalizeTime = time => time === 'noon' ? '12:00 PM' : time.replace(/^(\d+) ([AP]M)$/, '$1:00 $2');
  const calendarStops = [
    [normalizeName(meetup[1]), normalizeTime(meetup[2])],
    ...arrivals.map(stop => {
      const [, name, time] = stop.match(/^(.+?) (noon|\d+:\d{2} [AP]M)$/);
      return [normalizeName(name), normalizeTime(time)];
    })
  ];
  assert.equal(calendarStops.length, 7);
  for (const name of ['index.html', 'rebel.html']) {
    const home = page(name);
    const rows = [...home.matchAll(/<div class="schedule-row"><span>([^<]+)<\/span><a href="https:\/\/[^"]+"[^>]*>([^<]+) ↗<\/a><\/div>/g)];
    const stops = rows.map(([, time, venue]) => [normalizeName(venue), normalizeTime(time.split(' · ')[0])]);
    assert.deepEqual(stops, calendarStops, name);
    assert.equal((home.match(/>Keep me posted<\/button>/g) || []).length, 2);
    assert.match(home, /href="story.html#minneapolis"/);
    assert.doesNotMatch(home, /countdown-display|COUNTDOWN LIVE/);
  }
});

test('all pages have unique IDs and working same-page anchors', () => {
  for (const name of ['index.html', 'rebel.html', 'press.html', 'story.html', 'our-story.html']) {
    const text = page(name);
    const ids = [...text.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(ids.length, new Set(ids).size, name + ': duplicate IDs');
    for (const [, anchor] of text.matchAll(/href="#([^"]+)"/g)) {
      assert.ok(ids.includes(anchor), name + ': missing #' + anchor);
    }
  }
});

test('calendar contains actual CRLF records and matches homepage start time', () => {
  const calendar = page('santa-cycle-rampage-2026.ics');
  assert.ok(calendar.startsWith('BEGIN:VCALENDAR\r\n'));
  assert.ok(calendar.endsWith('END:VCALENDAR\r\n'));
  assert.doesNotMatch(calendar, /\\r\\n/);
  const unfolded = calendar.replace(/\r\n[ \t]/g, '');
  assert.match(unfolded, /\r\nDTSTART:20261205T160000Z\r\n/);
  assert.match(unfolded, /\r\nLOCATION:Cuzzy's\\, Minneapolis\\, MN\r\n/);
});

test('pending schedule keeps the meetup and signup but omits unpublished stop details', async () => {
  const { pendingScheduleFiles } = await import('../tools/website/prepare-pending-schedule.mjs');
  const pending = pendingScheduleFiles(page);
  for (const name of ['index.html', 'rebel.html']) {
    const home = pending.get(name);
    assert.match(home, /Brewery stops to be announced/);
    assert.match(home, /aria-label="Confirmed meetup"><div class="schedule-row"><span>10:00 AM · Start<\/span><a href="https:\/\/cuzzys.com\//);
    assert.equal((home.match(/class="schedule-row"/g) || []).length, 1);
    assert.equal((home.match(/>Keep me posted<\/button>/g) || []).length, 2);
    assert.match(home, /href="story.html#minneapolis"/);
  }
  const press = pending.get('press.html');
  assert.match(press, /<dt>(?:Route|Brewery) stops<\/dt><dd>To be announced<\/dd>/);
  assert.match(press, /<dt>(?:Starting place|Start location)<\/dt><dd>Cuzzy’s(?:, North Loop Minneapolis)?<\/dd>/);
  const calendar = pending.get('santa-cycle-rampage-2026.ics').replace(/\r\n[ \t]/g, '');
  assert.match(calendar, /DTSTART:20261205T160000Z\r\n/);
  assert.match(calendar, /DESCRIPTION:Meet at Cuzzy's at 10 AM\. Brewery stops and times will be announced later\./);
  assert.doesNotMatch(calendar, /DTEND:/);
  for (const content of pending.values()) assert.doesNotMatch(content, /Utepils|Fulton Taproom|5:30 PM/);
});
