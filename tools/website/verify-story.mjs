import assert from 'node:assert/strict';
import { content, renderDefault, renderRebel, directory } from './build.mjs';
import { renderStory } from './stories.mjs';
import { readFileSync } from 'node:fs';

let checks = 0;
const check = (condition, label) => { assert.ok(condition, label); checks++; };
const story = renderStory(content);
const local = content.history.stories.minneapolis;
const localHtml = story.slice(story.indexOf('<section class="minneapolis-history"'), story.indexOf('<p class="mayhem-sources"'));
const narrative = [...localHtml.matchAll(/<div class="history-copy" data-history-copy>([\s\S]*?)<\/div>/g)].flatMap(match => [...match[1].matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map(p => p[1]));
check(local.title === 'How a Dozen Friends Became 178 Friendly Santas' && localHtml.includes(`<h2 class="display" id="minneapolis-title">${local.title}</h2>`), 'Exact requested story heading');
check(local.description === 'A dozen riders, coffee-shop posters, a Facebook page, two good videos, and a lot of word of mouth.' && localHtml.includes(`<p class="local-story-deck">${local.description}</p>`), 'Exact requested subtitle');
check(narrative.length === 16 && JSON.stringify(narrative) === JSON.stringify(local.paragraphs), 'All sixteen approved paragraphs appear once, verbatim, in order around the media');
check(localHtml.includes('<strong>kindness</strong>') && !localHtml.includes('<mark>kindness</mark>'), 'Requested bold kindness');
check(!localHtml.includes('class="founding-sentence"') && !localHtml.includes('class="history-timeline"'), 'Superseded preface and timeline do not interrupt the new story');
for (const [index, anchor] of Object.entries(local.anchors)) check(localHtml.includes(`<p id="${anchor}">${local.paragraphs[index]}</p>`), 'Old bookmark still reaches its narrative section: ' + anchor);
for (const [index, key] of Object.entries(local.mediaAfter)) {
  const media = localHtml.indexOf(`data-story-media="${key}"`);
  check(media > localHtml.indexOf(local.paragraphs[index]), 'Media follows the intended passage: ' + key);
  if (Number(index) < local.paragraphs.length - 1) check(media < localHtml.indexOf(local.paragraphs[Number(index) + 1]), 'Media does not reorder the text: ' + key);
  check((localHtml.match(new RegExp(`data-story-media="${key}"`, 'g')) || []).length === 1, 'Archive block appears once: ' + key);
}
for (const url of ['https://www.facebook.com/groups/OpenRussianMN/', 'https://northloop.org/news/']) {
  const links = [...localHtml.matchAll(/<a href="([^"]+)"([^>]*)>(.*?)<\/a>/g)].filter(match => match[1] === url);
  check(links.length === (url.includes('facebook') ? 1 : 2), 'Every requested in-body organization reference is linked: ' + url);
  for (const link of links) check(link[2].includes('target="_blank"') && link[2].includes('rel="noopener"'), 'External link opens safely in a new tab');
}
check(story.indexOf('data-story-media="sanFrancisco"') > story.indexOf(content.copy.historyParagraphs[3]) && story.indexOf('data-story-media="sanFrancisco"') < story.indexOf(content.copy.historyParagraphs[4]), 'SF photograph accompanies the cheap-suit Santas origins');
check(story.indexOf('data-story-media="newYork"') > story.indexOf(content.copy.historyParagraphs[6]) && story.indexOf('data-story-media="newYork"') < story.indexOf(content.copy.historyParagraphs[7]), 'NY photograph accompanies the SantaCon excess passage');
for (const item of content.history.strip.slice(0, 2)) check(story.includes(item.photo.src) && story.includes(item.photo.credit) && story.includes(item.photo.caption), 'Historical photo, caption and credit preserved: ' + item.place);
check(localHtml.includes('Footage: Mike Binkley') && localHtml.includes('Photo: Sarah Mayer'), 'Existing video and photo credits preserved');
const film = localHtml.match(/<video data-ambient[\s\S]*?<\/video>/)[0];
check(film.includes('muted loop playsinline preload="none" poster=') && film.includes('<source data-src=') && !film.includes('<source src=') && !film.includes('autoplay'), 'Archive video retains its poster and lazy, muted behavior');
for (const render of [renderDefault, renderRebel]) {
  const home = render(content);
  check((home.match(/class="two-stories-band"/g) || []).length === 1 && home.includes('id="two-stories-title">Two stories</h3>'), 'One distinct Two stories band in each theme');
  check((home.match(/class="history-path story-feature"/g) || []).length === 2, 'Exactly two fully clickable story links');
  for (const text of ['Story 1: where the idea came from', 'Story 2: how it grew', 'How a Dozen Friends Became 178 Santas', 'Read the bigger story', 'Read how we grew']) check(home.includes(text), 'Exact band wording: ' + text);
  check(home.includes('href="story.html"') && home.includes('href="story.html#minneapolis"'), 'Both band links retain the combined page, at the correct starting point');
  check(home.includes('Photo: Peter Field') && home.includes('Source: Santa Cycle Rampage MSP collection'), 'Both thumbnail credits retained');
}
const css = readFileSync(directory + '/pages.css', 'utf8');
check(css.includes('.two-stories-band .history-path:focus-visible') && css.includes('outline:3px solid var(--band-text)'), 'Prominent keyboard focus on each whole story link');
check(css.includes('--band-bg:#171613;--band-text:#f1eddf') && css.includes('--band-bg:#efebdc;--band-text:#161412'), 'Unique high-contrast band colors in both themes');
check(css.includes('.two-stories-band .story-arrow') && css.includes('width:64px;height:64px'), 'Large visual arrow controls without nested interactive elements');
console.log(`${checks} story checks passed: exact copy, safe links, combined-page destinations, placed media, preserved credits and the Two stories band.`);
