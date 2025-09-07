// reveal.js — IntersectionObserver-powered scroll animations
(function(){
  if (!('IntersectionObserver' in window)) {
    // Fallback: show all
    document.querySelectorAll('.reveal').forEach(el => {
      el.classList.add('is-visible');
    });
    return;
  }

  const preferReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '0px 0px -10% 0px',
    threshold: preferReducedMotion ? 0 : 0.12
  });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
})();