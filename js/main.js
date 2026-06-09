/* ============================================================
   THE OBJECT - интерактив (art-house noir)
   Соответствует методологии taste-skill: без скролл-слушателей,
   reduced-motion, без кастомного курсора.
   ============================================================ */
(function () {
  'use strict';
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine   = window.matchMedia('(pointer: fine)').matches;

  /* ---------- Прелоадер со счётчиком 00 → 100 ---------- */
  window.addEventListener('load', () => {
    const loader = $('#loader');
    const count  = $('#loaderCount');
    if (!loader) return;
    if (reduce) { loader.classList.add('done'); return; }
    let n = 0;
    const t = setInterval(() => {
      n += Math.floor(Math.random() * 8) + 3;
      if (n >= 100) { n = 100; clearInterval(t); }
      count.textContent = n >= 100 ? '100' : String(n).padStart(2, '0');
    }, 90);
    setTimeout(() => loader.classList.add('done'), 2000);
  });

  /* ---------- Шапка при скролле (IntersectionObserver, без scroll-слушателя) ---------- */
  const head = $('#head');
  if (head && 'IntersectionObserver' in window) {
    const sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:64px;pointer-events:none;';
    document.body.prepend(sentinel);
    new IntersectionObserver(
      ([e]) => head.classList.toggle('scrolled', !e.isIntersecting),
      { threshold: 0 }
    ).observe(sentinel);
  }

  /* ---------- Magnetic-кнопки (десктоп, transform вне React-цикла) ---------- */
  if (fine && !reduce) {
    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- Мобильное меню ---------- */
  const burger = $('#burger'), menu = $('#menu');
  const toggle = (open) => {
    const o = open ?? !menu.classList.contains('open');
    menu.classList.toggle('open', o);
    burger.classList.toggle('open', o);
    burger.setAttribute('aria-expanded', String(o));
    document.body.style.overflow = o ? 'hidden' : '';
  };
  burger.addEventListener('click', () => toggle());
  $$('.menu__link').forEach((l) => l.addEventListener('click', () => toggle(false)));

  /* ---------- Reveal со ступенчатой задержкой ---------- */
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (!e.isIntersecting) return;
        e.target.style.transitionDelay = Math.min(i * 70, 280) + 'ms';
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('in'));
  }

  /* ---------- Счётчики спецификаций ---------- */
  $$('[data-count]').forEach((el) => {
    const target = parseInt(el.dataset.count, 10);
    if ('IntersectionObserver' in window && !reduce) {
      const o = new IntersectionObserver((en) => {
        en.forEach((e) => {
          if (!e.isIntersecting) return;
          const dur = 1500, start = performance.now();
          const tick = (now) => {
            const p = Math.min((now - start) / dur, 1);
            el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          o.unobserve(el);
        });
      }, { threshold: 0.6 });
      o.observe(el);
    } else { el.textContent = target; }
  });

  /* ---------- Форма брони ----------
     Отправка в Telegram идёт через прокси (Cloudflare Worker), чтобы токен
     бота не попадал в публичный код. Вставьте URL вашего worker ниже.
     Пока поле пустое — форма показывает подтверждение без отправки.        */
  const BOOKING_ENDPOINT = ''; // напр. 'https://the-object-booking.ВАШ-ЛОГИН.workers.dev'
  const form = $('#booking');
  if (form) {
    const di = form.querySelector('input[name="date"]');
    if (di) di.min = new Date().toISOString().split('T')[0];
    const resetMin = () => { if (di) di.min = new Date().toISOString().split('T')[0]; };
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const s = $('#bookingStatus');
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const d = Object.fromEntries(new FormData(form).entries());
      if (d.company) return; // honeypot: бот заполнил скрытое поле

      if (!BOOKING_ENDPOINT) {
        s.textContent = `Принято, ${d.name || 'гость'}. Мы перезвоним для подтверждения.`;
        form.reset(); resetMin(); return;
      }

      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true; s.textContent = 'Отправляем заявку…';
      try {
        const res = await fetch(BOOKING_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(d),
        });
        if (!res.ok) throw new Error(String(res.status));
        s.textContent = `Принято, ${d.name || 'гость'}. Мы перезвоним для подтверждения.`;
        form.reset(); resetMin();
      } catch (err) {
        s.textContent = 'Не удалось отправить. Позвоните нам: +7 (900) 333-30-26';
      } finally {
        btn.disabled = false;
      }
    });
  }

  /* ---------- Год ---------- */
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();
})();
