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

// Case study – slider „przed / po” (Decyzja II): strzałki przełączają zdjęcia i opis
document.querySelectorAll('[data-ba-slider]').forEach((slider) => {
  const slides = [...slider.querySelectorAll('[data-slide]')];
  let current = slides.findIndex((s) => !s.hidden);

  const show = (index, focusSelector) => {
    if (index < 0 || index >= slides.length) return;
    slides[current].hidden = true;
    slides[index].hidden = false;
    current = index;
    // na mobile nowy slajd zaczyna się od zdjęcia „Przed”; fokus zostaje na tej samej strzałce
    const images = slides[index].querySelector('.ba__images');
    if (images) images.scrollLeft = 0;
    const target = slides[index].querySelector(focusSelector);
    if (target && !target.disabled) target.focus({ preventScroll: true });
  };

  slider.addEventListener('click', (event) => {
    if (event.target.closest('[data-prev]')) show(current - 1, '[data-prev]');
    else if (event.target.closest('[data-next]')) show(current + 1, '[data-next]');
  });
});
