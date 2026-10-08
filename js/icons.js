/* Ícones SVG (traço único, 24×24, herdam a cor do texto). Uso: <span data-icon="nome"></span> ou ICON('nome'). */
(function () {
  'use strict';

  const P = {
    stethoscope: '<path d="M5 3v5a5 5 0 0 0 10 0V3"/><path d="M10 13v3a4 4 0 0 0 8 0v-3"/><circle cx="18" cy="11" r="2"/>',
    bandage: '<rect x="2.5" y="8.5" width="19" height="7" rx="3.5" transform="rotate(-45 12 12)"/><path d="M10.5 10.5h.01M13.5 13.5h.01M10.5 13.5h.01M13.5 10.5h.01"/>',
    female: '<circle cx="12" cy="9" r="5"/><path d="M12 14v7M9 18h6"/>',
    elder: '<circle cx="10" cy="4.5" r="2"/><path d="M10 7.5 9 13l-2 8M9 13l3 3v5M10 9.5l4 2M15 11.5V21"/>',
    book: '<path d="M3 5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v15a2 2 0 0 0-2-2H3z"/><path d="M21 5a2 2 0 0 0-2-2h-5a2 2 0 0 0-2 2v15a2 2 0 0 1 2-2h7z"/>',
    sparkles: '<path d="M11 3l1.8 4.7 4.7 1.8-4.7 1.8L11 16l-1.8-4.7L4.5 9.5l4.7-1.8z"/><path d="M18.5 14l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
    contrast: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    settings: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
    send: '<path d="M4 12 20 4l-4 16-4-6z"/><path d="M12 14 20 4"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    printer: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    calculator: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    pill: '<rect x="2.5" y="8.5" width="19" height="7" rx="3.5" transform="rotate(-45 12 12)"/><path d="M9.5 9.5l5 5"/>',
    leaf: '<path d="M5 19C5 10 10 5 20 4c-1 10-6 15-15 15z"/><path d="M5 19l8-8"/>',
    activity: '<path d="M3 12h4l3-7 4 14 3-7h4"/>',
    gauge: '<path d="M4 16a8 8 0 1 1 16 0"/><path d="M12 16l4-5M4 20h16"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    foot: '<path d="M8.5 21C6 21 5 19 5 16.5c0-3 1.2-6 3.2-7.5 1.8-1.3 3.8-.3 3.8 2.5 0 2.2-1 3.3-1 5.3 0 2.6-.4 4.2-2.5 4.2z"/><circle cx="14" cy="4.5" r="1.3"/><circle cx="17" cy="6.5" r="1.2"/><circle cx="18.5" cy="10" r="1.1"/><circle cx="18.5" cy="13.5" r="1"/>',
    home: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
    scale: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8.5 10a3.5 3.5 0 0 1 7 0"/><path d="M12 10l1.5-2"/>',
    shield: '<path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6z"/><path d="M9 12l2 2 4-4"/>',
    lungs: '<path d="M12 4v7"/><path d="M12 11c-1 0-2 1-2 2M12 11c1 0 2 1 2 2"/><path d="M9.5 7C6.5 7 4 11 4 16c0 2 1 3 2.5 3S10 18 10 16V9"/><path d="M14.5 7c3 0 5.5 4 5.5 9 0 2-1 3-2.5 3S14 18 14 16V9"/>',
    wind: '<path d="M3 8h11a3 3 0 1 0-3-3"/><path d="M3 12h15a3 3 0 1 1-3 3"/><path d="M3 16h7"/>',
    smile: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14a4 4 0 0 0 7 0"/><path d="M9 9.5h.01M15 9.5h.01"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/>',
    care: '<path d="M12 10s-3.5-2-3.5-4.5A2 2 0 0 1 12 4.3a2 2 0 0 1 3.5 1.2C15.5 8 12 10 12 10z"/><path d="M2 14h3l4 2h4.5a1.5 1.5 0 0 1 0 3H9"/><path d="M13.5 19H17l4.5-4.5a1.4 1.4 0 0 0-2-2L16 16"/>',
  };

  function ICON(name, cls = '') {
    const body = P[name];
    if (!body) return '';
    return `<svg class="icon${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ` +
      `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
  }

  function hydrate(root = document) {
    root.querySelectorAll('[data-icon]:empty').forEach((el) => { el.innerHTML = ICON(el.dataset.icon); });
  }

  window.ICON = ICON;
  window.hydrateIcons = hydrate;
  hydrate();
})();
