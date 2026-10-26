import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { renderFaq, renderScheduleJoinNote } from './faq.mjs';
import { escape, cleanCopy, dates, header, pageHead, footer, sticky, announcementDetails, renderHistoryHub, asset } from './shared.mjs';
import { renderPress, renderSitemap } from './pages.mjs';
import { renderStory, renderOurStory } from './stories.mjs';
import { applyMonsterLayer } from './monster-layer.mjs';
import { optimizePage } from './media-performance.mjs';

export const directory = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(path.join(directory, 'source/current-site.html'), 'utf8');
export const content = JSON.parse(readFileSync(path.join(directory, 'event-data.json'), 'utf8'));


export function eventSchema(c) {
  const schema = {
    '@context': 'https://schema.org', '@type': 'Event', name: c.eventName + ' ' + dates(c).year,
    url: c.links.canonical, startDate: c.startDate, eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode', isAccessibleForFree: c.cost.toLowerCase() === 'free',
    description: `A ${c.cost.toLowerCase()} holiday bicycle ride through Minneapolis. Dress as Santa or another festive character, decorate your bike, bring ${c.toyDrive.item} to donate, and ride together between local breweries.`,
    image: [c.links.canonical + 'assets/social-share-prince.jpg'],
    organizer: { '@type': 'Organization', name: c.shortName, ...c.organizer, sameAs: c.links.facebook }
  };
  if (c.announcementStatus.startLocation.status === 'confirmed') schema.location = { '@type': 'Place', name: c.announcementStatus.startLocation.name, address: c.announcementStatus.startLocation.address, ...(c.announcementStatus.startLocation.mapUrl ? { hasMap: c.announcementStatus.startLocation.mapUrl } : {}) };
  if (c.announcementStatus.finish.status === 'confirmed' && c.announcementStatus.finish.endDate) schema.endDate = c.announcementStatus.finish.endDate;
  return schema;
}

function sectionHeading(c, key, defaultText) {
  return `<span class="default-only">${escape(defaultText)}</span><span class="rebel-only">${escape(c.copy.rebel.sectionHeadings?.[key] || defaultText)}</span>`;
}

// Mode variants use the existing display classes, so switching preserves DOM state.
function bodyCopy(c, key, defaultHtml, { html = false } = {}) {
  let rebelText = key.startsWith("step") ? c.copy.rebel.body?.steps?.[Number(key.slice(4))] : c.copy.rebel.body?.[key];
  if (!rebelText) return defaultHtml;
  for (const [token, value] of Object.entries({ gift: c.toyDrive.item, collection: c.toyDrive.collection, recipient: c.toyDrive.recipient })) rebelText = rebelText.replaceAll('{' + token + '}', value);
  return `<span class="default-only">${defaultHtml}</span><span class="rebel-only">${html ? rebelText : escape(rebelText)}</span>`;
}

function emailForm(c, id) {
  const enabled = c.email.enabled && /^https:\/\//.test(c.email.endpoint);
  const hiddenFields = enabled ? Object.entries(c.email.hiddenFields || {}).map(([name, value]) => `<input type="hidden" name="${escape(name)}" value="${escape(value)}">`).join('') : '';
  return `<form class="email-signup"${enabled ? ` action="${escape(c.email.endpoint)}" method="post"` : ' hidden'}><label for="${id}">${escape(c.email.heading)}</label><div class="email-fields"><input id="${id}" name="${escape(c.email.emailField)}" type="email" autocomplete="email" placeholder="you@example.com" required><button class="button button-secondary" type="submit">${escape(c.email.buttonLabel)}</button></div>${hiddenFields}<p class="email-signup-status" role="status" aria-live="polite" hidden></p><p class="email-signup-fallback" hidden><a href="${escape(c.email.signupUrl)}" target="_blank" rel="noopener">Open the signup page instead ↗</a></p><noscript><p>JavaScript is needed for inline signup. <a href="${escape(c.email.signupUrl)}">Sign up on MailerLite</a>.</p></noscript></form>`;
}

function video(c, key, className = '') {
  const media = c.media[key];
  return `<figure class="${className}"><video data-ambient id="video-${key}" muted loop playsinline preload="none" poster="${escape(media.poster)}" aria-label="${escape(media.label)}"${key === 'hero' ? ' fetchpriority="high"' : ''}><source data-src="${escape(media.src)}" type="video/mp4"></video><figcaption class="media-caption">${escape(media.credit)}</figcaption></figure>`;
}

function stepRows(c) {
  return `<ol class="participation-steps" data-step-rows aria-label="Five ways to join the ride">${c.participationSteps.map((step, index) => `<li><span class="participation-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><h3 class="display">${escape(step.title)}</h3><p>${bodyCopy(c, "step" + index, escape(step.body))}</p></li>`).join('')}</ol>`;
}

function introduction(c, mode) {
  const intro = c.homepageIntro;
  const rebel = c.copy.rebel;
  const sharedSteps = stepRows(c);
  const sharedFilm = video(c, 'brewery', 'wide-film brewery-film');
  return `<section class="content-section what-section" id="what" aria-label="What is this?">
<div class="default-only"><p class="eyebrow">${escape(intro.eyebrow)}</p><h2 class="display section-title" id="what-title">${escape(intro.heading)}</h2><div class="what-layout"><div class="what-copy"><p class="what-lead">${escape(intro.lead)}</p><p>${escape(intro.body)}</p></div><div data-brewery-slot="default">${mode === 'default' ? sharedFilm : ''}</div></div><div data-steps-slot="default">${mode === 'default' ? sharedSteps : ''}</div></div>
<div class="manifesto-section rebel-only" aria-labelledby="manifesto-title"><div class="manifesto-heading"><h2 class="display" id="manifesto-title">${escape(rebel.manifestoTitle)}</h2><p class="manifesto-subline">${escape(rebel.manifestoSubline)}</p></div><div class="manifesto-copy">${rebel.manifesto.map(paragraph => `<p>${escape(paragraph)}</p>`).join('\n')}<p class="manifesto-closing"><strong>${escape(rebel.manifestoClosing)}</strong></p></div></div></section>
<section class="content-section uprising-section rebel-only" id="uprising" aria-labelledby="uprising-title"><p class="eyebrow">The whole crew rolls together</p><h2 class="display section-title" id="uprising-title">${escape(rebel.sectionHeadings.how)}</h2><div data-brewery-slot="rebel">${mode === 'rebel' ? sharedFilm : ''}</div><div data-steps-slot="rebel">${mode === 'rebel' ? sharedSteps : ''}</div></section>`;
}

function schedule(c) {
  const d = dates(c);
  const hasConfirmed = c.announcementStatus.startLocation.status === 'confirmed' || c.announcementStatus.stops.some(stop => stop.status === 'confirmed');
  const allConfirmed = c.announcementStatus.startLocation.status === 'confirmed' && c.announcementStatus.stops.every(stop => stop.status === 'confirmed');
  const heading = allConfirmed ? 'The route is ready. Come ride with us.' : hasConfirmed ? 'The route is taking shape.' : "TBA";
  const first = `<div class="schedule-row"><div>${escape(d.timelineTime)} · Start${c.announcementStatus.startLocation.status === 'confirmed' ? `<small>${escape(c.announcementStatus.startLocation.name)}</small>${c.announcementStatus.startLocation.mapUrl ? `<a href="${escape(c.announcementStatus.startLocation.mapUrl)}" target="_blank" rel="noopener">${escape(c.announcementStatus.startLocation.address)}</a>` : `<small>${escape(c.announcementStatus.startLocation.address)}</small>`}` : ''}</div>${c.announcementStatus.startLocation.status === 'confirmed' ? '<span class="status-badge">Confirmed</span>' : '<span class="status-badge">TBA</span>'}</div>`;
  const pendingStopLabel = "TBA";
  const logistics = `<dl class="schedule-logistics">${announcementDetails(c).filter(([label]) => ['Departure time', 'Toy collection stop'].includes(label)).map(([label, value]) => `<div><dt>${escape(label)}</dt><dd>${value === "to be announced" ? "TBA" : value}</dd></div>`).join('')}</dl>`;
  const stopRows = hasConfirmed ? c.announcementStatus.stops.map(stop => `<div class="schedule-row"><div>${stop.time ? escape(stop.time) + ' · ' : ''}Stop ${stop.number}${stop.status === 'confirmed' ? `<small>${escape(stop.name)}</small>${stop.mapUrl ? `<a href="${escape(stop.mapUrl)}" target="_blank" rel="noopener">${escape(stop.address)}</a>` : `<small>${escape(stop.address)}</small>`}` : ''}</div><span class="status-badge">${stop.status === 'confirmed' ? 'Confirmed' : escape(pendingStopLabel)}</span></div>`).join('') : `<div class="schedule-row"><span>Brewery stops ${c.announcementStatus.stops[0].number} to ${c.announcementStatus.stops.at(-1).number}</span><span class="status-badge">${escape(pendingStopLabel)}</span></div>`;
  return `<div class="schedule-layout"><div class="schedule-summary"><h3 class="schedule-heading">${heading}</h3><p class="schedule-description">We meet at ${escape(d.time)}, then ride to ${escape(c.route.breweryCount)} breweries. About ${c.route.miles} miles, and we take it slow.${hasConfirmed ? ' Times are approximate.' : ' Times will be approximate, with a finish time posted once the route is set.'}</p>${emailForm(c, 'schedule-email')}</div><div class="schedule-route"><div class="schedule-card" aria-label="Route status">${first}${stopRows}<div class="schedule-row"><span>Finish</span><span class="${c.announcementStatus.finish.status === 'confirmed' ? '' : 'status-badge'}">${c.announcementStatus.finish.status === 'confirmed' ? escape(c.announcementStatus.finish.time) : 'TBA'}</span></div></div><aside class="ride-smart" aria-labelledby="ride-smart-title"><h3 id="ride-smart-title">${escape(c.rideSmart.heading)}</h3><p>${escape(c.rideSmart.body).replace(escape(c.rideSmart.highlight), '<mark class="lights-reminder">' + escape(c.rideSmart.highlight) + '</mark>')}</p></aside>${logistics}${renderScheduleJoinNote(c)}</div><p class="schedule-channel"><a href="${escape(c.links.facebook)}" target="_blank" rel="noopener">Facebook is the live update channel on ride day.</a></p></div>`;
}

export function renderPage(c, mode = 'default') {
  const d = dates(c);
  const nameWords = c.eventName.split(/\s+/);
  const region = nameWords.slice(0, -3).join(' ');
  const titleFirst = nameWords.slice(-3, -1).join(' ');
  const titleLast = nameWords.at(-1);
  const faq = renderFaq(c);
  const rebel = c.copy.rebel;
  const shortRideDate = new Intl.DateTimeFormat('en-US', { timeZone: c.timeZone, month: 'short', day: 'numeric' }).format(new Date(c.startDate));
  const vibeCopy = source.match(/<section class="vibe"[\s\S]*?<p class="lede">([\s\S]*?)<\/p>/)[1];
  const status = (c.announcementStatus.startLocation.status === 'confirmed' ? `<strong>Starting spot: ${escape(c.announcementStatus.startLocation.name)}.</strong>${c.announcementStatus.startLocation.mapUrl ? `<a href="${escape(c.announcementStatus.startLocation.mapUrl)}" target="_blank" rel="noopener">${escape(c.announcementStatus.startLocation.address)} ↗</a>` : `<p>${escape(c.announcementStatus.startLocation.address)}</p>`}` : `<strong>Starting spot: to be announced.</strong> ${escape(c.announcementStatus.startLocation.pendingMessage)}`) + (c.announcementStatus.departure.status === 'confirmed' ? `<span class="departure-line">Roll out at ${escape(c.announcementStatus.departure.time)}.</span>` : '');
  const photo = (src, alt, caption, credit = '') => `<figure${src === 'elf.jpg' ? ' class="misfits-photo"' : src === 'decorated-bike-rider.jpg' ? ' class="decorated-bike-photo"' : ''}><img src="../../assets/${src}" alt="${escape(alt)}" loading="lazy" decoding="async"><figcaption>${caption}${credit ? ' · ' + credit : ''}</figcaption></figure>`;
  return cleanCopy(`<!doctype html>
<html lang="en" data-page-mode="${mode}" data-site-mode="${mode}"><head>
${pageHead(c, { page: 'home', title: `${c.eventName} ${d.year} | Local redesign test`, description: c.copy.description, schema: eventSchema(c) })}
</head><body data-home-page>
<a class="skip-link" href="#main-content">Skip to content</a>
${header(c, { mode })}
<main id="main-content" tabindex="-1">
<section class="hero" id="about" aria-labelledby="event-title"><div class="wrap hero-layout">
<p class="eyebrow hero-eyebrow"><span class="default-only">Minneapolis · Riding since 2013</span><span class="rebel-only">Santa bike ride · Toy drive · ${escape(shortRideDate)} · Minneapolis</span></p>
<div class="hero-heading"><h1 class="display hero-title" id="event-title"><span class="default-only"><span class="event-region">${escape(region)}</span><span class="title-line">${escape(titleFirst)}</span><span class="title-line">${escape(titleLast)}</span></span><span class="rebel-only rebel-title">${rebel.headline.map(line => `<span>${escape(line)}</span>`).join('')}</span></h1><p class="hero-response rebel-only">${escape(rebel.response)}</p></div>
<p class="hero-tagline">${escape(c.copy.tagline)}</p>
<p class="hero-description default-only">${escape(c.copy.description)}</p>
${video(c, 'hero', 'hero-film')}
<aside class="date-card" id="when-where" aria-labelledby="ride-date"><p class="eyebrow">${d.year} ride day</p><h2 class="display ride-date" id="ride-date"><time datetime="${escape(c.startDate)}"><span>${escape(d.dateLabel.split(', ')[0])},</span><span>${escape(d.dateLabel.split(', ').slice(1).join(', '))}</span></time></h2><p class="meet-time">Meet at ${escape(d.time)} · ${escape(c.cost)}</p><div class="location-status">${status}</div>${emailForm(c, 'location-email')}</aside>
<div class="hero-actions"><a class="button" href="${escape(c.links.event)}" target="_blank" rel="noopener">RSVP on Facebook ↗</a><a class="button button-secondary" href="${escape(c.links.calendar)}" download>Add to calendar</a></div>
<p class="free-note">${escape(c.cost)} ride. No registration. Facebook RSVP is optional.</p>
<ul class="quick-facts" aria-label="Quick facts"><li>${escape(c.cost)}</li><li>About ${c.route.miles} miles</li><li>${escape(c.route.breweryCountShort)} breweries</li><li>Bring ${escape(c.toyDrive.item)}</li><li>No registration</li></ul>
</div></section>
<div class="wrap"><div class="content-sections">
${introduction(c, mode)}
<section class="content-section schedule-section" id="schedule" aria-labelledby="schedule-title"><span class="legacy-section-anchor" id="stops" aria-hidden="true"></span><p class="eyebrow">${escape(d.monthYear)}</p><h2 class="display section-title" id="schedule-title">${d.year} schedule</h2>${schedule(c)}</section>
<section class="content-section gifts-section" id="toy" aria-labelledby="gift-title"><span class="legacy-section-anchor" id="gifts" aria-hidden="true"></span><div class="gift-panel"><p class="eyebrow">The ride gives back</p><h2 class="display" id="gift-title">${sectionHeading(c, 'gifts', 'Bring a gift.')}</h2><p class="toy-purpose">${escape(c.toyDrive.purpose)}</p><p>${bodyCopy(c, "gifts", `Bring ${escape(c.toyDrive.item)} and carry it on your bike. We collect at ${escape(c.toyDrive.collection)}, and the toys go to ${escape(c.toyDrive.recipient)}. ${escape(c.toyDrive.tagline)}`)}</p></div><aside class="spectator-card"><h3>${bodyCopy(c, "spectatorHeading", "Not riding? Come for the Santas.")}</h3><p>${bodyCopy(c, "spectator", "Meet us at a brewery or travel between stops by car. If you drink, have someone sober drive. Plan lunch with friends at one of our stops, and don't mention the Santas. Let us be the surprise.")}</p></aside></section>
<section class="content-section faq-section shared-faq" id="faq" aria-labelledby="faq-title"><h2 class="display section-title" id="faq-title">${sectionHeading(c, 'faq', 'FAQ')}</h2>${faq}</section>
<section class="content-section vibe-section" id="vibe" aria-labelledby="vibe-title"><p class="eyebrow">Joy in the wild</p><h2 class="display section-title" id="vibe-title"><span class="default-only">The vibe</span><span class="rebel-only">${escape(rebel.vibeHeading)}</span></h2><p class="section-intro">${bodyCopy(c, "vibe", "A little absurdity, a little beer, a gentle disregard for social norms, and a whole lot of bicycles, kindness, and holiday cheer.")}</p><div class="vibe-grid">${video(c, 'vibe', 'portrait-video')}${photo('decorated-bike-rider.jpg', 'A Santa rider beside a bicycle covered in garland, ornaments and a reindeer decoration', 'Decorate your bike')}${photo('brewery.jpg', 'A brewery crowded with Santa-costumed riders', 'Raise a little cheer')}${photo('elf.jpg', 'Buddy the Elf with two festive riders in the snow', 'A few misfits')}${photo('aerial.jpg', 'A stream of Santa cyclists seen from above', 'Make the city smile')}${video(c, 'crew')}</div><div class="vibe-note"><h3>Dress like Santa.</h3><p>${bodyCopy(c, "costume", "A Santa suit is the idea. We've also had Christmas trees, Krampus, and a whole assortment of characters from the old stop-motion Christmas specials.")}</p><p>${bodyCopy(c, "connection", vibeCopy)}</p></div></section>
${renderHistoryHub(c)}
<section class="content-section join-section" id="join" aria-labelledby="join-title"><p class="eyebrow">Ride updates and more cheer</p><h2 class="display section-title" id="join-title">${sectionHeading(c, 'join', 'Join the joy')}</h2><div class="join-actions"><a class="button" href="${escape(c.links.facebook)}" target="_blank" rel="noopener">Facebook</a><a class="button button-outline" href="${escape(c.links.instagram)}" target="_blank" rel="noopener">Instagram</a>${c.email.enabled && c.email.signupUrl ? `<a class="button button-outline" href="${escape(c.email.signupUrl)}">Email list</a>` : ''}<a class="button button-outline" href="${escape(c.links.press)}">Press</a><a class="button button-outline" href="${escape(c.links.contact)}">Contact</a></div>${video(c, 'history', 'wide-film farewell-film')}</section>
</div></div></main>
${footer(c)}${sticky(c)}<script src="${asset('email-signup.js')}" defer></script>
</body></html>`);
}

// The public homepage now opens in Rebel mode. Both markup variants remain in
// the shared page, so the existing toggle still reveals the regular site.
export const renderDefault = c => optimizePage(applyMonsterLayer(renderPage(c, 'rebel'), c));
export const renderRebel = c => optimizePage(applyMonsterLayer(renderPage(c, 'rebel'), c));

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (content.build.name.length > 15) throw new Error('Build name must be 15 characters or fewer');
  writeFileSync(path.join(directory, 'index.html'), renderDefault(content));
  writeFileSync(path.join(directory, 'rebel.html'), renderRebel(content));
  writeFileSync(path.join(directory, 'press.html'), renderPress(content));
  writeFileSync(path.join(directory, 'story.html'), renderStory(content));
  writeFileSync(path.join(directory, 'our-story.html'), renderOurStory(content));
  writeFileSync(path.join(directory, 'sitemap.xml'), renderSitemap(content));
  console.log('Built home, Rebel, press, two distinct histories, and local sitemap.');
}
