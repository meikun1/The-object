/* ============================================================
   THE OBJECT — интерактив (art-house noir)
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

  /* ---------- Кастомный курсор + ring (lerp) ---------- */
  if (fine && !reduce) {
    const dot  = $('#cursorDot');
    const ring = $('#cursorRing');
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    });
    const loop = () => {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    };
    loop();
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest('[data-cursor="hover"]')) ring.classList.add('is-hover');
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest('[data-cursor="hover"]')) ring.classList.remove('is-hover');
    });
  }

  /* ---------- Magnetic-кнопки ---------- */
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

  /* ---------- Шапка при скролле ---------- */
  const head = $('#head');
  addEventListener('scroll', () => head.classList.toggle('scrolled', scrollY > 40), { passive: true });

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

  /* ---------- Форма брони ---------- */
  const form = $('#booking');
  if (form) {
    const di = form.querySelector('input[name="date"]');
    if (di) di.min = new Date().toISOString().split('T')[0];
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const s = $('#bookingStatus');
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const d = Object.fromEntries(new FormData(form).entries());
      // TODO: подключить отправку (почта / Telegram-бот / CRM).
      s.textContent = `Принято, ${d.name || 'гость'}. Мы перезвоним для подтверждения.`;
      form.reset();
      if (di) di.min = new Date().toISOString().split('T')[0];
    });
  }

  /* ---------- Год ---------- */
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();
})();
