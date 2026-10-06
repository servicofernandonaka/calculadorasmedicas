/* Interface: abas, grade de calculadoras, diálogo, material educativo e roteamento */
(function () {
  'use strict';

  const CALCS = window.CALCS;
  const EDU = window.EDU;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

  const TABS = {
    clinica: { title: 'Clínica médica', sub: 'Risco cardiovascular, metabólico, renal, ósseo, tromboembolismo, infecção e hepatologia.' },
    cirurgia: { title: 'Especialidades cirúrgicas', sub: 'Avaliação pré-operatória, tromboprofilaxia, abdome agudo e trauma.' },
    gineco: { title: 'Ginecologia e obstetrícia', sub: 'Pré-natal, parto, saúde da mulher e osteoporose pós-menopausa.' },
  };

  const state = { tab: 'clinica', category: null, query: '', edu: EDU[0].id, calc: null, touched: false };

  const norm = (s) => (s || '').toString().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const byId = (id) => CALCS.find((c) => c.id === id);
  const eduById = (id) => EDU.find((e) => e.id === id);

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
    $$('.tab[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
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

  function renderCalcs() {
    const q = state.query.trim();
    let list;
    if (q) {
      list = searchCalcs(q);
      $('#calc-title').textContent = 'Resultados da busca';
      $('#calc-subtitle').textContent = `${list.length} calculadora(s) para “${q}” em todas as especialidades.`;
      $('#chips').innerHTML = '';
    } else {
      const t = TABS[state.tab];
      list = CALCS.filter((c) => c.tabs.includes(state.tab));
      $('#calc-title').textContent = t.title;
      $('#calc-subtitle').textContent = t.sub;
      const cats = [...new Set(list.map((c) => c.category))];
      $('#chips').innerHTML = ['Todas', ...cats].map((c) => {
        const active = (c === 'Todas' && !state.category) || c === state.category;
        return `<button class="chip" type="button" data-cat="${esc(c)}" aria-pressed="${active}">${esc(c)}</button>`;
      }).join('');
      if (state.category) list = list.filter((c) => c.category === state.category);
    }
    $('#grid').innerHTML = list.map((c) => `
      <button class="card calc-card" type="button" data-calc="${c.id}">
        <span class="pill">${esc(c.category)}</span>
        <h3>${esc(c.name)}</h3>
        <p>${esc(c.short)}</p>
      </button>`).join('');
    $('#empty').hidden = list.length > 0;
  }

  /* ---------- diálogo da calculadora ---------- */
  function fieldHtml(calc, f) {
    const id = `f-${f.id}`;
    if (f.type === 'check') {
      const pts = calc.hidePoints ? '' : `<span class="pts">${f.points > 0 ? '+' : ''}${String(f.points).replace('.', ',')}</span>`;
      return `<label class="check"><input type="checkbox" id="${id}" name="${f.id}"><span>${esc(f.label)}</span>${pts}</label>`;
    }
    const unit = f.unit ? ` <span class="unit">(${esc(f.unit)})</span>` : '';
    let input;
    if (f.type === 'select') {
      input = `<select id="${id}" name="${f.id}"><option value="">Selecione…</option>` +
        f.options.map((o) => `<option value="${o.v}">${esc(o.t)}</option>`).join('') + '</select>';
    } else if (f.type === 'date') {
      input = `<input type="date" id="${id}" name="${f.id}">`;
    } else {
      input = `<input type="text" inputmode="decimal" id="${id}" name="${f.id}" autocomplete="off"
        placeholder="${f.min != null ? `${f.min}–${f.max}` : ''}">`;
    }
    return `<label class="field" for="${id}"><span>${esc(f.label)}${unit}</span>${input}<span class="hint" id="${id}-hint"></span></label>`;
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
    p.textContent = msg || '';
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
    box.innerHTML = `
      <div class="res-head">
        <div class="main">${esc(r.main)}</div>
        <div class="sub">${esc(r.sub)}</div>
      </div>
      ${r.warn ? `<div class="warn"><strong>⚠️ Atenção — muda a conduta</strong><span>${esc(r.warn)}</span></div>` : ''}
      ${r.details ? `<details${detailsOpen ? ' open' : ''}><summary>Interpretação</summary><p class="det">${esc(r.details)}</p></details>` : ''}
      <div class="actions">
        <button class="btn btn-ghost" type="button" data-copy>📋 Copiar</button>
        <button class="btn" type="button" data-ask>✨ Discutir com a IA</button>
        ${r.link ? `<a class="btn btn-ghost" href="${esc(r.link.href)}" target="_blank" rel="noopener">${esc(r.link.text)} ↗</a>` : ''}
        ${r.edu ? `<button class="btn btn-ghost" type="button" data-edu="${esc(r.edu)}">📘 Material para o paciente</button>` : ''}
      </div>`;
    box.hidden = false;
    box.dataset.summary = text;
    syncFoot();
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
    const checks = calc.fields.filter((f) => f.type === 'check');
    const others = calc.fields.filter((f) => f.type !== 'check');
    $('#calc-form').innerHTML =
      others.map((f) => fieldHtml(calc, f)).join('') +
      checks.map((f) => fieldHtml(calc, f)).join('') +
      '<div class="form-actions"><button class="btn btn-ghost" type="reset">Limpar</button></div>';
    state.calc = calc;
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
    $('#edu-nav').innerHTML = EDU.map((e) =>
      `<button type="button" data-edu="${e.id}" aria-current="${e.id === state.edu}"><span aria-hidden="true">${e.icon}</span>${esc(e.title)}</button>`).join('');
    const e = eduById(state.edu) || EDU[0];
    const idx = EDU.indexOf(e);
    const next = EDU[idx + 1];
    $('#edu-content').innerHTML = `
      <h2>${e.icon} ${esc(e.title)}</h2>
      ${e.html}
      <div class="edu-footer">
        ${next ? `<button class="btn" type="button" data-edu="${next.id}">Próximo: ${esc(next.title)} →</button>` : ''}
        <button class="btn btn-ghost" type="button" data-print-one>🖨️ Imprimir este tópico</button>
        <button class="btn btn-ghost" type="button" data-ask-edu>✨ Tirar dúvidas com a IA</button>
      </div>`;
    $('#edu-content').classList.remove('print-all');
  }

  function openEdu(id) {
    if (eduById(id)) state.edu = id;
    closeCalc();
    if (state.tab !== 'educacao') setTab('educacao'); else renderEdu();
    history.replaceState(null, '', '#educacao/' + state.edu);
    $('#edu-content').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function printAllEdu() {
    const box = $('#edu-content');
    box.innerHTML = '<h1>Hipertensão arterial — guia para o paciente</h1>' +
      EDU.map((e) => `<section><h2>${e.icon} ${esc(e.title)}</h2>${e.html}</section>`).join('');
    box.classList.add('print-all');
    window.print();
    renderEdu();
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
      const id = h.split('/')[1];
      if (id && eduById(id)) state.edu = id;
      setTab('educacao');
      return;
    }
    if (TABS[h]) setTab(h);
  }

  /* ---------- eventos ---------- */
  function bind() {
    $$('.tab[data-tab]').forEach((b) => b.addEventListener('click', () => {
      state.query = ''; $('#search').value = '';
      if (location.hash === '#' + b.dataset.tab) setTab(b.dataset.tab);
      else location.hash = b.dataset.tab;
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
      const c = e.target.closest('[data-calc]');
      if (c) { openCalc(c.dataset.calc); return; }
      const ed = e.target.closest('[data-edu]');
      if (ed) { openEdu(ed.dataset.edu); return; }
      if (e.target.closest('[data-print-one]')) { window.print(); return; }
      if (e.target.closest('[data-ask-edu]')) {
        const t = eduById(state.edu);
        window.AI && window.AI.open(`Tenho dúvidas sobre “${t.title}” (hipertensão). `, false);
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
      if (location.hash.startsWith('#calc/')) history.replaceState(null, '', '#' + state.tab);
    });

    $('#calc-result').addEventListener('click', async (e) => {
      const text = $('#calc-result').dataset.summary;
      if (e.target.closest('[data-copy]')) {
        try { await navigator.clipboard.writeText(text); e.target.textContent = '✔ Copiado'; }
        catch (err) { e.target.textContent = 'Não foi possível copiar'; }
      }
      if (e.target.closest('[data-ask]')) {
        closeCalc();
        window.AI && window.AI.open('Ajude-me a interpretar este resultado e indicar próximos passos:\n' + text, true);
      }
    });

    $('#print-edu').addEventListener('click', printAllEdu);
    window.addEventListener('hashchange', route);
  }

  window.App = { openCalc, openEdu, searchCalcs, byId, eduById, esc, norm };

  initTheme();
  bind();
  if (location.hash) route(); else setTab('clinica');
})();
