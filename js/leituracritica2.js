/* Leitura crítica: subabas ROBINS-I (coortes) e AMSTAR 2 (revisões sistemáticas). Tudo calculado no navegador. */
(function () {
'use strict';
const root = document.getElementById('view-leitura');
if (!root || typeof RobinsI === 'undefined' || typeof Amstar2 === 'undefined') return;
const $ = (s, r) => (r || document).querySelector(s);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const META = {
  robinsi: { versao: '0.1.0', atualizado: '2026-10-13', doc: 'ROBINS-I detailed guidance, atualizado em 20 de outubro de 2016 (PDF oficial, 53 p.)', doi: '10.1136/bmj.i4919', nome: 'Sterne et al., BMJ 2016;355:i4919',
    pend: ['Julgamentos por domínio: o guia oficial os define por critérios descritivos (Tabelas 5 a 11), não por algoritmo das respostas. Por isso a ferramenta mostra o caminho de perguntas e os critérios, e quem decide é o avaliador. Só o julgamento global (Tabela 2) é calculado.',
      'Perguntas e critérios em português são tradução própria, ainda não revisada por tradutor oficial. O texto original em inglês está disponível em cada pergunta e em cada critério.',
      'Se as respostas a 1.2 ou 1.3 forem "sem informação" ou "não se aplica", o guia não diz qual bloco de perguntas responder; a ferramenta mostra os dois (confusão basal e variável no tempo).',
      'Não foram incluídos nesta versão o estágio de protocolo (domínios de confusão e co-intervenções) nem a direção prevista do viés, que são opcionais ou específicos da revisão.',
      'Versão do guia: 2016 (ROBINS-I original). Existe uma versão mais recente da ferramenta que não foi conferida aqui.'] },
  amstar: { versao: '0.1.0', atualizado: '2026-10-13', doc: 'checklist oficial do AMSTAR 2 (4 p.) e resumo do NCCMT (5 p.)', doi: '10.1136/bmj.j4008', nome: 'Shea et al., BMJ 2017;358:j4008',
    pend: ['O AMSTAR 2 não se destina a ser pontuado. Os documentos conferidos não trazem a regra de classificação geral de confiança (alta, moderada, baixa, criticamente baixa, que depende de domínios críticos do artigo original); por isso ela não está implementada. Pendente: conferir o artigo original.',
      'Cada item é derivado dos critérios que o avaliador marca, conforme o checklist oficial. Para os itens 9 e 11 a avaliação é feita separadamente para ensaios randomizados e estudos não randomizados; o checklist não diz como unir os dois resultados, e a ferramenta não os une.',
      'Critérios em português são tradução própria, ainda não revisada. O original em inglês está disponível em cada item.',
      'Alguns critérios dependem de contexto ("quando relevante", "se apropriado"): marque se o critério foi cumprido ou não se aplicava, conforme seu julgamento.'] }
};

let ultimo = { rbi: '', ams: '' };
const copiar = (btn, txt) => {
  const ok = () => { const t = btn.textContent; btn.textContent = 'Copiado'; setTimeout(() => { btn.textContent = t; }, 1800); };
  const fb = () => { const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); ok(); } catch (e) { btn.textContent = 'Copie manualmente'; } ta.remove(); };
  if (!txt) return;
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, fb); else fb();
};

/* ---------------- ROBINS-I ---------------- */
const OPT_CURTO = { Y: 'Sim', PY: 'Prov. sim', PN: 'Prov. não', N: 'Não', NI: 'Sem info.', NA: 'Não se aplica' };
const ICON = { baixo: '✔', moderado: '!', grave: '✖', critico: '✖', ni: '?' };
const COR = { baixo: 'baixo', moderado: 'algumas', grave: 'alto', critico: 'alto', ni: 'pend' };
const R = { estudo: '', desfecho: '', aim: 'assignment', resp: {}, jul: {} };
const resetR = () => { R.estudo = ''; R.desfecho = ''; R.aim = 'assignment'; R.resp = {}; R.jul = {}; };

function qHtml(d, q) {
  const cur = R.resp[q.id];
  const radios = RobinsI.opcoes(q).map((o) => `<label class="lc-opt"><input type="radio" name="rbi-${q.id}" data-rq="${q.id}" value="${o}"${cur === o ? ' checked' : ''}><span>${esc(OPT_CURTO[o])}</span></label>`).join('');
  return `<fieldset class="lc-q" data-rq-box="${q.id}" hidden><legend><span class="lc-n">${q.id}</span> ${esc(q.pt)}</legend><div class="lc-opts" role="radiogroup">${radios}</div>`
    + `<details class="lc-dica"><summary>Pergunta original (inglês)</summary><p lang="en">${esc(q.en)}</p></details></fieldset>`;
}
function domHtml(d, i) {
  const niveis = RobinsI.NIVEIS.map((n) => `<label class="lc-opt"><input type="radio" name="rbi-j-${d.id}" data-rj="${d.id}" value="${n}"><span>${esc(RobinsI.ROTULO[n])}</span></label>`).join('');
  const crit = RobinsI.NIVEIS.map((n) => `<li><b>${esc(RobinsI.ROTULO[n])}.</b> ${esc(d.criterios[n])}<details class="lc-dica"><summary>Original (inglês)</summary><p lang="en">${esc(d.criterios_en[n])}</p></details></li>`).join('');
  return `<details class="lc-grp" data-rdom="${d.id}"${i === 0 ? ' open' : ''}><summary><span>${i + 1}. ${esc(d.titulo)}</span><span class="lc-bd" data-rbd="${d.id}"></span></summary>`
    + d.perguntas.map((q) => qHtml(d, q)).join('')
    + `<fieldset class="lc-q lc-efeito"><legend>Julgamento do domínio (decisão do avaliador)</legend><p class="lc-cond" data-rsug="${d.id}" hidden></p><div class="lc-opts" role="radiogroup">${niveis}</div>`
    + `<details class="lc-dica"><summary>Critérios do guia para cada nível</summary><ul class="lc-crit">${crit}</ul></details></fieldset></details>`;
}
function buildRbi() {
  $('#lc-rbi-form').innerHTML =
    `<p class="lc-intro">Para estudos não randomizados de intervenções (coortes, caso-controle e similares). Imagine o ensaio randomizado que o estudo tenta emular (o "ensaio-alvo") e compare o estudo com ele.</p>
     <label class="lc-field"><span>Estudo (opcional)</span><input id="rbi-estudo" type="text" autocomplete="off" placeholder="ex.: autor, ano" value="${esc(R.estudo)}"></label>
     <label class="lc-field"><span>Desfecho avaliado (opcional)</span><input id="rbi-desfecho" type="text" autocomplete="off" placeholder="ex.: internação por insuficiência cardíaca em 12 meses" value="${esc(R.desfecho)}"></label>
     <fieldset class="lc-q lc-efeito"><legend>Efeito de interesse</legend>
      <label class="lc-opt lc-wide"><input type="radio" name="rbi-aim" value="assignment"${R.aim === 'assignment' ? ' checked' : ''}><span>Efeito da designação para a intervenção (perguntas 4.1 e 4.2).</span></label>
      <label class="lc-opt lc-wide"><input type="radio" name="rbi-aim" value="adhering"${R.aim === 'adhering' ? ' checked' : ''}><span>Efeito de iniciar e aderir à intervenção (perguntas 4.3 a 4.6).</span></label></fieldset>
     <p class="lc-intro">Responda as perguntas que aparecem e, ao fim de cada domínio, escolha o julgamento comparando com os critérios do guia. Julgar "risco" aqui significa risco de viés material: só o que pode alterar as conclusões.</p>
     ${RobinsI.DOMINIOS.map(domHtml).join('')}
     <div class="lc-actions"><button id="rbi-limpar" class="btn btn-ghost" type="button">Limpar</button><button id="rbi-copiar" class="btn" type="button">Copiar resumo</button></div>`;
}
function renderRbi() {
  const ds = RobinsI.DOMINIOS;
  ds.forEach((d) => {
    const vis = RobinsI.visiveis(d.id, R.resp, R.aim);
    d.perguntas.forEach((q) => { const el = document.querySelector(`#lc-rbi-form [data-rq-box="${q.id}"]`); if (el) el.hidden = !vis.includes(q.id); });
    const sug = RobinsI.sugestaoDominio(d.id, R.resp);
    const sEl = document.querySelector(`#lc-rbi-form [data-rsug="${d.id}"]`);
    sEl.hidden = !sug; sEl.textContent = sug ? 'O guia diz que, sem potencial de confusão (1.1 não/provavelmente não), o estudo pode ser considerado de baixo risco neste domínio.' : '';
    const j = R.jul[d.id];
    const b = document.querySelector(`#lc-rbi-form [data-rbd="${d.id}"]`);
    b.textContent = j ? ICON[j] + ' ' + RobinsI.ROTULO[j] : '';
    b.className = 'lc-bd' + (j ? ' lc-' + COR[j] : '');
  });
  const g = RobinsI.global(R.jul);
  const el = $('#lc-rbi-res');
  const nJul = ds.filter((d) => R.jul[d.id]).length;
  if (!nJul) { el.innerHTML = '<div class="lc-card lc-empty">Responda as perguntas e escolha o julgamento de cada domínio. O julgamento global é calculado pela regra da Tabela 2 do guia.</div>'; ultimo.rbi = ''; return; }
  const efRot = R.aim === 'assignment' ? 'Efeito da designação para a intervenção' : 'Efeito de iniciar e aderir à intervenção';
  const txt = { baixo: 'Baixo risco de viés em todos os domínios (comparável a um ensaio randomizado bem conduzido).', moderado: 'Baixo ou moderado risco em todos os domínios: evidência sólida para um estudo não randomizado, mas não comparável a um ensaio randomizado bem conduzido.', grave: 'Risco grave em pelo menos um domínio, sem risco crítico: o estudo tem problemas importantes.', critico: 'Risco crítico em pelo menos um domínio: o estudo é problemático demais para fornecer evidência útil e não deve entrar em uma síntese.', ni: 'Sem indicação clara de risco grave ou crítico, mas faltam informações em domínio(s) importante(s).' };
  let glob;
  if (g.global) glob = `<div class="lc-card lc-glob lc-${COR[g.global]}"><p class="lc-gl">Julgamento global (Tabela 2 do guia)</p><h3><span class="lc-di">${ICON[g.global]}</span> ${esc(RobinsI.ROTULO[g.global])}</h3><p>${esc(txt[g.global])}</p>${g.notas.map((n) => `<p class="lc-warn"><b>Atenção</b> ${esc(n)}</p>`).join('')}</div>`;
  else glob = `<div class="lc-card lc-glob"><p class="lc-gl">Julgamento global (Tabela 2 do guia)</p><h3>Incompleto</h3><p>${g.faltam} domínio(s) ainda sem julgamento.</p></div>`;
  const linhas = ds.map((d, i) => { const j = R.jul[d.id]; return `<li class="lc-dom ${j ? 'lc-' + COR[j] : 'lc-pend'}"><span class="lc-di">${j ? ICON[j] : '…'}</span><span><b>${i + 1}. ${esc(d.titulo)}</b><br>${j ? esc(RobinsI.ROTULO[j]) : 'Sem julgamento'}</span></li>`; }).join('');
  el.innerHTML = glob + `<div class="lc-card"><h3 class="lc-h">Por domínio</h3><ul class="lc-doms">${linhas}</ul><p class="lc-note">Julgamentos dos domínios escolhidos pelo avaliador. ${esc(efRot)}.</p></div>`;
  const L = ['Risco de viés (ROBINS-I, estudo não randomizado): apoio à decisão; confirme na leitura do artigo'];
  if (R.estudo) L.push('Estudo: ' + R.estudo);
  if (R.desfecho) L.push('Desfecho: ' + R.desfecho);
  L.push('Efeito de interesse: ' + efRot);
  ds.forEach((d, i) => L.push(`${i + 1}. ${d.titulo}: ${R.jul[d.id] ? RobinsI.ROTULO[R.jul[d.id]] : 'sem julgamento'}`));
  L.push('Global: ' + (g.global ? RobinsI.ROTULO[g.global] : 'incompleto'));
  g.notas.forEach((n) => L.push('Atenção: ' + n));
  L.push('Fonte: ' + META.robinsi.nome);
  ultimo.rbi = L.join('\n');
}

/* ---------------- AMSTAR 2 ---------------- */
const A = { desenho: '', ma: null, marcas: {}, marcasRct: {}, marcasNrsi: {}, tocado: {} };
const resetA = () => { A.desenho = ''; A.ma = null; A.marcas = {}; A.marcasRct = {}; A.marcasNrsi = {}; A.tocado = {}; };
const critHtml = (nome, c, marcado, extra) => `<label class="lc-opt lc-wide"${extra || ''}><input type="checkbox" ${nome} value="${c.id}"${marcado ? ' checked' : ''}><span>${esc(c.pt)}</span></label>`
  + `<details class="lc-dica lc-orig"><summary>Original (inglês)</summary><p lang="en">${esc(c.en)}</p></details>`;
function blocoHtml(it, spec, escopo, store) {
  const m = store[it.n] || {};
  const nome = (c) => `data-a="${it.n}" data-e="${escopo}" name="a-${it.n}-${escopo}-${c.id}"`;
  const por = (ids) => spec.criterios.filter((c) => ids.includes(c.id));
  let h = '';
  const alts = spec.yes;
  const usados = new Set([].concat(spec.py || [], ...alts));
  if (spec.py) h += `<p class="lc-sub">Para "Sim parcial" (todos):</p>` + por(spec.py).map((c) => critHtml(nome(c), c, m[c.id])).join('');
  if (alts.length === 1) h += `<p class="lc-sub">${spec.py ? 'Para "Sim", além dos anteriores (todos):' : 'Para "Sim" (todos):'}</p>` + por(alts[0]).map((c) => critHtml(nome(c), c, m[c.id], c.id === 'sp' && it.n === 11 ? ' data-so-ambos' : '')).join('');
  else h += `<p class="lc-sub">Para "Sim" basta uma das opções:</p>` + spec.criterios.filter((c) => usados.has(c.id)).map((c) => critHtml(nome(c), c, m[c.id])).join('');
  const extras = spec.criterios.filter((c) => !usados.has(c.id));
  if (extras.length) h += `<p class="lc-sub">Opcional (não muda o resultado):</p>` + extras.map((c) => critHtml(nome(c), c, m[c.id])).join('');
  return h;
}
function itemHtml(it) {
  let corpo;
  if (it.porDesenho) {
    corpo = ['rct', 'nrsi'].map((t) => `<div data-a9="${it.n}-${t}" hidden><p class="lc-sub"><b>${t === 'rct' ? 'Ensaios randomizados' : 'Estudos não randomizados'}</b></p>${blocoHtml(it, it[t], t, t === 'rct' ? A.marcasRct : A.marcasNrsi)}</div>`).join('');
  } else corpo = blocoHtml(it, it, 'x', A.marcas);
  return `<details class="lc-grp" data-aitem="${it.n}"><summary><span>${it.n}. ${esc(it.pt)}</span><span class="lc-bd" data-abd="${it.n}"></span></summary>`
    + `<div class="lc-q"><div data-anma="${it.n}" hidden><p class="lc-cond">Sem meta-análise: este item não se aplica.</p></div><div data-acorpo="${it.n}">${corpo}</div>`
    + `<details class="lc-dica"><summary>Pergunta original (inglês)</summary><p lang="en">${esc(it.en)}</p></details></div></details>`;
}
function buildAms() {
  $('#lc-ams-form').innerHTML =
    `<p class="lc-intro">Para revisões sistemáticas de intervenções (com ensaios randomizados, estudos não randomizados ou ambos). O instrumento não gera pontuação: o resultado de cada item vem dos critérios que você marcar.</p>
     <fieldset class="lc-q lc-efeito"><legend>Desenhos incluídos na revisão</legend>
      ${[['rct', 'Só ensaios randomizados'], ['nrsi', 'Só estudos não randomizados'], ['ambos', 'Ambos']].map(([v, t]) => `<label class="lc-opt lc-wide"><input type="radio" name="a-des" value="${v}"${A.desenho === v ? ' checked' : ''}><span>${t}</span></label>`).join('')}</fieldset>
     <fieldset class="lc-q lc-efeito"><legend>A revisão fez meta-análise?</legend>
      <label class="lc-opt"><input type="radio" name="a-ma" value="sim"${A.ma === true ? ' checked' : ''}><span>Sim</span></label><label class="lc-opt"><input type="radio" name="a-ma" value="nao"${A.ma === false ? ' checked' : ''}><span>Não</span></label></fieldset>
     ${Amstar2.ITENS.map(itemHtml).join('')}
     <div class="lc-actions"><button id="ams-limpar" class="btn btn-ghost" type="button">Limpar</button><button id="ams-copiar" class="btn" type="button">Copiar resumo</button></div>`;
}
const RES_COR = { yes: 'baixo', partial: 'algumas', no: 'alto', nma: 'pend', incompleto: 'pend' };
const RES_ICON = { yes: '✔', partial: '!', no: '✖', nma: '–', incompleto: '…' };
function textoRes(r) {
  if (r.partes) return Object.keys(r.partes).map((t) => (t === 'rct' ? 'ensaios: ' : 'não randomizados: ') + Amstar2.ROTULO[r.partes[t]]).join(' · ');
  return Amstar2.ROTULO[r.resultado];
}
function renderAms() {
  const out = Amstar2.avaliar({ desenho: A.desenho || null, ma: A.ma, marcas: A.marcas, marcasRct: A.marcasRct, marcasNrsi: A.marcasNrsi });
  const sem = A.ma === false, des = A.desenho;
  document.querySelectorAll('#lc-ams-form [data-a9]').forEach((d) => { const t = d.dataset.a9.split('-')[1]; d.hidden = !(des === 'ambos' || des === t); });
  document.querySelectorAll('#lc-ams-form [data-so-ambos]').forEach((d) => { d.hidden = des !== 'ambos'; });
  document.querySelectorAll('#lc-ams-form .lc-orig').forEach((d, i, all) => { const prev = d.previousElementSibling; if (prev && prev.hasAttribute('data-so-ambos')) d.hidden = des !== 'ambos'; });
  const rows = Amstar2.ITENS.map((it) => {
    const r = out.find((x) => x.n === it.n);
    const nma = it.ma && sem;
    document.querySelector(`#lc-ams-form [data-anma="${it.n}"]`).hidden = !nma;
    document.querySelector(`#lc-ams-form [data-acorpo="${it.n}"]`).hidden = nma;
    const tocou = nma || A.tocado[it.n];
    const needDes = it.porDesenho && !des;
    const res = needDes ? { n: it.n, resultado: 'incompleto' } : (tocou ? r : { n: it.n, resultado: 'incompleto' });
    const txt = res.resultado === 'incompleto' && !needDes ? 'Sem resposta' : needDes ? 'Escolha os desenhos incluídos' : textoRes(res);
    const key = res.partes ? (Object.values(res.partes).every((x) => x === 'yes') ? 'yes' : Object.values(res.partes).every((x) => x === 'no') ? 'no' : 'partial') : res.resultado;
    const b = document.querySelector(`#lc-ams-form [data-abd="${it.n}"]`);
    b.textContent = (tocou && !needDes) ? RES_ICON[key] + ' ' + txt : '';
    b.className = 'lc-bd lc-' + RES_COR[key];
    return { it, res, txt, key, tocou: tocou && !needDes };
  });
  const feitos = rows.filter((x) => x.tocou);
  const el = $('#lc-ams-res');
  if (!feitos.length) { el.innerHTML = '<div class="lc-card lc-empty">Marque os critérios cumpridos em cada item. O AMSTAR 2 não gera pontuação: o resultado aparece item a item.</div>'; ultimo.ams = ''; return; }
  const n = (k) => feitos.filter((x) => x.key === k).length;
  const nao = feitos.filter((x) => x.key === 'no' || (x.res.partes && x.key !== 'yes'));
  const linhas = rows.map((x) => `<li class="lc-dom ${x.tocou ? 'lc-' + RES_COR[x.key] : 'lc-pend'}"><span class="lc-di">${x.tocou ? RES_ICON[x.key] : '…'}</span><span><b>${x.it.n}.</b> ${esc(x.it.pt)}<br>${x.tocou ? esc(x.txt) : 'Sem resposta'}</span></li>`).join('');
  el.innerHTML = `<div class="lc-card lc-glob"><p class="lc-gl">Resumo por item (sem pontuação)</p><h3>${feitos.length} de 16 itens respondidos</h3><p>Sim: ${n('yes')} · Sim parcial: ${n('partial')} · Não: ${n('no')} · Sem meta-análise: ${n('nma')}</p>`
    + `<p class="lc-warn"><b>Atenção</b> A classificação geral de confiança nos resultados (alta a criticamente baixa) depende de itens críticos do artigo original e ainda não está implementada. Não some itens para chegar a uma nota.</p></div>`
    + `<div class="lc-card"><h3 class="lc-h">Por item</h3><ul class="lc-doms">${linhas}</ul></div>`;
  const L = ['Avaliação de revisão sistemática (AMSTAR 2): apoio à decisão; confirme na leitura do artigo', 'Desenhos incluídos: ' + ({ rct: 'ensaios randomizados', nrsi: 'estudos não randomizados', ambos: 'ambos' }[des] || 'não informado'), 'Meta-análise: ' + (A.ma === false ? 'não' : A.ma === true ? 'sim' : 'não informado')];
  rows.forEach((x) => L.push(`${x.it.n}. ${x.it.pt} ${x.tocou ? x.txt : 'sem resposta'}`));
  L.push('Instrumento sem pontuação. Fonte: ' + META.amstar.nome);
  ultimo.ams = L.join('\n');
}

/* ---------------- subabas e eventos ---------------- */
function mostrar(sub) {
  $('#lc-pane-rob').hidden = true; $('#lc-pane-ef').hidden = true;
  root.querySelectorAll('.lc-ext').forEach((p) => { p.hidden = p.id !== 'lc-pane-' + sub; });
  root.querySelectorAll('.lc-seg button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.sub === sub)));
  const m = META[sub === 'robins' ? 'robinsi' : 'amstar'];
  $('#lc-pend2').innerHTML = m.pend.map((p) => `<li>${esc(p)}</li>`).join('');
  $('#lc-rodape2').textContent = (sub === 'robins' ? 'ROBINS-I' : 'AMSTAR 2') + ' v' + m.versao + ' (' + m.doc + '), conferido em ' + m.atualizado.split('-').reverse().join('/') + '. Fonte: ' + m.nome + ' (doi ' + m.doi + ').';
  if (sub === 'robins') renderRbi(); else renderAms();
}
function init() {
  buildRbi(); buildAms();
  root.addEventListener('click', (e) => {
    const b = e.target.closest('.lc-seg button[data-ext]');
    if (b) { mostrar(b.dataset.sub); return; }
    if (e.target.closest('.lc-seg button')) { $('#lc-pend2').innerHTML = ''; $('#lc-rodape2').textContent = ''; return; }
    if (e.target.closest('#rbi-limpar')) { resetR(); buildRbi(); renderRbi(); return; }
    if (e.target.closest('#ams-limpar')) { resetA(); buildAms(); renderAms(); return; }
    const c = e.target.closest('#rbi-copiar, #ams-copiar');
    if (c) copiar(c, c.id === 'rbi-copiar' ? ultimo.rbi : ultimo.ams);
  });
  root.addEventListener('change', (e) => {
    const t = e.target;
    if (t.matches('input[data-rq]')) { R.resp[t.dataset.rq] = t.value; renderRbi(); return; }
    if (t.matches('input[data-rj]')) { R.jul[t.dataset.rj] = t.value; renderRbi(); return; }
    if (t.name === 'rbi-aim') { R.aim = t.value; renderRbi(); return; }
    if (t.name === 'a-des') { A.desenho = t.value; renderAms(); return; }
    if (t.name === 'a-ma') { A.ma = t.value === 'sim'; renderAms(); return; }
    if (t.matches('input[type=checkbox][data-a]')) {
      const n = Number(t.dataset.a), esc_ = t.dataset.e, store = esc_ === 'rct' ? A.marcasRct : esc_ === 'nrsi' ? A.marcasNrsi : A.marcas;
      store[n] = store[n] || {}; store[n][t.value] = t.checked; A.tocado[n] = true; renderAms();
    }
  });
  root.addEventListener('input', (e) => {
    if (e.target.id === 'rbi-estudo') { R.estudo = e.target.value; renderRbi(); }
    else if (e.target.id === 'rbi-desfecho') { R.desfecho = e.target.value; renderRbi(); }
  });
}
init();
})();
