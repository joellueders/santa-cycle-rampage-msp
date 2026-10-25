(() => {
  const root = document.documentElement;
  const phoneLayout = matchMedia('(max-width: 900px)');
  const heroLayout = document.querySelector('.hero-layout');
  const heading = document.querySelector('.hero-heading');
  const response = document.querySelector('.hero-response');
  const tagline = document.querySelector('.hero-tagline');
  const participationSteps = document.querySelector('[data-step-rows]');
  const breweryFilm = document.querySelector('.brewery-film');
  const moveShared = (node, slot) => {
    if (!node || !slot || node.parentNode === slot) return;
    // State-preserving moves keep an already loaded video alive where supported.
    if (slot.moveBefore) slot.moveBefore(node, null);
    else slot.append(node);
  };
  const updateLayout = () => {
    const rebel = root.dataset.siteMode === 'rebel';
    const slotMode = rebel ? 'rebel' : 'default';
    moveShared(participationSteps, document.querySelector(`[data-steps-slot="${slotMode}"]`));
    moveShared(breweryFilm, document.querySelector(`[data-brewery-slot="${slotMode}"]`));
    if (heroLayout && heading) {
      if (phoneLayout.matches && rebel) {
        if (response.parentNode !== heroLayout) tagline.after(response);
      } else {
        if (response.parentNode !== heading) heading.append(response);
      }
    }
  };
  phoneLayout.addEventListener?.('change', updateLayout);
  const modeButton = document.querySelector('.mode-toggle');
  const applyMode = (mode, { save = false, updateUrl = false, preservePosition = false } = {}) => {
    mode = root.dataset.themeFixed || mode;
    const oldY = scrollY;
    const anchor = [...document.querySelectorAll('.hero,.content-section,.story-hero,.article-copy')].filter(element => element.getClientRects().length && element.getBoundingClientRect().top <= Math.min(260, window.innerHeight / 3)).at(-1);
    const oldTop = anchor?.getBoundingClientRect().top;
    root.dataset.siteMode = mode;
    root.dataset.pageMode = mode;
    const rebel = mode === 'rebel';
    if (modeButton) {
      modeButton.hidden = false;
      modeButton.setAttribute('aria-pressed', String(rebel));
      modeButton.innerHTML = '<span class="mode-switch" aria-hidden="true"></span><span class="test-mode-label"><span class="mode-long">Rebel Mode:</span><span class="mode-short">Rebel:</span> ' + (rebel ? 'ON' : 'OFF') + '</span>';
      modeButton.removeAttribute('aria-label');
    }
    document.querySelector('meta[name="theme-color"]').content = rebel ? '#161412' : '#f1eddf';
    if (!root.dataset.themeFixed) document.querySelectorAll('a[data-mode-link]').forEach(link => {
      const url = new URL(link.getAttribute('href'), location.href);
      url.searchParams.set('mode', mode);
      link.href = url.href;
    });
    updateLayout();
    if (save) { try { localStorage.setItem('santa-claude-test-mode', mode); } catch {} }
    if (updateUrl) { const url = new URL(location.href); url.searchParams.set('mode', mode); history.replaceState(history.state, '', url.href); }
    if (preservePosition) requestAnimationFrame(() => {
      const delta = anchor ? anchor.getBoundingClientRect().top - oldTop : 0;
      window.scrollTo({ top: oldY < 8 ? 0 : Math.max(0, scrollY + delta), behavior: 'instant' });
    });
  };
  applyMode(root.dataset.siteMode || 'default');
  if (modeButton) {
    modeButton.addEventListener('click', () => applyMode(root.dataset.siteMode === 'rebel' ? 'default' : 'rebel', { save: true, updateUrl: true, preservePosition: true }));
  }

  const menu = document.querySelector('.menu');
  const nav = document.querySelector('#mobile-nav');
  if (menu && nav) {
    const close = () => { nav.hidden = true; menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Open menu'); };
    menu.addEventListener('click', () => { const open = nav.hidden; nav.hidden = !open; menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', close));
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && !nav.hidden) { close(); menu.focus(); } });
    document.addEventListener('click', event => { if (!event.target.closest('header')) close(); });
  }

  document.querySelectorAll('[data-copy-target]').forEach(button => button.addEventListener('click', async () => {
    const target = document.getElementById(button.dataset.copyTarget);
    const feedback = button.parentElement.querySelector('.copy-feedback');
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(target.textContent);
      else {
        const range = document.createRange();
        range.selectNodeContents(target);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        if (!document.execCommand('copy')) throw new Error('Copy unavailable');
        selection.removeAllRanges();
      }
      feedback.textContent = 'Description copied.';
    } catch { feedback.textContent = 'Copy unavailable. Select and copy the description above.'; }
  }));

  const hero = document.querySelector('.hero,[data-sticky-trigger]');
  const sticky = document.querySelector('#sticky-rsvp');
  if (hero && sticky && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { sticky.hidden = entry.isIntersecting || entry.boundingClientRect.bottom > 0; }, { threshold: 0 }).observe(hero);
  }

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const states = [];
  const limited = () => motion.matches || !!connection?.saveData;
  const sync = state => {
    const playing = !state.video.paused && !state.video.ended;
    state.button.innerHTML = '<svg class="video-control-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="' + (playing ? 'M6 4h4v16H6zM14 4h4v16h-4z' : 'm8 4 12 8-12 8Z') + '"/></svg>';
    state.button.setAttribute('aria-label', (playing ? 'Pause: ' : 'Play: ') + state.label);
    state.shell.dataset.playing = String(playing);
  };
  const load = state => {
    if (state.loaded) return;
    const source = state.video.querySelector('source');
    if (source?.dataset.src) { source.src = source.dataset.src; delete source.dataset.src; }
    state.video.load();
    state.loaded = true;
  };
  const update = state => {
    if (state.visible && !document.hidden && !state.pausedByUser && (!limited() || state.startedByUser)) {
      load(state);
      state.video.play().catch(() => sync(state));
    } else state.video.pause();
  };
  document.querySelectorAll('video[data-ambient]').forEach((video, index) => {
    // Keep media completely unloaded for reduced motion or Data Saver.
    video.removeAttribute('autoplay');
    video.preload = 'none';
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.controls = false;
    video.tabIndex = -1;
    const source = video.querySelector('source');
    if (source?.hasAttribute('src')) { source.dataset.src = source.getAttribute('src'); source.removeAttribute('src'); }
    video.id ||= 'ride-video-' + index;
    const shell = document.createElement('div');
    shell.className = 'video-shell';
    video.parentNode.insertBefore(shell, video);
    shell.append(video);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'video-toggle icon-video-toggle';
    button.setAttribute('aria-controls', video.id);
    shell.append(button);
    const state = { video, shell, button, label: video.getAttribute('aria-label') || 'Ride video', visible: false, loaded: false, pausedByUser: false, startedByUser: false };
    button.addEventListener('click', () => {
      if (video.paused) { state.pausedByUser = false; state.startedByUser = true; load(state); video.play().catch(() => sync(state)); }
      else { state.pausedByUser = true; video.pause(); }
    });
    ['play', 'pause', 'ended', 'error'].forEach(event => video.addEventListener(event, () => sync(state)));
    states.push(state);
    sync(state);
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) { const state = states.find(item => item.video === entry.target); state.visible = entry.isIntersecting; update(state); }
    }, { threshold: 0.15 });
    states.forEach(state => observer.observe(state.video));
  }
  const preferencesChanged = () => states.forEach(state => {
    if (limited()) {
      state.startedByUser = false;
      state.video.pause();
      const source = state.video.querySelector('source');
      if (source?.hasAttribute('src')) { source.dataset.src = source.getAttribute('src'); source.removeAttribute('src'); }
      state.loaded = false;
      state.video.load();
    }
    update(state);
  });
  motion.addEventListener?.('change', preferencesChanged);
  connection?.addEventListener?.('change', preferencesChanged);
  document.addEventListener('visibilitychange', () => states.forEach(update));
})();
