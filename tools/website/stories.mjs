import { escape, cleanCopy, header, pageHead, footer, sticky, storyParagraphs, renderHistoryParagraph, furtherReading, historyTimeline, namedCopy } from './shared.mjs';
import { localArchiveParts } from './history-archive.mjs';

function backgroundPhoto(c, index) {
  const photo = c.history.strip[index].photo;
  return `<figure class="background-history-photo story-media" data-story-media="${index === 0 ? 'sanFrancisco' : 'newYork'}"><img src="${escape(photo.src)}" alt="${escape(photo.alt)}" width="${photo.width}" height="${photo.height}" loading="lazy" decoding="async" style="object-position:${escape(photo.position)}"><figcaption>${escape(photo.caption)}<br><strong>${escape(namedCopy(c, photo.credit))}</strong></figcaption></figure>`;
}

function narrative(c, part, inserts = {}) {
  const paragraphs = storyParagraphs(c, part);
  let html = '<div class="history-copy" data-history-copy>';
  paragraphs.forEach((paragraph, index) => {
    html += renderHistoryParagraph(paragraph) + '\n';
    if (inserts[index]) html += '</div>' + inserts[index] + (index < paragraphs.length - 1 ? '<div class="history-copy" data-history-copy>' : '');
  });
  return html + (inserts[paragraphs.length - 1] ? '' : '</div>');
}

export function renderStory(c) {
  const story = c.history.stories.santacon;
  const local = c.history.stories.minneapolis;
  const title = namedCopy(c, story.title);
  const localMedia = localArchiveParts(c);
  const localInserts = Object.fromEntries(Object.entries(local.mediaAfter).map(([index, key]) => [index, localMedia[key]]));
  return cleanCopy(`<!doctype html><html lang="en" data-page-mode="default" data-site-mode="default" data-default-first="true"><head>${pageHead(c, { page: 'story', title: `${title} | ${c.eventName}`, description: story.description })}</head><body class="story-page" data-history-part="combined"><a class="skip-link" href="#main-content">Skip to content</a>${header(c, { page: 'story' })}<main id="main-content" tabindex="-1"><section class="story-hero" data-sticky-trigger aria-labelledby="story-title"><div class="wrap"><p class="eyebrow">${escape(story.label)} · ${escape(c.eventName)}</p><h1 class="display" id="story-title">${escape(title)}</h1><p class="story-subheading">${escape(c.history.subheading)}</p><p class="story-introduction">${escape(story.description)}</p>${historyTimeline(c, 'santacon')}</div></section><article class="wrap article-copy" aria-label="${escape(title)}">${narrative(c, 'santacon', { 3: backgroundPhoto(c, 0), 6: backgroundPhoto(c, 1) })}<section class="minneapolis-history" id="minneapolis" aria-labelledby="minneapolis-title"><p class="eyebrow">${escape(local.label)} · Since ${c.foundedYear}</p><h2 class="display" id="minneapolis-title">${escape(namedCopy(c, local.title))}</h2><p class="local-story-deck">${escape(local.description)}</p>${narrative(c, 'minneapolis', localInserts)}</section>${furtherReading(c)}<nav class="story-return" aria-label="After the story"><a class="button" data-mode-link href="${escape(c.links.home)}#history">Back to the homepage histories</a></nav></article></main>${footer(c, 'story')}${sticky(c)}</body></html>`);
}

export function renderOurStory(c) {
  const title = namedCopy(c, c.history.stories.minneapolis.title);
  return cleanCopy(`<!doctype html><html lang="en" data-page-mode="default" data-site-mode="default" data-default-first="true"><head>${pageHead(c, { page: 'story', title: `${title} | ${c.eventName}`, description: c.history.stories.minneapolis.description })}<meta http-equiv="refresh" content="0;url=${escape(c.links.ourStory)}"><script>const destination = new URL(${JSON.stringify(c.links.ourStory)}, location.href); destination.search = location.search; if (location.hash) destination.hash = location.hash; location.replace(destination.href);</script></head><body class="story-page"><a class="skip-link" href="#main-content">Skip to content</a><main class="wrap article-copy" id="main-content"><h1 class="display">${escape(title)}</h1><p>Our story is now part of the complete history.</p><a href="${escape(c.links.ourStory)}">Continue to the Minneapolis story →</a></main></body></html>`);
}
