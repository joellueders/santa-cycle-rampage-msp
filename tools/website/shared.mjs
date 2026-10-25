import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

export const escape = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
export const cleanCopy = html => html.replaceAll('—', ', ');
export const asset = name => name + '?v=' + createHash('sha256').update(readFileSync(new URL(name, import.meta.url))).digest('hex').slice(0, 10);
export const announcementLabel = c => c.route.announcement.replace(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/g, month => month.slice(0, 3)).toUpperCase();

export function dates(c) {
  const date = new Date(c.startDate);
  const options = { timeZone: c.timeZone };
  return {
    dateLabel: new Intl.DateTimeFormat('en-US', { ...options, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(date),
    shortDate: new Intl.DateTimeFormat('en-US', { ...options, weekday: 'short', month: 'short', day: 'numeric' }).format(date),
    time: new Intl.DateTimeFormat('en-US', { ...options, hour: 'numeric' }).format(date),
    timelineTime: new Intl.DateTimeFormat('en-US', { ...options, hour: 'numeric', minute: '2-digit' }).format(date),
    monthYear: new Intl.DateTimeFormat('en-US', { ...options, month: 'long', year: 'numeric' }).format(date),
    year: new Intl.DateTimeFormat('en-US', { ...options, year: 'numeric' }).format(date)
  };
}

export const namedCopy = (c, text) => text.replaceAll('{eventName}', c.eventName).replaceAll('{shortName}', c.shortName);
export const foundingSentence = c => c.foundingSentence && !c.foundingSentence.startsWith('[CONFIRM:') ? `<p class="founding-sentence">${escape(c.foundingSentence)}</p>` : '';
export const manifestoLine = c => c.copy.historyParagraphs.at(-1).match(/In a weary world,.*$/)[0];

export function header(c, { page = 'home', mode = 'default', themeable = true } = {}) {
  const homeSection = id => page === 'home' ? '#' + id : c.links.home + '#' + id;
  const items = [[homeSection('what'), 'What is this?'], [homeSection('schedule'), 'Schedule'], [homeSection('toy'), 'Toy drive'], [homeSection('faq'), 'FAQ'], [homeSection('history'), 'History'], [c.links.press, 'Press']];
  const nav = items.map(([href, label]) => `<a href="${escape(href)}"${label === 'Schedule' ? ' class="schedule-link"' : ''}${(page === 'press' && label === 'Press') || (page === 'story' && label === 'Story') ? ' aria-current="page"' : ''}${themeable && label !== 'Press' ? ' data-mode-link' : ''}>${label}</a>`).join('');
  const words = c.eventName.split(/\s+/);
  const brand = [words.slice(0, -3).join(' '), words.at(-3), words.slice(-2).join(' ')].map(part => `<span>${escape(part.toUpperCase())}</span>`).join(' ');
  return `<header class="site-header"><div class="header-bar"><a class="brand" href="${escape(homeSection('about'))}" aria-label="${escape(c.eventName)} home"${themeable ? ' data-mode-link' : ''}>${brand}</a><nav class="desktop-nav" aria-label="Main navigation">${nav}</nav><div class="header-actions">${themeable ? `<div class="mode-control"><button class="mode-toggle" type="button" aria-pressed="${mode === 'rebel'}" aria-label="Rebel Mode"><span class="mode-switch" aria-hidden="true"></span><span>Rebel Mode</span></button></div>` : ''}<button class="menu" type="button" aria-label="Open menu" aria-controls="mobile-nav" aria-expanded="false"><span></span><span></span><span></span></button></div></div><nav class="mobile-nav" id="mobile-nav" aria-label="Mobile navigation" hidden>${nav}</nav></header>`;
}

export function pageHead(c, { page, title, description, themeable = true, schema = null }) {
  const canonical = new URL(page === 'home' ? '' : c.links[page], c.links.canonical).href;
  const social = new URL('assets/social-share-prince.jpg', c.links.canonical).href;
  return `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f1eddf"><meta name="robots" content="noindex,nofollow"><title>${escape(title)}</title><meta name="description" content="${escape(description)}"><link rel="canonical" href="${escape(canonical)}"><link rel="icon" href="../../favicon.ico"><link rel="apple-touch-icon" href="../../apple-touch-icon.png"><meta property="og:type" content="${['story', 'ourStory'].includes(page) ? 'article' : 'website'}"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${escape(canonical)}"><meta property="og:image" content="${escape(social)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Santa-costumed cyclists riding past the Prince mural in Minneapolis"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(title)}"><meta name="twitter:description" content="${escape(description)}"><meta name="twitter:image" content="${escape(social)}">${themeable ? `<script src="${asset('mode-boot.js')}"></script>` : ''}<link rel="stylesheet" href="${asset('default.css')}"><link rel="stylesheet" href="${asset('components.css')}"><link rel="stylesheet" href="${asset('rebel.css')}"><link rel="stylesheet" href="${asset('pages.css')}">${schema ? `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>` : ''}<script src="${asset('site.js')}" defer></script>`;
}

export function footer(c, page = 'story') {
  return `<footer class="page-footer"><div class="wrap"><span>${escape(c.eventName)} · Minneapolis, Minnesota</span><a href="${escape(c.links.story)}" data-mode-link>Read the full story</a><span class="print-url">${escape(new URL(c.links[page], c.links.canonical).href)}</span></div></footer>`;
}

export function sticky(c) {
  const d = dates(c);
  return `<aside class="sticky-rsvp" id="sticky-rsvp" aria-label="Ride day RSVP" hidden><div class="sticky-inner"><strong>${escape(d.shortDate)} · ${escape(d.time)} · ${escape(c.cost)}</strong><a class="button" href="${escape(c.links.event)}" target="_blank" rel="noopener">RSVP<span class="sticky-long"> on Facebook</span></a></div></aside>`;
}

export function storyParagraphs(c, part) {
  const story = c.history.stories[part];
  return story.paragraphs
    ? story.paragraphs.map((html, index) => ({ html, anchor: story.anchors?.[index] }))
    : story.paragraphIndexes.map(index => ({ html: c.copy.historyParagraphs[index], anchor: c.history.anchors[index] }));
}

export const renderHistoryParagraph = ({ html, anchor }) => `<p${anchor ? ` id="${escape(anchor)}"` : ''}>${html}</p>`;

export function storyCopy(c, part = null) {
  const paragraphs = part ? storyParagraphs(c, part) : Object.keys(c.history.stories).flatMap(key => storyParagraphs(c, key));
  return `<div class="history-copy" data-history-copy>${paragraphs.map(renderHistoryParagraph).join('\n')}</div>`;
}

export function furtherReading(c) {
  return `<p class="mayhem-sources">Further reading: ${c.history.furtherReading.map(item => `<a href="${escape(item.url)}" target="_blank" rel="noopener">${escape(item.title)}</a>`).join(' · ')}</p>`;
}

export function historyStrip(c, id = 'origins') {
  return `<figure class="origin-strip" aria-labelledby="${id}-caption"><ol>${c.history.strip.map(item => `<li><strong class="origin-place">${escape(item.place)}</strong><p>${escape(item.line)}</p>${item.photo ? `<figure class="origin-photo"><img src="${escape(item.photo.src)}" alt="${escape(item.photo.alt)}" width="${item.photo.width}" height="${item.photo.height}" loading="lazy" decoding="async" style="object-position:${escape(item.photo.position)}"><figcaption><span>${escape(item.photo.caption)}</span><span class="origin-credit">${escape(namedCopy(c, item.photo.credit))}</span></figcaption></figure>` : ''}</li>`).join('')}</ol><figcaption id="${id}-caption">${escape(c.history.stripCaption)}</figcaption></figure>`;
}

export function historyTimeline(c, part) {
  const story = c.history.stories[part];
  const beats = c.history.timeline.filter(beat => story.timelineYears.includes(beat.year));
  return `<ol class="history-timeline" style="--timeline-count:${beats.length}" aria-label="${escape(namedCopy(c, story.title))} timeline">${beats.map(beat => `<li><div class="timeline-entry"><strong>${escape(beat.year)}:</strong> <span>${escape(beat.text)}</span></div></li>`).join('')}</ol>`;
}

export function renderHistoryHub(c) {
  const h = c.history.homepage;
  const paths = Object.entries(c.history.stories).map(([key, story]) => {
    const thumbnail = story.thumbnail || c.history.strip[story.photoIndex].photo;
    return `<article class="history-path-panel"><a class="history-path story-feature" data-mode-link href="${escape(c.links[story.linkKey])}" aria-labelledby="${key}-path-title ${key}-path-link"><figure class="history-path-photo"><img src="${escape(thumbnail.src)}" alt="${escape(thumbnail.alt)}" loading="lazy" decoding="async" style="object-position:${escape(thumbnail.position)}"><figcaption>${escape(namedCopy(c, thumbnail.credit))}</figcaption></figure><div class="story-feature-copy"><p class="history-path-kicker">${escape(story.panelLabel || story.label)}</p><h4 id="${key}-path-title">${escape(namedCopy(c, story.panelTitle || story.title))}</h4><p>${escape(story.description)}</p><span class="history-path-link" id="${key}-path-link"><span>${escape(story.linkLabel.replace(/ →$/, ''))}</span><span class="story-arrow" aria-hidden="true">→</span></span></div></a></article>`;
  }).join('');
  return `<section class="content-section history-section history-hub" id="history" aria-labelledby="history-title"><span id="santa-mayhem" class="legacy-history-anchor" aria-hidden="true"></span><p class="eyebrow">History</p><h2 class="display section-title" id="history-title">${escape(h.heading)}</h2><ol class="history-cards" id="origins" aria-label="From San Francisco to New York to Minneapolis">${h.cards.map(card => {
    const photo = c.history.strip[card.photoIndex].photo;
    return `<li><p class="history-card-place">${escape(card.label)}</p><h3 class="display">${escape(card.headline)}</h3><figure><img src="${escape(photo.src)}" alt="${escape(photo.alt)}" width="${photo.width}" height="${photo.height}" loading="lazy" decoding="async" style="object-position:${escape(photo.position)}"><p class="history-card-description">${escape(card.description)}</p><figcaption><span>${escape(card.caption || photo.caption)}</span><strong>${escape(namedCopy(c, photo.credit))}</strong></figcaption></figure></li>`;
  }).join('')}</ol><p class="history-bridge"><span class="default-only">${escape(h.narrative)}</span><span class="rebel-only">${escape(c.copy.rebel.body?.historyBridge || h.narrative)}</span></p><p class="display history-rebellion">${escape(manifestoLine(c))}</p><div class="two-stories-band" id="two-stories" role="group" aria-labelledby="two-stories-title"><h3 class="display" id="two-stories-title">${escape(c.history.storyBandHeading)}</h3><nav class="history-paths" aria-label="Choose a complete history">${paths}</nav></div></section>`;
}

export function locationMarkup(c) {
  const location = c.announcementStatus.startLocation;
  const text = [location.name, location.address].filter(Boolean).join(', ');
  return location.status === 'confirmed' ? location.mapUrl ? `<a href="${escape(location.mapUrl)}" target="_blank" rel="noopener">${escape(text)}</a>` : escape(text) : 'to be announced';
}

export function announcementDetails(c) {
  const s = c.announcementStatus;
  const stopsConfirmed = s.stops.filter(stop => stop.status === 'confirmed');
  const collection = s.stops.find(stop => stop.number === s.toyCollection.stopNumber);
  return [
    ['Start location', locationMarkup(c)],
    ['Departure time', s.departure.status === 'confirmed' ? escape(s.departure.time) : 'to be announced'],
    ['Brewery stops', stopsConfirmed.length === s.stops.length ? stopsConfirmed.map(stop => escape(stop.name)).join(' · ') : stopsConfirmed.length ? `${stopsConfirmed.map(stop => escape(stop.name)).join(' · ')}; remaining stops to be announced` : 'to be announced'],
    ['Finish time', s.finish.status === 'confirmed' ? escape(s.finish.time) : 'to be announced'],
    ['Toy collection stop', s.toyCollection.status === 'confirmed' && collection?.status === 'confirmed' ? `Stop ${collection.number}: ${escape(collection.name)}` : 'to be announced']
  ];
}
