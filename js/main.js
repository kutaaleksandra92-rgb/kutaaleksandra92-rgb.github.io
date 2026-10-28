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

// Case study – nawigacja sekcji (WERSJA ROBOCZA, tylko web): zmniejszenie po przyklejeniu
// i chowanie przy przewijaniu w dół / pokazywanie przy przewijaniu w górę
const caseNav = document.querySelector('.case-nav');
if (caseNav) {
  const desktop = window.matchMedia('(min-width: 721px)');
  const STUCK_TOP = -28; // musi odpowiadać wartości top w CSS
  let lastY = window.scrollY;
  let ticking = false;

  const update = () => {
    ticking = false;
    const y = window.scrollY;
    if (!desktop.matches) {
      caseNav.classList.remove('is-stuck', 'is-hidden');
      lastY = y;
      return;
    }
    // naturalne miejsce paska = dół poprzedzającej go sekcji (niezależnie od przesunięcia przy chowaniu)
    const anchor = caseNav.previousElementSibling;
    const naturalTop = anchor ? anchor.getBoundingClientRect().bottom : caseNav.getBoundingClientRect().top;
    const stuck = naturalTop <= STUCK_TOP;
    caseNav.classList.toggle('is-stuck', stuck);
    if (!stuck) caseNav.classList.remove('is-hidden');
    else if (y > lastY + 4) caseNav.classList.add('is-hidden');
    else if (y < lastY - 4) caseNav.classList.remove('is-hidden');
    lastY = y;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  desktop.addEventListener('change', update);
  update();
}
