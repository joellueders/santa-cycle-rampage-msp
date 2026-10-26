import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import vm from 'node:vm';
import { content, renderDefault } from './build.mjs';
import { renderPress } from './pages.mjs';
import { renderStory } from './stories.mjs';
import { optimizePage } from './media-performance.mjs';

const root = new URL('../../', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('./media-performance.json', import.meta.url)));

test('every derivative exists, is smaller than its original, and retains image dimensions', () => {
  const tracked = new Set(execFileSync('git', ['ls-tree', '-r', '--name-only', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim().split('\n'));
  for (const image of Object.values(manifest.images)) {
    assert.ok(image.width > 0 && image.height > 0);
    for (const variant of image.variants) {
      assert.ok(variant.bytes < image.originalBytes, variant.src);
      assert.ok(variant.width <= image.width, variant.src);
      assert.ok(tracked.has(variant.src) || existsSync(new URL(variant.src, root)) || existsSync(new URL(variant.src, import.meta.url)), variant.src);
    }
  }
  assert.equal(Object.keys(manifest.videos).length, 5);
  for (const video of Object.values(manifest.videos)) for (const size of ['mobile', 'desktop']) {
    assert.ok(video[size].bytes < video.originalBytes);
    assert.ok(existsSync(new URL(video[size].src, import.meta.url)));
  }
});

test('all three page types use responsive images and defer only nonhero posters', () => {
  const home = renderDefault(content);
  for (const html of [home, renderPress(content), renderStory(content)]) {
    for (const [image] of html.matchAll(/<img\b[^>]*data-media-source[^>]*>/g)) {
      assert.match(image, /srcset="[^"]+ \d+w/);
      assert.match(image, /sizes="[^"]+"/);
      assert.match(image, /width="\d+"/);
      assert.match(image, /height="\d+"/);
    }
    for (const [video] of html.matchAll(/<video\b[^>]*>/g)) {
      if (video.includes('id="video-hero"')) assert.match(video, /\sposter="/);
      else {
        assert.match(video, /\sdata-poster="/);
        assert.doesNotMatch(video, /\sposter="/);
      }
    }
  }
  assert.match(home, /rel="preload" as="image"[^>]+fetchpriority="high"/);
  assert.equal((home.match(/data-default-hero-slot/g) || []).length, 1);
  assert.match(readFileSync(new URL('./monster-vhs.css', import.meta.url), 'utf8'), /\.default-hero-slot::before[^}]+aspect-ratio: 1\.72/);
  const monster = home.match(/<img class="mockup-monster"[^>]*>/)[0];
  assert.match(monster, /fetchpriority="low"/);
  assert.match(monster, /loading="lazy"/);
  assert.equal((home.match(/id="video-hero"/g) || []).length, 1);
  const hero = home.match(/<video\b[^>]*id="video-hero"[\s\S]*?<\/video>/)[0];
  assert.match(hero, /media="\(max-width: 900px\)"/);
  assert.equal((hero.match(/<source /g) || []).length, 2);
});

test('optimization leaves copy, captions, links, schema and downloadable originals unchanged', () => {
  const original = '<head></head><p>Approved copy.</p><figure><img src="../../assets/group.jpg" alt="Original alt" loading="lazy"><figcaption>Original credit.</figcaption></figure><a href="../../assets/group.jpg" download>Download original</a><script type="application/ld+json">{"unchanged":true}</script>';
  const optimized = optimizePage(original);
  const text = html => html.replace(/<[^>]*>/g, '');
  assert.equal(text(optimized), text(original));
  assert.match(optimized, /href="\.\.\/\.\.\/assets\/group.jpg" download/);
  assert.match(optimized, /alt="Original alt"/);
  assert.match(optimized, /<script type="application\/ld\+json">\{"unchanged":true\}<\/script>/);
  assert.doesNotMatch(renderDefault(content), /--cast-art/);
});

function runtime({ reduced = false, saveData = false, posterGate = false } = {}) {
  const events = () => ({ handlers: {}, addEventListener(name, handler) { this.handlers[name] = handler; } });
  const source = path => ({ dataset: { src: path }, hasAttribute(name) { return name === 'src' && !!this.src; }, getAttribute(name) { return this[name]; }, removeAttribute(name) { delete this[name]; } });
  const sources = [source('phone.mp4'), source('desktop.mp4')];
  const video = { ...events(), dataset: { poster: 'poster.webp' }, paused: true, ended: false, id: 'video-hero', loadCount: 0, playCount: 0,
    querySelectorAll: () => sources, getAttribute: () => 'Ride video', removeAttribute() {},
    load() { this.loadCount++; }, play() { this.playCount++; this.paused = false; return Promise.resolve(); }, pause() { this.paused = true; },
    parentNode: { insertBefore() {} } };
  const observers = [];
  const posterImages = [];
  const frames = [];
  class PosterImage {
    constructor() { Object.assign(this, events()); posterImages.push(this); }
  }
  if (posterGate) video.poster = 'first-frame.webp';
  class Observer {
    constructor(callback, options) { this.callback = callback; this.options = options; observers.push(this); }
    observe() {} unobserve() {}
  }
  const motion = { ...events(), matches: reduced };
  const connection = { ...events(), saveData };
  const document = { ...events(), hidden: false, documentElement: { dataset: {} },
    querySelector: selector => selector === 'meta[name="theme-color"]' ? {} : null,
    querySelectorAll: selector => selector === 'video[data-ambient]' || selector === 'video[data-poster]' ? [video] : [],
    createElement: () => ({ ...events(), dataset: {}, append() {}, setAttribute() {} }) };
  vm.runInNewContext(readFileSync(new URL('./site.js', import.meta.url), 'utf8'), {
    document, window: { IntersectionObserver: Observer, Image: posterGate ? PosterImage : undefined }, navigator: { connection }, scrollY: 0,
    requestAnimationFrame: callback => frames.push(callback),
    matchMedia: query => query.includes('reduced-motion') ? motion : { matches: true, addEventListener() {} },
    IntersectionObserver: Observer
  });
  const near = () => observers.find(observer => observer.options.rootMargin)?.callback([{ target: video, isIntersecting: true }]);
  const visible = on => observers.find(observer => observer.options.threshold === .15).callback([{ target: video, isIntersecting: on }]);
  return { sources, video, motion, connection, near, visible, posterImages, frames };
}

test('posters hydrate near the viewport and both responsive sources load once', () => {
  const r = runtime();
  assert.equal(r.video.poster, undefined);
  assert.equal(r.video.loadCount, 0);
  r.near();
  assert.equal(r.video.poster, 'poster.webp');
  r.visible(true);
  assert.deepEqual(r.sources.map(source => source.src), ['phone.mp4', 'desktop.mp4']);
  assert.equal(r.video.loadCount, 1);
  r.visible(false);
  assert.equal(r.video.paused, true);
  r.visible(true);
  assert.equal(r.video.loadCount, 1);
});

test('reduced motion and Data Saver load a poster but no automatic video bytes', () => {
  for (const settings of [{ reduced: true }, { saveData: true }]) {
    const r = runtime(settings);
    r.near();
    r.visible(true);
    assert.equal(r.video.poster, 'poster.webp');
    assert.equal(r.video.loadCount, 0);
    assert.equal(r.video.playCount, 0);
    assert.ok(r.sources.every(source => !source.src));
  }
});

test('the initial hero poster paints before playback; changing preferences unloads both sources', () => {
  const r = runtime({ posterGate: true });
  r.visible(true);
  assert.equal(r.video.loadCount, 0);
  assert.equal(r.posterImages.length, 1);
  r.posterImages[0].handlers.load();
  assert.equal(r.video.loadCount, 0);
  while (r.frames.length) r.frames.shift()();
  assert.equal(r.video.loadCount, 1);
  r.motion.matches = true;
  r.motion.handlers.change();
  assert.ok(r.sources.every(source => !source.src && source.dataset.src));
  assert.equal(r.video.paused, true);
  const afterUnload = r.video.loadCount;
  r.motion.matches = false;
  r.motion.handlers.change();
  assert.equal(r.video.loadCount, afterUnload + 1);
  assert.deepEqual(r.sources.map(source => source.src), ['phone.mp4', 'desktop.mp4']);
});
