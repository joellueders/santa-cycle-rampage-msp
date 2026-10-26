import assert from 'node:assert/strict';
import test from 'node:test';
import { mountTakeover, TAKEOVER_TIMING as T } from './monster-takeover.mjs';

class Events {
  listeners = new Map();
  addEventListener(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(fn);
  }
  removeEventListener(type, fn) { this.listeners.get(type)?.delete(fn); }
  emit(type, details = {}) { for (const fn of [...(this.listeners.get(type) || [])]) fn(details); }
  count() { return [...this.listeners.values()].reduce((sum, set) => sum + set.size, 0); }
}

function setup({ reduced = false, ready = true, random = () => 0.5, timing = T } = {}) {
  let now = 0, id = 0, highWater = 0, intersection, mutation;
  const tasks = new Map();
  const root = { dataset: { siteMode: 'rebel' } };
  const media = { dataset: {}, style: { setProperty() {} } };
  const doc = Object.assign(new Events(), { hidden: false });
  const win = new Events();
  const motion = Object.assign(new Events(), { matches: reduced });
  const image = Object.assign(new Events(), { complete: ready, naturalWidth: ready ? 1122 : 0, setAttribute() {} });
  // No playback or source-writing API is provided: the controller must not need one.
  const video = Object.assign(new Events(), { paused: false, ended: false, readyState: 4, error: null });
  class Intersection {
    connected = false;
    constructor(fn) { this.fn = fn; intersection = this; }
    observe() { this.connected = true; }
    disconnect() { this.connected = false; }
  }
  class Mutation {
    connected = false;
    constructor(fn) { this.fn = fn; mutation = this; }
    observe() { this.connected = true; }
    disconnect() { this.connected = false; }
  }
  const controller = mountTakeover({ root, media, video, image, doc, win, motion, Intersection, Mutation, random, timing,
    setTimer(fn, ms) { tasks.set(++id, { at: now + ms, fn }); highWater = Math.max(highWater, tasks.size); return id; },
    clearTimer(key) { tasks.delete(key); }
  });
  const advance = ms => {
    const end = now + ms;
    for (;;) {
      const next = [...tasks.entries()].sort((a, b) => a[1].at - b[1].at)[0];
      if (!next || next[1].at > end) break;
      tasks.delete(next[0]); now = next[1].at; next[1].fn();
    }
    now = end;
  };
  const visible = (value = true) => intersection.fn([{ target: media, isIntersecting: value, intersectionRatio: value ? 1 : 0 }]);
  const mode = value => { root.dataset.siteMode = value; mutation.fn(); };
  const hidden = value => { doc.hidden = value; doc.emit('visibilitychange'); };
  const reduce = value => { motion.matches = value; motion.emit('change'); };
  return { controller, root, media, video, image, doc, win, motion, advance, visible, mode, hidden, reduce,
    tasks, intersection, mutation, highWater: () => highWater, now: () => now };
}

test('first VHS burst starts within one second and returns to video after 900ms', () => {
  const h = setup();
  assert.equal(h.media.dataset.takeover, 'video');
  assert.equal(h.tasks.size, 0);
  h.visible(); h.advance(824);
  assert.equal(h.media.dataset.takeover, 'video');
  h.advance(1); assert.equal(h.media.dataset.takeover, 'burst');
  h.advance(T.burst - 1); assert.equal(h.media.dataset.takeover, 'burst');
  h.advance(1); assert.equal(h.media.dataset.takeover, 'video');
  const rest = [...h.tasks.values()][0].at - h.now();
  assert.ok(Math.abs(((7000 + T.burst) / 1.5) / (rest + T.burst) - 1.5) < 1e-10);
  assert.ok(T.initialMax + T.burst * .45 < 2000, 'readable monster cut is within the first two seconds');
  h.controller.destroy();
});

test('random delay boundaries are modest and within the requested ranges', () => {
  for (const random of [() => 0, () => 1]) {
    const h = setup({ random }); h.visible();
    const first = [...h.tasks.values()][0].at;
    assert.ok(first >= 650 && first <= 1000);
    h.advance(first + T.burst);
    const next = [...h.tasks.values()][0].at - h.now();
    const previousRest = random() === 0 ? 5000 : 9000;
    assert.ok(Math.abs(((previousRest + T.burst) / 1.5) / (next + T.burst) - 1.5) < 1e-10);
    h.controller.destroy();
  }
});

test('many cycles and repeated playback/observer events never accumulate timers', () => {
  const h = setup(); h.visible();
  for (let i = 0; i < 80; i++) {
    h.visible(); h.video.emit('playing'); h.video.emit('loadeddata');
    h.advance(30000);
  }
  assert.equal(h.highWater(), 1);
  assert.equal(h.tasks.size, 1);
  h.controller.destroy(); assert.equal(h.tasks.size, 0);
});

test('offscreen or hidden documents cancel waiting and active transitions', () => {
  const h = setup(); h.visible(); h.advance(925);
  assert.equal(h.media.dataset.takeover, 'burst');
  h.visible(false); assert.equal(h.tasks.size, 0); assert.equal(h.media.dataset.takeover, 'video');
  h.advance(60000); assert.equal(h.tasks.size, 0);
  h.visible(); assert.equal(h.tasks.size, 1);
  h.hidden(true); assert.equal(h.tasks.size, 0);
  h.hidden(false); assert.equal(h.tasks.size, 1);
  h.controller.destroy();
});

test('reduced motion disables all automatic interruptions, including a mid-cycle preference change', () => {
  const h = setup({ reduced: true }); h.visible(); h.advance(60000);
  assert.equal(h.media.dataset.takeover, 'video'); assert.equal(h.tasks.size, 0);
  h.reduce(false); h.advance(825); assert.equal(h.media.dataset.takeover, 'burst');
  h.reduce(true); assert.equal(h.media.dataset.takeover, 'video'); assert.equal(h.tasks.size, 0);
  h.controller.destroy();
});

test('default theme and paused/error/not-ready media never hijack', () => {
  const h = setup(); h.visible(); h.mode('default'); assert.equal(h.tasks.size, 0);
  h.mode('rebel'); assert.equal(h.tasks.size, 1);
  h.video.paused = true; h.video.emit('pause'); assert.equal(h.tasks.size, 0);
  h.video.paused = false; h.video.emit('playing'); assert.equal(h.tasks.size, 1);
  h.video.error = {}; h.video.emit('error'); assert.equal(h.tasks.size, 0);
  h.video.error = null; h.video.readyState = 1; h.video.emit('playing'); assert.equal(h.tasks.size, 0);
  h.controller.destroy();
});

test('brief buffering at each 9.5s video loop does not postpone a longer takeover countdown', () => {
  const h = setup({ timing: { ...T, initialMin: 12000, initialMax: 18000 } }); h.visible();
  const deadline = [...h.tasks.values()][0].at;
  h.advance(9500); h.video.readyState = 1; h.video.emit('waiting');
  assert.equal([...h.tasks.values()][0].at, deadline);
  h.advance(50); h.video.readyState = 4; h.video.emit('playing');
  assert.equal([...h.tasks.values()][0].at, deadline);
  h.advance(5450); assert.equal(h.media.dataset.takeover, 'burst');
  h.controller.destroy();
});

test('does not begin until the exact monster image is ready', () => {
  const h = setup({ ready: false }); h.visible(); assert.equal(h.tasks.size, 0);
  h.image.complete = true; h.image.naturalWidth = 1122; h.image.emit('load');
  assert.equal(h.tasks.size, 1); h.controller.destroy();
});

test('page teardown removes timers, observers and every listener', () => {
  const h = setup(); h.visible(); h.win.emit('pagehide', { persisted: false });
  assert.equal(h.tasks.size, 0); assert.equal(h.intersection.connected, false); assert.equal(h.mutation.connected, false);
  for (const target of [h.doc, h.win, h.motion, h.video, h.image]) assert.equal(target.count(), 0);
  h.controller.destroy();
});

test('back-forward cache suspends and reconnects without duplicate observers or timers', () => {
  const h = setup(); h.visible();
  for (let i = 0; i < 3; i++) {
    h.win.emit('pagehide', { persisted: true }); assert.equal(h.tasks.size, 0); assert.equal(h.intersection.connected, false);
    h.win.emit('pageshow', { persisted: true }); assert.equal(h.tasks.size, 0); assert.equal(h.intersection.connected, true);
    h.visible(); assert.equal(h.tasks.size, 1);
  }
  assert.equal(h.highWater(), 1); h.controller.destroy();
});
