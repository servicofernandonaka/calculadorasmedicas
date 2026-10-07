/*
 * Assistente IA.
 * - Modo guia (offline): sugere calculadoras e materiais por palavras-chave, sem enviar dados a lugar nenhum.
 * - Modo Claude: usa o SDK oficial da Anthropic direto no navegador com a chave do próprio usuário.
 */
(function () {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const { esc, norm } = window.App;
  const CALCS = window.CALCS;
  const EDU = window.EDU;

  const SDK_URLS = [
    'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk/+esm',
    'https://esm.sh/@anthropic-ai/sdk',
  ];
  const MODELS = {
    'claude-opus-5-5': { effort: true, fallbacks: true },
    'claude-sonnet-5-5': { effort: true, fallbacks: true },
    'claude-haiku-4-5': { effort: false, fallbacks: false },
  };

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignora */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignora */ } },
  };

  const state = {
    key: store.get('anthropic_key') || '',
    model: store.get('anthropic_model') || 'claude-opus-5-5',
    history: [], // histórico enviado à API (somente no modo Claude)
    busy: false,
    sdk: null,
  };
  if (!MODELS[state.model]) state.model = 'claude-opus-5-5';

  /* ---------- prompt do sistema ---------- */
  const catalog = CALCS.map((c) => `- ${c.id} | ${c.name} | ${c.category} | abas: ${c.tabs.join(', ')} | ${c.short}`).join('\n');
  const eduCatalog = EDU.map((e) => `- ${e.id} | ${e.title}`).join('\n');
  const SYSTEM = `Você é o assistente do site MedCalc, um conjunto de calculadoras médicas e material educativo em português do Brasil.
Seu papel é GUIAR o usuário: entender a situação clínica, indicar quais calculadoras do site usar e em que ordem, explicar como
interpretar os resultados e apontar o material educativo adequado para pacientes.

Público: principalmente médicos e estudantes; às vezes pacientes. Ajuste a linguagem: técnica e objetiva para profissionais;
simples e acolhedora para pacientes.

Regras:
- Responda em português do Brasil, de forma concisa (normalmente até ~200 palavras), com listas curtas quando ajudar.
- Para indicar uma calculadora do site, escreva exatamente o marcador [[calc:ID]] (o site o transforma em botão). Para material
  educativo, use [[edu:ID]]. Use apenas os IDs dos catálogos abaixo; não invente IDs.
- Se uma ferramenta pedida não existir no site, diga isso e sugira a alternativa mais próxima do catálogo.
- Baseie-se em diretrizes reconhecidas (SBC, SBD, FEBRASGO, ABRASSO, KDIGO, ESC, ACC/AHA, ACOG) e cite-as quando relevante.
  Se houver incerteza ou divergência entre diretrizes, diga isso.
- Você apoia, mas não substitui, o julgamento clínico. Não faça diagnóstico definitivo nem prescrição individualizada para pacientes leigos;
  oriente procurar a equipe de saúde.
- Diante de sinais de emergência (dor torácica, sinais de AVC, falta de ar intensa, sangramento importante na gestação etc.),
  oriente ligar 192 (SAMU) ou procurar o pronto-socorro imediatamente.
- Se o usuário enviar dados que identifiquem pacientes (nome, CPF, prontuário), lembre-o de não fazer isso.

Abas do site: clinica (Clínica), cirurgia (Cirúrgica), gineco (Ginecologia & Obstetrícia), geriatria (Geriatria), educacao (Paciente: Hipertensão).

Catálogo de calculadoras (ID | nome | categoria | abas | descrição):
${catalog}

Material educativo para pacientes — hipertensão (ID | título):
${eduCatalog}`;

  /* ---------- modo guia (offline) ---------- */
  const STOP = new Set(('de da do das dos para com sem uma umas uns por que qual quais como sobre meu minha seu sua ' +
    'paciente pacientes risco calcular calculadora escore usar posso devo tem ter esta este isso essa esse nos nas ' +
    'mais muito ajuda ajude quero preciso saber fazer avaliar anos ano idade mulher homem senhora senhor ' +
    'adulto adulta').split(' '));
  const SYN = {
    idoso: 'geriatria idoso', idosa: 'geriatria idoso', idosos: 'geriatria idoso', velhice: 'geriatria idoso',
    demencia: 'cognicao memoria', memoria: 'cognicao demencia', esquecimento: 'memoria cognicao',
    confuso: 'delirium', confusao: 'delirium', depressao: 'humor gds', triste: 'depressao humor',
    queda: 'quedas', caiu: 'queda', desnutricao: 'nutricao mna', escara: 'lesao por pressao braden',
    fragil: 'fragilidade', dependente: 'funcionalidade dependencia',
    gravida: 'gestacao gravidez pre-natal', gestante: 'gestacao gravidez pre-natal', gestacao: 'gravidez pre-natal',
    gravidez: 'gestacao pre-natal', grávida: 'gestacao', prenatal: 'pre-natal',
    cirurgia: 'pre-operatorio cirurgico', operar: 'pre-operatorio', operatorio: 'pre-operatorio',
    coracao: 'cardiovascular infarto', cardiaco: 'cardiovascular', infarto: 'cardiovascular',
    osso: 'osteoporose fratura', ossos: 'osteoporose fratura', fraturas: 'fratura osteoporose',
    trombose: 'tev tvp', embolia: 'tep', tev: 'trombose', rim: 'renal tfg creatinina', rins: 'renal tfg',
    figado: 'cirrose hepatica', acucar: 'diabetes glicemia', glicose: 'diabetes glicemia',
    pressao: 'hipertensao pa', hipertenso: 'hipertensao pa', hipertensao: 'pa pressao',
    gordura: 'obesidade imc', peso: 'imc obesidade', parto: 'bishop apgar parto',
    bebe: 'apgar recem-nascido peso fetal', menopausa: 'osteoporose densitometria',
    sangramento: 'hemorragia sangramento choque', avc: 'fibrilacao avc', arritmia: 'fibrilacao',
  };

  function tokens(text) {
    const base = norm(text).replace(/[^a-z0-9\-\s]/g, ' ').split(/\s+/).filter((t) => t.length >= 3 && !STOP.has(t));
    const out = new Set(base);
    base.forEach((t) => {
      if (t.length > 4 && t.endsWith('s')) out.add(t.slice(0, -1)); // plural simples: quedas → queda
      (SYN[t] || '').split(' ').filter((s) => s.length >= 3).forEach((s) => out.add(s));
    });
    return [...out];
  }

  function rankCalcs(text, limit = 5) {
    const toks = tokens(text);
    if (!toks.length) return [];
    const ranked = CALCS.map((c) => {
      const name = norm(c.name), kw = norm(c.keywords), other = norm(c.short + ' ' + c.category);
      let s = 0;
      for (const t of toks) {
        if (name.includes(t)) s += 3;
        else if (kw.includes(t)) s += 2;
        else if (other.includes(t)) s += 1;
      }
      // Contexto de especialidade (ex.: "idoso" → geriatria) favorece as calculadoras daquela aba
      if (c.tabs.some((tab) => toks.includes(tab))) s += 3;
      return { c, s };
    }).filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
    if (!ranked.length) return [];
    const floor = Math.max(1, ranked[0].s / 3);
    return ranked.filter((x) => x.s >= floor).slice(0, limit).map((x) => x.c);
  }

  function rankEdu(text) {
    const toks = tokens(text);
    return EDU.map((e) => {
      const hay = norm(e.title + ' ' + e.keywords);
      return { e, s: toks.filter((t) => hay.includes(t)).length };
    }).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 3).map((x) => x.e);
  }

  function offlineReply(text) {
    const n = norm(text);
    if (/^(oi|ola|bom dia|boa tarde|boa noite|ajuda|help|menu)\b/.test(n) && n.length < 30) {
      return 'Olá! Sou o guia do MedCalc. Diga o cenário clínico — por exemplo, *“mulher de 60 anos com risco de fratura”* ou ' +
        '*“pré-operatório de cirurgia abdominal”* — e eu indico as calculadoras certas.\n\n' +
        'Atalhos: [[calc:framingham]] [[calc:rcri]] [[calc:ig_dum]] [[calc:frax_fatores]] [[edu:has-oque]]';
    }
    if (n.startsWith('ajude-me a interpretar')) {
      const name = text.split('\n')[1] || '';
      const calc = CALCS.find((c) => c.name === name.trim());
      const rel = calc ? CALCS.filter((c) => c.category === calc.category && c.id !== calc.id).slice(0, 4) : [];
      return 'No modo guia (offline) eu não interpreto casos individualmente — a interpretação de referência já aparece no quadro do resultado. ' +
        'Para uma discussão detalhada com IA, configure sua chave da Anthropic em ⚙️.' +
        (rel.length ? '\n\nFerramentas relacionadas que podem complementar a avaliação:\n' + rel.map((c) => `- [[calc:${c.id}]]`).join('\n') : '');
    }
    const calcs = rankCalcs(text);
    const wantsPatient = /paciente|orientar|orientac|educa|explicar|leigo|material/.test(n);
    const edus = rankEdu(text);
    let out = '';
    if (calcs.length) {
      out += 'Estas calculadoras parecem relevantes:\n' + calcs.map((c) => `- [[calc:${c.id}]] — ${c.short}`).join('\n');
    }
    if (edus.length && (wantsPatient || !calcs.length || /hipertens|pressao/.test(n))) {
      out += (out ? '\n\n' : '') + 'Material para o paciente:\n' + edus.map((e) => `- [[edu:${e.id}]]`).join('\n');
    }
    if (!out) {
      out = 'Não encontrei uma ferramenta específica para isso. Tente palavras como *risco cardiovascular*, *fratura*, ' +
        '*trombose*, *pré-operatório*, *gestação*, *rim* ou *pressão alta*.';
    }
    if (!state.key) out += '\n\n_Modo guia por palavras-chave. Para respostas completas com IA, configure sua chave em ⚙️._';
    return out;
  }

  /* ---------- renderização ---------- */
  function inline(s) {
    return s
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1<em>$2</em>')
      .replace(/(^|\W)_(.+?)_(?=\W|$)/g, '$1<em>$2</em>')
      .replace(/\[\[calc:([a-z0-9_]+)\]\]/g, (m, id) => {
        const c = CALCS.find((x) => x.id === id);
        return c ? `<button type="button" class="tool-link" data-calc="${id}">🧮 ${esc(c.name)}</button>` : '';
      })
      .replace(/\[\[edu:([a-z0-9-]+)\]\]/g, (m, id) => {
        const e = EDU.find((x) => x.id === id);
        return e ? `<button type="button" class="tool-link" data-edu="${id}">📘 ${esc(e.title)}</button>` : '';
      });
  }

  function md(text) {
    const lines = esc(text).split('\n');
    let html = '', list = null;
    const close = () => { if (list) { html += `</${list}>`; list = null; } };
    for (const raw of lines) {
      const l = raw.trim();
      let m;
      if ((m = l.match(/^[-*•]\s+(.*)/))) {
        if (list !== 'ul') { close(); html += '<ul>'; list = 'ul'; }
        html += `<li>${inline(m[1])}</li>`;
      } else if ((m = l.match(/^\d+[.)]\s+(.*)/))) {
        if (list !== 'ol') { close(); html += '<ol>'; list = 'ol'; }
        html += `<li>${inline(m[1])}</li>`;
      } else if (!l) {
        close();
      } else if ((m = l.match(/^#{1,4}\s+(.*)/))) {
        close(); html += `<p><strong>${inline(m[1])}</strong></p>`;
      } else {
        close(); html += `<p>${inline(l)}</p>`;
      }
    }
    close();
    return html;
  }

  function addMsg(role, text) {
    const div = document.createElement('div');
    div.className = 'msg ' + role;
    if (role === 'user') div.textContent = text;
    else div.innerHTML = md(text);
    $('#ai-log').appendChild(div);
    $('#ai-log').scrollTop = $('#ai-log').scrollHeight;
    return div;
  }

  function updateMode() {
    $('#ai-mode').textContent = state.key ? `Claude • ${$('#ai-model').selectedOptions[0].text.replace(/ \(.*\)/, '')}` : 'Modo guia (offline)';
  }

  /* ---------- Claude ---------- */
  async function loadSdk() {
    if (state.sdk) return state.sdk;
    let lastErr;
    for (const url of SDK_URLS) {
      try {
        const mod = await import(url);
        state.sdk = mod.default || mod.Anthropic;
        return state.sdk;
      } catch (e) { lastErr = e; }
    }
    throw lastErr;
  }

  async function claudeReply(text) {
    const Anthropic = await loadSdk();
    const client = new Anthropic({ apiKey: state.key, dangerouslyAllowBrowser: true });
    const cfg = MODELS[state.model];
    state.history.push({ role: 'user', content: text });

    const params = {
      model: state.model,
      max_tokens: 16000,
      system: SYSTEM,
      messages: state.history,
    };
    if (cfg.effort) params.output_config = { effort: 'low' };

    let stream;
    if (cfg.fallbacks) {
      // Se um classificador de segurança recusar, a API redireciona automaticamente para um modelo alternativo.
      stream = client.beta.messages.stream({ ...params, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' });
    } else {
      stream = client.messages.stream(params);
    }

    const div = addMsg('bot', '');
    div.classList.add('typing');
    let acc = '';
    stream.on('text', (delta) => {
      acc += delta;
      div.innerHTML = md(acc);
      $('#ai-log').scrollTop = $('#ai-log').scrollHeight;
    });

    try {
      const final = await stream.finalMessage();
      div.classList.remove('typing');
      if (final.stop_reason === 'refusal') {
        state.history.pop();
        div.innerHTML = md('Não posso ajudar com essa solicitação. Reformule a pergunta com foco no uso das calculadoras ou no material educativo.');
        return;
      }
      // Mantém o conteúdo completo (inclusive blocos de raciocínio) no histórico da conversa.
      state.history.push({ role: 'assistant', content: final.content });
      if (final.stop_reason === 'max_tokens') acc += '\n\n_(resposta interrompida por limite de tamanho)_';
      if (!acc.trim()) acc = '…';
      div.innerHTML = md(acc);
    } catch (err) {
      div.remove();
      state.history.pop();
      throw err;
    }
  }

  function explainError(err, Anthropic) {
    if (Anthropic) {
      if (err instanceof Anthropic.AuthenticationError) return 'Chave de API inválida. Confira em ⚙️.';
      if (err instanceof Anthropic.PermissionDeniedError) return 'Sua chave não tem permissão para este modelo. Tente outro modelo em ⚙️.';
      if (err instanceof Anthropic.NotFoundError) return 'Modelo não encontrado para esta conta. Escolha outro modelo em ⚙️.';
      if (err instanceof Anthropic.RateLimitError) return 'Limite de uso atingido. Aguarde alguns instantes e tente novamente.';
      if (err instanceof Anthropic.APIConnectionError) return 'Sem conexão com a API da Anthropic. Verifique sua internet.';
      if (err instanceof Anthropic.APIError) return `Erro da API (${err.status || '?'}): ${err.message}`;
    }
    return 'Não foi possível carregar o SDK da IA (verifique a conexão). Usando o modo guia.';
  }

  async function send(text) {
    text = text.trim();
    if (!text || state.busy) return;
    state.busy = true;
    $('#ai-suggest').innerHTML = '';
    addMsg('user', text);
    $('#ai-input').value = '';
    try {
      if (state.key) await claudeReply(text);
      else addMsg('bot', offlineReply(text));
    } catch (err) {
      console.error(err);
      addMsg('bot err', explainError(err, state.sdk));
      if (!state.sdk) addMsg('bot', offlineReply(text));
    } finally {
      state.busy = false;
    }
  }

  /* ---------- painel ---------- */
  const SUGGESTIONS = [
    'Avaliar risco cardiovascular',
    'Pré-operatório de cirurgia abdominal',
    'Gestante no 1º trimestre',
    'Mulher de 65 anos: risco de fratura',
    'Idoso frágil: avaliação geriátrica',
    'Orientar paciente hipertenso',
  ];

  function renderSuggestions() {
    $('#ai-suggest').innerHTML = SUGGESTIONS.map((s) => `<button type="button">${esc(s)}</button>`).join('');
  }

  function open(prefill, autoSend) {
    const p = $('#ai-panel');
    p.classList.add('open');
    p.setAttribute('aria-hidden', 'false');
    $('#ai-fab').hidden = true;
    if (prefill) {
      if (autoSend) send(prefill);
      else { $('#ai-input').value = prefill; }
    }
    setTimeout(() => $('#ai-input').focus(), 200);
  }

  function close() {
    const p = $('#ai-panel');
    p.classList.remove('open');
    p.setAttribute('aria-hidden', 'true');
    $('#ai-fab').hidden = false;
  }

  function reset() {
    state.history = [];
    $('#ai-log').innerHTML = '';
    addMsg('bot', 'Olá! Sou o assistente do MedCalc. Descreva o paciente ou a dúvida e eu indico **quais calculadoras usar**, ' +
      'como **interpretar** os resultados e qual **material educativo** entregar. Não informe dados que identifiquem o paciente.');
    renderSuggestions();
  }

  function bind() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-open-ai]')) open();
    });
    $('#ai-close').addEventListener('click', close);
    $('#ai-clear').addEventListener('click', reset);
    $('#ai-settings-btn').addEventListener('click', () => { $('#ai-settings').hidden = !$('#ai-settings').hidden; });
    $('#ai-key').value = state.key;
    $('#ai-model').value = state.model;
    $('#ai-save').addEventListener('click', () => {
      state.key = $('#ai-key').value.trim();
      state.model = $('#ai-model').value;
      if (state.key) store.set('anthropic_key', state.key); else store.del('anthropic_key');
      store.set('anthropic_model', state.model);
      $('#ai-settings').hidden = true;
      updateMode();
      addMsg('bot', state.key ? 'Pronto! Respostas agora geradas pelo Claude.' : 'Sem chave: usando o modo guia (offline).');
    });
    $('#ai-forget').addEventListener('click', () => {
      state.key = ''; $('#ai-key').value = ''; store.del('anthropic_key'); updateMode();
      addMsg('bot', 'Chave removida deste navegador. Usando o modo guia (offline).');
    });
    $('#ai-form').addEventListener('submit', (e) => { e.preventDefault(); send($('#ai-input').value); });
    $('#ai-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send($('#ai-input').value); }
    });
    $('#ai-suggest').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (b) send(b.textContent);
    });
    $('#ai-log').addEventListener('click', (e) => {
      if (e.target.closest('[data-edu]') && window.innerWidth < 760) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && $('#ai-panel').classList.contains('open') && !$('#calc-dialog').open) close();
    });
  }

  window.AI = { open, close, send, offlineReply };
  bind();
  updateMode();
  reset();
})();
