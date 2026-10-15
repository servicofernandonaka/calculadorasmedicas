/* LabCore APS — interface (Bancada Rápida, Colar do Prontuário, Governança). O motor está em labcore-engine.js; aqui só há DOM.
   Dados do paciente nunca são gravados: só o Registry ajustado, as auditorias, o changelog e (opcional) a chave Gemini vão para o localStorage. */
(function () {
  'use strict';
  const L = window.LabCore, FX = window.LabCoreFluxos, EN = window.LabCoreEnciclopedia, HM = window.LabCoreHemato, PL = window.LabCorePlugins;
  const root = document.getElementById('lab-root');
  if (!L || !FX || !EN || !HM || !PL || !root) return;

  const store = {
    get(k, d) { try { const s = localStorage.getItem(k); return s == null ? d : JSON.parse(s); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } },
    raw(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } },
    setRaw(k, v) { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch (e) { /* ignora */ } },
  };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

  const S = {
    sub: 'bancada',
    raw: { flags: {} },
    custom: store.get('labcore_custom', {}),
    audits: store.get('labcore_audits', {}),
    log: store.get('labcore_log', []),
    pending: null,       // { rows, origem, grounding }
    seal: null,          // guideline cuja ficha está aberta
    parsed: null,
    fx: null,            // { flow, node, ctx, hist:[{node,ctx}], error, raw }
    enc: { q: '', cat: '' },
    regulacao: store.get('labcore_regulacao', {}),
    exams: [],           // exames cadastrados pela tela (localStorage 'labcore_exams')
    codeWarn: [],        // problemas em CUSTOM_EXAMS_PLUGINS / CUSTOM_FLOWS_PLUGINS
    tool: null,          // simulador aberto em Fluxogramas: 'eps' | 'hplc'
    toolRaw: {},
    dlgEdit: null,
    dlgMsg: '',
    msg: '',
  };

  /* ---------- exames personalizados (plug-and-play) ---------- */
  const RESERVADOS = L.FIELDS.map((f) => f.id).concat(['idade', 'sexo', 'flags', 'gestante', 'dm', 'icc', 'persistente', 'picoM']);
  const codeExams = [];
  (function carregarPlugins() {
    const ids = RESERVADOS.slice();
    const aceitar = (raw, origem, destino) => {
      const r = PL.validar(raw, ids, ids);
      if (r.ok) { destino.push(r.plugin); ids.push(r.plugin.id); } else S.codeWarn.push(`${origem} "${(raw && raw.nome) || '?'}": ${r.erros.join(' ')}`);
    };
    PL.CUSTOM_EXAMS_PLUGINS.forEach((x) => aceitar(x, 'CUSTOM_EXAMS_PLUGINS', codeExams));
    (store.get('labcore_exams', []) || []).forEach((x) => aceitar(x, 'Exame salvo', S.exams));
    PL.CUSTOM_FLOWS_PLUGINS.forEach((f) => { const r = FX.registrar(f); if (!r.ok) S.codeWarn.push(`CUSTOM_FLOWS_PLUGINS "${(f && f.id) || '?'}": ${r.erros.join('; ')}`); });
  })();
  const plugins = () => codeExams.concat(S.exams);
  const idsUsados = (exceto) => RESERVADOS.concat(plugins().map((p) => p.id)).filter((x) => x !== exceto);
  const persistExams = () => store.set('labcore_exams', S.exams);
  const customLabel = (id) => { const p = plugins().find((x) => x.id === id); return p ? { label: p.nome, unit: p.unidade } : null; };
  const reg = () => L.effective(S.custom, S.audits);
  const persist = () => { store.set('labcore_custom', S.custom); store.set('labcore_audits', S.audits); store.set('labcore_log', S.log); };

  const STATUS = { diretriz: ['ok', 'diretriz'], secundaria: ['sec', 'fonte secundária'], a_verificar: ['a_verificar', 'a verificar'], lab_local: ['lab_local', 'ref. do laboratório'] };
  const statusTag = (st) => { const x = STATUS[st] || STATUS.a_verificar; return `<span class="lab-tag ${x[0]}">${x[1]}</span>`; };

  async function copiar(texto) {
    try { await navigator.clipboard.writeText(texto); return true; } catch (e) { /* tenta o plano B */ }
    try {
      const t = document.createElement('textarea'); t.value = texto; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select();
      const ok = document.execCommand('copy'); t.remove(); return ok;
    } catch (e) { return false; }
  }

  /* ================= estrutura ================= */
  function render() {
    const r = reg(), cs = L.cycleStatus(r, today());
    const banner = cs.overdue ? `<div class="lab-banner" role="alert">Ciclo Mensal de Revisão de Guidelines Vencido — Recomenda-se rodar a rotina de sincronização <span class="lab-small">(última auditoria há ${cs.maxDays} dias; limite ${cs.ttlDays}).</span> <button type="button" class="lab-seal" data-act="goto-gov">Abrir Governança</button></div>` : '';
    const tabs = [['bancada', 'Bancada Rápida'], ['fluxos', 'Fluxogramas'], ['enc', 'Enciclopédia'], ['colar', 'Colar do Prontuário'], ['gov', 'Governança']];
    root.innerHTML = `${banner}
      <p class="lab-notice"><strong>Apoio à decisão para profissionais de saúde.</strong> Não substitui o julgamento clínico nem o laudo do laboratório. Nada do que você digita sobre o paciente sai do navegador nem é salvo; só os ajustes do Registry, os exames que você cadastrar e os protocolos de regulação ficam neste aparelho.</p>
      <div class="lab-row"><button type="button" class="btn btn-ghost" data-act="exam-new">+ Adicionar Novo Exame / Índice</button></div>
      ${S.codeWarn.length ? `<div class="warn"><strong>Adendos de código recusados</strong><span>${S.codeWarn.map(esc).join(' · ')}</span></div>` : ''}
      <div class="lab-tabs" role="tablist">${tabs.map(([id, n]) => `<button type="button" role="tab" class="chip" data-act="sub" data-sub="${id}" aria-pressed="${S.sub === id}" aria-selected="${S.sub === id}">${n}</button>`).join('')}</div>
      <div id="lab-body"></div><dialog id="lab-dlg" aria-labelledby="lab-dlg-t"></dialog>`;
    ({ bancada: renderBancada, fluxos: renderFluxos, enc: renderEnc, colar: renderColar, gov: renderGov })[S.sub]();
  }

  /* ================= Módulo 1: Bancada Rápida ================= */
  const GRUPOS = { hemato: 'Hemograma e ferro', renal: 'Rim', eletro: 'Eletrólitos', metab: 'Glicemia', hepat: 'Fígado e hemólise', lipid: 'Lipídios', tireo: 'Tireoide', prot: 'Proteínas', coag: 'Coagulograma' };
  const CASOS = [
    { n: '1. MASLD / fibrose silenciosa', d: { idade: 52, sexo: 'M', ast: 58, alt: 74, plaq: 168000, ct: 232, hdl: 38, tg: 210, glicemia: 112, insulina: 18, hba1c: 5.9 } },
    { n: '2. Pseudo-hipercalemia por hemólise', d: { idade: 45, sexo: 'F', k: 6.8, ast: 95, ldh: 520, cr: 0.9, na: 139, flags: { hemolise: true } } },
    { n: '3. Anemia microcítica: ferropriva vs. talassemia', d: { idade: 34, sexo: 'F', hb: 9.8, vcm: 68, rbc: 4.4, ferro: 28, ctlf: 410, ferritina: 8 } },
    { n: '4. Tireoide discordante vs. biotina', d: { idade: 41, sexo: 'F', tsh: 0.04, t4l: 3.1, flags: { biotina: true } } },
  ];

  function renderBancada() {
    const v = S.raw, fl = v.flags || {};
    const inp = (f) => `<label class="field"><span>${esc(f.label)} <span class="unit">${esc(f.unit)}</span></span><input type="text" inputmode="decimal" autocomplete="off" data-f="${f.id}" value="${esc(v[f.id])}"></label>`;
    const chk = (k, t, on, attr) => `<label><input type="checkbox" ${attr}="${k}" ${on ? 'checked' : ''}> ${t}</label>`;
    document.getElementById('lab-body').innerHTML = `<div class="lab-layout">
      <div>
        <section class="lab-panel"><h2>Paciente</h2>
          <div class="lab-grid">
            <label class="field"><span>Idade <span class="unit">anos</span></span><input type="text" inputmode="numeric" data-f="idade" value="${esc(v.idade)}"></label>
            <label class="field"><span>Sexo biológico</span><select data-f="sexo"><option value="">—</option><option value="F" ${v.sexo === 'F' ? 'selected' : ''}>Feminino</option><option value="M" ${v.sexo === 'M' ? 'selected' : ''}>Masculino</option></select></label>
          </div>
          <div class="lab-checks">${chk('gestante', 'Gestante', v.gestante, 'data-b')}${chk('dm', 'Diabetes', v.dm, 'data-b')}${chk('icc', 'Insuficiência cardíaca', v.icc, 'data-b')}${chk('persistente', 'Alteração renal persistente há mais de 3 meses', v.persistente, 'data-b')}</div>
          <h3>Filtros pré-analíticos da amostra</h3>
          <div class="lab-checks">${chk('hemolise', 'Hemólise (+1 a +4)', fl.hemolise, 'data-fl')}${chk('lipemia', 'Lipemia intensa', fl.lipemia, 'data-fl')}${chk('ictericia', 'Icterícia', fl.ictericia, 'data-fl')}${chk('biotina', 'Uso de biotina / polivitamínico', fl.biotina, 'data-fl')}</div>
          <div class="lab-row"><button type="button" class="btn btn-ghost" data-act="casos">Carregar Casos Clínicos de Exemplo</button><button type="button" class="btn btn-ghost" data-act="limpar">Limpar</button></div>
          <div id="lab-casos" class="lab-row" hidden>${CASOS.map((c, i) => `<button type="button" class="chip" data-act="caso" data-i="${i}">${esc(c.n)}</button>`).join('')}</div>
        </section>
        ${Object.keys(GRUPOS).map((g) => `<section class="lab-panel"><h2>${GRUPOS[g]}</h2><div class="lab-grid">${L.FIELDS.filter((f) => f.group === g).map(inp).join('')}</div>${g === 'prot' ? `<div class="lab-checks">${chk('picoM', 'Pico monoclonal (componente M) presente na eletroforese', v.picoM, 'data-b')}</div>` : ''}</section>`).join('')}
        ${plugins().filter((p) => !p.formula).length ? `<section class="lab-panel"><h2>Exames personalizados</h2><div class="lab-grid">${plugins().filter((p) => !p.formula).map((p) => `<label class="field"><span>${esc(p.nome)} <span class="unit">${esc(p.unidade)}</span></span><input type="text" inputmode="decimal" autocomplete="off" data-f="${p.id}" value="${esc(v[p.id])}"></label>`).join('')}</div></section>` : ''}
      </div>
      <div class="lab-results" aria-live="polite"><div id="lab-out"></div></div></div>`;
    calc();
  }

  function calc() {
    const out = document.getElementById('lab-out');
    if (!out) return;
    const r = reg(), a = L.analyze(S.raw, r);
    const vars = Object.assign({}, a.v);
    plugins().forEach((p) => { const x = L.parseNum(S.raw[p.id]); if (x != null) vars[p.id] = x; });
    a.items = a.items.concat(PL.avaliarTodos(plugins(), vars));
    S.analysis = a;
    const temDado = a.items.length || a.alerts.length || a.warnings.length;
    let h = '';
    a.alerts.forEach((x) => { h += `<div class="lab-alert ${x.level === 'high' ? '' : 'mod'}" role="alert"><strong>${esc(x.title)}</strong>${esc(x.text)}</div>`; });
    a.warnings.forEach((w) => { h += `<div class="warn"><strong>Atenção</strong><span>${esc(w)}</span></div>`; });
    a.items.forEach((it) => {
      const seals = (it.guideline || []).map((g) => `<button type="button" class="lab-seal" data-act="seal" data-g="${g}" aria-expanded="${S.seal === g}">${esc(L.selo(r, g))}</button>`).join(' ');
      h += `<div class="result ${it.level}" ${it.grade ? `data-grade="${it.grade}"` : ''}>
        <div class="res-head"><span class="sub">${esc(it.title)}</span><span class="main">${esc(it.main)}</span>${it.sub ? `<span class="sub">${esc(it.sub)}</span>` : ''}</div>
        <div>${seals}${it.selo ? `<span class="lab-seal" style="cursor:default">${esc(it.selo)}</span>` : ''}</div>
        ${(it.guideline || []).includes(S.seal) ? sealPanel(r, S.seal) : ''}
        ${(it.details || []).filter(Boolean).map((d) => `<p class="det">${esc(d)}</p>`).join('')}
        ${(it.recs || []).length ? `<ul class="det">${it.recs.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</div>`;
    });
    if (a.notes.length) h += `<p class="lab-small">${a.notes.map(esc).join(' ')}</p>`;
    if (!temDado) h = '<p class="lab-notice">Preencha idade, sexo e os exames (vírgula ou ponto) ou carregue um caso de exemplo. Os resultados aparecem aqui na hora.</p>';
    else h += `<div class="lab-row lab-print"><button type="button" class="btn" data-act="soap">Copiar Evolução para Prontuário (SOAP/e-SUS)</button></div><pre class="lab-pre" id="lab-soap" hidden></pre>`;
    out.innerHTML = h;
  }

  function sealPanel(r, g) {
    const G = r.guidelines[g];
    const ps = Object.values(G.params).map((p) => `<li>${esc(p.label)}: <strong>${esc(L.fmt(p.value, p.value % 1 === 0 ? 0 : 3))} ${esc(p.unit)}</strong> ${statusTag(p.status)}${p.custom ? ' <span class="lab-tag lab_local">ajustado</span>' : ''}</li>`).join('');
    return `<div class="lab-seal-panel"><strong>${esc(G.title)}</strong> — ${esc(G.society)}, versão ${esc(G.version)} (${G.year}). Auditado em ${esc(L.mesAno(G.lastAuditedISO))}.<br><span class="lab-small">${esc(G.ref)}</span><ul>${ps}</ul></div>`;
  }

  async function copiarSoap() {
    const t = L.soap(S.raw, S.analysis, today());
    const ok = await copiar(t);
    const pre = document.getElementById('lab-soap');
    pre.hidden = false; pre.textContent = t;
    const b = root.querySelector('[data-act="soap"]');
    b.textContent = ok ? 'Copiado' : 'Não foi possível copiar: selecione o texto abaixo';
    setTimeout(() => { if (b.isConnected) b.textContent = 'Copiar Evolução para Prontuário (SOAP/e-SUS)'; }, 2500);
  }


  /* ================= Módulo 2: Fluxogramas ================= */
  function renderFluxos() {
    const body = document.getElementById('lab-body');
    if (S.tool) return renderTool();
    const x = S.fx;
    if (!x) {
      body.innerHTML = `<section class="lab-panel"><h2>Fluxogramas sindrômicos</h2><p class="lab-small">Responda passo a passo. Cada resultado traz o selo da diretriz, sugestões e um texto para o prontuário. Os pontos de corte vêm do Registry (Governança).</p>
        <div class="lab-cards">${FX.FLUXOS.map((f) => `<button type="button" class="lab-card" data-act="fx-open" data-id="${f.id}"><strong>${esc(f.titulo)}</strong><span>${esc(f.resumo)}</span></button>`).join('')}
        ${Object.entries(TOOLS).map(([id, t]) => `<button type="button" class="lab-card" data-act="tool-open" data-id="${id}"><strong>${esc(t.titulo)}</strong><span>${esc(t.resumo)}</span></button>`).join('')}</div></section>`;
      return;
    }
    const flow = FX.byId(x.flow), node = flow.nodes[x.node], r = reg();
    const barra = `<div class="lab-row"><button type="button" class="btn btn-ghost" data-act="fx-back">Voltar</button><button type="button" class="btn btn-ghost" data-act="fx-reset">Escolher outro fluxograma</button></div>`;
    let h = `<section class="lab-panel"><h2>${esc(flow.titulo)}</h2>${barra}`;
    if (x.error) h += `<div class="warn"><strong>Atenção</strong><span>${esc(x.error)}</span></div>`;
    if (node.t === 'choice') {
      h += `<p><strong>${esc(node.q)}</strong></p><div class="lab-row">${node.opts.map((o) => `<button type="button" class="btn" data-act="fx-choice" data-v="${esc(o.v)}">${esc(o.label)}</button>`).join('')}</div>`;
    } else if (node.t === 'form') {
      const raw = x.raw || {};
      h += `<p><strong>${esc(node.q)}</strong></p><div class="lab-grid" id="lab-ffields">${node.fields.map((f) => {
        const v = raw[f.id];
        if (f.type === 'check') return `<label class="lab-checks lab-fullrow"><span><input type="checkbox" data-ff="${f.id}" ${v ? 'checked' : ''}> ${esc(f.label)}</span></label>`;
        if (f.type === 'select') return `<label class="field"><span>${esc(f.label)}${f.req ? '' : ' <span class="unit">(opcional)</span>'}</span><select data-ff="${f.id}"><option value="">—</option>${f.options.map((o) => `<option value="${esc(o[0])}" ${v === o[0] ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select></label>`;
        return `<label class="field"><span>${esc(f.label)} ${f.unit ? `<span class="unit">${esc(f.unit)}</span>` : ''}${f.req ? '' : ' <span class="unit">(opcional)</span>'}</span><input type="text" inputmode="decimal" autocomplete="off" data-ff="${f.id}" value="${esc(v)}"></label>`;
      }).join('')}</div><div class="lab-row"><button type="button" class="btn" data-act="fx-next">Continuar</button></div>`;
    } else {
      const res = FX.result(flow, x.node, x.ctx, r);
      h += `<div class="result ${res.level}" ${res.level === 'high' ? 'data-grade="2"' : ''}><div class="res-head"><span class="main" style="font-size:1.25rem">${esc(res.title)}</span></div>
        <div>${res.selos.map((t) => `<span class="lab-seal" style="cursor:default">${esc(t)}</span>`).join(' ')}</div>
        ${res.texts.map((t) => `<p class="det">${esc(t)}</p>`).join('')}
        ${res.recs.length ? `<ul class="det">${res.recs.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}</div>
        <div class="lab-row lab-print"><button type="button" class="btn" data-act="fx-copy">Copiar para Prontuário (SOAP/e-SUS)</button></div><pre class="lab-pre" id="lab-fxnote" hidden></pre>`;
    }
    body.innerHTML = h + '</section>';
  }
  function lerForm() {
    const raw = {};
    root.querySelectorAll('[data-ff]').forEach((el) => { raw[el.dataset.ff] = el.type === 'checkbox' ? el.checked : el.value; });
    return raw;
  }
  function fxIr(answer) {
    const x = S.fx, flow = FX.byId(x.flow);
    const s = FX.step(flow, x.ctx, x.node, answer, reg());
    if (s.error) { x.error = s.error; if (typeof answer === 'object') x.raw = answer; return renderFluxos(); }
    x.hist.push({ node: x.node, ctx: x.ctx, raw: typeof answer === 'object' ? answer : {} });
    x.node = s.next; x.ctx = s.ctx; x.error = ''; x.raw = {};
    renderFluxos();
  }


  /* ---------- simuladores: EPS com curva SVG e eletroforese de hemoglobina / HPLC ---------- */
  const TOOLS = {
    eps: {
      titulo: 'Simulador de Eletroforese de Proteínas Séricas (EPS)', resumo: 'Curva densitométrica (normal × paciente), padrões clínicos e pico monoclonal (MGUS × mieloma).',
      campos: [['alb', 'Albumina', 'g/dL'], ['a1', 'Alfa-1', 'g/dL'], ['a2', 'Alfa-2', 'g/dL'], ['b1', 'Beta-1', 'g/dL'], ['b2', 'Beta-2', 'g/dL'], ['gama', 'Gama', 'g/dL'], ['pico', 'Pico monoclonal (componente M)', 'g/dL'], ['ca', 'Cálcio total (opcional, CRAB)', 'mg/dL'], ['cr', 'Creatinina (opcional, CRAB)', 'mg/dL'], ['hb', 'Hemoglobina (opcional, CRAB)', 'g/dL']],
      selects: [['picoZona', 'Zona do pico', [['g', 'Gama'], ['b', 'Beta'], ['a2', 'Alfa-2']]]], checks: [['osso', 'Lesão óssea lítica em imagem']],
      exemplos: [
        ['Normal (didático)', { alb: 4.2, a1: 0.25, a2: 0.65, b1: 0.45, b2: 0.35, gama: 1.1 }],
        ['Inflamação aguda', { alb: 3.0, a1: 0.6, a2: 1.2, b1: 0.4, b2: 0.3, gama: 1.2 }],
        ['Síndrome nefrótica', { alb: 2.0, a1: 0.2, a2: 1.4, b1: 0.4, b2: 0.3, gama: 0.5 }],
        ['Cirrose (ponte β-γ)', { alb: 3.0, a1: 0.2, a2: 0.6, b1: 0.4, b2: 0.7, gama: 2.2 }],
        ['Pico < 3 g/dL (MGUS)', { alb: 3.8, a1: 0.25, a2: 0.6, b1: 0.4, b2: 0.3, gama: 2.4, pico: 1.2 }],
        ['Pico + CRAB (mieloma)', { alb: 3.0, a1: 0.2, a2: 0.5, b1: 0.35, b2: 0.3, gama: 5.0, pico: 3.8, ca: 11.4, cr: 2.3, hb: 8.9 }],
      ],
    },
    hplc: {
      titulo: 'Interpretador de Eletroforese de Hemoglobina / HPLC', resumo: 'Beta e alfa-talassemia, traço e doença falciforme, HbSC e o efeito da ferropenia sobre a HbA2.',
      campos: [['a1', 'HbA1', '%'], ['a2', 'HbA2', '%'], ['f', 'HbF', '%'], ['s', 'HbS', '%'], ['c', 'HbC', '%'], ['vcm', 'VCM', 'fL'], ['rbc', 'Eritrócitos (opcional, Mentzer)', '10⁶/µL'], ['ferritina', 'Ferritina (opcional)', 'ng/mL']],
      selects: [], checks: [['ferropenia', 'Ferropenia concomitante presente']],
      exemplos: [
        ['Normal (didático)', { a1: 96.5, a2: 2.6, f: 0.9, vcm: 88 }],
        ['Beta-talassemia menor', { a1: 91, a2: 5.2, f: 1.5, vcm: 66 }],
        ['Ferropenia mascarando', { a1: 96.8, a2: 2.9, f: 0.3, vcm: 68, ferropenia: true }],
        ['Traço alfa', { a1: 97, a2: 2.5, f: 0.5, vcm: 68, rbc: 5.8 }],
        ['Traço falciforme (AS)', { a1: 60, a2: 2.5, f: 0.5, s: 38, vcm: 85 }],
        ['Anemia falciforme (SS)', { a1: 0, a2: 2.8, f: 8, s: 89, vcm: 88 }],
        ['S-beta⁰', { a1: 0, a2: 5.0, f: 6, s: 88, vcm: 68 }],
        ['HbSC', { a1: 0, a2: 2.5, f: 1.5, s: 49, c: 48, vcm: 80 }],
      ],
    },
  };
  function renderTool() {
    const t = TOOLS[S.tool], v = S.toolRaw;
    document.getElementById('lab-body').innerHTML = `<section class="lab-panel"><h2>${esc(t.titulo)}</h2>
      <div class="lab-row"><button type="button" class="btn btn-ghost" data-act="tool-back">Voltar aos fluxogramas</button></div>
      <p class="lab-small">Exemplos didáticos (valores inventados para treino, não são de pacientes):</p>
      <div class="lab-row">${t.exemplos.map((e, i) => `<button type="button" class="chip" data-act="tool-ex" data-i="${i}">${esc(e[0])}</button>`).join('')}</div>
      <div class="lab-layout"><div><div class="lab-grid">${t.campos.map(([id, n, u]) => `<label class="field"><span>${esc(n)} <span class="unit">${esc(u)}</span></span><input type="text" inputmode="decimal" autocomplete="off" data-tf="${id}" value="${esc(v[id])}"></label>`).join('')}
        ${t.selects.map(([id, n, ops]) => `<label class="field"><span>${esc(n)}</span><select data-ts="${id}">${ops.map((o) => `<option value="${o[0]}" ${v[id] === o[0] ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select></label>`).join('')}</div>
        <div class="lab-checks">${t.checks.map(([id, n]) => `<label><input type="checkbox" data-tb="${id}" ${v[id] ? 'checked' : ''}> ${esc(n)}</label>`).join('')}</div></div>
      <div class="lab-results" aria-live="polite" id="lab-toolout"></div></div></section>`;
    calcTool();
  }
  function calcTool() {
    const out = document.getElementById('lab-toolout');
    if (!out) return;
    const t = TOOLS[S.tool], v = S.toolRaw, num = {}, avisos = [];
    t.campos.forEach(([id, n]) => {
      const x = L.parseNum(v[id]);
      if (x == null) { if (v[id] != null && String(v[id]).trim() !== '') avisos.push(`${n}: não é um número.`); return; }
      if (x < 0 || (S.tool === 'hplc' && ['a1', 'a2', 'f', 's', 'c'].includes(id) && x > 100)) { avisos.push(`${n}: valor fora da faixa possível.`); return; }
      num[id] = x;
    });
    t.selects.forEach(([id, , ops]) => { num[id] = v[id] || ops[0][0]; });
    t.checks.forEach(([id]) => { num[id] = !!v[id]; });
    const dados = Object.keys(num).filter((k) => typeof num[k] === 'number');
    const r = reg();
    let h = avisos.map((w) => `<div class="warn"><strong>Atenção</strong><span>${esc(w)}</span></div>`).join('');
    if (!dados.length) { out.innerHTML = h + '<p class="lab-notice">Preencha as frações ou escolha um exemplo. O resultado aparece aqui na hora.</p>'; return; }
    let res, nota;
    if (S.tool === 'eps') {
      res = HM.eps(num, r);
      h += `<div class="lab-panel" style="margin:0">${res.svg}</div>`;
      res.padroes.forEach((p) => { h += `<div class="result ${p.level}" ${p.level === 'high' ? 'data-grade="2"' : ''}><div class="res-head"><span class="main" style="font-size:1.15rem">${esc(p.title)}</span></div><p class="det">${esc(p.text)}</p></div>`; });
      nota = ['Eletroforese de proteínas séricas (LabCore APS) — ' + today().split('-').reverse().join('/')].concat(Object.entries(num).filter(([k, x]) => typeof x === 'number').map(([k, x]) => `${(t.campos.find((c) => c[0] === k) || [k, k])[1]} ${L.fmt(x, 2)}`), res.padroes.map((p) => `- ${p.title}: ${p.text}`), ['Faixas de referência: Registry local (dependem do laboratório).', res.selos.join(' '), 'Apoio à decisão; não substitui o julgamento clínico.']).join('\n');
    } else {
      res = HM.hplc(num, r);
      res.avisos.forEach((w) => { h += `<div class="warn"><strong>Atenção</strong><span>${esc(w)}</span></div>`; });
      res.alertas.forEach((x) => { h += `<div class="lab-alert" role="alert"><strong>${esc(x.title)}</strong>${esc(x.text)}</div>`; });
      res.padroes.forEach((p) => { h += `<div class="result ${p.level}" ${p.level === 'high' ? 'data-grade="2"' : ''}><div class="res-head"><span class="main" style="font-size:1.15rem">${esc(p.title)}</span></div><p class="det">${esc(p.text)}</p>${(p.recs || []).length ? `<ul class="det">${p.recs.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</div>`; });
      nota = ['Eletroforese de hemoglobina / HPLC (LabCore APS) — ' + today().split('-').reverse().join('/')].concat(Object.entries(num).filter(([k, x]) => typeof x === 'number').map(([k, x]) => `${(t.campos.find((c) => c[0] === k) || [k, k])[1]} ${L.fmt(x, 1)}`), num.ferropenia ? ['Ferropenia concomitante: sim'] : [], res.alertas.map((x) => `ALERTA: ${x.title}. ${x.text}`), res.padroes.map((p) => `- ${p.title}: ${p.text}`), [res.selos.join(' '), 'Apoio à decisão; não substitui o julgamento clínico.']).join('\n');
    }
    S.toolNote = nota;
    h += `<div class="lab-row lab-print"><button type="button" class="btn" data-act="tool-copy">Copiar para Prontuário (SOAP/e-SUS)</button></div><pre class="lab-pre" id="lab-toolnote" hidden></pre>`;
    out.innerHTML = h;
  }

  /* ---------- Criador de Exames & Fórmulas Customizadas ---------- */
  function openDlg() {
    const dlg = document.getElementById('lab-dlg');
    if (!dlg) return;
    const e = S.dlgDraft || (S.dlgEdit ? S.exams.find((x) => x.id === S.dlgEdit) : null);
    const val = (k) => esc(e ? (Array.isArray(e[k]) ? e[k].join(', ') : e[k] == null ? '' : e[k]) : '');
    const campo = (id, rot, extra) => `<label class="field"><span>${rot}</span><input type="text" id="dlg-${id}" autocomplete="off" value="${val(id)}" ${extra || ''}></label>`;
    const area = (id, rot) => `<label class="field"><span>${rot}</span><textarea id="dlg-${id}" style="min-height:64px">${val(id)}</textarea></label>`;
    dlg.innerHTML = `<h2 id="lab-dlg-t">${e ? 'Editar exame / índice' : '+ Novo exame / índice'}</h2>
      <p class="lab-small">Fica salvo neste navegador e passa a valer no Parser, na Bancada Rápida, no SOAP e na Enciclopédia. Sem fórmula, o exame é digitado; com fórmula, é calculado.</p>
      ${S.dlgMsg ? `<div class="warn"><strong>Atenção</strong><span>${esc(S.dlgMsg)}</span></div>` : ''}
      <div class="lab-grid">${campo('nome', 'Nome do exame *')}${campo('categoria', 'Categoria')}${campo('siglas', 'Siglas para o Parser (separe por vírgula)')}${campo('unidade', 'Unidade')}${campo('refMin', 'Referência: mínimo')}${campo('refMax', 'Referência: máximo')}</div>
      ${campo('formula', 'Fórmula opcional (ex.: vcm / rbc ; use + - * / ^ ( ) sqrt ln log exp abs min max)')}
      <details><summary class="lab-small">Variáveis que a fórmula pode usar</summary><p class="lab-small">${esc(idsUsados(S.dlgEdit).filter((i) => !['sexo', 'flags', 'gestante', 'dm', 'icc', 'persistente', 'picoM'].includes(i)).join(', '))}</p></details>
      ${area('interferentes', 'Interferentes de bancada (pré-analítico / analítico)')}${area('interpretaAlto', 'Interpretação se alto')}${area('interpretaBaixo', 'Interpretação se baixo')}
      ${area('regulacao', 'Critério de regulação (CROSS/SISREG) do seu município')}${campo('fonte', 'Fonte / diretriz dos valores (recomendado)')}
      <div class="lab-row"><button type="button" class="btn" data-act="exam-save">Salvar</button><button type="button" class="btn btn-ghost" data-act="exam-cancel">Fechar</button></div>
      <h3>Meus exames</h3>
      ${S.exams.length ? `<ul>${S.exams.map((x) => `<li><strong>${esc(x.nome)}</strong> <span class="lab-small">(${esc(x.id)}${x.formula ? ' · fórmula' : ''})</span> <button type="button" class="lab-seal" data-act="exam-edit" data-id="${x.id}">Editar</button> <button type="button" class="lab-seal" data-act="exam-del" data-id="${x.id}">Excluir</button></li>`).join('')}</ul>` : '<p class="lab-small">Nenhum exame cadastrado pela tela.</p>'}
      ${codeExams.length ? `<p class="lab-small">No código (CUSTOM_EXAMS_PLUGINS): ${codeExams.map((x) => esc(x.nome)).join(', ')}.</p>` : ''}
      <div class="lab-row"><button type="button" class="btn btn-ghost" data-act="exam-export">Exportar .json</button><label class="btn btn-ghost" style="cursor:pointer">Importar .json<input type="file" id="lab-dlg-file" accept=".json,application/json" hidden></label></div>`;
    if (!dlg.open) dlg.showModal();
  }
  function salvarExame() {
    const g = (k) => document.getElementById('dlg-' + k).value;
    const raw = { nome: g('nome'), categoria: g('categoria'), siglas: g('siglas'), unidade: g('unidade'), refMin: g('refMin'), refMax: g('refMax'), formula: g('formula'), interferentes: g('interferentes'), interpretaAlto: g('interpretaAlto'), interpretaBaixo: g('interpretaBaixo'), regulacao: g('regulacao'), fonte: g('fonte') };
    if (S.dlgEdit) raw.id = S.dlgEdit;
    const ids = idsUsados(S.dlgEdit);
    const r = PL.validar(raw, ids, ids);
    if (!r.ok) { S.dlgMsg = r.erros.join(' '); S.dlgDraft = raw; return openDlg(); }
    const i = S.exams.findIndex((x) => x.id === r.plugin.id);
    if (i >= 0) S.exams[i] = r.plugin; else S.exams.push(r.plugin);
    persistExams(); S.dlgMsg = ''; S.dlgEdit = null; S.dlgDraft = null;
    document.getElementById('lab-dlg').close();
    render();
  }
  function importarExames(texto) {
    const ids = idsUsados();
    const r = PL.importar(texto, ids, ids);
    if (!r.ok) { S.dlgMsg = r.erros.join(' '); return openDlg(); }
    r.novos.forEach((x) => S.exams.push(x)); persistExams();
    S.dlgMsg = `${r.novos.length} exame(s) importado(s).${r.ignorados.length ? ' Ignorados: ' + r.ignorados.join(' | ') : ''}`;
    document.getElementById('lab-dlg').close(); render(); openDlg();
  }

  /* ================= Módulo 3: Enciclopédia ================= */
  function renderEnc() {
    document.getElementById('lab-body').innerHTML = `<section class="lab-panel"><h2>Enciclopédia metrológica e pérolas de bancada</h2>
      <label class="field"><span>Buscar</span><input type="search" id="lab-q" autocomplete="off" placeholder="ex.: hemólise, EDTA, TSH, nefrologia" value="${esc(S.enc.q)}"></label>
      <div class="lab-row" id="lab-cats">${[['', 'Todas']].concat(Object.entries(EN.CATS)).map(([k, n]) => `<button type="button" class="chip" data-act="enc-cat" data-cat="${k}" aria-pressed="${S.enc.cat === k}">${esc(n)}</button>`).join('')}</div>
      <p class="lab-small">Conteúdo de livro-texto e das diretrizes citadas em cada entrada; "a verificar" indica que ainda falta conferência. Os exames obrigatórios das centrais de regulação (CROSS, SISREG) variam por município e estado: cole o protocolo da sua central em cada especialidade.</p>
      <div class="lab-row"><button type="button" class="btn btn-ghost" data-act="exam-new">+ Adicionar Novo Exame / Índice</button></div>
      <div id="lab-enclist"></div></section>`;
    listaEnc();
  }
  function listaEnc() {
    const r = reg(), items = EN.buscar(S.enc.q, S.enc.cat, r, plugins().map(PL.paraEnciclopedia));
    const el = document.getElementById('lab-enclist');
    el.innerHTML = items.length ? items.map((e) => `<details class="lab-enc"><summary><strong>${esc(e.titulo)}</strong> <span class="lab-small">${esc(EN.CATS[e.cat])}</span></summary>
      <p>${esc(e.resumo)}</p><ul>${EN.textoPontos(e, r).map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
      <p class="lab-small">Fonte: ${esc(e.fonte)} ${e.conf === 'a_verificar' ? '<span class="lab-tag a_verificar">a verificar</span>' : ''}</p>
      ${e.regulacao ? `<label class="field"><span>Protocolo local de regulação (exames obrigatórios, documentos, prioridade)</span><textarea data-reg="${e.id}" placeholder="Cole aqui o protocolo da central do seu município/estado">${esc(S.regulacao[e.id] != null ? S.regulacao[e.id] : e.regulacaoPadrao || '')}</textarea></label><p class="lab-small">Fica só neste navegador.</p>` : ''}</details>`).join('') : '<p class="lab-small">Nada encontrado. Tente outro termo.</p>';
  }

  /* ================= Módulo 4: Colar do Prontuário ================= */
  const EXEMPLO = 'Hb 10.5 VCM 71 Plaq 140000 Cr 1.4 K 5.8 Glic 142 HbA1c 7.4 AST 55 ALT 62';
  function renderColar() {
    const p = S.parsed;
    document.getElementById('lab-body').innerHTML = `<section class="lab-panel"><h2>Colar do Prontuário</h2>
      <p class="lab-small">Cole o texto do laudo ou da evolução. A extração é local, por expressões regulares fixas: nenhuma IA e nenhuma chamada de rede.</p>
      <label class="field"><span>Texto livre</span><textarea id="lab-paste" placeholder="${esc(EXEMPLO)}">${esc(S.pasteText || '')}</textarea></label>
      <div class="lab-row"><button type="button" class="btn" data-act="parse">Extrair e preencher a Bancada</button><button type="button" class="btn btn-ghost" data-act="exemplo">Usar exemplo</button></div>
      ${p ? `<h3>${p.found.length ? 'Valores reconhecidos' : 'Nenhum valor reconhecido'}</h3>${p.found.length ? `<div class="lab-tablewrap"><table class="lab-table"><thead><tr><th>Campo</th><th>Trecho</th><th>Valor</th><th>Unidade</th></tr></thead><tbody>${p.found.map((f) => `<tr><td>${esc((L.FIELD[f.field] || customLabel(f.field)).label)}</td><td>${esc(f.alias)} ${esc(f.raw)}</td><td>${esc(L.fmt(f.value, f.value % 1 === 0 ? 0 : 2))}</td><td>${esc((L.FIELD[f.field] || customLabel(f.field)).unit)}</td></tr>`).join('')}</tbody></table></div>` : ''}
      <p class="lab-small">Confira os valores e as unidades (assumidas: as da tabela acima). <button type="button" class="lab-seal" data-act="sub" data-sub="bancada">Ver na Bancada</button></p>` : ''}</section>`;
  }
  function extrair() {
    const t = document.getElementById('lab-paste').value;
    S.pasteText = t;
    S.parsed = L.parseReport(t, PL.aliases(plugins()));
    const val = S.parsed.values;
    Object.keys(val).forEach((k) => {
      if (k === 'gestante' || k === 'picoM') S.raw[k] = true; else if (k === 'sexo') S.raw.sexo = val[k]; else S.raw[k] = String(val[k]).replace('.', ',');
    });
    renderColar();
  }

  /* ================= Módulo 5: Governança ================= */
  function renderGov() {
    const r = reg(), cs = L.cycleStatus(r, today());
    const fontes = cs.rows.map((s) => `<tr><td><strong>${esc(s.sigla)}</strong><br><span class="lab-small">${esc(s.escopo)}</span></td><td>${esc(L.mesAno(s.lastAuditedISO))}</td><td>${s.days == null ? '—' : s.days + ' d'}</td><td><span class="lab-tag ${s.overdue ? 'bad' : 'ok'}">${s.overdue ? 'vencida' : 'em dia'}</span></td><td><button type="button" class="lab-seal" data-act="audit-one" data-id="${s.id}">Marcar auditada hoje</button></td></tr>`).join('');
    const key = store.raw('labcore_gemini_key'), model = store.raw('labcore_gemini_model') || 'gemini-2.5-flash';
    document.getElementById('lab-body').innerHTML = `
      <section class="lab-panel"><h2>Status das sociedades e ciclo de ${cs.ttlDays} dias</h2>
        <p class="lab-small">Registry v${esc(r.version)}. Auditoria mais antiga: ${cs.maxDays} dias. A data só muda quando você marca a fonte como auditada, depois de rever as propostas.</p>
        <div class="lab-tablewrap"><table class="lab-table"><thead><tr><th>Fonte monitorada</th><th>Última auditoria</th><th>Dias</th><th>Ciclo</th><th></th></tr></thead><tbody>${fontes}</tbody></table></div>
        <div class="lab-row"><button type="button" class="btn" data-act="audit-all">Concluir auditoria do mês (todas as fontes)</button></div></section>
      <section class="lab-panel"><h2>Sincronização mensal assistida</h2>
        <h3>Modo A — Gemini com Google Search Grounding</h3>
        <p class="lab-small">Envia ao Gemini somente o JSON do Registry (nenhum dado de paciente). A chave fica só neste navegador.</p>
        <div class="lab-grid"><label class="field"><span>Chave da API Gemini</span><input type="password" id="lab-key" autocomplete="off" value="${esc(key)}"></label>
        <label class="field"><span>Modelo</span><select id="lab-model"><option value="gemini-2.5-flash" ${model === 'gemini-2.5-flash' ? 'selected' : ''}>gemini-2.5-flash</option><option value="gemini-2.5-pro" ${model === 'gemini-2.5-pro' ? 'selected' : ''}>gemini-2.5-pro</option></select></label></div>
        <div class="lab-row"><button type="button" class="btn" data-act="scan" id="lab-scan">Executar Varredura Mensal nas Sociedades (Search Grounding)</button></div>
        <h3>Modo B — Prompt de auditoria externa (sem chave)</h3>
        <div class="lab-row"><button type="button" class="btn btn-ghost" data-act="prompt">Gerar Prompt de Auditoria do Mês ${esc(L.mesAnoExt(today()))}</button></div>
        <pre class="lab-pre" id="lab-prompt" hidden></pre>
        <label class="field"><span>Importar Pacote de Atualização (.JSON)</span><textarea id="lab-import" placeholder='{"schema":"labcore-update/1", ...}'></textarea></label>
        <div class="lab-row"><button type="button" class="btn btn-ghost" data-act="import">Validar pacote</button><label class="btn btn-ghost" style="cursor:pointer">Abrir arquivo .json<input type="file" id="lab-file" accept=".json,application/json" hidden></label></div>
        <p class="lab-small" id="lab-msg" role="status">${esc(S.msg)}</p>
        <div id="lab-diff"></div></section>
      <section class="lab-panel"><h2>Exames personalizados</h2><p class="lab-small">Cadastre novos exames e fórmulas sem mexer no código; exporte e importe em .json.</p><div class="lab-row"><button type="button" class="btn btn-ghost" data-act="exam-new">+ Adicionar Novo Exame / Índice</button></div></section>
      <section class="lab-panel"><h2>Editor de cutoffs locais</h2>
        <p class="lab-small">Ajuste valores ao kit do laboratório conveniado (ex.: limites superiores de AST, K+, LDH). Cada alteração fica registrada no changelog. Faixas fora do plausível são recusadas.</p>
        ${editor(r)}
        <div class="lab-row"><button type="button" class="btn btn-ghost" data-act="reset-all">Restaurar Padrão Internacional (todos)</button></div></section>
      <section class="lab-panel"><h2>Histórico de versões (changelog)</h2>${changelog()}</section>`;
    renderDiff();
    const f = document.getElementById('lab-file');
    if (f) f.addEventListener('change', () => { const file = f.files[0]; if (!file) return; file.text().then((t) => { document.getElementById('lab-import').value = t; importar(); }); });
  }

  function editor(r) {
    return Object.entries(r.guidelines).map(([gid, g]) => `<details><summary><strong>${esc(g.title)}</strong> <span class="lab-small">${esc(L.selo(r, gid))}</span></summary>
      <div class="lab-tablewrap"><table class="lab-table"><thead><tr><th>Parâmetro</th><th>Valor</th><th>Padrão</th><th>Origem</th><th></th></tr></thead><tbody>${Object.entries(g.params).map(([k, p]) => {
        const def = L.REGISTRY.guidelines[gid].params[k].value;
        return `<tr><td>${esc(p.label)}<br><span class="lab-small">${esc(p.unit)} · faixa ${p.min} a ${p.max}</span></td>
          <td><input class="lab-edit" inputmode="decimal" data-edit="${gid}:${k}" value="${esc(String(p.value).replace('.', ','))}" aria-label="${esc(p.label)}"></td>
          <td>${esc(String(def).replace('.', ','))}</td>
          <td>${statusTag(p.status)}${p.custom ? ` <span class="lab-tag lab_local">${esc(p.custom)}</span>` : ''}</td>
          <td>${p.custom ? `<button type="button" class="lab-seal" data-act="reset-one" data-k="${gid}:${k}">Restaurar padrão</button>` : ''}</td></tr>`;
      }).join('')}</tbody></table></div></details>`).join('');
  }

  function changelog() {
    if (!S.log.length) return '<p class="lab-small">Nenhuma alteração aplicada ainda. Registry inicial v1.0.0 (15/10/2026), montado a partir da especificação e ainda sem varredura online.</p>';
    const tipo = { atualizacao: 'Atualização aprovada', manual: 'Ajuste manual', restauracao: 'Restaurado ao padrão', auditoria: 'Auditoria registrada' };
    return `<div class="lab-tablewrap"><table class="lab-table"><thead><tr><th>Data</th><th>Tipo</th><th>Parâmetro</th><th>De → Para</th><th>Fonte</th></tr></thead><tbody>${S.log.slice().reverse().map((e) => `<tr><td>${esc(String(e.atISO).split('-').reverse().join('/'))}</td><td>${esc(tipo[e.tipo] || e.tipo)}</td><td>${esc(e.label || '')}</td><td>${e.tipo === 'auditoria' ? '—' : `${esc(e.from)} → ${esc(e.to)}`}</td><td>${esc(e.source || '')}</td></tr>`).join('')}</tbody></table></div>`;
  }

  function addLog(entries) { S.log = S.log.concat(entries); }

  function renderDiff() {
    const el = document.getElementById('lab-diff');
    if (!el) return;
    const p = S.pending;
    if (!p) { el.innerHTML = ''; return; }
    const validas = p.rows.filter((r) => r.valid).length;
    el.innerHTML = `<h3>Diff clínico — ${esc(p.origem)}: ${p.rows.length} proposta(s), ${validas} aplicável(is)</h3>
      ${p.rows.length ? `<div class="lab-tablewrap"><table class="lab-table"><thead><tr><th>Parâmetro</th><th>Valor atual</th><th>Novo valor</th><th>Fonte / evidência</th><th></th></tr></thead><tbody>${p.rows.map((r) => `<tr><td>${esc(r.label)}</td><td>${esc(r.current)} ${esc(r.unit)}</td><td><strong>${esc(r.proposed)}</strong></td>
        <td>${esc(r.source)}${r.url ? ` — <a href="${esc(/^https?:\/\//.test(r.url) ? r.url : '#')}" target="_blank" rel="noopener noreferrer">link</a>` : ''}<br><span class="lab-small">${esc(r.evidence)}</span></td>
        <td>${r.valid ? `<button type="button" class="btn" data-act="approve" data-i="${r.idx}">Aprovar e Atualizar Registry</button>` : `<span class="lab-tag bad">${esc(r.problem)}</span>`}</td></tr>`).join('')}</tbody></table></div>` : '<p class="lab-small">Nenhuma mudança proposta. Se você revisou as fontes, registre a auditoria.</p>'}
      ${(p.grounding || []).length ? `<p class="lab-small">Páginas consultadas pelo Gemini: ${p.grounding.map((g) => `<a href="${esc(g.uri)}" target="_blank" rel="noopener noreferrer">${esc(g.title || g.uri)}</a>`).join(' · ')}</p>` : ''}
      <div class="lab-row">${validas > 1 ? '<button type="button" class="btn" data-act="approve-all">Aprovar todas as aplicáveis</button>' : ''}<button type="button" class="btn btn-ghost" data-act="discard">Descartar propostas</button></div>
      <p class="lab-small">Propostas de IA podem estar erradas: confira a fonte antes de aprovar. Nada é alterado sem o seu clique.</p>`;
  }

  function setMsg(t) { S.msg = t; const m = document.getElementById('lab-msg'); if (m) m.textContent = t; }

  function aplicar(rows) {
    const r = L.applyRows(S.custom, rows, today(), 'atualizacao');
    S.custom = r.custom; addLog(r.log); persist();
  }

  function importar() {
    const txt = document.getElementById('lab-import').value;
    const pkg = L.extractJson(txt);
    const v = L.validatePackage(pkg, reg());
    if (!v.ok) { S.pending = null; renderDiff(); setMsg('Pacote recusado: ' + v.erros.join(' ')); return; }
    S.pending = { rows: v.rows, origem: 'pacote importado' };
    setMsg('Pacote válido. Revise cada linha e aprove.');
    renderDiff();
  }

  async function varredura() {
    const key = document.getElementById('lab-key').value.trim(), model = document.getElementById('lab-model').value;
    store.setRaw('labcore_gemini_key', key); store.setRaw('labcore_gemini_model', model);
    if (!key) { setMsg('Informe a chave da API Gemini ou use o Modo B (sem chave).'); return; }
    const btn = document.getElementById('lab-scan'); btn.disabled = true;
    setMsg('Consultando o Gemini com busca na web… pode levar um minuto.');
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: L.buildAuditPrompt(reg(), today()) }] }], tools: [{ google_search: {} }], generationConfig: { temperature: 0.1 } }),
      });
      if (!res.ok) throw new Error(res.status === 400 || res.status === 403 ? 'Chave recusada ou sem permissão (erro ' + res.status + ').' : res.status === 429 ? 'Limite de uso do Gemini atingido (429). Tente mais tarde.' : 'Erro ' + res.status + ' do Gemini.');
      const j = await res.json();
      const c = j.candidates && j.candidates[0];
      const texto = c && c.content && c.content.parts ? c.content.parts.map((x) => x.text || '').join('') : '';
      const pkg = L.extractJson(texto);
      const v = L.validatePackage(pkg, reg());
      if (!v.ok) throw new Error('O Gemini não devolveu um pacote válido. ' + v.erros.join(' '));
      const ch = (c.groundingMetadata && c.groundingMetadata.groundingChunks) || [];
      S.pending = { rows: v.rows, origem: 'varredura Gemini (' + model + ')', grounding: ch.map((x) => x.web).filter(Boolean).slice(0, 8) };
      setMsg('Varredura concluída. Revise o diff abaixo.');
      renderDiff();
    } catch (e) {
      setMsg(e.message || 'Falha na varredura. Verifique a conexão e a chave.');
    } finally { btn.disabled = false; }
  }

  function editar(inputEl) {
    const k = inputEl.dataset.edit, [gid, key] = L.splitKey(k);
    const p = reg().guidelines[gid].params[key];
    const x = L.parseNum(inputEl.value);
    if (x == null || x < p.min || x > p.max) { setMsg(`${p.label}: valor deve ser numérico entre ${p.min} e ${p.max}.`); inputEl.value = String(p.value).replace('.', ','); return; }
    if (x === p.value) return;
    const def = L.REGISTRY.guidelines[gid].params[key].value;
    if (x === def) { delete S.custom[k]; addLog([{ atISO: today(), tipo: 'restauracao', label: p.label, from: p.value, to: x, source: 'Padrão internacional' }]); }
    else { S.custom[k] = { value: x, origin: 'manual', atISO: today() }; addLog([{ atISO: today(), tipo: 'manual', label: `${reg().guidelines[gid].title}: ${p.label}`, from: p.value, to: x, source: 'Ajuste local do usuário' }]); }
    persist(); renderGov();
  }

  function auditar(ids) {
    const t = today();
    ids.forEach((id) => { S.audits[id] = t; });
    addLog([{ atISO: t, tipo: 'auditoria', label: ids.length === 12 ? 'Auditoria mensal concluída (12 fontes)' : 'Fonte auditada: ' + ids.join(', '), source: '' }]);
    persist(); render();
  }

  /* ================= eventos ================= */
  root.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    if (act === 'sub') { S.sub = b.dataset.sub; render(); }
    else if (act === 'goto-gov') { S.sub = 'gov'; render(); }
    else if (act === 'tool-open') { S.tool = b.dataset.id; S.toolRaw = {}; renderTool(); }
    else if (act === 'tool-back') { S.tool = null; renderFluxos(); }
    else if (act === 'tool-ex') { S.toolRaw = {}; Object.entries(TOOLS[S.tool].exemplos[+b.dataset.i][1]).forEach(([k, x]) => { S.toolRaw[k] = typeof x === 'number' ? String(x).replace('.', ',') : x; }); renderTool(); }
    else if (act === 'tool-copy') { const ok = await copiar(S.toolNote); const pre = document.getElementById('lab-toolnote'); pre.hidden = false; pre.textContent = S.toolNote; b.textContent = ok ? 'Copiado' : 'Não foi possível copiar: selecione o texto abaixo'; }
    else if (act === 'exam-new') { S.dlgEdit = null; S.dlgDraft = null; S.dlgMsg = ''; openDlg(); }
    else if (act === 'exam-edit') { S.dlgEdit = b.dataset.id; S.dlgDraft = null; S.dlgMsg = ''; openDlg(); }
    else if (act === 'exam-del') { if (confirm('Excluir este exame personalizado?')) { S.exams = S.exams.filter((x) => x.id !== b.dataset.id); delete S.raw[b.dataset.id]; persistExams(); S.dlgEdit = null; document.getElementById('lab-dlg').close(); render(); openDlg(); } }
    else if (act === 'exam-save') salvarExame();
    else if (act === 'exam-cancel') { S.dlgDraft = null; document.getElementById('lab-dlg').close(); }
    else if (act === 'exam-export') { const blob = new Blob([PL.exportar(S.exams, today())], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'labcore-exames.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
    else if (act === 'fx-open') { const f = FX.byId(b.dataset.id); S.fx = { flow: f.id, node: f.start, ctx: {}, hist: [], error: '', raw: {} }; renderFluxos(); }
    else if (act === 'fx-choice') fxIr(b.dataset.v);
    else if (act === 'fx-next') fxIr(lerForm());
    else if (act === 'fx-back') { const x = S.fx, h = x.hist.pop(); if (h) { x.node = h.node; x.ctx = h.ctx; x.raw = h.raw || {}; x.error = ''; renderFluxos(); } else { S.fx = null; renderFluxos(); } }
    else if (act === 'fx-reset') { S.fx = null; renderFluxos(); }
    else if (act === 'fx-copy') { const flow = FX.byId(S.fx.flow), t = FX.nota(flow, FX.result(flow, S.fx.node, S.fx.ctx, reg()), today()); const ok = await copiar(t); const pre = document.getElementById('lab-fxnote'); pre.hidden = false; pre.textContent = t; b.textContent = ok ? 'Copiado' : 'Não foi possível copiar: selecione o texto abaixo'; }
    else if (act === 'enc-cat') { S.enc.cat = b.dataset.cat; renderEnc(); }
    else if (act === 'casos') { const c = document.getElementById('lab-casos'); c.hidden = !c.hidden; }
    else if (act === 'caso') { const c = CASOS[+b.dataset.i].d; S.raw = { flags: Object.assign({}, c.flags) }; Object.keys(c).forEach((k) => { if (k !== 'flags') S.raw[k] = String(c[k]).replace('.', ','); }); renderBancada(); }
    else if (act === 'limpar') { S.raw = { flags: {} }; renderBancada(); }
    else if (act === 'seal') { S.seal = S.seal === b.dataset.g ? null : b.dataset.g; calc(); }
    else if (act === 'soap') copiarSoap();
    else if (act === 'parse') extrair();
    else if (act === 'exemplo') { document.getElementById('lab-paste').value = EXEMPLO; }
    else if (act === 'audit-one') auditar([b.dataset.id]);
    else if (act === 'audit-all') auditar(L.REGISTRY.sources.map((s) => s.id));
    else if (act === 'scan') varredura();
    else if (act === 'prompt') { const p = L.buildAuditPrompt(reg(), today()); const ok = await copiar(p); const pre = document.getElementById('lab-prompt'); pre.hidden = false; pre.textContent = p; setMsg(ok ? 'Prompt copiado. Cole no Gemini, Perplexity ou Claude com acesso à web e traga o JSON de volta.' : 'Não foi possível copiar: selecione o texto abaixo.'); }
    else if (act === 'import') importar();
    else if (act === 'approve') { const row = S.pending.rows.find((r) => r.idx === +b.dataset.i); aplicar([row]); S.pending.rows = L.validatePackage({ schema: 'labcore-update/1', proposals: S.pending.rows.map((r) => ({ guideline: r.gid, param: r.key, value: r.proposed, source: r.source, evidence: r.evidence, url: r.url })) }, reg()).rows; setMsg('Registry atualizado e registrado no changelog.'); renderGov(); }
    else if (act === 'approve-all') { aplicar(S.pending.rows); S.pending = null; setMsg('Propostas aplicáveis aprovadas e registradas no changelog.'); renderGov(); }
    else if (act === 'discard') { S.pending = null; setMsg('Propostas descartadas.'); renderDiff(); }
    else if (act === 'reset-one') { const [gid, key] = L.splitKey(b.dataset.k); const p = reg().guidelines[gid].params[key]; const def = L.REGISTRY.guidelines[gid].params[key].value; delete S.custom[b.dataset.k]; addLog([{ atISO: today(), tipo: 'restauracao', label: p.label, from: p.value, to: def, source: 'Padrão internacional' }]); persist(); renderGov(); }
    else if (act === 'reset-all') { if (Object.keys(S.custom).length && confirm('Restaurar todos os pontos de corte ao padrão internacional?')) { addLog([{ atISO: today(), tipo: 'restauracao', label: `${Object.keys(S.custom).length} parâmetro(s)`, from: 'ajustado', to: 'padrão', source: 'Padrão internacional' }]); S.custom = {}; persist(); renderGov(); } }
  });
  root.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.f) { S.raw[t.dataset.f] = t.value; calc(); }
    else if (t.dataset.b) { S.raw[t.dataset.b] = t.checked; calc(); }
    else if (t.dataset.tf) { S.toolRaw[t.dataset.tf] = t.value; calcTool(); }
    else if (t.dataset.ts) { S.toolRaw[t.dataset.ts] = t.value; calcTool(); }
    else if (t.dataset.tb) { S.toolRaw[t.dataset.tb] = t.checked; calcTool(); }
    else if (t.id === 'lab-q') { S.enc.q = t.value; listaEnc(); }
    else if (t.dataset.fl) { S.raw.flags = Object.assign({}, S.raw.flags, { [t.dataset.fl]: t.checked }); calc(); }
  });
  root.addEventListener('change', (e) => {
    if (e.target.id === 'lab-dlg-file') { const f = e.target.files[0]; if (f) f.text().then(importarExames); }
    else if (e.target.dataset.edit) editar(e.target);
    else if (e.target.dataset.reg) { S.regulacao[e.target.dataset.reg] = e.target.value; store.set('labcore_regulacao', S.regulacao); }
  });

  render();
  window.addEventListener('hashchange', () => { if (location.hash === '#labcore') render(); });
})();
