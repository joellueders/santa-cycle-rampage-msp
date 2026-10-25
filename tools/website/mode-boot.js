(() => {
  const root = document.documentElement;
  const params = new URLSearchParams(location.search);
  const requested = params.get('mode');
  let remembered = 'default';
  try { remembered = localStorage.getItem('santa-claude-test-mode') || 'default'; } catch {}
  const directRebel = new URL(location.href).pathname.endsWith('/rebel.html');
  const mode = ['default', 'rebel'].includes(requested) ? requested : root.dataset.defaultFirst ? 'default' : directRebel || remembered === 'rebel' ? 'rebel' : 'default';
  root.dataset.siteMode = mode;
  root.dataset.pageMode = mode;
  if (['default', 'rebel'].includes(requested) || directRebel) {
    try { localStorage.setItem('santa-claude-test-mode', mode); } catch {}
  }
})();
