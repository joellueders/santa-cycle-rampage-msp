import { readFileSync } from 'node:fs';

const media = JSON.parse(readFileSync(new URL('./media-performance.json', import.meta.url), 'utf8'));
const value = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
const set = (tag, name, content) => {
  const attribute = new RegExp(`\\s${name}="[^"]*"`);
  return attribute.test(tag) ? tag.replace(attribute, ` ${name}="${content}"`) : tag.replace(/\s*\/?>(?=$)/, ` ${name}="${content}">`);
};
// New derivatives live beside the local source, too. Reused public derivatives
// retain the original ../../ prefix when previewing from local-tests/.
const pathFor = (source, variant) => variant.startsWith('assets/mobile/') ? variant : (source.startsWith('../../') ? '../../' : '') + variant;
const keyFor = source => source.replace(/^\.\.\/\.\.\//, '');

function imageSizes(source, tag, before) {
  if (source.includes('hero-monster-user')) return /monster-footer-emblem[^<]*$/.test(before.slice(-200)) ? '210px' : '(max-width: 900px) 90vw, 600px';
  if (source.includes('chocolate-clean')) return '(max-width: 900px) 100vw, 660px';
  if (source.includes('cast-longhair')) return '(max-width: 900px) 76vw, 350px';
  if (source.includes('cast-many-eyed')) return '145px';
  if (source.includes('cast-stick')) return '(max-width: 900px) 108px, 150px';
  if (source.includes('cast-watercolor')) return '(max-width: 900px) 125px, 145px';
  if (source.includes('cast-dinosaur')) return '(max-width: 900px) 140px, 250px';
  if (source.includes('cast-crayon')) return '(max-width: 900px) 38vw, 250px';
  if (source.includes('cast-dinner')) return '(max-width: 900px) calc(100vw - 40px), 390px';
  if (source.includes('cast-vintage')) return '(max-width: 900px) calc(100vw - 40px), 600px';
  if (before.slice(-220).includes('story-feature-image')) return '(max-width: 600px) 100px, 200px';
  if (value(tag, 'class')?.includes('logo')) return '240px';
  return '(max-width: 600px) calc(100vw - 40px), (max-width: 900px) 50vw, 700px';
}

export function optimizePage(html) {
  html = html.replace(/<img\b[^>]*>/g, (tag, offset) => {
    const source = value(tag, 'src');
    const item = source && media.images[keyFor(source)];
    if (!item) return tag;
    const variants = item.variants;
    const fallback = variants.find(variant => variant.width >= 640) || variants.at(-1);
    tag = set(tag, 'src', pathFor(source, fallback.src));
    tag = set(tag, 'srcset', variants.map(variant => `${pathFor(source, variant.src)} ${variant.width}w`).join(', '));
    tag = set(tag, 'sizes', imageSizes(source, tag, html.slice(0, offset)));
    tag = set(tag, 'data-media-source', keyFor(source));
    if (!value(tag, 'width')) tag = set(tag, 'width', item.width);
    if (!value(tag, 'height')) tag = set(tag, 'height', item.height);
    if (!value(tag, 'decoding')) tag = set(tag, 'decoding', 'async');
    if (value(tag, 'class')?.includes('mockup-monster')) {
      tag = set(tag, 'loading', 'lazy');
      tag = set(tag, 'fetchpriority', 'low');
    }
    return tag;
  });

  let heroPoster;
  html = html.replace(/<video\b[^>]*>[\s\S]*?<\/video>/g, video => {
    const open = video.match(/^<video\b[^>]*>/)[0];
    const hero = value(open, 'id') === 'video-hero';
    const poster = value(open, 'poster');
    const image = poster && media.images[keyFor(poster)];
    if (image) {
      // A small, immediately available first frame. Other posters load only as
      // their sections approach the viewport, including with reduced motion.
      const variant = image.variants.find(item => item.width >= 640) || image.variants.at(-1);
      const optimized = pathFor(poster, variant.src);
      let updated = set(open, hero ? 'poster' : 'data-poster', optimized);
      updated = set(updated, 'data-poster-source', keyFor(poster));
      if (!hero) updated = updated.replace(/\sposter="[^"]*"/, '');
      else heroPoster = optimized;
      video = video.replace(open, updated);
    }
    return video.replace(/<source\b[^>]*>/g, source => {
      const original = value(source, 'data-src') || value(source, 'src');
      const item = original && media.videos[keyFor(original)];
      if (!item) return source; // Press footage and downloadable originals stay intact.
      return `<source data-src="${pathFor(original, item.mobile.src)}" media="(max-width: 900px)" type="video/mp4" data-media-source="${keyFor(original)}"><source data-src="${pathFor(original, item.desktop.src)}" type="video/mp4">`;
    });
  });
  if (heroPoster) html = html.replace('</head>', `<link rel="preload" as="image" href="${heroPoster}" fetchpriority="high"></head>`);
  return html;
}
