(() => {
  'use strict';
  const cards = [...document.querySelectorAll('.work-card')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches;
  let pending = false;
  function render() {
    pending = false;
    if (document.hidden) return;
    for (const card of cards) {
      const rect = card.querySelector('.work-art').getBoundingClientRect();
      const visible = rect.bottom > 0 && rect.top < innerHeight;
      card.classList.toggle('work-visible', visible && !paused);
      if (visible) {
        const progress = Math.max(-1, Math.min(1, (innerHeight / 2 - rect.top - rect.height / 2) / innerHeight));
        card.style.setProperty('--work-scroll', paused ? '0' : progress.toFixed(3));
      }
    }
  }
  function request() {
    if (!pending && !document.hidden) { pending = true; requestAnimationFrame(render); }
  }
  document.addEventListener('oceanframe', event => {
    if (paused === event.detail.paused) return;
    paused = event.detail.paused;
    document.documentElement.dataset.worksMotion = paused ? 'paused' : 'running';
    request();
  });
  reduced.addEventListener('change', () => {
    paused = reduced.matches;
    document.documentElement.dataset.worksMotion = paused ? 'paused' : 'running';
    request();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cards.forEach(card => card.classList.remove('work-visible'));
    else request();
  });
  addEventListener('scroll', request, {passive: true});
  addEventListener('resize', request);
  addEventListener('pageshow', request);
  request();
})();
