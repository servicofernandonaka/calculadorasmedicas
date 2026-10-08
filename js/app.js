/* Interface: abas, grade de calculadoras, diálogo, material educativo e roteamento */
(function () {
  'use strict';

  const CALCS = window.CALCS;
  const EDU = window.EDU;
  const GUIDES = window.EDU_GUIDES;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

  const TABS = {
    clinica: { title: 'Clínica médica', sub: 'Risco cardiovascular, metabólico, renal, ósseo, tromboembolismo, infecção e hepatologia.' },
    cirurgia: { title: 'Especialidades cirúrgicas', sub: 'Avaliação pré-operatória, tromboprofilaxia, abdome agudo e trauma.' },
    gineco: { title: 'Ginecologia e obstetrícia', sub: 'Pré-natal, parto, saúde da mulher e osteoporose pós-menopausa.' },
    geriatria: { title: 'Geriatria', sub: 'Avaliação geriátrica ampla: fragilidade, funcionalidade, cognição, humor, delirium, quedas, nutrição e pele.' },
    favoritos: { title: 'Favoritos', sub: 'Suas calculadoras marcadas com estrela, de todas as especialidades.' },
  };
  const SPECIALTY = { clinica: 'Clínica', cirurgia: 'Cirúrgica', gineco: 'Gineco & Obstetrícia', geriatria: 'Geriatria' };

  // Preferências locais (favoritos, tamanho do texto): o site funciona normalmente se o armazenamento falhar
  const store = {
    get(k, fallback) { try { const v = localStorage.getItem(k); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  };
  const EDU_SIZES = [
    { px: 16, label: 'Texto normal' }, { px: 18, label: 'Texto ampliado' }, { px: 20, label: 'Texto grande' },
    { px: 22, label: 'Texto muito grande' }, { px: 24, label: 'Texto máximo' },
  ];

  const state = { tab: 'clinica', category: null, query: '', edu: EDU[0].id, calc: null, touched: false };
  let favs = store.get('favoritos', []);
  if (!Array.isArray(favs)) favs = [];
  favs = favs.filter((id) => CALCS.some((c) => c.id === id));
  let eduSize = store.get('eduFontIndex', 1);
  if (!(eduSize >= 0 && eduSize < EDU_SIZES.length)) eduSize = 1;

  const norm = (s) => (s || '').toString().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const byId = (id) => CALCS.find((c) => c.id === id);
  const ICON = window.ICON;
  const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const eduById = (id) => EDU.find((e) => e.id === id);
  const guideOf = (e) => GUIDES.find((g) => g.id === e.guide) || GUIDES[0];
  const guideTopics = (gid) => EDU.filter((e) => e.guide === gid);
  // Aceita o ID de um tópico ou de um guia inteiro (abre o primeiro tópico do guia)
  const resolveEdu = (id) => (eduById(id) ? id : (guideTopics(id)[0] || {}).id);

  /* ---------- tema ---------- */
  function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem('theme'); } catch (e) { /* armazenamento indisponível */ }
    if (saved) document.documentElement.dataset.theme = saved;
    $('#theme-toggle').addEventListener('click', () => {
      const cur = document.documentElement.dataset.theme ||
        (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      const next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (e) { /* ignora */ }
    });
  }

  /* ---------- abas ---------- */
  function setTab(tab) {
    state.tab = tab;
    $$('.tab[data-tab]').forEach((b) => {
      if (b.dataset.tab === tab) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    const isEdu = tab === 'educacao';
    $('#view-calcs').hidden = isEdu;
    $('#view-edu').hidden = !isEdu;
    if (isEdu) renderEdu();
    else { state.category = null; renderCalcs(); }
  }

  /* ---------- grade de calculadoras ---------- */
  function searchCalcs(q) {
    const terms = norm(q).split(/\s+/).filter(Boolean);
    return CALCS.map((c) => {
      const hay = norm([c.name, c.short, c.category, c.keywords].join(' '));
      let score = 0;
      for (const t of terms) if (hay.includes(t)) score += norm(c.name).includes(t) ? 3 : 1;
      return { c, score };
    }).filter((x) => x.score >= terms.length).sort((a, b) => b.score - a.score).map((x) => x.c);
  }

  function origin(c) {
    const [first, ...rest] = c.tabs.filter((t) => SPECIALTY[t]);
    return `<span class="card-origin"><strong>${esc(SPECIALTY[first])}</strong>` +
      (rest.length ? ` · também em ${esc(rest.map((t) => SPECIALTY[t]).join(', '))}` : '') + '</span>';
  }

  function cardHtml(c, showOrigin) {
    const on = favs.includes(c.id);
    return `
      <div class="card calc-card">
        <span class="pill">${esc(c.category)}</span>
        <button class="card-open" type="button" data-calc="${c.id}" aria-describedby="d-${c.id}">
          <span class="card-title">${esc(c.name)}</span>
        </button>
        <span class="card-desc" id="d-${c.id}">${esc(c.short)}</span>
        ${showOrigin ? origin(c) : ''}
        <button class="icon-btn fav" type="button" data-fav="${c.id}" aria-pressed="${on}"
          aria-label="${on ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}: ${esc(c.name)}">${ICON('star')}</button>
      </div>`;
  }

  function renderCalcs() {
    const q = state.query.trim();
    const isFav = !q && state.tab === 'favoritos';
    let list;
    if (q) {
      list = searchCalcs(q);
      $('#calc-title').textContent = 'Resultados da busca';
      $('#calc-subtitle').textContent = `${list.length} calculadora(s) para “${q}” em todas as especialidades.`;
      $('#chips').innerHTML = '';
    } else if (isFav) {
      list = favs.map(byId);
      $('#calc-title').textContent = TABS.favoritos.title;
      $('#calc-subtitle').textContent = TABS.favoritos.sub;
      $('#chips').innerHTML = '';
    } else {
      const t = TABS[state.tab];
      // Primeiro as calculadoras próprias da especialidade, depois as compartilhadas com outras abas
      list = CALCS.filter((c) => c.tabs[0] === state.tab).concat(CALCS.filter((c) => c.tabs[0] !== state.tab && c.tabs.includes(state.tab)));
      $('#calc-title').textContent = t.title;
      $('#calc-subtitle').textContent = t.sub;
      const cats = [...new Set(list.map((c) => c.category))];
      $('#chips').innerHTML = ['Todas', ...cats].map((c) => {
        const active = (c === 'Todas' && !state.category) || c === state.category;
        return `<button class="chip" type="button" data-cat="${esc(c)}" aria-pressed="${active}">${esc(c)}</button>`;
      }).join('');
      if (state.category) list = list.filter((c) => c.category === state.category);
    }
    $('#grid').innerHTML = list.map((c) => cardHtml(c, !!q || isFav)).join('');
    $('#empty').hidden = list.length > 0 || isFav;
    $('#fav-empty').hidden = !(isFav && !list.length);
  }

  /* ---------- favoritos ---------- */
  function syncFavUi() {
    const n = favs.length;
    const badge = $('#fav-count');
    badge.textContent = n;
    badge.hidden = !n;
    const tab = $('.tab[data-tab=favoritos]');
    tab.setAttribute('aria-label', n ? `Favoritos (${n})` : 'Favoritos');
    $$('[data-fav]').forEach((b) => {
      const c = byId(b.dataset.fav), on = favs.includes(c.id);
      b.setAttribute('aria-pressed', on);
      b.setAttribute('aria-label', `${on ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}: ${c.name}`);
    });
    const d = $('#dlg-fav');
    if (state.calc) {
      const on = favs.includes(state.calc.id);
      d.setAttribute('aria-pressed', on);
      d.setAttribute('aria-label', on ? 'Remover dos favoritos' : 'Adicionar aos favoritos');
    }
  }

  function toggleFav(id) {
    favs = favs.includes(id) ? favs.filter((x) => x !== id) : favs.concat(id);
    store.set('favoritos', favs);
    // Na própria aba de favoritos, a lista muda; o foco vai para o próximo cartão (ou para o título)
    if (state.tab === 'favoritos' && !state.query.trim() && !$('#calc-dialog').open) {
      const idx = $$('#grid [data-fav]').findIndex((b) => b.dataset.fav === id);
      renderCalcs();
      const next = $$('#grid .card-open')[Math.max(0, idx - (favs.includes(id) ? 0 : 1))] || $('#calc-title');
      if (next === $('#calc-title')) next.setAttribute('tabindex', '-1');
      next.focus();
    }
    syncFavUi();
  }

  /* ---------- diálogo da calculadora ---------- */
  function fieldHtml(calc, f, hidePts) {
    const id = `f-${f.id}`;
    if (f.type === 'check') {
      const pts = calc.hidePoints || hidePts ? '' : `<span class="pts">${f.points > 0 ? '+' : ''}${String(f.points).replace('.', ',')}</span>`;
      return `<label class="check"><input type="checkbox" id="${id}" name="${f.id}"><span>${esc(f.label)}</span>${pts}</label>`;
    }
    const unit = f.unit ? ` <span class="unit">(${esc(f.unit)})</span>` : '';
    const aria = `aria-describedby="${id}-hint"${f.optional ? '' : ' aria-required="true"'}`;
    let input;
    if (f.type === 'select') {
      input = `<select id="${id}" name="${f.id}" ${aria}><option value="">Selecione…</option>` +
        f.options.map((o) => `<option value="${o.v}">${esc(o.t)}</option>`).join('') + '</select>';
    } else if (f.type === 'date') {
      input = `<input type="date" id="${id}" name="${f.id}" ${aria}>`;
    } else {
      input = `<input type="text" inputmode="decimal" id="${id}" name="${f.id}" autocomplete="off" ${aria}
        placeholder="${f.min != null ? `${f.min}–${f.max}` : ''}">`;
    }
    return `<label class="field" for="${id}"><span>${esc(f.label)}${unit}</span>${input}<span class="hint" id="${id}-hint"></span></label>`;
  }

  const ptsLegend = (p) => {
    const n = String(Math.abs(p)).replace('.', ',');
    const word = Math.abs(p) < 2 ? 'ponto' : 'pontos';
    return p < 0 ? `Subtrai ${n} ${word}` : `${n} ${word} cada`;
  };

  // Checkboxes em <fieldset>: grupos definidos na calculadora, senão por peso (listas longas com pesos diferentes)
  function checksHtml(calc) {
    const checks = calc.fields.filter((f) => f.type === 'check');
    if (!checks.length) return '';
    let groups;
    if (calc.groups) {
      groups = calc.groups.map((g) => ({ legend: g.legend, byPoints: g.hidePts, fields: g.ids.map((id) => checks.find((f) => f.id === id)).filter(Boolean) }));
      const rest = checks.filter((f) => !calc.groups.some((g) => g.ids.includes(f.id)));
      if (rest.length) groups.push({ legend: 'Outros itens', fields: rest });
    } else {
      const weights = [...new Set(checks.map((f) => f.points))];
      groups = checks.length >= 5 && weights.length > 1 && !calc.hidePoints
        ? weights.map((w) => ({ legend: ptsLegend(w), fields: checks.filter((f) => f.points === w), byPoints: true }))
        : [{ legend: calc.checkLegend || 'Marque os itens presentes', fields: checks }];
    }
    return groups.map((g) => `<fieldset class="checks"><legend>${esc(g.legend)}</legend>` +
      g.fields.map((f) => fieldHtml(calc, f, g.byPoints)).join('') + '</fieldset>').join('');
  }

  // Valida um campo e devolve { value, error } — error: '' | 'missing' | mensagem de faixa/formato
  function checkField(f, el) {
    if (f.type === 'check') return { value: el.checked, error: '' };
    const raw = el.value.trim();
    if (!raw) return { value: null, error: f.optional ? '' : 'missing' };
    if (f.type === 'select' || f.type === 'date') return { value: raw, error: '' };
    const n = Number(raw.replace(',', '.'));
    if (!Number.isFinite(n)) return { value: null, error: 'Número inválido' };
    if ((f.min != null && n < f.min) || (f.max != null && n > f.max)) {
      return { value: n, error: `Valor válido: ${f.min} a ${f.max}${f.unit ? ' ' + f.unit : ''}` };
    }
    return { value: n, error: '' };
  }

  function setFieldError(el, msg) {
    const wrap = el.closest('.field');
    if (!wrap) return;
    $('.hint', wrap).textContent = msg;
    wrap.classList.toggle('invalid', !!msg);
    if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
    el.setAttribute('aria-describedby', el.id + '-hint');
  }

  // Mensagem visível para um campo: obrigatório só aparece se o usuário já mexeu nele (ou forçou)
  function visibleError(f, el, err, force) {
    if (!err) return '';
    if (err === 'missing') return force || el.dataset.dirty ? (f.type === 'select' ? 'Selecione uma opção' : 'Campo obrigatório') : '';
    return err;
  }

  function readValues(calc) {
    const form = $('#calc-form');
    const v = {}, missing = [], invalid = [];
    for (const f of calc.fields) {
      const { value, error } = checkField(f, form.elements[f.id]);
      v[f.id] = value;
      if (error === 'missing') missing.push(f.label);
      else if (error) invalid.push(f.label);
    }
    return { v, missing, invalid };
  }

  function summary(calc, v, r) {
    const lines = [calc.name];
    for (const f of calc.fields) {
      let val = v[f.id];
      if (f.type === 'check') { if (!val) continue; val = 'sim'; }
      else if (f.type === 'select') val = (f.options.find((o) => o.v === val) || {}).t;
      if (val == null || val === '') continue;
      lines.push(`- ${f.label}: ${val}${f.unit && f.type === 'number' ? ' ' + f.unit : ''}`);
    }
    lines.push(`Resultado: ${r.main} — ${r.sub}`);
    if (r.note) lines.push(`Importante: ${r.note}`);
    if (r.warn) lines.push(`Atenção: ${r.warn}`);
    return lines.join('\n');
  }

  function hideResult() {
    const box = $('#calc-result');
    box.hidden = true;
    box.innerHTML = '';
    delete box.dataset.summary;
  }

  function setPending(msg) {
    const p = $('#calc-pending');
    p.innerHTML = msg ? ICON('clock') + `<span>${esc(msg)}</span>` : '';
    p.hidden = !msg;
  }

  function syncFoot() {
    const empty = $('#calc-result').hidden && $('#calc-pending').hidden;
    $('#calc-status').classList.toggle('is-empty', empty);
  }

  // Atualiza o rodapé: nada antes da 1ª interação; nunca deixa resultado antigo quando os dados ficam incompletos/inválidos
  function update() {
    const calc = state.calc;
    if (!calc) return;
    if (!state.touched) { hideResult(); setPending(''); syncFoot(); return; }
    const { v, missing, invalid } = readValues(calc);
    if (missing.length || invalid.length) {
      hideResult();
      const parts = [];
      if (invalid.length) parts.push('Corrija: ' + invalid.join(', '));
      if (missing.length) parts.push('Falta preencher: ' + missing.join(', '));
      setPending(parts.join(' • '));
      syncFoot();
      return;
    }
    let r;
    try { r = calc.compute(v); } catch (e) { console.error(e); r = null; }
    if (!r || r.main == null) { hideResult(); setPending('Não foi possível calcular com estes dados.'); syncFoot(); return; }
    setPending('');
    const box = $('#calc-result');
    const text = summary(calc, v, r);
    // Evita recriar os botões quando nada mudou (o "change" do blur engoliria o clique)
    if (!box.hidden && box.dataset.summary === text) { syncFoot(); return; }
    const detailsOpen = !!$('#calc-result details[open]');
    box.className = 'result ' + (r.level || 'info');
    if (r.grade) box.dataset.grade = r.grade; else delete box.dataset.grade;
    box.innerHTML = `
      <div class="res-head">
        <div class="main">${esc(r.main)}</div>
        <div class="sub">${esc(r.sub)}</div>
      </div>
      ${r.scale ? scaleHtml(r.scale) : ''}
      ${r.note ? `<div class="note-box"><strong>Importante</strong><span>${esc(r.note)}</span></div>` : ''}
      ${r.warn ? `<div class="warn"><strong>${ICON('alert')}Atenção — muda a conduta</strong><span>${esc(r.warn)}</span></div>` : ''}
      ${r.details ? `<details${detailsOpen ? ' open' : ''}><summary>Interpretação</summary><p class="det">${esc(r.details)}</p></details>` : ''}
      <div class="actions">
        ${r.link && r.link.primary ? linkBtn(r.link) : ''}
        <button class="btn btn-ghost" type="button" data-copy>${ICON('copy')}<span>Copiar</span></button>
        <button class="btn${r.link && r.link.primary ? ' btn-ghost' : ''}" type="button" data-ask>${ICON('sparkles')}Discutir com a IA</button>
        ${r.link && !r.link.primary ? linkBtn(r.link) : ''}
        ${r.edu ? `<button class="btn btn-ghost" type="button" data-edu="${esc(r.edu)}">${ICON('book')}Material para o paciente</button>` : ''}
      </div>`;
    box.hidden = false;
    box.dataset.summary = text;
    syncFoot();
  }

  const linkBtn = (l) => `<a class="btn${l.primary ? '' : ' btn-ghost'}" href="${esc(l.href)}" target="_blank" rel="noopener">` +
    `${esc(l.text)}${ICON('external')}<span class="sr-only"> (abre em nova aba)</span></a>`;

  // Régua de categorias: a posição atual tem marcador e rótulo em negrito (não depende só de cor)
  function scaleHtml(sc) {
    const fill = sc.fill !== false;
    const items = sc.labels.map((l, i) => {
      const pos = i + 1, cur = pos === sc.step, on = fill ? pos <= sc.step : cur;
      return `<li class="seg${on ? ' on' : ''}${cur ? ' cur' : ''}"${cur ? ' aria-current="step"' : ''}>` +
        `<span class="bar"></span><span class="lbl">${esc(l)}</span></li>`;
    }).join('');
    const name = (sc.names || sc.labels)[sc.step - 1];
    return `<div class="scale-wrap"><ol class="scale" data-n="${sc.labels.length}" aria-label="Escala: ${esc(name)}, ${sc.step} de ${sc.labels.length}">${items}</ol></div>`;
  }

  function fieldOf(el) {
    if (!el.isConnected || !state.calc) return null;
    return state.calc.fields.find((f) => f.id === el.name);
  }

  function openCalc(id) {
    const calc = byId(id);
    if (!calc) return;
    state.calc = null; // eventos do formulário anterior (blur/change ao removê-lo) são ignorados
    state.touched = false;
    $('#dlg-cat').textContent = calc.category;
    $('#dlg-title').textContent = calc.name;
    $('#dlg-short').textContent = calc.short;
    $('#dlg-ref').textContent = 'Referência: ' + calc.ref;
    const others = calc.fields.filter((f) => f.type !== 'check');
    $('#calc-form').innerHTML =
      others.map((f) => fieldHtml(calc, f)).join('') +
      checksHtml(calc) +
      '<div class="form-actions"><button class="btn btn-ghost" type="reset">Limpar</button></div>';
    state.calc = calc;
    syncFavUi();
    update();
    const dlg = $('#calc-dialog');
    if (!dlg.open) dlg.showModal();
    $('.dlg-body', dlg).scrollTop = 0;
    if (location.hash !== '#calc/' + id) history.replaceState(null, '', '#calc/' + id);
    const first = $('#calc-form input, #calc-form select');
    if (first) first.focus();
  }

  function closeCalc() {
    const dlg = $('#calc-dialog');
    if (dlg.open) dlg.close();
  }

  /* ---------- material educativo ---------- */
  function renderEdu() {
    const e = eduById(state.edu) || EDU[0];
    const g = guideOf(e);
    const topics = guideTopics(g.id);
    $('#edu-heading').textContent = g.title + ' — guia para o paciente';
    $('#edu-guides').innerHTML = GUIDES.map((x) =>
      `<button class="chip" type="button" data-edu="${x.id}" aria-pressed="${x.id === g.id}">${esc(x.title)}</button>`).join('');
    $('#edu-nav').innerHTML = topics.map((t) =>
      `<button type="button" data-edu="${t.id}" aria-current="${t.id === e.id}">${ICON(t.icon)}${esc(t.title)}</button>`).join('');
    const next = topics[topics.indexOf(e) + 1];
    $('#edu-content').innerHTML = `
      ${printHead()}
      <h2 class="edu-title">${ICON(e.icon)}${esc(e.title)}</h2>
      ${e.html}
      ${e.sources ? `<p class="sources">Fontes: ${esc(e.sources)}</p>` : ''}
      ${printFoot()}
      <div class="edu-footer">
        ${next ? `<button class="btn" type="button" data-edu="${next.id}">Próximo: ${esc(next.title)}${ICON('arrow')}</button>` : ''}
        <button class="btn btn-ghost" type="button" data-print-one>${ICON('printer')}Imprimir este tópico</button>
        <button class="btn btn-ghost" type="button" data-ask-edu>${ICON('sparkles')}Tirar dúvidas com a IA</button>
      </div>`;
    $('#edu-content').classList.remove('print-all');
  }

  function openEdu(id) {
    const topic = resolveEdu(id);
    if (topic) state.edu = topic;
    closeCalc();
    if (state.tab !== 'educacao') setTab('educacao'); else renderEdu();
    history.replaceState(null, '', '#educacao/' + state.edu);
    $('#edu-content').scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
  }

  const printHead = () => `<header class="print-only print-head">
      <strong>${esc(guideOf(eduById(state.edu) || EDU[0]).title)} — guia para o paciente</strong>
      <span>MedCalc · material educativo · ${new Date().toLocaleDateString('pt-BR')}</span>
    </header>`;
  const printFoot = () => `<footer class="print-only print-foot">
      Este material não substitui a orientação da sua equipe de saúde. Em caso de emergência, ligue 192 (SAMU).
    </footer>`;

  // Guia completo do tema atual (não todos os temas)
  function renderPrintAll() {
    const box = $('#edu-content');
    const g = guideOf(eduById(state.edu) || EDU[0]);
    box.innerHTML = printHead() +
      guideTopics(g.id).map((e) => `<section class="print-section"><h2 class="edu-title">${ICON(e.icon)}${esc(e.title)}</h2>${e.html}` +
      `${e.sources ? `<p class="sources">Fontes: ${esc(e.sources)}</p>` : ''}</section>`).join('') +
      printFoot();
    box.classList.add('print-all');
  }

  // Guia completo: monta todos os tópicos, imprime e volta ao tópico atual depois da impressão
  function printAllEdu() {
    renderPrintAll();
    window.addEventListener('afterprint', () => renderEdu(), { once: true });
    window.print();
  }

  function applyEduSize() {
    const sz = EDU_SIZES[eduSize];
    $('#edu-content').style.setProperty('--edu-fs', sz.px / 16 + 'rem');
    $('#font-label').textContent = sz.label;
    $('#font-dec').disabled = eduSize === 0;
    $('#font-inc').disabled = eduSize === EDU_SIZES.length - 1;
  }

  function changeEduSize(delta) {
    const next = Math.min(EDU_SIZES.length - 1, Math.max(0, eduSize + delta));
    if (next === eduSize) return;
    eduSize = next;
    store.set('eduFontIndex', eduSize);
    applyEduSize();
  }

  /* ---------- roteamento ---------- */
  function route() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (h.startsWith('calc/')) {
      const calc = byId(h.slice(5));
      if (calc) {
        if (!calc.tabs.includes(state.tab)) setTab(calc.tabs[0]);
        openCalc(calc.id);
      }
      return;
    }
    if (h.startsWith('educacao')) {
      const id = resolveEdu(h.split('/')[1]);
      if (id) state.edu = id;
      closeCalc();
      setTab('educacao');
      return;
    }
    if (TABS[h]) setTab(h);
  }

  /* ---------- eventos ---------- */
  function bind() {
    // Links normais (#clinica…): o hashchange faz a troca; no mesmo endereço, só reaplica a aba
    $$('.tab[data-tab]').forEach((b) => b.addEventListener('click', (e) => {
      state.query = ''; $('#search').value = '';
      if (location.hash === '#' + b.dataset.tab) { e.preventDefault(); setTab(b.dataset.tab); }
    }));

    $('#chips').addEventListener('click', (e) => {
      const b = e.target.closest('[data-cat]');
      if (!b) return;
      state.category = b.dataset.cat === 'Todas' ? null : b.dataset.cat;
      renderCalcs();
    });

    $('#search').addEventListener('input', (e) => {
      state.query = e.target.value;
      if (state.tab === 'educacao' && state.query) setTab('clinica');
      renderCalcs();
    });

    document.addEventListener('click', (e) => {
      const fv = e.target.closest('[data-fav]');
      if (fv) { toggleFav(fv.dataset.fav); return; }
      if (e.target.closest('#dlg-fav')) { if (state.calc) toggleFav(state.calc.id); return; }
      const c = e.target.closest('[data-calc]');
      if (c) { openCalc(c.dataset.calc); return; }
      const ed = e.target.closest('[data-edu]');
      if (ed) { openEdu(ed.dataset.edu); return; }
      if (e.target.closest('[data-print-one]')) { window.print(); return; }
      if (e.target.closest('[data-ask-edu]')) {
        const t = eduById(state.edu);
        window.AI && window.AI.open(`Tenho dúvidas sobre “${t.title}” (${guideOf(t).title.toLowerCase()}). `, false);
      }
    });

    const form = $('#calc-form');
    // Enter num campo: mostra todos os erros pendentes
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      state.touched = true;
      for (const f of state.calc.fields) {
        const el = form.elements[f.id];
        setFieldError(el, visibleError(f, el, checkField(f, el).error, true));
      }
      update();
    });
    const onEdit = (e) => {
      const f = fieldOf(e.target);
      if (!f) return;
      state.touched = true;
      e.target.dataset.dirty = '1';
      // Durante a digitação só limpa erros; erros novos aparecem no blur
      if (!checkField(f, e.target).error) setFieldError(e.target, '');
      if (f.type === 'select') setFieldError(e.target, visibleError(f, e.target, checkField(f, e.target).error));
      update();
    };
    form.addEventListener('input', onEdit);
    form.addEventListener('change', onEdit);
    form.addEventListener('focusout', (e) => {
      const f = fieldOf(e.target);
      if (!f || f.type === 'check') return;
      setFieldError(e.target, visibleError(f, e.target, checkField(f, e.target).error));
    });
    form.addEventListener('reset', () => setTimeout(() => {
      state.touched = false;
      for (const el of form.elements) { delete el.dataset.dirty; if (el.name) setFieldError(el, ''); }
      update();
    }));

    const dlg = $('#calc-dialog');
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg || e.target.closest('[data-close]')) closeCalc();
    });
    dlg.addEventListener('close', () => {
      if (dlg.open) return; // o diálogo já foi reaberto com outra calculadora
      state.calc = null;
      if (state.tab === 'favoritos' && !state.query.trim()) renderCalcs();
      if (location.hash.startsWith('#calc/')) history.replaceState(null, '', '#' + state.tab);
    });

    $('#calc-result').addEventListener('click', async (e) => {
      const text = $('#calc-result').dataset.summary;
      if (e.target.closest('[data-copy]')) {
        const label = $('[data-copy] span', $('#calc-result'));
        try { await navigator.clipboard.writeText(text); label.textContent = 'Copiado'; }
        catch (err) { label.textContent = 'Não foi possível copiar'; }
      }
      if (e.target.closest('[data-ask]')) {
        closeCalc();
        window.AI && window.AI.open('Ajude-me a interpretar este resultado e indicar próximos passos:\n' + text, true);
      }
    });

    $('#print-edu').addEventListener('click', printAllEdu);
    $('#font-dec').addEventListener('click', () => changeEduSize(-1));
    $('#font-inc').addEventListener('click', () => changeEduSize(1));
    window.addEventListener('hashchange', route);
  }

  window.App = { openCalc, openEdu, searchCalcs, byId, eduById, esc, norm, renderPrintAll };

  initTheme();
  bind();
  applyEduSize();
  syncFavUi();
  if (location.hash) route(); else setTab('clinica');
})();
