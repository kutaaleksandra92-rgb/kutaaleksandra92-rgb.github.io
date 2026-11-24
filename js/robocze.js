/* ============================================================
   ROBOCZE (24.11) – tylko projekty/warsztat-mvp.html
   Podgląd efektów ładowania treści + lista miejsc do uzupełnienia.
   Wariant zapamiętywany w adresie (?fx=a|b|c|off) – można wysłać link z konkretnym wariantem.
   Przed publikacją: usunąć ten plik (i css/robocze.css); wybrany efekt przenieść do main.js.
   ============================================================ */
(() => {
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const VARIANTS = {
    a: { name: 'A', desc: 'Wjazd od dołu: krycie + przesunięcie 32 px, elementy sekcji kolejno co 0,08 s.' },
    b: { name: 'B', desc: 'Odsłanianie: nagłówki wyjeżdżają spod maski, obrazy odsłaniane od dołu z lekkim zoomem.' },
    c: { name: 'C', desc: 'Rozmycie: treść wyostrza się z blur 12 px i lekko powiększa. Spokojniejsze, wolniejsze.' },
    off: { name: 'Brak', desc: 'Bez efektów – tak strona działa dziś.' },
  };

  /* Co animujemy: [selektor, typ]. Kolejność w sekcji = kolejność w DOM. */
  const TARGETS = [
    ['.case-hero__title, .case-intro__title, .case-business__title, .case-verdict__title, .case-directions__title, .case-stages__title, .case-outcome__title, .case-limits__title, .case-more__title', 'title'],
    ['.case-info__item, .case-business__eyebrow, .case-verdict__eyebrow, .case-decision__eyebrow, .case-outcome__eyebrow, .case-limits__eyebrow, .case-business__lead, .case-business__goal, .case-verdict__lead, .case-directions__lead, .case-stages__sub, .case-outcome__text, .case-business__subtitle, .case-reflection__text > *, .case-intro__action, .post-mvp', 'text'],
    ['.intro-fact, .idea-step, .verdict-tile, .direction, .stage, .limit, .artifact, .more', 'item'],
    ['.case-hero__media > *, .case-intro__media, .case-business__media, .case-stages__media, .case-reflection__photo', 'media'],
  ];
  const STAGGER = 0.08;
  const MAX_DELAY = 0.6;

  let observer;
  let counters = true;

  function sectionOf(el) { return el.closest('section') || document.body; }

  function prepare() {
    const bySection = new Map();
    TARGETS.forEach(([sel, type]) => {
      document.querySelectorAll(sel).forEach((el) => {
        if (el.closest('.drawer, .fx-panel')) return;
        el.dataset.fx = type;
        el.dataset.fxType = type;
        const s = sectionOf(el);
        if (!bySection.has(s)) bySection.set(s, []);
        bySection.get(s).push(el);
      });
    });
    /* opóźnienie wg kolejności w dokumencie w obrębie sekcji */
    bySection.forEach((els) => {
      els.sort((x, y) => (x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
      els.forEach((el, i) => el.style.setProperty('--fx-delay', `${Math.min(i * STAGGER, MAX_DELAY)}s`));
    });
  }

  function reveal(el) {
    el.classList.add('is-in');
    if (counters && el.classList.contains('intro-fact')) countUp(el.querySelector('.intro-fact__value'));
    /* po efekcie zdejmujemy data-fx – wracają oryginalne transition (np. hover kolumn „Podejście”) */
    const delay = parseFloat(el.style.getPropertyValue('--fx-delay')) || 0;
    clearTimeout(el._fxDone);
    el._fxDone = setTimeout(() => { el.removeAttribute('data-fx'); el.classList.remove('is-in'); }, (delay + 1.8) * 1000);
  }

  function observe() {
    observer?.disconnect();
    observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        reveal(e.target);
        observer.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.01 });
    document.querySelectorAll('[data-fx]').forEach((el) => observer.observe(el));
  }

  /* Liczniki: 0 → wartość (liczba w tekście, reszta zostaje, np. „< 11 tyg.”) */
  function countUp(el) {
    if (!el || el.dataset.counted) return;
    const text = el.dataset.final || el.textContent;
    el.dataset.final = text;
    const m = text.match(/\d+(?:[.,]\d+)?/);
    if (!m) return;
    el.dataset.counted = '1';
    const target = parseFloat(m[0].replace(',', '.'));
    const decimals = (m[0].split(/[.,]/)[1] || '').length;
    const dur = 1200;
    const t0 = performance.now() + parseFloat(getComputedStyle(el.closest('[data-fx]') || el).getPropertyValue('--fx-delay') || 0) * 1000;
    el.setAttribute('aria-label', text);
    const tick = (now) => {
      const p = Math.min(Math.max((now - t0) / dur, 0), 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = (target * eased).toFixed(decimals).replace('.', ',');
      el.textContent = text.replace(m[0], val);
      if (p < 1) requestAnimationFrame(tick); else el.textContent = text;
    };
    requestAnimationFrame(tick);
  }

  function apply(variant, { replay = false } = {}) {
    root.classList.add('fx-reset'); /* bez przejść na czas resetu */
    root.classList.remove('fx-a', 'fx-b', 'fx-c');
    observer?.disconnect();
    document.querySelectorAll('[data-fx-type]').forEach((el) => {
      clearTimeout(el._fxDone);
      el.classList.remove('is-in');
      el.dataset.fx = el.dataset.fxType;
      const v = el.querySelector('.intro-fact__value');
      if (v?.dataset.final) { v.textContent = v.dataset.final; delete v.dataset.counted; }
    });
    if (variant !== 'off' && !reduced) {
      if (replay) window.scrollTo({ top: 0, behavior: 'instant' });
      root.classList.add(`fx-${variant}`); /* przy pierwszym wczytaniu przed pierwszym malowaniem – bez mignięcia */
    }
    void root.offsetHeight;
    requestAnimationFrame(() => {
      root.classList.remove('fx-reset');
      if (variant !== 'off' && !reduced) requestAnimationFrame(observe);
    });
  }

  /* ---------- Panel ---------- */
  function buildPanel(current) {
    const todos = [...document.querySelectorAll('[data-todo]')];
    const panel = document.createElement('aside');
    panel.className = 'fx-panel';
    panel.setAttribute('aria-label', 'Podgląd roboczy');
    panel.dataset.collapsed = sessionStorageGet('fx-collapsed') || 'false';
    panel.innerHTML = `
      <div class="fx-panel__head">
        <p class="fx-panel__title">Podgląd roboczy</p>
        <button type="button" class="fx-panel__toggle" aria-expanded="true">zwiń</button>
      </div>
      <div class="fx-panel__body">
        <p class="fx-panel__label">Efekt ładowania treści${reduced ? ' (wyłączone: system ma ograniczony ruch)' : ''}</p>
        <div class="fx-panel__group" role="group">
          ${Object.entries(VARIANTS).map(([k, v]) => `<button type="button" class="fx-panel__btn" data-variant="${k}" aria-pressed="${k === current}">${v.name}</button>`).join('')}
        </div>
        <p class="fx-panel__desc"></p>
        <label class="fx-panel__check"><input type="checkbox" checked> Liczniki we wprowadzeniu</label>
        <div class="fx-panel__row"><button type="button" class="fx-panel__btn" data-replay>Odtwórz od góry</button></div>
        <div class="fx-panel__todo">
          <p class="fx-panel__label">Do uzupełnienia: ${todos.length}</p>
          <div class="fx-panel__row" style="margin-top:8px"><button type="button" class="fx-panel__btn" data-next-todo>Następne miejsce ↓</button></div>
        </div>
      </div>`;
    document.body.appendChild(panel);

    const desc = panel.querySelector('.fx-panel__desc');
    const toggle = panel.querySelector('.fx-panel__toggle');
    const setDesc = (k) => { desc.textContent = VARIANTS[k].desc; };
    const syncToggle = () => {
      const c = panel.dataset.collapsed === 'true';
      toggle.textContent = c ? 'rozwiń' : 'zwiń';
      toggle.setAttribute('aria-expanded', String(!c));
    };
    setDesc(current); syncToggle();

    toggle.addEventListener('click', () => {
      panel.dataset.collapsed = panel.dataset.collapsed === 'true' ? 'false' : 'true';
      sessionStorageSet('fx-collapsed', panel.dataset.collapsed);
      syncToggle();
    });
    panel.querySelectorAll('[data-variant]').forEach((btn) => btn.addEventListener('click', () => {
      current = btn.dataset.variant;
      panel.querySelectorAll('[data-variant]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      setDesc(current);
      const url = new URL(location.href); url.searchParams.set('fx', current); history.replaceState(null, '', url);
      apply(current, { replay: true });
    }));
    panel.querySelector('[data-replay]').addEventListener('click', () => apply(current, { replay: true }));
    panel.querySelector('input').addEventListener('change', (e) => { counters = e.target.checked; apply(current, { replay: true }); });

    let idx = -1;
    panel.querySelector('[data-next-todo]').addEventListener('click', () => {
      if (!todos.length) return;
      idx = (idx + 1) % todos.length;
      const el = todos[idx];
      el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      el.classList.add('is-todo-flash');
      setTimeout(() => el.classList.remove('is-todo-flash'), 1400);
    });
  }

  function sessionStorageGet(k) { try { return sessionStorage.getItem(k); } catch { return null; } }
  function sessionStorageSet(k, v) { try { sessionStorage.setItem(k, v); } catch { /* brak dostępu */ } }

  const param = new URL(location.href).searchParams.get('fx');
  const initial = VARIANTS[param] ? param : 'a';
  prepare();
  buildPanel(initial);
  apply(initial);
})();
