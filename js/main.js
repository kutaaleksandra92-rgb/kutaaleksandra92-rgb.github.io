// Menu mobilne – otwieranie / zamykanie
// 26.11: na Stronie Głównej menu mobilne na cały ekran (Figma 3445:8281) – własny przycisk zamknięcia [data-nav-close],
// blokada przewijania strony, Esc zamyka, fokus wraca na przycisk menu.
const toggle = document.querySelector('.nav__toggle');
const menu = document.getElementById('nav-menu');

if (toggle && menu) {
  const closeBtn = menu.querySelector('[data-nav-close]');
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Zamknij menu' : 'Otwórz menu');
    menu.classList.toggle('is-open', open);
    if (closeBtn) {
      document.documentElement.classList.toggle('has-nav-open', open);
      if (open) closeBtn.focus({ preventScroll: true });
    }
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  if (closeBtn) {
    closeBtn.addEventListener('click', () => { setOpen(false); toggle.focus({ preventScroll: true }); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) { setOpen(false); toggle.focus({ preventScroll: true }); }
    });
    // po powiększeniu okna do wersji web menu nie może zostać otwarte
    window.matchMedia('(min-width: 721px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
  }

  menu.querySelectorAll('a').forEach((link) =>
    link.addEventListener('click', () => setOpen(false))
  );
}

// Case study – slider „przed / po” (Decyzja II): strzałki przełączają zdjęcia i opis (w pętli)
document.querySelectorAll('[data-ba-slider]').forEach((slider) => {
  const slides = [...slider.querySelectorAll('[data-slide]')];
  let current = slides.findIndex((s) => !s.hidden);

  const show = (requested, focusSelector) => {
    // pętla: po ostatnim slajdzie wraca do pierwszego i odwrotnie
    const index = (requested + slides.length) % slides.length;
    slides[current].hidden = true;
    slides[index].hidden = false;
    current = index;
    // na mobile nowy slajd zaczyna się od zdjęcia „Przed”; fokus zostaje na tej samej strzałce
    const images = slides[index].querySelector('.ba__images');
    if (images) images.scrollLeft = 0;
    const target = slides[index].querySelector(focusSelector);
    if (target) target.focus({ preventScroll: true });
  };

  slider.addEventListener('click', (event) => {
    if (event.target.closest('[data-prev]')) show(current - 1, '[data-prev]');
    else if (event.target.closest('[data-next]')) show(current + 1, '[data-next]');
  });
});

// Case study – nawigacja sekcji (sticky)
// • po przyklejeniu: przewijanie w dół – pasek widoczny, w górę – zwinięty do linii z akcentem (.is-collapsed)
// • aktywny link = sekcja, w której jesteśmy („Decyzje” obejmuje Decyzje I–III – atrybut data-sections)
// • mobile: pasek przesuwa się w bok, żeby aktywny link był widoczny
const caseNav = document.querySelector('.case-nav');
if (caseNav) {
  const bar = caseNav.querySelector('.case-nav__bar');
  const links = [...caseNav.querySelectorAll('.case-nav__link')];
  const targets = []; // [sekcja, link] w kolejności na stronie
  links.forEach((link) => {
    const ids = (link.dataset.sections || link.getAttribute('href').slice(1)).split(' ');
    ids.forEach((id) => {
      const section = document.getElementById(id);
      if (section) targets.push([section, link]);
    });
  });
  targets.sort((a, b) => (a[0].compareDocumentPosition(b[0]) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));

  let lastY = window.scrollY;
  let ticking = false;
  let clicked = null; // link kliknięty – ważny, dopóki użytkownik nie przewinie dalej (np. sekcja przy końcu strony)
  let clickY = null;
  let current = null;

  const setActive = (link) => {
    if (link === current) return;
    current = link;
    links.forEach((l) => {
      const on = l === link;
      l.classList.toggle('is-active', on);
      if (on) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current');
    });
    if (link && bar.scrollWidth > bar.clientWidth) {
      bar.scrollLeft = link.offsetLeft - parseFloat(getComputedStyle(bar).paddingLeft);
    }
  };

  const update = () => {
    ticking = false;
    const y = window.scrollY;
    const anchor = caseNav.previousElementSibling;
    const stuck = anchor ? anchor.getBoundingClientRect().bottom <= 0 : true;

    if (!stuck) caseNav.classList.remove('is-collapsed');
    else if (y < lastY - 4) caseNav.classList.add('is-collapsed');
    else if (y > lastY + 4) caseNav.classList.remove('is-collapsed');
    lastY = y;

    if (clicked) {
      if (clickY === null) clickY = y;                 // pozycja po skoku do sekcji
      else if (Math.abs(y - clickY) > 2) clicked = null; // użytkownik przewija dalej
    }
    if (clicked) { setActive(clicked); return; }
    // sekcja staje się aktywna, gdy jej górna krawędź dojdzie do dolnej krawędzi paska
    const line = caseNav.offsetHeight + 1;
    let active = null;
    targets.forEach(([section, link]) => {
      if (section.getBoundingClientRect().top <= line) active = link;
    });
    const atBottom = window.innerHeight + y >= document.documentElement.scrollHeight - 2;
    if (atBottom && targets.length) active = targets[targets.length - 1][1];
    setActive(active);
  };

  links.forEach((link) => link.addEventListener('click', () => { clicked = link; clickY = null; setActive(link); }));
  ['wheel', 'touchstart', 'keydown'].forEach((type) =>
    window.addEventListener(type, () => { clicked = null; }, { passive: true }));
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
}

// Przycisk „do góry” – płynny powrót na górę strony (ease-in-out, czas zależny od odległości)
document.querySelectorAll('[data-scroll-top]').forEach((btn) => {
  btn.addEventListener('click', (event) => {
    event.preventDefault();
    const startY = window.scrollY;
    if (startY <= 0) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.scrollTo(0, 0);
      return;
    }
    const duration = Math.min(1600, Math.max(600, startY / 6)); // ok. 1,6 s z dołu strony 4F
    const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    let start = null;
    let cancelled = false;
    const cancel = () => { cancelled = true; };
    ['wheel', 'touchstart', 'keydown'].forEach((type) => window.addEventListener(type, cancel, { once: true, passive: true }));
    const step = (now) => {
      if (cancelled) return;
      if (start === null) start = now;
      const t = Math.min(1, (now - start) / duration);
      window.scrollTo(0, Math.round(startY * (1 - easeInOut(t))));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
});

// Research (CTRL+) – kafle delikatnie podążają za kursorem z różną głębią (tylko web z myszą, wg nagrania Oli 01.11)
document.querySelectorAll('[data-parallax]').forEach((board) => {
  const web = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1201px)');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const items = [...board.querySelectorAll('[data-depth]')].map((el) => ({ el, depth: parseFloat(el.dataset.depth) || 0 }));
  const area = board.closest('section') || board;
  let tx = 0, ty = 0, x = 0, y = 0, raf = null;
  const render = () => {
    x += (tx - x) * 0.025; // 01.11: wolniej i delikatniej – kafle powoli „dopływają” za kursorem
    y += (ty - y) * 0.025;
    items.forEach(({ el, depth }) => { el.style.transform = `translate3d(${(x * depth).toFixed(2)}px, ${(y * depth).toFixed(2)}px, 0)`; });
    if (Math.abs(tx - x) > 0.001 || Math.abs(ty - y) > 0.001) raf = requestAnimationFrame(render);
    else raf = null;
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(render); };
  area.addEventListener('mousemove', (e) => {
    if (!web.matches || reduce.matches) return;
    const r = area.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width - 0.5) * 2;   // -1 … 1
    ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    kick();
  });
  area.addEventListener('mouseleave', () => { tx = 0; ty = 0; kick(); });
  web.addEventListener('change', () => { if (!web.matches) { tx = ty = x = y = 0; items.forEach(({ el }) => { el.style.transform = ''; }); } });
});

// „Case Study w pigułce” (case study + Strona Główna) – na webie drawer z prawej (maska, płynne wysunięcie), na mobile zwykły link (strona „w pigułce” / pełne case study)
document.querySelectorAll('[data-drawer-open]').forEach((trigger) => {
  const drawer = document.getElementById(trigger.dataset.drawerOpen);
  if (!drawer) return;
  const web = window.matchMedia('(min-width: 721px)');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const panel = drawer.querySelector('.drawer__panel');
  const scroller = drawer.querySelector('.pill__scroll');
  let closeTimer = null;
  const focusables = () => [...panel.querySelectorAll('a[href], button:not([disabled])')];
  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    const items = focusables();
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  const open = () => {
    clearTimeout(closeTimer);
    const gap = window.innerWidth - document.documentElement.clientWidth; // bez „skoku” strony po ukryciu paska przewijania
    document.documentElement.style.paddingRight = gap ? gap + 'px' : '';
    document.documentElement.classList.add('has-drawer');
    drawer.hidden = false;
    scroller.scrollTop = 0;
    void drawer.offsetWidth; // start animacji od stanu zamkniętego
    drawer.classList.add('is-open');
    document.addEventListener('keydown', onKey);
    focusables()[0].focus({ preventScroll: true });
  };
  const close = () => {
    if (!drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    document.removeEventListener('keydown', onKey);
    const done = () => {
      drawer.hidden = true;
      document.documentElement.classList.remove('has-drawer');
      document.documentElement.style.paddingRight = '';
    };
    closeTimer = setTimeout(done, reduce.matches ? 0 : 420);
    trigger.focus({ preventScroll: true });
  };
  trigger.addEventListener('click', (e) => {
    if (!web.matches) return; // mobile: osobna strona
    e.preventDefault();
    open();
  });
  drawer.querySelectorAll('[data-drawer-close]').forEach((el) => el.addEventListener('click', close));
});

// Strona „w pigułce” (mobile): X i przycisk wracają do case study – jeśli przyszliśmy z niego, cofamy historię (zachowana pozycja przewinięcia)
document.querySelectorAll('[data-pill-back]').forEach((link) => {
  link.addEventListener('click', (e) => {
    let ref = null;
    try { ref = new URL(document.referrer); } catch (err) { ref = null; }
    const target = '/' + link.getAttribute('href');
    if (ref && ref.origin === location.origin && ref.pathname.endsWith(target) && history.length > 1) {
      e.preventDefault();
      history.back();
    }
  });
});

// Header SG – miniatury projektów pojawiają się pod kursorem i znikają (wg nagrania header.mov).
// Tylko mysz (hover + pointer fine) i ≥721 px; wyłączone przy prefers-reduced-motion.
document.querySelectorAll('[data-hero-trail]').forEach((hero) => {
  const layer = hero.querySelector('.hero__trail');
  const srcs = hero.dataset.heroTrail.trim().split(/\s+/);
  const enabled = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 721px)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!layer || !srcs.length) return;

  const W = 248, H = 180;
  const STEP = 110;      // co ile px ruchu kursora pojawia się kolejna miniatura
  const POOL = 14;       // maks. liczba miniatur naraz
  let pool = null, next = 0, img = 0, z = 0, last = null;

  const build = () => {
    pool = Array.from({ length: POOL }, () => {
      const el = document.createElement('img');
      el.className = 'hero__trail-img';
      el.alt = '';
      el.decoding = 'async';
      layer.appendChild(el);
      return el;
    });
    srcs.forEach((s) => { new Image().src = s; }); // wczytanie z wyprzedzeniem
  };

  const spawn = (x, y) => {
    const el = pool[next];
    next = (next + 1) % POOL;
    el.getAnimations().forEach((a) => a.cancel());
    el.src = srcs[img];
    img = (img + 1) % srcs.length;
    el.style.zIndex = ++z;
    const at = `translate(${x - W / 2}px, ${y - H / 2}px)`;
    el.animate(
      [
        { opacity: 0, transform: `${at} scale(0.85)` },
        { opacity: 1, transform: `${at} scale(1)`, offset: 0.2 },
        { opacity: 1, transform: `${at} scale(1)`, offset: 0.55 },
        { opacity: 0, transform: `${at} scale(0.96)` },
      ],
      { duration: 1400, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' }
    );
  };

  hero.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || !enabled.matches || reduced.matches) return;
    if (!pool) build();
    const r = hero.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (!last) { last = { x, y }; spawn(x, y); return; }
    if (Math.hypot(x - last.x, y - last.y) < STEP) return;
    last = { x, y };
    spawn(x, y);
  });
  hero.addEventListener('pointerleave', () => { last = null; });
});

/* Pojawianie się treści – wariant C „Rozmycie” (24.11). Na razie tylko SG (body[data-reveal-page]).
   html.reveal ustawia skrypt w <head> (bez prefers-reduced-motion).
   26.11: efekt w obie strony – element, który całkiem zniknie z ekranu, wraca do stanu ukrytego (bez animacji)
   i pojawia się ponownie, gdy znów wjedzie w widok (z dołu albo z góry). Elementy wchodzące razem
   pojawiają się kolejno co 0,08 s (maks. 0,6 s) w kolejności zgodnej z kierunkiem przewijania. */
if (document.body.hasAttribute('data-reveal-page') && document.documentElement.classList.contains('reveal')) {
  window.__revealReady = true;
  const REVEAL_TARGETS = [
    '.hero__tags', '.hero__title',
    '.section-head__title', '.section-head__lead', '.project__media', '.project__body', '.projects__note',
    '.stack__title', '.stack__item',
    '.home-footer__tag', '.home-footer__title', '.home-footer__cta', '.home-footer__bottom',
  ].join(',');
  const STAGGER = 0.08;
  const MAX_DELAY = 0.6;
  const DURATION = 1.1;
  const timers = new WeakMap();
  const els = [...document.querySelectorAll(REVEAL_TARGETS)];
  els.forEach((el) => el.setAttribute('data-reveal', ''));

  let lastY = window.scrollY;
  let goingUp = false;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y !== lastY) goingUp = y < lastY;
    lastY = y;
  }, { passive: true });

  const show = (el, delay) => {
    clearTimeout(timers.get(el));
    el.style.setProperty('--reveal-delay', `${delay}s`);
    el.classList.remove('is-settled');
    el.classList.add('is-revealed');
    /* po efekcie zdejmujemy przejście (.is-settled) – wracają zwykłe hovery elementu */
    timers.set(el, setTimeout(() => {
      el.classList.add('is-settled');
      el.style.removeProperty('--reveal-delay');
    }, (delay + DURATION + 0.1) * 1000));
  };
  const hide = (el) => {
    clearTimeout(timers.get(el));
    el.classList.remove('is-revealed', 'is-settled');
    el.style.removeProperty('--reveal-delay');
  };

  /* pojawianie: element wchodzi w widok (od dołu z zapasem 12%, od góry 4%) */
  const showIO = new IntersectionObserver((entries) => {
    const entering = entries.filter((e) => e.isIntersecting && !e.target.classList.contains('is-revealed'));
    entering.sort((a, b) => (goingUp ? -1 : 1) * (a.boundingClientRect.top - b.boundingClientRect.top));
    entering.forEach((e, i) => show(e.target, Math.min(i * STAGGER, MAX_DELAY)));
  }, { rootMargin: '-4% 0px -12% 0px', threshold: 0.01 });
  /* chowanie: element całkiem poza ekranem */
  const hideIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (!e.isIntersecting) hide(e.target); });
  }, { rootMargin: '0px', threshold: 0 });
  els.forEach((el) => { showIO.observe(el); hideIO.observe(el); });
}
