(() => {
  const root = document.documentElement;
  const film = document.querySelector('.hero-film');
  const hero = document.querySelector('.hero-layout');
  const destination = document.querySelector('[data-monster-media]');
  const regularSlot = document.querySelector('[data-default-hero-slot]');
  const date = document.querySelector('.date-card');
  if (!film || !hero || !destination || !date) return;

  const placeFilm = () => {
    const slot = root.dataset.siteMode === 'rebel' ? destination : regularSlot || hero;
    const before = slot === hero ? date : null;
    if (film.parentNode === slot) return;
    // Keep the existing video, controller, currentTime and manual pause state.
    if (slot.moveBefore) slot.moveBefore(film, before);
    else slot.insertBefore(film, before);
  };
  placeFilm();
  const placementObserver = new window.MutationObserver(placeFilm);
  placementObserver.observe(root, { attributes: true, attributeFilter: ['data-site-mode'] });
  import('./monster-takeover.mjs?v=1.7.3').then(({ mountTakeover }) => mountTakeover({
    root, media: destination, video: film.querySelector('video'),
    image: destination.querySelector('.mockup-monster')
  }));
  window.addEventListener('pagehide', event => {
    placementObserver.disconnect();
    if (event.persisted) window.addEventListener('pageshow', () => {
      placementObserver.observe(root, { attributes: true, attributeFilter: ['data-site-mode'] });
      placeFilm();
    }, { once: true });
  });

  // The shared mode controller preserves its anchor before our additional media
  // move. Preserve that same reading position after both layouts have settled.
  document.querySelector('.mode-toggle')?.addEventListener('click', () => {
    const oldY = window.scrollY;
    const headerBottom = document.querySelector('.site-header').getBoundingClientRect().bottom;
    const visible = element => {
      const box = element.getBoundingClientRect();
      return element.getClientRects().length && box.top >= headerBottom && box.top < window.innerHeight - 44;
    };
    const visibleQuestion = [...document.querySelectorAll('#faq summary')].find(visible);
    const fragment = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
    const fragmentVisible = fragment && fragment.getClientRects().length && fragment.getBoundingClientRect().bottom > headerBottom && fragment.getBoundingClientRect().top < window.innerHeight;
    const anchor = visibleQuestion || (fragmentVisible ? fragment : null) || [...document.querySelectorAll('main h2,main h3')].find(visible) || [...document.querySelectorAll('.hero,.content-section')]
      .filter(element => element.getClientRects().length && element.getBoundingClientRect().top <= Math.min(260, window.innerHeight / 3)).at(-1);
    const top = anchor?.getBoundingClientRect().top;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (oldY < 8) window.scrollTo({ top: 0, behavior: 'instant' });
      else if (anchor?.getClientRects().length) window.scrollBy({ top: anchor.getBoundingClientRect().top - top, behavior: 'instant' });
    }));
  }, { capture: true });
})();
