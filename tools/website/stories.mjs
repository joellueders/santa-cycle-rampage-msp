import { escape, cleanCopy, header, pageHead, footer, sticky, storyCopy, furtherReading, historyTimeline, foundingSentence, namedCopy } from './shared.mjs';
import { localArchive } from './history-archive.mjs';

function backgroundPhotos(c) {
  return `<div class="background-history-photos">${c.history.strip.slice(0, 2).map(({ photo }) => `<figure><img src="${escape(photo.src)}" alt="${escape(photo.alt)}" width="${photo.width}" height="${photo.height}" loading="lazy" decoding="async" style="object-position:${escape(photo.position)}"><figcaption>${escape(photo.caption)}<br><strong>${escape(namedCopy(c, photo.credit))}</strong></figcaption></figure>`).join('')}</div>`;
}

export function renderStory(c) {
  const story = c.history.stories.santacon;
  const local = c.history.stories.minneapolis;
  const title = namedCopy(c, story.title);
  return cleanCopy(`<!doctype html><html lang="en" data-page-mode="default" data-site-mode="default" data-default-first="true"><head>${pageHead(c, { page: 'story', title: `${title} | ${c.eventName}`, description: story.description })}</head><body class="story-page" data-history-part="combined"><a class="skip-link" href="#main-content">Skip to content</a>${header(c, { page: 'story' })}<main id="main-content" tabindex="-1"><section class="story-hero" data-sticky-trigger aria-labelledby="story-title"><div class="wrap"><p class="eyebrow">${escape(story.label)} · ${escape(c.eventName)}</p><h1 class="display" id="story-title">${escape(title)}</h1><p class="story-subheading">${escape(c.history.subheading)}</p><p class="story-introduction">${escape(story.description)}</p>${historyTimeline(c, 'santacon')}</div></section><article class="wrap article-copy" aria-label="${escape(title)}">${storyCopy(c, 'santacon')}<section class="minneapolis-history" id="minneapolis" aria-labelledby="minneapolis-title"><p class="eyebrow">${escape(local.label)} · Since ${c.foundedYear}</p><h2 class="display" id="minneapolis-title">${escape(namedCopy(c, local.title))}</h2>${foundingSentence(c)}${historyTimeline(c, 'minneapolis')}${storyCopy(c, 'minneapolis')}${localArchive(c)}</section>${backgroundPhotos(c)}${furtherReading(c)}<nav class="story-return" aria-label="After the story"><a class="button" data-mode-link href="${escape(c.links.home)}#history">Back to the homepage histories</a></nav></article></main>${footer(c, 'story')}${sticky(c)}</body></html>`);
}

export function renderOurStory(c) {
  const title = namedCopy(c, c.history.stories.minneapolis.title);
  return cleanCopy(`<!doctype html><html lang="en" data-page-mode="default" data-site-mode="default" data-default-first="true"><head>${pageHead(c, { page: 'story', title: `${title} | ${c.eventName}`, description: c.history.stories.minneapolis.description })}<meta http-equiv="refresh" content="0;url=${escape(c.links.ourStory)}"><script>const destination = new URL(${JSON.stringify(c.links.ourStory)}, location.href); destination.search = location.search; if (location.hash) destination.hash = location.hash; location.replace(destination.href);</script></head><body class="story-page"><a class="skip-link" href="#main-content">Skip to content</a><main class="wrap article-copy" id="main-content"><h1 class="display">${escape(title)}</h1><p>Our story is now part of the complete history.</p><a href="${escape(c.links.ourStory)}">Continue to the Minneapolis story →</a></main></body></html>`);
}
