/* ============================================================
   THE OBJECT — интерактив и анимации
   ============================================================ */
(function () {
  'use strict';

  const $  = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Прелоадер ---------- */
  window.addEventListener('load', () => {
    const pre = $('#preloader');
    if (!pre) return;
    setTimeout(() => pre.classList.add('is-done'), reduceMotion ? 0 : 1900);
  });

  /* ---------- Шапка: фон при скролле + прогресс ---------- */
  const header = $('#header');
  const progress = $('#scrollProgress');
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 40);
    const h = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Мобильное меню ---------- */
  const burger = $('#burger');
  const nav = $('#nav');
  const toggleNav = (open) => {
    const isOpen = open ?? !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', isOpen);
    burger.classList.toggle('is-open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };
  burger.addEventListener('click', () => toggleNav());
  $$('.nav__link').forEach(l => l.addEventListener('click', () => toggleNav(false)));

  /* ---------- Reveal при скролле ---------- */
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          // лёгкая каскадная задержка для соседних элементов
          const delay = Math.min(i * 80, 240);
          setTimeout(() => e.target.classList.add('is-visible'), delay);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- Счётчики в блоке "Атмосфера" ---------- */
  const counters = $$('.stat__num[data-count]');
  if ('IntersectionObserver' in window && counters.length) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = parseInt(el.dataset.count, 10);
        if (reduceMotion) { el.textContent = target; cio.unobserve(el); return; }
        const dur = 1400; const start = performance.now();
        const tick = (now) => {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        cio.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(c => cio.observe(c));
  }

  /* ---------- Параллакс-наклон логотипа Hero (десктоп) ---------- */
  const tiltEl = $('[data-tilt]');
  if (tiltEl && !reduceMotion && window.matchMedia('(pointer:fine)').matches) {
    const hero = $('#hero');
    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      const cx = (e.clientX - r.left) / r.width - 0.5;
      const cy = (e.clientY - r.top) / r.height - 0.5;
      tiltEl.style.transform =
        `perspective(900px) rotateY(${cx * 8}deg) rotateX(${-cy * 8}deg)`;
    });
    hero.addEventListener('mouseleave', () => { tiltEl.style.transform = ''; });
  }

  /* ---------- Форма брони ---------- */
  const form = $('#booking');
  if (form) {
    // минимальная дата — сегодня
    const dateInput = form.querySelector('input[name="date"]');
    if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const status = $('#bookingStatus');
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const data = Object.fromEntries(new FormData(form).entries());
      // TODO: подключить отправку на сервер / Telegram-бот / почту заведения.
      // Сейчас — демонстрационное подтверждение.
      status.textContent = `Спасибо, ${data.name || 'гость'}! Заявка принята — мы перезвоним для подтверждения.`;
      form.reset();
      if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];
    });
  }

  /* ---------- Год в футере ---------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();
