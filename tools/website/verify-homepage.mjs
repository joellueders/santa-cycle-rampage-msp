import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { content, directory, renderDefault, renderRebel } from './build.mjs';
import { renderPress, renderStory } from './pages.mjs';
import { renderFaq } from './faq.mjs';

let checks = 0;
const check = (value, label) => { assert.ok(value, label); checks++; };
const source = readFileSync(new URL('./source/current-site.html', import.meta.url), 'utf8');
const strip = html => html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const expectedNav = ['What is this?', 'Schedule', 'Toy drive', 'FAQ', 'History', 'Press'];
const targets = ['what', 'schedule', 'toy', 'faq', 'history'];
const titles = ['Dress like Santa', 'Bring a gift', 'Decorate your bike', 'Drink a beer', 'Spread some cheer'];
const originalSteps = [...source.matchAll(/<div class="step"><div class="num">\d+<\/div><div><h3>(.*?)<\/h3><p>([\s\S]*?)<\/p>/g)].map(([, title, advice]) => ({ title, advice: strip(advice) }));
check(originalSteps.length === 5, 'All five original steps found');
check(JSON.stringify(content.rideSteps.items) === JSON.stringify(originalSteps), 'All original titles and full advice preserved verbatim as unused shared data');
check(content.rideSteps.usage.toLowerCase().includes('unused'), 'Unused advice is explicitly marked');

for (const render of [renderDefault, renderRebel]) {
  const html = render(content);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  check(ids.length === new Set(ids).size, 'Every element ID is unique');
  for (const target of targets) check(html.includes(`id="${target}"`), 'Real navigation target: ' + target);
  for (const nav of html.matchAll(/<nav class="(?:desktop-nav|mobile-nav)"[\s\S]*?<\/nav>/g)) {
    const links = [...nav[0].matchAll(/<a href="([^"]+)"[^>]*>(.*?)<\/a>/g)];
    check(JSON.stringify(links.map(link => link[2])) === JSON.stringify(expectedNav), 'Desktop and phone nav have the exact shared order');
    check(JSON.stringify(links.map(link => link[1])) === JSON.stringify([...targets.map(id => '#' + id), content.links.press]), 'Nav points at the requested sections and press page');
    check(!/badge|EARLY|How it works/.test(nav[0]), 'No announcement badge or How it works nav link');
  }
  const positions = targets.map(id => html.indexOf(`id="${id}"`));
  check(positions.every((position, index) => index === 0 || position > positions[index - 1]), 'Content order matches nav at all widths');
  check(!/how-section|steps-overview|how-steps-slot|step-number|data-ride-steps|How it works/.test(html), 'Old numbered cards and How it works rendering removed');
  const rows = [...html.matchAll(/<ol class="participation-steps"[\s\S]*?<\/ol>/g)];
  check(rows.length === 1 && !html.includes('ride-chips'), 'Only one set of step rows exists, with no chip row');
  check(JSON.stringify([...rows[0][0].matchAll(/<h3 class="display">(.*?)<\/h3>/g)].map(match => match[1])) === JSON.stringify(titles), 'Five exact display-font step titles');
  for (const step of content.participationSteps) check(rows[0][0].includes(step.body), 'Exact shared step paragraph: ' + step.title);
  const slot = render === renderDefault ? 'default' : 'rebel';
  check(html.includes(`data-steps-slot="${slot}">${rows[0][0]}`), 'Rows start in the correct theme section');
  check(html.indexOf(`id="video-brewery"`) < html.indexOf('data-step-rows'), 'The La Doña video appears before the step rows');
  check((html.match(/id="video-brewery"/g) || []).length === 1, 'One shared La Doña video');
  const film = html.match(/<figure class="wide-film brewery-film"[\s\S]*?<\/figure>/)[0];
  check(/muted loop playsinline preload="none" poster=/.test(film) && film.includes('data-src=') && !film.includes('<source src='), 'Existing poster, lazy loading and muted playback retained');
  check(film.includes('Footage: Vitaly Katasonov'), 'La Doña credit retained');
  for (const text of Object.values(content.homepageIntro)) check(html.includes(text), 'Exact default explanation: ' + text.slice(0, 25));
  const schedule = html.match(/<section class="content-section schedule-section"[\s\S]*?<\/section>/)[0];
  check(schedule.includes(`</div><aside class="ride-smart"`), 'Ride smart is directly after the schedule card');
  check(strip(schedule).includes(content.rideSmart.body) && (html.match(/id="ride-smart-title"/g) || []).length === 1, 'Exact practical advice appears once in schedule');
  check(schedule.includes('<mark class="lights-reminder">bring front and rear lights</mark>'), 'Light reminder is highlighted without changing the sentence');
  const goodbye = html.match(/<section class="content-section join-section"[\s\S]*?<\/section>/)[0];
  check(goodbye.includes('id="video-history"') && goodbye.includes(content.media.history.src), 'The trail clip closes Join the Joy in both themes');
  check(goodbye.includes('Footage: Mike Binkley') && !goodbye.includes('Footage: North Loop Neighborhood News'), 'Farewell credit is Mike Binkley');
  check((schedule.match(/class="status-badge">TBA<\/span>/g) || []).length === 3, 'Existing schedule status pills remain unchanged');
  for (const card of content.history.homepage.cards) check(html.includes(card.label) && html.includes(card.headline) && html.includes(card.description), 'Shared history card wording: ' + card.label);
  check(html.includes('Cacophony Society Cheap Suit Santas, 1994 to 1995.') && html.includes('Photo: Peter Field'), 'Requested SF caption and unchanged credit');
  check(html.includes('SantaCon, Central Park, New York, 2010.') && html.includes('Photo: Jim Henderson / CC0'), 'NY caption and credit unchanged');
  check(!html.includes('—'), 'No em dashes in rendered copy');
  for (const href of html.matchAll(/href="#([^"]+)"/g)) check(ids.includes(href[1]), 'Every local fragment resolves: ' + href[1]);
  const archivedFaq = structuredClone(content);
  check(renderFaq(archivedFaq).includes('Are kids allowed?'), 'Existing reduced FAQ retained');
}

for (const html of [renderPress(content), renderStory(content)]) {
  const nav = html.match(/<nav class="desktop-nav"[\s\S]*?<\/nav>/)[0];
  for (const target of targets) check(nav.includes(`index.html#${target}`), 'Other page returns to correct homepage anchor: ' + target);
  check(!nav.includes('How it works') && !nav.includes('badge'), 'No obsolete nav on other pages');
}
const css = readFileSync(directory + '/components.css', 'utf8');
check(css.includes('scroll-margin-top:112px') && css.includes('scroll-margin-bottom:100px'), 'Anchor clearance for sticky header and bottom bar');
check(css.includes('.content-sections>.content-section{order:0;'), 'Phone and desktop retain source order');
check(css.includes('.participation-steps>li{display:grid;grid-template-columns:48px') && css.includes('border-top:1px solid var(--line)'), 'Rows have number, title and text columns with thin dividers');
check(css.includes('.participation-steps>li{grid-template-columns:1fr;'), 'Step rows stack on phones');
check(css.includes('background:#b7ff00;color:#171717'), 'Neon-green reminder has dark, readable text');
const controller = readFileSync(directory + '/site.js', 'utf8');
check(controller.includes('moveShared(breweryFilm') && controller.includes('moveShared(participationSteps') && !controller.includes('sections.append'), 'Toggle moves existing shared elements without reordering the page');
check(renderStory(content).includes('Footage: Mike Binkley'), 'History archive also reads the corrected trail credit');
console.log(`${checks} homepage cleanup checks passed: navigation, preserved advice, exact step rows, farewell video and credit, and sticky-anchor spacing.`);
