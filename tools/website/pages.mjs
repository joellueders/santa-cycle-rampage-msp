import { readFileSync } from 'node:fs';
import { optimizePage } from './media-performance.mjs';
import { escape, cleanCopy, dates, header, pageHead, footer, historyStrip, manifestoLine, foundingSentence, namedCopy, announcementDetails, locationMarkup } from './shared.mjs';

const pressSource = readFileSync(new URL('./source/press-before-pass3.html', import.meta.url), 'utf8');
const originalSitemap = readFileSync(new URL('../../sitemap.xml', import.meta.url), 'utf8');

function retainedMedia(c, id) {
  let html = pressSource.match(new RegExp(`<section id="${id}"[\\s\\S]*?<\\/section>`))[0];
  html = html.replace(/(src|href|poster)="((?:assets|downloads)\/[^\"]+)"/g, '$1="../../$2"').replaceAll('Santa Cycle Rampage MSP', escape(c.shortName));
  if (id === 'photos') html = html.replace('</div></div></section>', `</div><p class="media-note">Credits are shown with each image. For publication permission or licensing questions, <a href="${escape(c.links.contact)}">contact ${escape(c.press.contactName)}</a>.</p></div></section>`);
  if (id === 'coverage') {
    const date = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(c.press.lastUpdated + 'T12:00:00Z'));
    html = html.replace('</div></section>', `<p class="last-updated">Last updated: <time datetime="${escape(c.press.lastUpdated)}">${escape(date)}</time></p></div></section>`);
  }
  return html;
}

function pressStatus(c) {
  const d = dates(c);
  return `<aside class="press-status" id="ride-status" aria-labelledby="status-title"><h2 class="display" id="status-title">Ride status</h2><p class="status-summary">${escape(c.announcementStatus.summary)}</p><p class="status-kicker">Confirmed</p><dl class="confirmed-facts"><div><dt>Date</dt><dd>${escape(d.dateLabel)}</dd></div><div><dt>Meetup</dt><dd>${escape(d.time)}</dd></div><div><dt>Cost</dt><dd>${escape(c.cost)}</dd></div></dl><dl class="pending-facts">${announcementDetails(c).map(([label, value]) => `<div><dt>${escape(label)}</dt><dd>${value}</dd></div>`).join('')}</dl></aside>`;
}

function pressEssentials(c) {
  const d = dates(c);
  const facts = [
    ['Ride day', escape(d.dateLabel)], ['Meet time', escape(d.time)], ['Cost', escape(c.cost) + ', no registration'],
    ['Start', '<a href="#ride-status">See the ride status above ↗</a>'], ['Event', escape(c.eventName)], ['Location', 'Minneapolis, Minnesota'],
    ['Established', 'Since ' + c.foundedYear], ['Largest ride', `${c.latestRide.riders} riders in ${c.latestRide.year}`],
    ['Toy donation', 'Bring ' + escape(c.toyDrive.item) + ' for kids in need'], ['Media contact', `<a href="${escape(c.links.contact)}">${escape(c.press.contactName)}</a>`]
  ];
  return `<section class="press-section" id="facts"><div class="wrap"><p class="eyebrow">At a glance</p><h2 class="display section-title">Essentials</h2><dl class="press-essentials">${facts.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl><p class="naming-line"><strong>How to refer to us:</strong> ${escape(c.eventName)}; also ${escape(c.shortName)}.</p></div></section>`;
}

function pressAngles(c) {
  return `<section class="press-section" id="angles"><div class="wrap"><p class="eyebrow">Ready for the headline</p><h2 class="display section-title">Four ways into the story</h2><ol class="press-angles">${c.press.angles.map(angle => `<li${angle.story ? ' class="story-angle"' : ''}><h3>${escape(angle.heading)}</h3><p>${escape(angle.text)}</p>${angle.extra ? `<p class="angle-extra">${escape(angle.extra)}</p>` : ''}${angle.story ? `<a class="text-link" href="${escape(c.links.story)}">Read the full story ↗</a>${historyStrip(c, 'press-origins')}` : ''}</li>`).join('')}</ol><section class="press-quotes" id="quotes" aria-labelledby="quotes-title"${c.quotes.length ? '' : ' hidden'}><h3 class="display" id="quotes-title">Quotes</h3>${c.quotes.map(quote => `<figure><blockquote><p>${escape(quote.text)}</p></blockquote><figcaption>${escape(quote.attribution)}</figcaption></figure>`).join('')}</section><figure class="press-pull-quote"><blockquote><p>“${escape(manifestoLine(c))}”</p></blockquote><figcaption>${escape(c.shortName)} · From the ride’s story</figcaption></figure></div></section>`;
}

function coveringLine(c) {
  const s = c.announcementStatus;
  const location = s.startLocation.status === 'confirmed' ? locationMarkup(c) : '<a href="#ride-status">see the pending start details in Ride status</a>';
  const departure = s.departure.status === 'confirmed' ? `Departure: ${escape(s.departure.time)}.` : '<a href="#ride-status">Departure details are in Ride status.</a>';
  return `Where to meet the Santas: ${location}. ${departure}`;
}

export function renderPress(c) {
  const description = namedCopy(c, c.press.description);
  const bundle = c.press.everythingBundle;
  return optimizePage(cleanCopy(`<!doctype html><html lang="en" data-page-mode="default" data-site-mode="default" data-theme-fixed="default"><head>${pageHead(c, { page: 'press', title: `Media Resources | ${c.eventName}`, description, themeable: false })}</head><body class="press-page"><a class="skip-link" href="#main-content">Skip to content</a>${header(c, { page: 'press', themeable: false })}<main id="main-content" tabindex="-1">
<section class="press-hero"><div class="wrap press-hero-layout"><div><p class="eyebrow">${escape(c.eventName)} · Media resources</p><h1 class="display">A sea of<br>Santas.</h1><h2>A Minneapolis holiday tradition since ${c.foundedYear}.</h2><p class="press-lede">Every December, a sea of Santas takes over the streets of Minneapolis, not in sleighs, but on bicycles.</p><p>${c.latestRide.riders} riders in ${c.latestRide.year}. Santa suits, festive misfits, decorated bikes and a city full of cheer.</p>${foundingSentence(c)}<nav class="press-jumps" aria-label="Media resources"><a class="button button-outline" href="#facts">Essentials</a><a class="button button-outline" href="#angles">Story angles</a><a class="button button-outline" href="#photos">Photos</a><a class="button button-outline" href="#broll">B-roll</a><a class="button button-outline" href="#logos">Logos</a><a class="button button-outline" href="#coverage">Coverage</a><a class="button button-outline" href="#contact">Contact</a><a class="button" data-everything-download${bundle.enabled && bundle.url ? ` href="${escape(bundle.url)}" download` : ' hidden'}>Download everything</a></nav></div>${pressStatus(c)}</div></section>
${pressEssentials(c)}
<section class="press-section" id="description"><div class="wrap"><p class="eyebrow">For introductions and listings</p><h2 class="display section-title">Copy-paste description</h2><div class="description-box"><p id="press-description">${escape(description)}</p><button class="button button-secondary" type="button" data-copy-target="press-description">Copy description</button><p class="copy-feedback" role="status" aria-live="polite"></p></div></div></section>
${pressAngles(c)}${retainedMedia(c, 'poster')}${retainedMedia(c, 'photos')}${retainedMedia(c, 'broll')}${retainedMedia(c, 'logos')}${retainedMedia(c, 'coverage')}
<section class="press-section press-contact" id="contact"><div class="wrap contact-layout"><div><p class="eyebrow">Interviews, photos, footage</p><h2 class="display section-title">Media contact</h2><p><strong>${escape(c.press.contactName)}</strong></p><p>For interviews, original files, credits or publication permission, email us.</p><a class="text-link contact-email" href="${escape(c.links.contact)}">${escape(c.links.contact.replace('mailto:', ''))} ↗</a></div><aside class="covering-box" aria-labelledby="covering-title"><h3 id="covering-title">Covering the ride</h3><p>Ride-day contact: <a href="${escape(c.links.contact)}">${escape(c.press.contactName)}</a>.</p><p class="covering-meetup">${coveringLine(c)}</p><p>Drinking is optional. If you drink, have a sober driver or call a ride. Riders go at their own pace.</p><p class="media-note">Check <a href="#ride-status">Ride status</a> before coming.</p></aside></div></section>
</main>${footer(c)}</body></html>`));
}

export { renderStory, renderOurStory } from './stories.mjs';

export function renderSitemap(c) {
  const cleaned = originalSitemap.replace(/\s*<url><loc>[^<]*our-story\.html<\/loc><\/url>/g, '');
  const url = escape(new URL(c.links.story, c.links.canonical).href);
  return cleaned.includes(`<loc>${url}</loc>`) ? cleaned : cleaned.replace('</urlset>', `  <url><loc>${url}</loc></url>\n</urlset>`);
}
