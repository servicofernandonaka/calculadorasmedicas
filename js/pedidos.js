/* Pedidos de exames especiais (aba): formulário, texto pronto para o prontuário e pendências.
   Nenhum dado é enviado ou guardado: tudo roda neste navegador. O texto é do profissional: pode editar antes de copiar. */
(function () {
  'use strict';
  const D = window.PedidosDados, E = window.PedidosEngine;
  if (!D || !E) return;

  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeUrl = (u) => (/^https:\/\//.test(u) ? u : '#');
  const PRIOR = D.prioridades || E.PRIORIDADES;
  const ROTULOS = D.chavesRotulos || {};

  const novo = () => ({ exame: '', idade: '', sexo: '', solicitante: '', prioridade: '', cid: '', criterios: new Set(), quadro: '', campos: {}, obs: '', contraRevisadas: false });
  let st = novo();
  let editado = false;   // o profissional mexeu no texto: não sobrescrever
  let ultimo = '';       // último texto gerado pelo formulário
  let ultimoHtml = '';   // evita refazer a tela (e perder o foco ou o clique) quando nada mudou

  const SISTEMAS = [];
  D.exames.forEach((x) => { if (!SISTEMAS.includes(x.sistema)) SISTEMAS.push(x.sistema); });

  function formBase() {
    const opts = SISTEMAS.map((s) =>
      `<optgroup label="${esc(s)}">${D.exames.filter((x) => x.sistema === s).map((x) => `<option value="${esc(x.id)}">${esc(x.nomeCurto || x.nome)}</option>`).join('')}</optgroup>`).join('');
    return `<label class="pd-field"><span>Exame a solicitar</span>
        <select id="pd-exame"><option value="">Selecione…</option>${opts}</select></label>
      <div class="pd-row2">
        <label class="pd-field" id="pd-f-idade"><span>Idade (anos)</span><input id="pd-idade" type="number" inputmode="numeric" min="0" max="120" step="1" autocomplete="off"></label>
        <label class="pd-field"><span>Sexo</span><select id="pd-sexo"><option value="">Selecione…</option><option value="F">Feminino</option><option value="M">Masculino</option></select></label>
      </div>
      <label class="pd-field"><span>Profissional solicitante</span><select id="pd-solicitante"><option value="">Selecione…</option>${(D.solicitantes || []).map((s) => `<option value="${esc(s.v)}">${esc(s.rotulo)}</option>`).join('')}</select></label>
      <label class="pd-field"><span>Prioridade</span><select id="pd-prioridade"><option value="">Selecione…</option>${Object.keys(PRIOR).map((k) => `<option value="${k}">${esc(PRIOR[k])}</option>`).join('')}</select>
        <small class="pd-dica" id="pd-prior-dica">${esc(D.prioridadesDica || '')}</small></label>
      <div id="pd-exame-bloco"></div>
      <div class="pd-actions"><button id="pd-limpar" class="btn btn-ghost" type="button">Limpar</button></div>`;
  }

  function blocoExame(ex) {
    if (!ex) return '';
    const cids = `<label class="pd-field"><span>CID-10 da indicação</span><select id="pd-cid"><option value="">Selecione…</option>${ex.cids.map((c) => `<option value="${esc(c[0])}">${esc(c[0])} - ${esc(c[1])}</option>`).join('')}</select></label>`;
    const grupos = ex.grupos.map((g, gi) => `<fieldset class="pd-grp"><legend>${esc(g.rotulo)}</legend>${g.dica ? `<p class="pd-dica">${esc(g.dica)}</p>` : ''}` +
      g.criterios.map((c) => `<label class="pd-check"><input type="checkbox" data-crit="${esc(c.id)}"><span>${esc(c.rotulo)}${c.detalhe ? `<small>${esc(c.detalhe)}</small>` : ''}${c.v === false ? '<small class="pd-pend">Critério usual, ainda sem conferência no texto da diretriz</small>' : ''}</span></label>`).join('') + '</fieldset>').join('');
    const contra = (ex.contra && ex.contra.length) ? `<fieldset class="pd-grp pd-contra"><legend>Contraindicações e cuidados (marque se presentes)</legend>` +
      ex.contra.map((c) => `<label class="pd-check"><input type="checkbox" data-crit="${esc(c.id)}"><span>${esc(c.rotulo)}${c.detalhe ? `<small>${esc(c.detalhe)}</small>` : ''}</span></label>`).join('') +
      (ex.contraConfirmacao ? `<label class="pd-check pd-confirma"><input type="checkbox" id="pd-contra-ok"><span>Revisei as contraindicações e nenhuma está presente<small>Entra no texto do pedido</small></span></label>` : '') + '</fieldset>' : '';
    const campoHtml = (c) => `<label class="pd-field"><span>${esc(c.rotulo)}</span>` +
      (c.tipo === 'escolha' ? `<select data-campo="${esc(c.id)}"><option value="">Selecione…</option>${c.opcoes.map((o) => `<option value="${esc(o[0])}">${esc(o[1])}</option>`).join('')}</select>`
        : c.tipo === 'area' ? `<textarea data-campo="${esc(c.id)}" rows="2"></textarea>`
        : `<input type="text"${c.tipo === 'numero' ? ' inputmode="decimal"' : ''} data-campo="${esc(c.id)}" autocomplete="off">`) +
      (c.dica ? `<small class="pd-dica">${esc(c.dica)}</small>` : '') + '</label>';
    const campos = (ex.campos || []).concat(D.camposGerais || []).map(campoHtml).join('');
    const quem = (ex.solicitantes && ex.solicitantes.length) ? `<details class="pd-nao"><summary>Quem pode solicitar (protocolo de ${esc(D.municipio || 'regulação')})</summary><ul>${ex.solicitantes.map((k) => `<li>${esc(ROTULOS[k] || k)}</li>`).join('')}</ul></details>` : '';
    const orient = (ex.orientacoes && ex.orientacoes.length) ? `<details class="pd-nao" open><summary>Orientações de preparo (ficha de ${esc(D.municipio || 'regulação')})</summary><ul>${ex.orientacoes.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></details>` : '';
    const naoInd = (ex.naoIndicado && ex.naoIndicado.length) ? `<details class="pd-nao"><summary>Quando o pedido costuma ser negado ou não é indicado</summary><ul>${ex.naoIndicado.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></details>` : '';
    const nota = ex.notaProtocolo ? `<p class="pd-dica pd-nota-prot">${esc(ex.notaProtocolo)}</p>` : '';
    return `${nota}${quem}${cids}${grupos}${contra}${campos}
      <label class="pd-field"><span>Justificativa clínica (quadro clínico)</span><textarea id="pd-quadro" rows="3" placeholder="Sintomas, tempo de evolução, conduta já adotada"></textarea></label>
      <label class="pd-field"><span>Observações (opcional)</span><textarea id="pd-obs" rows="2"></textarea></label>${orient}${naoInd}`;
  }

  function entrada() {
    return { exame: st.exame, idade: st.idade === '' ? '' : Number(st.idade), sexo: st.sexo, solicitante: st.solicitante, prioridade: st.prioridade, cid: st.cid,
      criterios: [...st.criterios], quadro: st.quadro, campos: st.campos, obs: st.obs, contraRevisadas: st.contraRevisadas };
  }

  function fontesHtml(ex, res) {
    const usados = new Set(res.criteriosMarcados.map((id) => { const c = E.todosCriterios(ex).find((x) => x.id === id); return c && c.fonte; }).filter(Boolean));
    const lista = Object.keys(ex.fontes || {}).filter((k) => usados.has(k));
    const conf = ex.conferencia || {};
    const pend = (conf.pendencias || []).map((p) => `<li>${esc(p)}</li>`).join('');
    const marc = res.criteriosMarcados.map((id) => E.todosCriterios(ex).find((x) => x.id === id)).filter((c) => c && c.v === false);
    const locais = D.fontesRegulacao ? ['diretrizes', 'protocolos'].concat(ex.fontes && ex.fontes.ficha ? ['ficha'] : []).map((k) => D.fontesRegulacao[k]).filter(Boolean) : [];
    return `<details class="pd-fontes"><summary>Fontes e conferência</summary>` +
      (locais.length ? `<p class="pd-lab">Regulação de ${esc(D.municipio || '')}</p><ul class="pd-src">${locais.map((f) => `<li>${esc(f.nome)}<p>${esc(f.nota)}</p></li>`).join('')}</ul><p class="pd-lab">Fontes dos critérios marcados</p>` : '') +
      (lista.length ? `<ul class="pd-src">${lista.map((k) => { const f = ex.fontes[k]; return `<li>${f.link ? `<a href="${esc(safeUrl(f.link))}" target="_blank" rel="noopener noreferrer">${esc(f.nome)}</a>` : esc(f.nome)}${f.nota ? `<p>${esc(f.nota)}</p>` : ''}</li>`; }).join('')}</ul>` : '<p class="pd-dica">Marque critérios para ver as fontes.</p>') +
      (marc.length ? `<p class="pd-aviso-v"><strong>Critérios ainda sem conferência no texto da fonte:</strong> ${marc.map((c) => esc(c.rotulo)).join('; ')}.</p>` : '') +
      (conf.data ? `<p class="pd-dica">Conferido em ${esc(conf.data.split('-').reverse().join('/'))}${conf.nivel ? ` (${esc(conf.nivel)})` : ''}.</p>` : '') +
      (pend ? `<p class="pd-lab">Pendências</p><ul>${pend}</ul>` : '') + '</details>';
  }

  function render() {
    const alvo = $('#pd-resultado');
    const res = E.montar(D, entrada());
    const ex = res.exame;
    if (!ex) {
      alvo.innerHTML = `<div class="pd-card pd-empty"><p><b>Escolha o exame para começar.</b> Marque os critérios que o paciente cumpre e o texto da justificativa aparece aqui, pronto para colar no prontuário.</p></div>`;
      ultimoHtml = '';
      $('#pd-status').textContent = '';
      return;
    }
    const avisos = res.avisos.map((a) => `<div class="pd-warn pd-${a.nivel}"><b>${a.nivel === 'alto' ? 'Não solicitar' : a.nivel === 'info' ? 'Lembrete' : 'Atenção'}</b> ${esc(a.texto)}</div>`).join('');
    let miolo;
    if (res.pronto) {
      if (!editado) ultimo = res.texto;
      miolo = `<div class="pd-card"><label class="pd-lab" for="pd-texto">Texto para colar no prontuário (pode editar)</label>
        <textarea id="pd-texto" class="pd-texto" rows="16" spellcheck="true">${esc(editado ? ($('#pd-texto') ? $('#pd-texto').value : ultimo) : res.texto)}</textarea>
        <div class="pd-actions"><button id="pd-copiar" class="btn" type="button">Copiar texto</button>
        <button id="pd-refazer" class="btn btn-ghost" type="button"${editado ? '' : ' hidden'}>Refazer a partir do formulário</button></div>
        <p class="pd-dica" id="pd-edit-nota"${editado ? '' : ' hidden'}>Você editou o texto: ele não muda sozinho quando o formulário muda.</p></div>`;
    } else if (res.bloqueado) {
      miolo = '<div class="pd-card pd-empty"><p>O texto não é gerado enquanto houver um item que impede o pedido.</p></div>';
    } else {
      miolo = `<div class="pd-card pd-faltas"><p class="pd-lab">Para gerar o texto, falta:</p><ul>${res.faltas.map((f) => `<li>${esc(f)}</li>`).join('')}</ul></div>`;
    }
    const html = avisos + miolo + fontesHtml(ex, res);
    if (html !== ultimoHtml) { alvo.innerHTML = html; ultimoHtml = html; }
    $('#pd-status').textContent = res.pronto ? 'Texto do pedido pronto.' : res.bloqueado ? 'Pedido não recomendado: veja o aviso.' : `Faltam ${res.faltas.length} item(ns) para gerar o texto.`;
  }

  function copiar() {
    const t = $('#pd-texto'); if (!t) return;
    const b = $('#pd-copiar');
    const ok = () => { b.textContent = 'Copiado'; setTimeout(() => { if (b) b.textContent = 'Copiar texto'; }, 1800); };
    const fb = () => { t.select(); try { document.execCommand('copy'); ok(); } catch (e) { b.textContent = 'Copie manualmente'; } };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t.value).then(ok, fb); else fb();
  }

  function init() {
    const f = $('#pd-form'); if (!f) return;
    f.innerHTML = formBase();
    const res = $('#pd-resultado');
    $('#pd-rodape').textContent = `Critérios v${D.versao}, atualizados em ${D.atualizadoEm.split('-').reverse().join('/')}. O texto é um apoio: a decisão e o protocolo local de regulação são do profissional.`;

    const sync = (e) => {
      const t = e.target;
      // Campos de texto já foram tratados a cada tecla ('input'); no 'change' (ao sair do campo) não há o que refazer
      if (e.type === 'change' && t.matches('input[type=text], input[type=number], textarea')) return;
      if (t.id === 'pd-exame') {
        st = Object.assign(novo(), { idade: st.idade, sexo: st.sexo, solicitante: st.solicitante, prioridade: st.prioridade, exame: t.value });
        editado = false;
        $('#pd-exame-bloco').innerHTML = blocoExame(E.achaExame(D, st.exame));
      } else if (t.id === 'pd-idade') {
        st.idade = t.value.trim();
        const v = Number(st.idade), bad = st.idade !== '' && !(Number.isInteger(v) && v >= 0 && v <= 120);
        $('#pd-f-idade').classList.toggle('pd-invalid', bad); t.setAttribute('aria-invalid', String(bad));
      } else if (t.id === 'pd-sexo') st.sexo = t.value;
      else if (t.id === 'pd-solicitante') st.solicitante = t.value;
      else if (t.id === 'pd-prioridade') { st.prioridade = t.value; const d = $('#pd-prior-dica'); if (d) d.textContent = (D.prioridadesDetalhe || {})[t.value] || D.prioridadesDica || ''; }
      else if (t.id === 'pd-cid') st.cid = t.value;
      else if (t.id === 'pd-quadro') st.quadro = t.value;
      else if (t.id === 'pd-obs') st.obs = t.value;
      else if (t.id === 'pd-contra-ok') st.contraRevisadas = t.checked;
      else if (t.dataset && t.dataset.crit) { t.checked ? st.criterios.add(t.dataset.crit) : st.criterios.delete(t.dataset.crit); }
      else if (t.dataset && t.dataset.campo) st.campos[t.dataset.campo] = t.value;
      else return;
      render();
    };
    f.addEventListener('change', sync);
    f.addEventListener('input', (e) => { if (e.target.matches('input[type=number], input[type=text], textarea')) sync(e); });
    f.addEventListener('click', (e) => {
      if (e.target.closest('#pd-limpar')) {
        st = novo(); editado = false; f.innerHTML = formBase(); render(); $('#pd-exame').focus();
      }
    });
    res.addEventListener('input', (e) => { if (e.target.id === 'pd-texto') { editado = true; ultimoHtml = ''; const r = $('#pd-refazer'), n = $('#pd-edit-nota'); if (r) r.hidden = false; if (n) n.hidden = false; } });
    res.addEventListener('click', (e) => {
      if (e.target.closest('#pd-copiar')) copiar();
      else if (e.target.closest('#pd-refazer')) { editado = false; ultimoHtml = ''; render(); }
    });
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
