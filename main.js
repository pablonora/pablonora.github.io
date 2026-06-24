/* =========================================================
   UI interactions — scroll reveals, nav state, count-up,
   mobile menu. Vanilla, no dependencies.
   ========================================================= */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- current year in footer ---- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---- nav background on scroll ---- */
  var nav = document.getElementById('nav');
  var onScroll = function () {
    if (window.scrollY > 24) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- mobile menu ---- */
  var toggle = document.querySelector('.nav__toggle');
  var links = document.querySelector('.nav__links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---- scroll reveals + timeline activation ---- */
  var reveals = document.querySelectorAll('.reveal');
  var timelineItems = document.querySelectorAll('.timeline__item');

  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('in'); });
    timelineItems.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          if (entry.target.classList.contains('stat')) animateCount(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });

    var tlio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) entry.target.classList.add('in');
      });
    }, { threshold: 0.5 });
    timelineItems.forEach(function (el) { tlio.observe(el); });
  }

  /* ---- count-up for stats ---- */
  function animateCount(stat) {
    var numEl = stat.querySelector('.stat__num');
    if (!numEl || reduce) return;
    var target = parseFloat(numEl.getAttribute('data-count'));
    var suffix = numEl.getAttribute('data-suffix') || '';
    if (isNaN(target)) return;
    var dur = 1300;
    var start = performance.now();
    var fmt = function (n) {
      return n >= 1000 ? Math.round(n).toLocaleString('en-US') : Math.round(n).toString();
    };
    function tick(now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      numEl.textContent = fmt(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else numEl.textContent = fmt(target) + suffix;
    }
    requestAnimationFrame(tick);
  }

  /* ---- active section highlight in nav ---- */
  var sections = ['work', 'experience', 'skills', 'recommendations', 'about', 'contact']
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);
  var navAnchors = {};
  document.querySelectorAll('.nav__links a[href^="#"]').forEach(function (a) {
    navAnchors[a.getAttribute('href').slice(1)] = a;
  });
  if ('IntersectionObserver' in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var a = navAnchors[entry.target.id];
        if (a && entry.isIntersecting) {
          Object.keys(navAnchors).forEach(function (k) {
            navAnchors[k].style.color = '';
          });
          a.style.color = 'var(--ink)';
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }
})();
