// Milliseconds. One pending timeout, never an interval or a media reload.
const BURST_MS = 900;
const FREQUENCY_MULTIPLIER = 2.25;
export const TAKEOVER_TIMING = Object.freeze({
  initialMin: 650, initialMax: 1000,
  // Include the burst: 1.5 times the previous rate, 2.25 times the original.
  repeatMin: (5000 + BURST_MS) / FREQUENCY_MULTIPLIER - BURST_MS,
  repeatMax: (9000 + BURST_MS) / FREQUENCY_MULTIPLIER - BURST_MS,
  burst: BURST_MS
});

export function mountTakeover({
  root, media, video, image,
  doc = document, win = window,
  motion = win.matchMedia('(prefers-reduced-motion: reduce)'),
  Intersection = win.IntersectionObserver, Mutation = win.MutationObserver,
  setTimer = win.setTimeout.bind(win), clearTimer = win.clearTimeout.bind(win),
  random = Math.random, timing = TAKEOVER_TIMING
}) {
  let timer = null;
  let visible = false;
  let first = true;
  let suspended = false;
  let destroyed = false;
  const listeners = [];
  media.style.setProperty('--takeover-burst', timing.burst + 'ms');
  const paint = state => {
    media.dataset.takeover = state;
    // Fleeting interference is decorative, not a live screen-reader update.
    image.setAttribute('aria-hidden', 'true');
  };
  const clear = () => {
    if (timer !== null) clearTimer(timer);
    timer = null;
  };
  const reset = () => { clear(); paint('video'); };
  const eligible = () => !destroyed && !suspended && visible && !doc.hidden &&
    !motion.matches && root.dataset.siteMode === 'rebel' &&
    !video.paused && !video.ended && !video.error && video.readyState >= 2 &&
    image.complete && image.naturalWidth > 0;
  const later = (delay, run) => {
    clear();
    timer = setTimer(() => {
      timer = null;
      if (!eligible()) { reset(); return; }
      run();
    }, delay);
  };
  const schedule = () => {
    if (!eligible()) { reset(); return; }
    if (timer !== null) return;
    const min = first ? timing.initialMin : timing.repeatMin;
    const max = first ? timing.initialMax : timing.repeatMax;
    later(min + random() * (max - min), () => {
      first = false;
      paint('burst');
      later(timing.burst, () => { paint('video'); schedule(); });
    });
  };
  const on = (target, event, callback) => {
    target.addEventListener(event, callback);
    listeners.push(() => target.removeEventListener(event, callback));
  };
  const intersection = Intersection ? new Intersection(entries => {
    const entry = entries.find(item => item.target === media);
    if (!entry) return;
    visible = entry.isIntersecting && entry.intersectionRatio >= 0.15;
    schedule();
  }, { threshold: [0, 0.15] }) : null;
  const modeObserver = new Mutation(schedule);
  const observe = () => {
    intersection?.observe(media);
    modeObserver.observe(root, { attributes: true, attributeFilter: ['data-site-mode'] });
  };
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    reset();
    intersection?.disconnect();
    modeObserver.disconnect();
    listeners.splice(0).forEach(remove => remove());
  };
  on(doc, 'visibilitychange', schedule);
  on(motion, 'change', schedule);
  // A short looping MP4 can emit `waiting` at every wrap. Do not reset a
  // countdown for that transient seek; actual pause/error still cancels.
  for (const event of ['playing', 'pause', 'ended', 'loadeddata', 'error']) on(video, event, schedule);
  on(image, 'load', schedule);
  on(win, 'pagehide', event => {
    if (!event.persisted) { destroy(); return; }
    suspended = true;
    visible = false;
    reset();
    intersection?.disconnect();
    modeObserver.disconnect();
  });
  on(win, 'pageshow', event => {
    if (!event.persisted || destroyed) return;
    suspended = false;
    observe();
  });
  paint('video');
  observe();
  return { destroy };
}
