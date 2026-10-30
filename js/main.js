// Menu mobilne – otwieranie / zamykanie
const toggle = document.querySelector('.nav__toggle');
const menu = document.getElementById('nav-menu');

if (toggle && menu) {
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    toggle.setAttribute('aria-label', open ? 'Otwórz menu' : 'Zamknij menu');
    menu.classList.toggle('is-open', !open);
  });

  menu.querySelectorAll('a').forEach((link) =>
    link.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', 'false');
      menu.classList.remove('is-open');
    })
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
