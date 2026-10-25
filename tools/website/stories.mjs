import { escape, cleanCopy, header, pageHead, footer, sticky, storyCopy, furtherReading, historyTimeline, foundingSentence, namedCopy } from './shared.mjs';
import { localArchive } from './history-archive.mjs';

function backgroundPhotos(c) {
  return `<div class="background-history-photos">${c.history.strip.slice(0, 2).map(({ photo }) => `<figure><img src="${escape(photo.src)}" alt="${escape(photo.alt)}" width="${photo.width}" height="${photo.height}" loading="lazy" decoding="async" style="object-position:${escape(photo.position)}"><figcaption>${escape(photo.caption)}<br><strong>${escape(namedCopy(c, photo.credit))}</strong></figcaption></figure>`).join('')}</div>`;
}

function render(c, part) {
  const story = c.history.stories[part];
  const local = part === 'minneapolis';
  const title = namedCopy(c, story.title);
  const other = c.history.stories[local ? 'santacon' : 'minneapolis'];
  const localAnchors = Object.entries(c.history.anchors).filter(([index]) => c.history.stories.minneapolis.paragraphIndexes.includes(Number(index))).map(([, anchor]) => anchor);
  return cleanCopy(`<!doctype html><html lang="en" data-page-mode="default" data-site-mode="default" data-default-first="true"><head>${pageHead(c, { page: story.linkKey, title: `${title} | ${c.eventName}`, description: story.description })}</head><body class="story-page" data-history-part="${part}"${local ? '' : ` data-local-story="${escape(c.links.ourStory)}" data-legacy-local-anchors="${localAnchors.join(' ')}"`}><a class="skip-link" href="#main-content">Skip to content</a>${header(c, { page: story.linkKey })}<main id="main-content" tabindex="-1"><section class="story-hero" data-sticky-trigger aria-labelledby="story-title"><div class="wrap"><p class="eyebrow">${escape(story.label)} · ${escape(c.eventName)}</p><h1 class="display" id="story-title">${escape(title)}</h1><p class="story-subheading">${local ? `Since ${c.foundedYear}` : escape(c.history.subheading)}</p><p class="story-introduction">${escape(story.description)}</p>${local ? foundingSentence(c) : ''}${historyTimeline(c, part)}</div></section><article class="wrap article-copy" aria-label="${escape(title)}">${storyCopy(c, part)}${local ? localArchive(c) : furtherReading(c) + backgroundPhotos(c)}<nav class="story-return" aria-label="After the story"><a class="button" data-mode-link href="${escape(c.links.home)}#history">Back to the homepage histories</a><a class="button button-outline" data-mode-link href="${escape(c.links[other.linkKey])}">${local ? 'Read the bigger SantaCon story' : 'Read our Minneapolis story'} →</a></nav></article></main>${footer(c, story.linkKey)}${sticky(c)}</body></html>`);
}

export const renderStory = c => render(c, 'santacon');
export const renderOurStory = c => render(c, 'minneapolis');
