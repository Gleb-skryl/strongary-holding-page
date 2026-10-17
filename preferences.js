// Apply the saved site appearance before the first paint. Storage may be disabled.
(() => {
  let theme = 'mixed';
  try {
    const saved = localStorage.getItem('strongary-theme');
    if (['mixed', 'light', 'dark'].includes(saved)) theme = saved;
  } catch { /* The default remains usable in private or restricted browsers. */ }
  document.documentElement.dataset.theme = theme;
})();
