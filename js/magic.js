/* Magia: show de abertura (céu, fogos e castelo), portais das áreas e efeitos de brilho.
   Só enfeita a interface: não toca em cálculo nem em dado de paciente. Respeita "reduzir movimento"
   e tem botão para desligar. Os resultados clínicos nunca recebem fogos. */
(function () {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const KEY = 'calcmed.magic';

  /* ---------- preferência: efeitos ligados ou desligados ---------- */
  function saved() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  function save(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* sem armazenamento: vale só nesta visita */ } }
  let magicOn = saved() ?? !reduce.matches;

  function applyMagic() {
    root.dataset.magic = magicOn ? 'on' : 'off';
    const b = $('#magic-toggle');
    if (b) {
      b.setAttribute('aria-pressed', String(magicOn));
      b.setAttribute('aria-label', 'Efeitos visuais: ' + (magicOn ? 'ligados' : 'desligados'));
    }
    sky.sync();
  }

  /* ---------- castelo (SVG desenhado à mão) ---------- */
  const FLAGS = ['#2dd4bf', '#f9a8d4', '#fde047', '#93c5fd', '#c4b5fd', '#fdba74'];
  function tower(x, w, top, roofH, flag) {
    const cx = x + w / 2, eave = 8;
    let s = `<rect x="${x}" y="${top}" width="${w}" height="${420 - top}"/>` +
      `<path d="M${x - eave} ${top}L${cx} ${top - roofH}L${x + w + eave} ${top}Z"/>`;
    if (flag) {
      s += `<path class="c-pole" d="M${cx} ${top - roofH}v-26"/>` +
        `<path class="c-flag" style="fill:${flag}" d="M${cx} ${top - roofH - 26}l22 6-22 6z"/>`;
    }
    return s;
  }
  function windows(list) {
    return list.map(([x, y, w, h], i) =>
      `<rect class="c-win" style="animation-delay:${(i * 0.37) % 3}s" x="${x}" y="${y}" width="${w}" height="${h}" rx="${w / 2}"/>`).join('');
  }
  function crenels(x1, x2, y) {
    let s = '';
    for (let x = x1; x < x2; x += 18) s += `<rect x="${x}" y="${y - 10}" width="10" height="12"/>`;
    return s;
  }
  function castleSVG() {
    const back = tower(250, 40, 260, 70) + tower(910, 40, 260, 70) + tower(520, 30, 170, 80) + tower(650, 30, 170, 80);
    const front =
      `<rect x="330" y="300" width="540" height="120"/>` + crenels(330, 870, 300) +
      tower(300, 46, 250, 64, FLAGS[0]) + tower(854, 46, 250, 64, FLAGS[1]) +
      tower(395, 62, 190, 86, FLAGS[2]) + tower(743, 62, 190, 86, FLAGS[3]) +
      `<rect x="470" y="235" width="260" height="185"/>` + crenels(470, 730, 235) +
      tower(552, 96, 120, 110);
    const win = windows([
      [588, 160, 10, 22], [602, 160, 10, 22], [416, 225, 9, 18], [432, 225, 9, 18], [764, 225, 9, 18], [780, 225, 9, 18],
      [318, 280, 9, 16], [872, 280, 9, 16], [500, 270, 9, 18], [530, 270, 9, 18], [662, 270, 9, 18], [692, 270, 9, 18],
      [418, 300, 8, 15], [770, 300, 8, 15], [596, 215, 14, 26],
    ]);
    // Coração com cruz no alto da torre central: o "castelo do cuidado"
    const crest = `<g class="c-crest"><circle cx="600" cy="-8" r="26" class="c-crest-glow"/>` +
      `<path d="M600 8c-14-9-22-16-22-25a10 10 0 0 1 22-5 10 10 0 0 1 22 5c0 9-8 16-22 25z"/>` +
      `<path class="c-cross" d="M600 -24v14M593 -17h14"/></g>`;
    return `<svg viewBox="0 -60 1200 480" preserveAspectRatio="xMidYMax meet" focusable="false">` +
      `<defs><linearGradient id="c-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2f6e"/><stop offset="1" stop-color="#0c1033"/></linearGradient>` +
      `<radialGradient id="c-gate" cx=".5" cy="1" r=".9"><stop offset="0" stop-color="#ffe7a3"/><stop offset="1" stop-color="#ff9f6e"/></radialGradient></defs>` +
      `<g class="c-back">${back}</g>` +
      `<g class="c-front">${front}</g>` +
      `<path class="c-gate" d="M574 420v-46a26 26 0 0 1 52 0v46z"/>` + win + crest + `</svg>`;
  }

  /* ---------- céu: estrelas, estrelas cadentes e fogos (canvas) ---------- */
  const COLORS = ['#2dd4bf', '#93c5fd', '#f9a8d4', '#c4b5fd', '#fdba74', '#fde047', '#6ee7b7', '#67e8f9', '#a5b4fc', '#fcd34d', '#ffffff'];
  const pick = (a) => a[(Math.random() * a.length) | 0];
  const rnd = (a, b) => a + Math.random() * (b - a);

  const sky = (function () {
    let cv, ctx, show, stageH = 300, W = 0, H = 0, dpr = 1, raf = 0, last = 0, visible = false, running = false;
    let stars = [], rockets = [], sparks = [], shooting = null, nextAuto = 0, timeline = [], t0 = 0, flash = 0;

    function init() {
      cv = $('#show-sky'); show = $('#show');
      if (!cv || !show) return false;
      ctx = cv.getContext('2d');
      if (!ctx) return false;
      new ResizeObserver(resize).observe(show);
      new IntersectionObserver((e) => { visible = e[0].isIntersecting; sync(); }, { threshold: 0.05 }).observe(show);
      document.addEventListener('visibilitychange', sync);
      show.addEventListener('pointerdown', (e) => {
        if (!magicOn || e.target.closest('a, button, input')) return;
        const r = cv.getBoundingClientRect();
        launch(e.clientX - r.left, e.clientY - r.top);
      });
      resize();
      return true;
    }

    function resize() {
      const r = show.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      const st = $('.show-stage'); if (st) stageH = st.offsetTop + st.offsetHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(380, Math.round((W * H) / 2600));
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * stageH, r: Math.random() < 0.08 ? rnd(1.2, 1.9) : rnd(0.35, 1.1),
        p: Math.random() * 6.28, s: rnd(0.6, 2.2), c: Math.random() < 0.15 ? '#ffe9b0' : Math.random() < 0.2 ? '#c7d7ff' : '#ffffff',
      }));
      if (!running) drawStill();
    }

    /* Foguete sobe com rastro até o alvo e explode */
    function launch(tx, ty, type) {
      const x = tx ?? rnd(W * 0.15, W * 0.85);
      const y = ty ?? rnd(stageH * 0.12, stageH * 0.62);
      // Sobe de trás do castelo (linha do horizonte), nunca por cima do texto
      const sx = x + rnd(-W * 0.06, W * 0.06), sy = stageH - 8;
      if (y >= sy - 20) { burst(x, y, pick(COLORS)); return; }
      const dist = sy - y;
      rockets.push({ x: sx, y: sy, tx: x, ty: y, vx: (x - sx) / 60, vy: -Math.sqrt(2 * 0.09 * dist) * 1.02, trail: [], c: pick(COLORS), type });
    }

    function burst(x, y, c, type) {
      type = type || pick(['peony', 'peony', 'ring', 'willow', 'glitter', 'double']);
      const c2 = pick(COLORS);
      const k = Math.max(0.85, Math.min(1.7, W / 820));
      const add = (vx, vy, o) => sparks.push(Object.assign({ x, y, px: x, py: y, vx: vx * k, vy: vy * k, life: 1, decay: rnd(0.010, 0.016), c, g: 0.035, drag: 0.985, size: rnd(1.4, 2.4), tw: false }, o));
      if (type === 'heart') {
        const n = 90, s = rnd(0.16, 0.2);
        for (let i = 0; i < n; i++) {
          const t = (i / n) * Math.PI * 2;
          const hx = 16 * Math.pow(Math.sin(t), 3);
          const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
          add(hx * s, hy * s, { c: '#ff6b9a', g: 0.012, drag: 0.975, decay: 0.009, size: 2.4 });
        }
        for (let i = 0; i < 30; i++) { const a = Math.random() * 6.28, v = rnd(0.3, 1.4); add(Math.cos(a) * v, Math.sin(a) * v, { c: '#ffd1e0', tw: true, decay: 0.02, size: 1.4 }); }
      } else if (type === 'ring') {
        const n = 70, v = rnd(3.2, 4.4);
        for (let i = 0; i < n; i++) { const a = (i / n) * 6.28; add(Math.cos(a) * v, Math.sin(a) * v, { decay: 0.013 }); }
        for (let i = 0; i < 40; i++) { const a = (i / 40) * 6.28; add(Math.cos(a) * v * 0.5, Math.sin(a) * v * 0.5, { c: c2, decay: 0.016 }); }
      } else if (type === 'willow') {
        for (let i = 0; i < 110; i++) { const a = Math.random() * 6.28, v = rnd(0.6, 3.4); add(Math.cos(a) * v, Math.sin(a) * v, { c: pick(['#ffd479', '#ffc15a', '#fff1c4']), g: 0.03, drag: 0.97, decay: rnd(0.005, 0.008), size: 1.7, tw: Math.random() < 0.3 }); }
      } else if (type === 'glitter') {
        for (let i = 0; i < 120; i++) { const a = Math.random() * 6.28, v = rnd(0.5, 4.2); add(Math.cos(a) * v, Math.sin(a) * v, { tw: true, decay: rnd(0.008, 0.013), c: Math.random() < 0.5 ? c : '#ffffff' }); }
      } else if (type === 'double') {
        for (let i = 0; i < 90; i++) { const a = Math.random() * 6.28, v = rnd(2.4, 4.6); add(Math.cos(a) * v, Math.sin(a) * v); }
        for (let i = 0; i < 50; i++) { const a = Math.random() * 6.28, v = rnd(0.6, 2); add(Math.cos(a) * v, Math.sin(a) * v, { c: c2 }); }
      } else {
        for (let i = 0; i < 120; i++) { const a = Math.random() * 6.28, v = Math.pow(Math.random(), 0.45) * 4.6; add(Math.cos(a) * v, Math.sin(a) * v); }
      }
      flash = Math.min(1, flash + 0.65);
      show.style.setProperty('--flash-color', c);
      show.classList.add('is-flash');
      clearTimeout(burst.t); burst.t = setTimeout(() => show.classList.remove('is-flash'), 160);
    }

    /* Abertura: crescendo, coração no centro e grande final */
    function program() {
      const cx = W / 2;
      timeline = [
        [200, () => launch(W * 0.3, stageH * 0.42)], [700, () => launch(W * 0.7, stageH * 0.36)], [1300, () => launch(W * 0.5, stageH * 0.3, 'ring')],
        [2100, () => { launch(W * 0.2, stageH * 0.4, 'willow'); launch(W * 0.8, stageH * 0.4, 'willow'); }],
        [3100, () => launch(cx, stageH * 0.26, 'heart')],
        [4400, () => { for (let i = 0; i < 6; i++) launch(rnd(W * 0.12, W * 0.88), rnd(stageH * 0.12, stageH * 0.55)); }],
        [4900, () => { for (let i = 0; i < 4; i++) launch(rnd(W * 0.2, W * 0.8), rnd(stageH * 0.1, stageH * 0.4), 'glitter'); }],
      ];
      t0 = performance.now(); nextAuto = t0 + 7200;
    }

    function step(now) {
      raf = 0;
      if (!running) return;
      const dt = Math.min(2.5, (now - last) / 16.67 || 1);
      last = now;
      while (timeline.length && now - t0 >= timeline[0][0]) timeline.shift()[1]();
      if (!timeline.length && now >= nextAuto) { launch(undefined, undefined, Math.random() < 0.12 ? 'heart' : undefined); nextAuto = now + rnd(1600, 3800); }
      if (!shooting && Math.random() < 0.0035 * dt) shooting = { x: rnd(W * 0.1, W * 0.9), y: rnd(10, stageH * 0.4), vx: rnd(-9, -6) * (Math.random() < 0.5 ? -1 : 1), vy: rnd(2.5, 4), life: 1 };

      ctx.clearRect(0, 0, W, H);
      drawStars(now);
      if (flash > 0.01) {
        const g = ctx.createRadialGradient(W / 2, stageH * 0.4, 0, W / 2, stageH * 0.4, Math.max(W, H) * 0.7);
        g.addColorStop(0, `rgba(255,236,200,${flash * 0.12})`); g.addColorStop(1, 'rgba(255,236,200,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        flash *= Math.pow(0.9, dt);
      }
      ctx.globalCompositeOperation = 'lighter';
      if (shooting) {
        const s = shooting;
        const g = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 9, s.y - s.vy * 9);
        g.addColorStop(0, `rgba(255,255,255,${s.life})`); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 9, s.y - s.vy * 9); ctx.stroke();
        s.x += s.vx * dt; s.y += s.vy * dt; s.life -= 0.02 * dt;
        if (s.life <= 0 || s.x < -50 || s.x > W + 50) shooting = null;
      }
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.trail.push([r.x, r.y]); if (r.trail.length > 10) r.trail.shift();
        r.x += r.vx * dt; r.y += r.vy * dt; r.vy += 0.09 * dt;
        ctx.strokeStyle = r.c; ctx.lineWidth = 2; ctx.globalAlpha = 0.85;
        ctx.beginPath(); ctx.moveTo(r.trail[0][0], r.trail[0][1]); ctx.lineTo(r.x, r.y); ctx.stroke();
        ctx.globalAlpha = 1; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(r.x, r.y, 1.8, 0, 6.28); ctx.fill();
        if (r.vy >= -0.4 || r.y <= r.ty) { rockets.splice(i, 1); burst(r.x, r.y, r.c, r.type); }
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i];
        p.px = p.x; p.py = p.y;
        p.vx *= Math.pow(p.drag, dt); p.vy = p.vy * Math.pow(p.drag, dt) + p.g * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.life -= p.decay * dt;
        if (p.life <= 0) { sparks.splice(i, 1); continue; }
        const a = p.tw ? p.life * (0.4 + 0.6 * Math.abs(Math.sin(now / 60 + i))) : p.life;
        ctx.globalAlpha = Math.max(0, a);
        ctx.strokeStyle = p.c; ctx.lineWidth = p.size * (0.6 + p.life * 0.6);
        ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y); ctx.stroke();
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(step);
    }

    function drawStars(now) {
      for (const s of stars) {
        const a = now == null ? 0.75 : 0.45 + 0.55 * Math.abs(Math.sin(s.p + now / 1000 * s.s));
        ctx.globalAlpha = a; ctx.fillStyle = s.c;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.28); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    function drawStill() { if (ctx) { ctx.clearRect(0, 0, W, H); drawStars(null); } }

    function sync() {
      if (!ctx) return;
      const want = magicOn && visible && !document.hidden && !$('#view-inicio').hidden;
      if (want && !running) {
        running = true; last = performance.now();
        if (!sync.played) { sync.played = true; program(); }
        raf = requestAnimationFrame(step);
      } else if (!want && running) {
        running = false; if (raf) cancelAnimationFrame(raf); raf = 0;
        if (!magicOn) { rockets = []; sparks = []; timeline = []; drawStill(); }
      } else if (!want) drawStill();
    }
    function replay() { if (ctx && magicOn) { sync.played = true; program(); sync(); } }

    return { init, sync, replay };
  })();

  /* ---------- números do show (contagem animada) ---------- */
  function countUp(el, to) {
    if (!magicOn) { el.textContent = to; return; }
    const t0 = performance.now(), dur = 1400;
    (function tick(now) {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(to * e);
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  }

  /* ---------- portais das áreas ---------- */
  const LANDS = [
    ['clinica', 'Clínica médica', 'Risco cardiovascular, metabólico, renal, hepático e mais.', 'stethoscope'],
    ['cirurgia', 'Cirúrgica', 'Pré-operatório, tromboprofilaxia, abdome agudo e trauma.', 'bandage'],
    ['gineco', 'Gineco & Obstetrícia', 'Pré-natal, parto e saúde da mulher.', 'female'],
    ['geriatria', 'Geriatria', 'Fragilidade, cognição, quedas e funcionalidade.', 'elder'],
    ['paliativos', 'Cuidados paliativos', 'Quem se beneficia, prognóstico e sintomas.', 'care'],
    ['rastreio', 'Rastreio', 'Exames e vacinas indicados por idade, sexo e risco.', 'activity'],
    ['mental', 'Saúde mental', 'Segurança primeiro; PHQ-9, GAD-7, AUDIT e mais.', 'brain'],
    ['leitura', 'Leitura crítica', 'RoB 2, ROBINS-I, AMSTAR 2, NNT e acurácia.', 'clipboard'],
    ['labcore', 'LabCore APS', 'Interpretação de exames, com a fonte de cada corte.', 'gauge'],
    ['educacao', 'Paciente', 'Guias em linguagem simples para ler e imprimir.', 'book'],
    ['favoritos', 'Favoritos', 'Suas calculadoras marcadas com estrela.', 'star'],
  ];
  function buildHome() {
    const calcs = window.CALCS || [];
    const icon = (n) => (window.ICON ? window.ICON(n) : '');
    const count = (tab) => calcs.filter((c) => c.tabs.includes(tab)).length;
    $('#land-grid').innerHTML = LANDS.map(([tab, t, d, ic], i) => {
      const n = count(tab);
      const foot = n ? `${n} calculadora${n > 1 ? 's' : ''}` : 'Explorar';
      return `<a class="land" href="#${tab}" style="--lc:var(--c-${tab});--i:${i}">` +
        `<span class="land-orb">${icon(ic)}</span><span class="land-title">${t}</span>` +
        `<span class="land-desc">${d}</span><span class="land-foot">${foot}${icon('arrow')}</span></a>`;
    }).join('');
    const guides = Array.isArray(window.EDU) ? window.EDU.length : 0;
    const stats = [[calcs.length, 'calculadoras e escores'], [LANDS.length - 1, 'áreas para explorar'], [guides, 'tópicos para o paciente']].filter(([n]) => n > 0);
    $('#show-stats').innerHTML = stats.map(([, l]) => `<div><dt>${l}</dt><dd></dd></div>`).join('');
    const dds = document.querySelectorAll('#show-stats dd');
    stats.forEach(([n], i) => { dds[i].textContent = n; });
    $('#show-castle').innerHTML = castleSVG();
    if (window.hydrateIcons) window.hydrateIcons($('#view-inicio'));
    $('#show-search').addEventListener('click', () => { const s = $('#search'); window.scrollTo({ top: 0, behavior: 'smooth' }); s.focus(); });
    // Conta os números sempre que o show volta à tela
    new IntersectionObserver((e) => {
      if (e[0].isIntersecting) stats.forEach(([n], i) => countUp(dds[i], n));
    }, { threshold: 0.4 }).observe($('#show-stats'));
  }

  /* ---------- brilho que segue o cursor e inclinação dos portais ---------- */
  let pending = null;
  document.addEventListener('pointermove', (e) => {
    if (!magicOn || e.pointerType === 'touch') return;
    pending = e;
    if (pointerFrame.id) return;
    pointerFrame.id = requestAnimationFrame(pointerFrame);
  }, { passive: true });
  function pointerFrame() {
    pointerFrame.id = 0;
    const e = pending; if (!e) return;
    const el = e.target.closest && e.target.closest('.calc-card, .land, .promise-item');
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    el.style.setProperty('--mx', x + 'px'); el.style.setProperty('--my', y + 'px');
    if (el.classList.contains('land')) {
      el.style.setProperty('--rx', ((0.5 - y / r.height) * 7).toFixed(2) + 'deg');
      el.style.setProperty('--ry', ((x / r.width - 0.5) * 9).toFixed(2) + 'deg');
    }
  }
  document.addEventListener('pointerout', (e) => {
    const el = e.target.closest && e.target.closest('.land');
    if (el && !el.contains(e.relatedTarget)) { el.style.removeProperty('--rx'); el.style.removeProperty('--ry'); }
  });

  /* ---------- cartões entram em cascata quando a grade muda ---------- */
  function cascade(grid) {
    [...grid.children].forEach((c, i) => { c.style.setProperty('--i', Math.min(i, 14)); c.classList.add('pop'); });
  }

  function start() {
    buildHome();
    sky.init();
    const grid = $('#grid');
    if (grid) { new MutationObserver(() => cascade(grid)).observe(grid, { childList: true }); cascade(grid); }
    const b = $('#magic-toggle');
    if (b) b.addEventListener('click', () => { magicOn = !magicOn; save(magicOn); applyMagic(); if (magicOn) sky.replay(); });
    // O show recomeça com a grande abertura cada vez que se volta ao Início
    window.addEventListener('hashchange', () => { if (location.hash === '#inicio') setTimeout(sky.replay, 60); else sky.sync(); });
    reduce.addEventListener('change', () => { if (saved() == null) { magicOn = !reduce.matches; applyMagic(); } });
    applyMagic();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
