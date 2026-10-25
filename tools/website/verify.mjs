import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { directory, content, renderDefault, renderRebel, eventSchema } from './build.mjs';
import { faqContent, renderFaq, renderScheduleJoinNote } from './faq.mjs';
import { renderStory, renderOurStory } from './stories.mjs';

const source = readFileSync(path.join(directory, 'source/current-site.html'), 'utf8');
const normal = s => s.replaceAll('—', ', ').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const paragraphs = s => [...s.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map(match => normal(match[1]));
let assertions = 0;
const check = (condition, label) => { assert.ok(condition, label); assertions++; };
const html = renderDefault(content);
const rebel = renderRebel(content);
const faq = source.match(/<section id="faq"[\s\S]*?<\/section>/)[0];
const fullHistory = source.match(/<div class="mayhem-story">([\s\S]*?)<\/div><\/details>/)[1];
const defaultText = normal(html);
const rebelText = normal(rebel);
const expectedManifesto = [
  'Fudge that! There’s something about wearing a Santa suit that makes it easier to be kind to strangers and makes strangers more willing to accept that kindness.',
  'The suit helps them lower their guard, while being part of a whole ridiculous group of Santas lets us lower ours and be openly joyful.',
  'We bring toys for kids and ride from brewery to brewery through Minneapolis, but the people we meet are the destination.'
];
check(JSON.stringify(content.copy.rebel.manifesto) === JSON.stringify(expectedManifesto), 'Exact approved Rebel paragraphs stored in shared content in order');
const manifesto = rebel.match(/<div class="manifesto-section rebel-only"[\s\S]*?<\/div><\/div>/)[0];
const expectedClosing = 'That’s our particular brand of mayhem: in a weary world, kindness is its own kind of rebellion.';
const expectedSubline = 'Work. Buy. Scroll. Repeat. Keep your head down. Keep to yourself.';
check(content.copy.rebel.manifestoClosing === expectedClosing && JSON.stringify(paragraphs(manifesto)) === JSON.stringify([expectedSubline, ...expectedManifesto, expectedClosing]), 'Updated subheading, manifesto, and closing appear in exact requested order');
check(manifesto.includes(`<h2 class="display" id="manifesto-title">JOIN THE RESISTANCE.</h2><p class="manifesto-subline">${expectedSubline}</p>`) && !manifesto.includes('SINCE 2013'), 'Requested subheading directly below title and Since removed');
check(manifesto.includes('id="manifesto-title">JOIN THE RESISTANCE.</h2>') && !/[—'"]/.test(normal(manifesto)), 'Exact heading and curly apostrophes without em dashes');
check(manifesto.includes(`<p class="manifesto-closing"><strong>${expectedClosing}</strong></p>`), 'Final sentence remains bold');
const biggerStory = renderStory(content);
const ourStory = biggerStory;
const legacyStory = renderOurStory(content);
check(legacyStory.includes('location.replace(destination.href)') && legacyStory.includes('story.html#minneapolis'), 'Old Our Story URL redirects to the combined Minneapolis section');
check(!ourStory.includes('The whole idea') && !ourStory.includes('When we started in 2013, brewery taprooms') && !ourStory.includes('local-idea-title'), 'Whole idea section and paragraphs removed from Our Story');
check(ourStory.includes('aria-labelledby="first-ride-title"') && ourStory.includes('id="posters-title"'), 'Interspersed archive media retains valid section headings');
const historyText = normal(biggerStory + ourStory);
for (const page of [html, rebel, biggerStory, ourStory]) check(!page.includes('class="badge"'), 'Top navigation announcement badge removed from desktop and mobile');
check(html.includes('The Strange History of Groups of People in Santa Suits') && biggerStory.includes('<h1 class="display" id="story-title">The Strange History of Groups of People in Santa Suits</h1>'), 'Updated bigger-story title shared by homepage panel and story destination');
for (const page of [html, rebel, biggerStory, ourStory]) check(!page.includes('class="build-stamp"') && !page.includes(content.build.version), 'Visible version and build label removed');
const visibleFaqItems = faqContent.displayOrder.map(id => faqContent.items.find(item => item.id === id));

check((html.match(/<h1\b/g) || []).length === 1, 'One default H1');
check((rebel.match(/<h1\b/g) || []).length === 1, 'One Rebel H1');
check((html.match(/<video\b/g) || []).length === 5 && (ourStory.match(/<video\b/g) || []).length === 1, 'All existing media retained, with the farewell trail video restored at the end');
check((rebel.match(/<video\b/g) || []).length === 5, 'Rebel also includes the farewell trail video');
check((html.match(/<details data-faq-id=/g) || []).length === 6, 'Only the six requested FAQs are displayed');
for (const paragraph of paragraphs(faq)) {
  // This opening paragraph was explicitly replaced in the kids FAQ.
  if (paragraph.startsWith('Yes, with a parent or guardian. But this is a winter brewery ride')) continue;
  check(normal(JSON.stringify(faqContent)).includes(paragraph.replaceAll('"', '\\"')) || faqContent.items.some(item => paragraphs(item.answerHtml || '').includes(paragraph)), 'Original answer retained in shared FAQ source: ' + paragraph.slice(0, 60));
  if (visibleFaqItems.some(item => paragraphs(item.answerHtml || '').includes(paragraph))) check(defaultText.includes(paragraph) && rebelText.includes(paragraph), 'Kept answer visible unchanged in both themes: ' + paragraph.slice(0, 60));
}
const kidsOpening = 'Sorta. Kids need to be with a parent or guardian, but this isn’t an event made for kids. We pride ourselves on not being rowdy, but it’s still a winter brewery ride with adults drinking.';
check(defaultText.includes(kidsOpening) && rebelText.includes(kidsOpening), 'Revised candid kids answer appears in both themes without a Yes opening');
const previousHistory = paragraphs(fullHistory).slice(0, -1);
const updatedHistory = content.copy.historyParagraphs.map(normal);
check(previousHistory.length === 14 && updatedHistory.length === 15, 'One history paragraph added');
for (const [index, paragraph] of previousHistory.entries()) {
  if ([0, 1, 12].includes(index)) continue;
  check(updatedHistory[index >= 11 ? index + 1 : index] === paragraph, 'Unaffected history paragraph retained verbatim: ' + (index + 1));
}
check(updatedHistory[0].includes('(active from 1977 to 1982, and often called the first modern urban explorers)') && updatedHistory[0].endsWith('Despite the name, it was never about death. It was about facing your fears.'), 'Requested history dates and fears context');
check(updatedHistory[1] === previousHistory[1].replace(' and urban exploration.', '.'), 'Only urban exploration removed from paragraph 2');
check(updatedHistory[11].startsWith('Minneapolis sits somewhere between the two coasts, and so does our idea.'), 'New Minneapolis paragraph in the requested position');
check(updatedHistory[13].startsWith(previousHistory[12] + ' At SantaCon, the suit is a disguise') && updatedHistory[13].endsWith('the group lets us be openly joyful without feeling exposed.'), 'Santa-suit paragraph extended without rewriting its opening');
for (const paragraph of updatedHistory.slice(0, 8)) check(historyText.includes(paragraph), 'International history paragraph remains unchanged: ' + paragraph.slice(0, 60));
for (const paragraph of content.history.stories.minneapolis.paragraphs) check(historyText.includes(normal(paragraph)), 'New approved Minneapolis paragraph is rendered: ' + normal(paragraph).slice(0, 60));
check(content.copy.historyParagraphs[1].includes('<em>Fight Club</em>'), 'Fight Club retains italics');
check(biggerStory.includes(source.match(/<p class="mayhem-sources">[\s\S]*?<\/p>/)[0]), 'Further reading links and wording unchanged');
check(html.includes(content.history.homepage.heading) && biggerStory.includes(content.history.subheading), 'New homepage heading and preserved bigger-story subheading');
check(!html.includes('—') && !rebel.includes('—'), 'No em dashes in generated copy');
check(defaultText.includes('Your bike is your sleigh.'), 'Toy drive voice retained');
check(defaultText.includes('the Salvation Army'), 'Toy recipient present');
check(rebelText.toLowerCase().includes('the machine') && rebelText.toLowerCase().includes('wants you') && rebelText.toLowerCase().includes('alone.'), 'Existing Rebel headline retained');
const sharedLayout = page => page.replace(/<ol class="participation-steps"[\s\S]*?<\/ol>/, '').replace(/<figure class="wide-film brewery-film"[\s\S]*?<\/figure>/, '').replace(/data-page-mode="(?:default|rebel)" data-site-mode="(?:default|rebel)"/, '').replace(/aria-pressed="(?:true|false)"/, 'aria-pressed="MODE"');
check(sharedLayout(html) === sharedLayout(rebel), 'Both themes share identical templates and facts, with single movable step rows and video');
check(!rebel.includes('shared.css'), 'Legacy Rebel-only stylesheet removed from output');
check((html.match(/data-step-rows/g) || []).length === 1 && !html.includes('data-ride-chips'), 'One shared five-row steps component, without chips or duplicate cards');
check(!html.includes('The unofficial Santa resistance cut'), 'Old navigation hint removed');
check(!html.includes('Switch to default') && !rebel.includes('mode-return'), 'Redundant Rebel return link removed; shared switch remains');
check(html.includes('aria-controls="mobile-nav"') && html.includes('id="mobile-nav"'), 'Mobile menu markup provided in both themes');
check(html.includes('Brewery stops 2 to 7'), 'Brewery stop status label updated');
const pendingSchedule = html.match(/<section class="content-section schedule-section"[\s\S]*?<\/section>/)[0];
check((pendingSchedule.match(/class="status-badge">TBA<\/span>/g) || []).length === 3 && !/Location TBA|TBA EARLY|Stops announced|to be announced/.test(pendingSchedule), 'All pending schedule labels are plain TBA');
check(html.includes('<figure class="misfits-photo"><img src="../../assets/elf.jpg"'), 'Misfits photo has its own crop hook');
check(readFileSync(path.join(directory, 'components.css'), 'utf8').includes('.misfits-photo img{object-position:center 18%}'), 'Misfits crop favors the faces near the top');
const siteScript = readFileSync(path.join(directory, 'site.js'), 'utf8');
check(siteScript.includes("button.className = 'video-toggle icon-video-toggle'") && !siteScript.includes('state.isHero') && !siteScript.includes('state.button.textContent'), 'Every video gets the same SVG-only control');
check(siteScript.includes("state.button.setAttribute('aria-label'"), 'Icon controls retain accessible action labels');
const questions = [...renderFaq(content).matchAll(/<summary><span>(.*?)<\/span>/g)].map(match => match[1]);
check(JSON.stringify(questions) === JSON.stringify(['Do I need to register?', 'Can I come alone?', 'Do I have to dress like Santa?', "What if there's snow?", 'Are kids allowed?', "Can I come if I don't ride a bicycle?"]), 'Exact reduced FAQ order and wording');
check(!renderFaq(content).includes('faq-participation-group'), 'Reduced FAQ is one simple list');
for (const id of ['start', 'join-partway', 'drink', 'toys', 'race']) check(!renderFaq(content).includes(`data-faq-id="${id}"`), 'Removed question is absent from visible FAQ: ' + id);
for (const item of visibleFaqItems) for (const paragraph of paragraphs(item.answerHtml)) check(normal(renderFaq(content)).includes(paragraph), 'Every kept answer paragraph is unchanged: ' + item.id);
check(renderFaq(content).includes('Plan to arrive about 30 minutes before we do.') && renderFaq(content).includes('Don’t tell them about the Santas.'), 'Lunch surprise and arrival copy preserved');
check((renderFaq(content).match(/aria-hidden="true" focusable="false"/g) || []).length === 6, 'Every FAQ has a decorative SVG expand indicator');
check(renderScheduleJoinNote(content).includes('Arrival times are posted here once the route is set.'), 'Pending schedule join note');
for (const [label, pattern] of [['canonical', /<link rel="canonical"[^>]*>/], ['social image', /<meta property="og:image"[^>]*>/]]) {
  check(html.includes(source.match(pattern)[0]), label + ' preserved');
}
check(html.includes(`<meta name="description" content="${content.copy.description}">`), 'Home description reads from shared copy');
check(!html.includes('hello@santacyclerampagemsp.org'), 'No invented contact address');
check(html.includes('mailto:santacyclerampagemsp@gmail.com'), 'Existing contact email used');
for (const page of [html, rebel]) {
  check((page.match(/>Get ride updates<\/label>/g) || []).length === 2 && (page.match(/>Keep me posted<\/button>/g) || []).length === 2, 'Both signup forms use the approved shared CTA copy');
  check((page.match(/<form class="email-signup" action=/g) || []).length === 2, 'Hero and schedule signup visible in both themes');
  check(page.includes(`action="${content.email.endpoint}" method="post"`) && content.email.endpoint.startsWith('https://assets.mailerlite.com/'), 'Uses direct MailerLite action without redirecting away');
  check(page.includes('email-signup.js?v=') && (page.match(/class="email-signup-status" role="status" aria-live="polite" hidden/g) || []).length === 2, 'Inline signup controller and accessible response areas included');
  check((page.match(/name="fields\[email\]"/g) || []).length === 2, 'Uses MailerLite email field name');
  check((page.match(/name="ml-submit" value="1"/g) || []).length === 2 && (page.match(/name="anticsrf" value="true"/g) || []).length === 2, 'Provider hidden fields preserved on both forms');
  check(!page.includes('Optional ride updates.') && !page.includes('Use the MailerLite form') && !page.includes('aria-describedby="location-email-note"'), 'Requested signup fine print removed without dangling description');
  check(page.includes(content.email.signupUrl), 'Hosted signup fallback available');
}
for (const [key, id, normalHeading] of [['gifts', 'gift-title', 'Bring a gift.'], ['faq', 'faq-title', 'FAQ'], ['join', 'join-title', 'Join the joy']]) {
  const expected = `<span class="default-only">${normalHeading}</span><span class="rebel-only">${content.copy.rebel.sectionHeadings[key]}</span>`;
  for (const page of [html, rebel]) check(page.includes(`id="${id}">${expected}</h2>`), 'One shared heading switches between default and Rebel copy: ' + key);
}
const emailOff = structuredClone(content);
emailOff.email.enabled = false;
check((renderDefault(emailOff).match(/<form class="email-signup" hidden/g) || []).length === 2, 'Disabled email forms remain hidden');
check(!renderDefault(emailOff).includes('action="'), 'Disabled email never posts addresses');
check(!eventSchema(content).location, 'Unannounced location omitted from schema');
check(eventSchema(content).startDate === '2026-12-05T10:00:00-06:00', 'Correct zoned start timestamp');
check(!eventSchema(content).endDate, 'Unconfirmed finish time omitted from schema');
for (const [name, page] of [['default', html], ['rebel', rebel]]) {
  for (const match of page.matchAll(/(?:src|poster|href|data-src)="([^"#]+)"/g)) {
    if (/^(https?:|mailto:|data:)/.test(match[1])) continue;
    const file = match[1].split(/[?#]/)[0];
    check(existsSync(path.resolve(directory, file)), name + ' local asset exists: ' + file);
  }
}

// Exercise the real renderer against changed operational data without editing the test's facts.
const confirmed = structuredClone(content);
confirmed.announcementStatus.startLocation = { status: 'confirmed', name: 'Fixture venue', address: '123 Test Street, Minneapolis, MN', mapUrl: 'https://example.com/fixture-map' };
let updated = renderDefault(confirmed);
check(updated.includes('Starting spot: Fixture venue.'), 'One location edit updates hero/date card');
check(updated.includes('<small>Fixture venue</small>'), 'One location edit updates schedule');
check(!updated.includes('class="badge"'), 'Navigation badge remains absent after shared status updates');
check(eventSchema(confirmed).location.name === 'Fixture venue', 'One location edit updates Event schema');
check(!updated.includes('The Loop is out this year.'), 'Confirmed state removes obsolete location notice');
check(updated.includes('https://example.com/fixture-map'), 'Confirmed location map remains in hero and schedule');
for (const render of [renderDefault, renderRebel]) check(render(confirmed).includes(renderFaq(confirmed)), 'Confirmed shared FAQ rendered in each theme');
confirmed.announcementStatus.stops.forEach((stop, i) => Object.assign(stop, { status: 'confirmed', name: 'Fixture brewery ' + (i + 1), address: 'Test address ' + i, time: (11 + i) + ':00', mapUrl: 'https://example.com/stop-' + i }));
confirmed.announcementStatus.finish = { status: 'confirmed', time: '6 PM', endDate: '2026-12-05T18:00:00-06:00' };
updated = renderDefault(confirmed);
check(!updated.includes('class="badge"'), 'All confirmed stops remove early-November badge');
for (const stop of confirmed.announcementStatus.stops) check(updated.includes(stop.name) && updated.includes(stop.address), 'Per-stop content renders: ' + stop.number);
check(updated.includes('6 PM') && eventSchema(confirmed).endDate.endsWith('18:00:00-06:00'), 'Finish time drives timeline and schema');
check(renderFaq(confirmed).includes('Fixture brewery 1') && renderFaq(confirmed).includes('11:00'), 'Confirmed first brewery and approximate arrival in FAQ');
check(renderScheduleJoinNote(confirmed).includes('Fixture brewery 1') && renderScheduleJoinNote(confirmed).includes('11:00'), 'Schedule and FAQ share confirmed arrival');
check(!renderFaq(confirmed).includes('Stops will be announced in early November.'), 'Confirmed stops remove pending announcement');
const rescheduled = structuredClone(content);
rescheduled.startDate = '2027-01-09T11:00:00-06:00';
rescheduled.route.announcement = 'early January';
rescheduled.announcementStatus.startLocation.previousName = 'Fixture previous venue';
const rescheduledHtml = renderDefault(rescheduled);
check(rescheduledHtml.includes('Meet at 11 AM') && !rescheduledHtml.includes('TBA EARLY'), 'Date changes still share facts while pending schedule labels stay plain TBA');
check(renderFaq(rescheduled) === renderFaq(content), 'Reduced FAQ does not duplicate dates, places, or announcement timing');

// Cover URL priority, fresh visits, persistence, and denied storage in the actual boot script.
const boot = readFileSync(path.join(directory, 'mode-boot.js'), 'utf8');
function modeTest({ query = '', pageMode = 'default', remembered = null, denied = false }) {
  const url = new URL('http://localhost/test/' + (pageMode === 'rebel' ? 'rebel.html' : 'index.html') + query);
  const root = { dataset: { pageMode } };
  let redirect = null;
  const storage = { getItem() { if (denied) throw new Error('Denied'); return remembered; }, setItem() { if (denied) throw new Error('Denied'); } };
  vm.runInNewContext(boot, { document: { documentElement: root }, location: { href: url.href, search: url.search, hash: url.hash, replace: value => { redirect = value; } }, localStorage: storage, URL, URLSearchParams });
  return { mode: root.dataset.siteMode, redirect };
}
check(modeTest({}).mode === 'default', 'Fresh visitor gets default');
check(modeTest({ remembered: 'rebel' }).mode === 'rebel', 'Remembered Rebel choice is restored');
check(modeTest({ query: '?mode=default', remembered: 'rebel' }).mode === 'default', 'Explicit default URL wins');
check(modeTest({ query: '?mode=rebel' }).mode === 'rebel', 'Direct Rebel parameter works');
check(modeTest({ query: '?mode=rebel' }).redirect === null, 'Direct mode selection does not reload page');
check(modeTest({ pageMode: 'rebel' }).mode === 'rebel', 'Direct Rebel compatibility path works');
check(modeTest({ denied: true }).mode === 'default', 'Denied localStorage does not break default');
check(modeTest({ denied: true, query: '?mode=rebel' }).mode === 'rebel', 'Direct Rebel works with denied localStorage');
check(readFileSync(path.join(directory, 'index.html'), 'utf8') === html, 'Generated default is current');
check(readFileSync(path.join(directory, 'rebel.html'), 'utf8') === rebel, 'Generated Rebel is current');
console.log(`${assertions} checks passed: retained copy/media, local links, shared content transitions, schema, mode priority, storage fallback, and current generated pages.`);
