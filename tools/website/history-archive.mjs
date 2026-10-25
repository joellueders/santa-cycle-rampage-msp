import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { escape } from './shared.mjs';

const source = readFileSync(new URL('./source/current-site.html', import.meta.url), 'utf8');
const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function div(className) {
  const start = source.indexOf(`<div class="${className}">`);
  let depth = 0;
  for (const match of source.slice(start).matchAll(/<div\b[^>]*>|<\/div>/g)) {
    depth += match[0].startsWith('</') ? -1 : 1;
    if (!depth) return source.slice(start, start + match.index + match[0].length);
  }
  throw new Error('Unbalanced archive block: ' + className);
}

function localMedia(html) {
  return html.replace(/\s(?:srcset|sizes)="[^"]*"/g, '')
    .replace(/assets\/optimized\/([^"'\s]+)/g, (_, filename) => {
      const stem = filename.replace(/-\d+\.webp$/, '');
      const actual = ['jpg', 'png', 'webp'].map(ext => `assets/${stem}.${ext}`).find(candidate => existsSync(path.join(repository, candidate)));
      if (!actual) throw new Error('Missing original archive photo: ' + filename);
      return actual;
    }).replace(/(["'])assets\//g, '$1../../assets/').replaceAll('<video ', '<video data-ambient ');
}

export function localArchive(c) {
  const thenNow = div('history-grid').replace(/<p class="lede">[\s\S]*?<\/p>/, '');
  const early = div('early-history');
  const extras = [
    ['crowd.jpg', 'A huge crowd of Santa Cycle Rampage riders outdoors', 'A little joy in the streets.'],
    ['prince.jpg', 'Santa and elf cyclists riding past the Prince mural in Minneapolis', 'Very Minneapolis.'],
    ['sarah-mayer-friends-2024.jpg', 'Five friends in Santa costumes at La Doña during the 2024 ride', 'Free. Festive. Full of cheer.', 'Photo: Sarah Mayer'],
    ['patio.jpg', 'Santa riders relaxing outside a brewery', 'December patio weather.']
  ];
  return `<section class="local-archive" aria-labelledby="local-archive-title"><h2 class="display archive-title" id="local-archive-title">From the ride’s archive</h2><p>${c.latestRide.riders} riders joined in ${c.latestRide.year}, our biggest year yet.</p>${localMedia(thenNow + early)}<div class="vibe-grid">${extras.map(([src, alt, caption, credit]) => `<figure><img src="../../assets/${src}" alt="${escape(alt)}" loading="lazy" decoding="async"><figcaption>${caption}${credit ? ' · ' + credit : ''}</figcaption></figure>`).join('')}</div></section>`;
}
