/* Ilustrações coloridas do cabeçalho de cada aba (SVG desenhado à mão, sem imagens externas). Uso: ART('clinica'). */
(function () {
  'use strict';

  const C = { coral: '#FF8A80', yellow: '#FFD166', mint: '#8EF0D4', sky: '#9AD8FF', lilac: '#D8C7FF', pink: '#FFB3D1', white: '#FFFFFF' };

  // Estrela de quatro pontas (brilho)
  const spark = (x, y, r, fill) =>
    `<path d="M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z" fill="${fill}"/>`;
  const plus = (x, y, r, color) =>
    `<path d="M${x} ${y - r}v${2 * r}M${x - r} ${y}h${2 * r}" stroke="${color}" stroke-width="5" stroke-linecap="round"/>`;
  const dot = (x, y, r, fill, op = 1) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" fill-opacity="${op}"/>`;
  // Coração centrado em (x, y) com largura aproximada 2·s
  const heart = (x, y, s, fill) =>
    `<path d="M${x} ${y + s * .95}C${x - s * 1.1} ${y + s * .3} ${x - s * 1.3} ${y - s * .35} ${x - s} ${y - s * .75}` +
    `C${x - s * .68} ${y - s * 1.15} ${x - s * .18} ${y - s} ${x} ${y - s * .62}` +
    `C${x + s * .18} ${y - s} ${x + s * .68} ${y - s * 1.15} ${x + s} ${y - s * .75}` +
    `C${x + s * 1.3} ${y - s * .35} ${x + s * 1.1} ${y + s * .3} ${x} ${y + s * .95}Z" fill="${fill}"/>`;
  const halo = `<circle cx="120" cy="82" r="70" fill="#fff" fill-opacity=".09"/><circle cx="120" cy="82" r="50" fill="#fff" fill-opacity=".07"/>`;

  const ART = {
    clinica: halo +
      heart(120, 86, 44, C.coral) +
      `<path d="M90 58c5-9 13-12 20-9" stroke="#fff" stroke-opacity=".55" stroke-width="5" stroke-linecap="round" fill="none"/>` +
      `<path d="M30 88h58l8-16 10 34 10-44 10 36 6-10h66" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<g transform="rotate(-35 188 38)"><rect x="170" y="29" width="36" height="18" rx="9" fill="#fff"/><path d="M188 29h9a9 9 0 0 1 0 18h-9z" fill="${C.yellow}"/></g>` +
      plus(38, 40, 9, C.mint) + dot(200, 124, 5, C.yellow) + dot(46, 130, 4, '#fff', .7) + spark(170, 136, 7, C.mint),

    cirurgia: halo +
      `<rect x="80" y="30" width="80" height="106" rx="12" fill="#fff"/>` +
      `<rect x="102" y="21" width="36" height="17" rx="6" fill="${C.sky}"/>` +
      `<g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="5">` +
      `<path d="M95 63l6 6 11-12M95 87l6 6 11-12M95 111l6 6 11-12" stroke="#10B981"/>` +
      `<path d="M122 64h24M122 88h24M122 112h18" stroke="#94A3B8"/></g>` +
      `<g transform="rotate(-30 58 118)"><rect x="22" y="106" width="74" height="24" rx="12" fill="${C.yellow}"/>` +
      `<rect x="47" y="106" width="24" height="24" fill="#FFE7A3"/>` +
      `<g fill="#D99A00">${dot(54, 113, 1.8, '#D99A00')}${dot(64, 113, 1.8, '#D99A00')}${dot(54, 123, 1.8, '#D99A00')}${dot(64, 123, 1.8, '#D99A00')}</g></g>` +
      `<g transform="rotate(32 186 78)"><rect x="180" y="72" width="12" height="54" rx="5" fill="${C.sky}"/>` +
      `<path d="M180 74c0-22 9-34 12-40v40z" fill="#fff"/></g>` +
      plus(198, 26, 8, C.mint) + spark(44, 44, 9, C.yellow) + dot(208, 136, 4, '#fff', .7),

    gineco: halo +
      `<circle cx="112" cy="80" r="48" fill="${C.pink}"/>` +
      heart(112, 82, 24, '#fff') +
      `<path d="M112 128v22M100 140h24" stroke="${C.pink}" stroke-width="8" stroke-linecap="round"/>` +
      `<g fill="#fff"><ellipse cx="182" cy="112" rx="10" ry="15"/>${dot(173, 92, 3.6, '#fff')}${dot(180, 89, 3.6, '#fff')}${dot(187, 90, 3.3, '#fff')}${dot(193, 95, 2.9, '#fff')}</g>` +
      `<g fill="#fff" fill-opacity=".75"><ellipse cx="204" cy="66" rx="8" ry="12"/>${dot(197, 50, 2.9, '#fff', .75)}${dot(203, 48, 2.9, '#fff', .75)}${dot(209, 49, 2.6, '#fff', .75)}${dot(213, 53, 2.3, '#fff', .75)}</g>` +
      spark(40, 46, 11, C.yellow) + spark(52, 124, 7, C.mint) + dot(160, 26, 5, C.yellow),

    geriatria: halo +
      `<g stroke="#fff" stroke-width="7" fill="${C.lilac}" fill-opacity=".35"><circle cx="90" cy="80" r="25"/><circle cx="152" cy="80" r="25"/></g>` +
      `<path d="M115 78q6-9 12 0M65 76 45 62M177 76l20-14" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round"/>` +
      `<path d="M80 70c3-6 8-8 13-8M142 70c3-6 8-8 13-8" stroke="#fff" stroke-opacity=".7" stroke-width="4" fill="none" stroke-linecap="round"/>` +
      `<path d="M192 150v-34a11 11 0 0 0-22 0" stroke="${C.yellow}" stroke-width="7" fill="none" stroke-linecap="round"/>` +
      heart(48, 128, 14, C.coral) + spark(120, 132, 9, C.mint) + plus(36, 30, 8, C.yellow) + dot(206, 28, 5, C.mint),

    paliativos:
      `<circle cx="120" cy="150" r="66" fill="${C.yellow}" fill-opacity=".9"/>` +
      `<g stroke="${C.yellow}" stroke-width="6" stroke-linecap="round">` +
      `<path d="M120 62v-14M64 88l-10-9M176 88l10-9M42 128H28M198 128h14"/></g>` +
      heart(120, 120, 30, C.coral) +
      `<path d="M120 96V72" stroke="#3FBF8F" stroke-width="5" stroke-linecap="round"/>` +
      `<path d="M120 82c-4-14-18-18-26-14 4 12 16 18 26 14zM120 76c4-14 18-18 26-14-4 12-16 18-26 14z" fill="${C.mint}"/>` +
      spark(46, 40, 9, '#fff') + spark(190, 34, 7, '#fff') + dot(84, 26, 4, '#fff', .8),

    favoritos: halo +
      `<path d="M120 28l15 30 33 5-24 23 6 33-30-16-30 16 6-33-24-23 33-5z" fill="${C.yellow}" stroke="#fff" stroke-width="5" stroke-linejoin="round"/>` +
      `<path d="M188 92l7 14 15 2-11 11 3 15-14-7-14 7 3-15-11-11 15-2z" fill="#fff"/>` +
      `<path d="M50 96l6 12 13 2-9 9 2 13-12-6-12 6 2-13-9-9 13-2z" fill="${C.mint}"/>` +
      spark(186, 34, 10, '#fff') + spark(46, 44, 7, C.yellow) + dot(120, 146, 4, '#fff', .7),

    educacao: halo +
      `<path d="M120 50C100 38 70 38 46 46v80c24-8 54-8 74 4z" fill="#fff"/>` +
      `<path d="M120 50c20-12 50-12 74-4v80c-24-8-54-8-74 4z" fill="#E6FFF6"/>` +
      `<path d="M120 52v76" stroke="#A7D8C5" stroke-width="3"/>` +
      `<g stroke="#9CC9B8" stroke-width="4" stroke-linecap="round"><path d="M60 66c14-4 30-4 46 0M60 82c14-4 30-4 46 0M60 98c14-4 30-4 36 0"/>` +
      `<path d="M134 66c16-4 32-4 46 0M134 82c16-4 32-4 46 0M134 98c16-4 26-4 36 0"/></g>` +
      `<rect x="160" y="8" width="54" height="36" rx="12" fill="${C.yellow}"/><path d="M172 42l-6 13 18-11z" fill="${C.yellow}"/>` +
      heart(187, 26, 10, C.coral) +
      spark(36, 30, 9, C.mint) + plus(40, 140, 7, C.yellow) + dot(206, 136, 5, '#fff', .7),
  };

  window.ART = (name) =>
    `<svg viewBox="0 0 240 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${ART[name] || ART.clinica}</svg>`;
})();
