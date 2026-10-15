/* LabCore APS — interface (Bancada Rápida, Colar do Prontuário, Governança). O motor está em labcore-engine.js; aqui só há DOM.
   Dados do paciente nunca são gravados: só o Registry ajustado, as auditorias, o changelog e (opcional) a chave Gemini vão para o localStorage. */
(function () {
  'use strict';
  const L = window.LabCore, FX = window.LabCoreFluxos, EN = window.LabCoreEnciclopedia;
  const root = document.getElementById('lab-root');
  if (!L || !FX || !EN || !root) return;

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
    msg: '',
  };
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
      <p class="lab-notice"><strong>Apoio à decisão para profissionais de saúde.</strong> Não substitui o julgamento clínico nem o laudo do laboratório. Nada do que você digita sai do navegador nem é salvo; só os ajustes do Registry ficam neste aparelho.</p>
      <div class="lab-tabs" role="tablist">${tabs.map(([id, n]) => `<button type="button" role="tab" class="chip" data-act="sub" data-sub="${id}" aria-pressed="${S.sub === id}" aria-selected="${S.sub === id}">${n}</button>`).join('')}</div>
      <div id="lab-body"></div>`;
    ({ bancada: renderBancada, fluxos: renderFluxos, enc: renderEnc, colar: renderColar, gov: renderGov })[S.sub]();
  }

  /* ================= Módulo 1: Bancada Rápida ================= */
  const GRUPOS = { hemato: 'Hemograma e ferro', renal: 'Rim', eletro: 'Eletrólitos', metab: 'Glicemia', hepat: 'Fígado e hemólise', lipid: 'Lipídios', tireo: 'Tireoide' };
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
        ${Object.keys(GRUPOS).map((g) => `<section class="lab-panel"><h2>${GRUPOS[g]}</h2><div class="lab-grid">${L.FIELDS.filter((f) => f.group === g).map(inp).join('')}</div></section>`).join('')}
      </div>
      <div class="lab-results" aria-live="polite"><div id="lab-out"></div></div></div>`;
    calc();
  }

  function calc() {
    const out = document.getElementById('lab-out');
    if (!out) return;
    const r = reg(), a = L.analyze(S.raw, r);
    S.analysis = a;
    const temDado = a.items.length || a.alerts.length || a.warnings.length;
    let h = '';
    a.alerts.forEach((x) => { h += `<div class="lab-alert ${x.level === 'high' ? '' : 'mod'}" role="alert"><strong>${esc(x.title)}</strong>${esc(x.text)}</div>`; });
    a.warnings.forEach((w) => { h += `<div class="warn"><strong>Atenção</strong><span>${esc(w)}</span></div>`; });
    a.items.forEach((it) => {
      const seals = (it.guideline || []).map((g) => `<button type="button" class="lab-seal" data-act="seal" data-g="${g}" aria-expanded="${S.seal === g}">${esc(L.selo(r, g))}</button>`).join(' ');
      h += `<div class="result ${it.level}" ${it.grade ? `data-grade="${it.grade}"` : ''}>
        <div class="res-head"><span class="sub">${esc(it.title)}</span><span class="main">${esc(it.main)}</span>${it.sub ? `<span class="sub">${esc(it.sub)}</span>` : ''}</div>
        <div>${seals}</div>
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
    const x = S.fx;
    if (!x) {
      body.innerHTML = `<section class="lab-panel"><h2>Fluxogramas sindrômicos</h2><p class="lab-small">Responda passo a passo. Cada resultado traz o selo da diretriz, sugestões e um texto para o prontuário. Os pontos de corte vêm do Registry (Governança).</p>
        <div class="lab-cards">${FX.FLUXOS.map((f) => `<button type="button" class="lab-card" data-act="fx-open" data-id="${f.id}"><strong>${esc(f.titulo)}</strong><span>${esc(f.resumo)}</span></button>`).join('')}</div></section>`;
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

  /* ================= Módulo 3: Enciclopédia ================= */
  function renderEnc() {
    document.getElementById('lab-body').innerHTML = `<section class="lab-panel"><h2>Enciclopédia metrológica e pérolas de bancada</h2>
      <label class="field"><span>Buscar</span><input type="search" id="lab-q" autocomplete="off" placeholder="ex.: hemólise, EDTA, TSH, nefrologia" value="${esc(S.enc.q)}"></label>
      <div class="lab-row" id="lab-cats">${[['', 'Todas']].concat(Object.entries(EN.CATS)).map(([k, n]) => `<button type="button" class="chip" data-act="enc-cat" data-cat="${k}" aria-pressed="${S.enc.cat === k}">${esc(n)}</button>`).join('')}</div>
      <p class="lab-small">Conteúdo de livro-texto e das diretrizes citadas em cada entrada; "a verificar" indica que ainda falta conferência. Os exames obrigatórios das centrais de regulação (CROSS, SISREG) variam por município e estado: cole o protocolo da sua central em cada especialidade.</p>
      <div id="lab-enclist"></div></section>`;
    listaEnc();
  }
  function listaEnc() {
    const r = reg(), items = EN.buscar(S.enc.q, S.enc.cat, r);
    const el = document.getElementById('lab-enclist');
    el.innerHTML = items.length ? items.map((e) => `<details class="lab-enc"><summary><strong>${esc(e.titulo)}</strong> <span class="lab-small">${esc(EN.CATS[e.cat])}</span></summary>
      <p>${esc(e.resumo)}</p><ul>${EN.textoPontos(e, r).map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
      <p class="lab-small">Fonte: ${esc(e.fonte)} ${e.conf === 'a_verificar' ? '<span class="lab-tag a_verificar">a verificar</span>' : ''}</p>
      ${e.regulacao ? `<label class="field"><span>Protocolo local de regulação (exames obrigatórios, documentos, prioridade)</span><textarea data-reg="${e.id}" placeholder="Cole aqui o protocolo da central do seu município/estado">${esc(S.regulacao[e.id] || '')}</textarea></label><p class="lab-small">Fica só neste navegador.</p>` : ''}</details>`).join('') : '<p class="lab-small">Nada encontrado. Tente outro termo.</p>';
  }

  /* ================= Módulo 4: Colar do Prontuário ================= */
  const EXEMPLO = 'Hb 10.5 VCM 71 Plaq 140000 Cr 1.4 K 5.8 Glic 142 HbA1c 7.4 AST 55 ALT 62';
  function renderColar() {
    const p = S.parsed;
    document.getElementById('lab-body').innerHTML = `<section class="lab-panel"><h2>Colar do Prontuário</h2>
      <p class="lab-small">Cole o texto do laudo ou da evolução. A extração é local, por expressões regulares fixas: nenhuma IA e nenhuma chamada de rede.</p>
      <label class="field"><span>Texto livre</span><textarea id="lab-paste" placeholder="${esc(EXEMPLO)}">${esc(S.pasteText || '')}</textarea></label>
      <div class="lab-row"><button type="button" class="btn" data-act="parse">Extrair e preencher a Bancada</button><button type="button" class="btn btn-ghost" data-act="exemplo">Usar exemplo</button></div>
      ${p ? `<h3>${p.found.length ? 'Valores reconhecidos' : 'Nenhum valor reconhecido'}</h3>${p.found.length ? `<div class="lab-tablewrap"><table class="lab-table"><thead><tr><th>Campo</th><th>Trecho</th><th>Valor</th><th>Unidade</th></tr></thead><tbody>${p.found.map((f) => `<tr><td>${esc(L.FIELD[f.field].label)}</td><td>${esc(f.alias)} ${esc(f.raw)}</td><td>${esc(L.fmt(f.value, f.value % 1 === 0 ? 0 : 2))}</td><td>${esc(L.FIELD[f.field].unit)}</td></tr>`).join('')}</tbody></table></div>` : ''}
      <p class="lab-small">Confira os valores e as unidades (assumidas: as da tabela acima). <button type="button" class="lab-seal" data-act="sub" data-sub="bancada">Ver na Bancada</button></p>` : ''}</section>`;
  }
  function extrair() {
    const t = document.getElementById('lab-paste').value;
    S.pasteText = t;
    S.parsed = L.parseReport(t);
    const val = S.parsed.values;
    Object.keys(val).forEach((k) => {
      if (k === 'gestante') S.raw.gestante = true; else if (k === 'sexo') S.raw.sexo = val[k]; else S.raw[k] = String(val[k]).replace('.', ',');
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
    else if (t.id === 'lab-q') { S.enc.q = t.value; listaEnc(); }
    else if (t.dataset.fl) { S.raw.flags = Object.assign({}, S.raw.flags, { [t.dataset.fl]: t.checked }); calc(); }
  });
  root.addEventListener('change', (e) => {
    if (e.target.dataset.edit) editar(e.target);
    else if (e.target.dataset.reg) { S.regulacao[e.target.dataset.reg] = e.target.value; store.set('labcore_regulacao', S.regulacao); }
  });

  render();
  window.addEventListener('hashchange', () => { if (location.hash === '#labcore') render(); });
})();
