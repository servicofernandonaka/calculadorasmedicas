/*
 * Assistente IA.
 * - Modo guia (offline): sugere calculadoras e materiais por palavras-chave, sem enviar dados a lugar nenhum.
 * - Modo IA: Claude (SDK oficial da Anthropic), Gemini (Google), ChatGPT (OpenAI) ou OpenRouter, chamados direto do navegador
 *   com a chave do próprio usuário.
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
  const CUSTOM = '__custom';
  const PROVIDERS = {
    anthropic: {
      name: 'Claude',
      keyName: 'Anthropic',
      placeholder: 'sk-ant-…',
      keyUrl: 'https://console.anthropic.com/settings/keys',
      models: [
        ['claude-opus-5-5', 'Claude Opus 5.5 (recomendado)'],
        ['claude-sonnet-5-5', 'Claude Sonnet 5.5 (mais rápido)'],
        ['claude-haiku-4-5', 'Claude Haiku 4.5 (mais econômico)'],
      ],
    },
    gemini: {
      name: 'Gemini',
      keyName: 'Google Gemini',
      placeholder: 'AIza…',
      keyUrl: 'https://aistudio.google.com/apikey',
      models: [
        ['gemini-3.8-flash', 'Gemini 3.8 Flash (recomendado)'],
        ['gemini-flash-latest', 'Gemini Flash (sempre a versão mais nova)'],
        ['gemini-3.1-pro-preview', 'Gemini 3.1 Pro (prévia, mais detalhado)'],
        ['gemini-3.5-flash-lite', 'Gemini 3.5 Flash-Lite (mais econômico)'],
      ],
    },
    openai: {
      name: 'ChatGPT',
      keyName: 'OpenAI',
      placeholder: 'sk-…',
      keyUrl: 'https://platform.openai.com/api-keys',
      url: 'https://api.openai.com/v1/chat/completions',
      models: [
        ['gpt-5.6-terra', 'GPT-5.6 Terra (recomendado)'],
        ['gpt-5.6-sol', 'GPT-5.6 Sol (mais detalhado)'],
        ['gpt-5.4-mini', 'GPT-5.4 mini (mais rápido e econômico)'],
      ],
    },
    // OpenRouter usa o mesmo formato da API da OpenAI e dá acesso a modelos de várias empresas com uma só chave.
    openrouter: {
      name: 'OpenRouter',
      keyName: 'OpenRouter',
      placeholder: 'sk-or-…',
      keyUrl: 'https://openrouter.ai/settings/keys',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      headers: { 'HTTP-Referer': location.origin + location.pathname, 'X-Title': 'CalcMed' },
      models: [
        ['anthropic/claude-sonnet-5.5', 'Claude Sonnet 5.5 (recomendado)'],
        ['anthropic/claude-opus-5.5', 'Claude Opus 5.5 (mais detalhado)'],
        ['google/gemini-3.8-flash', 'Gemini 3.8 Flash (rápido e econômico)'],
        ['openai/gpt-5.6-terra', 'GPT-5.6 Terra'],
      ],
    },
  };

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignora */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignora */ } },
  };

  const savedKey = (p) => store.get(p + '_key') || '';
  const savedModel = (p) => store.get(p + '_model') || PROVIDERS[p].models[0][0];

  const state = {
    provider: PROVIDERS[store.get('ai_provider')] ? store.get('ai_provider') : 'anthropic',
    key: '',
    model: '',
    history: [], // histórico enviado à API do Claude (blocos de conteúdo completos)
    chat: [], // histórico simples ({ role, text }) para Gemini e ChatGPT
    busy: false,
    sdk: null,
  };
  state.key = savedKey(state.provider);
  state.model = savedModel(state.provider);
  if (state.provider === 'anthropic' && !MODELS[state.model]) state.model = 'claude-opus-5-5';

  /* ---------- prompt do sistema ---------- */
  const catalog = CALCS.map((c) => `- ${c.id} | ${c.name} | ${c.category} | abas: ${c.tabs.join(', ')} | ${c.short}`).join('\n');
  const eduCatalog = window.EDU_GUIDES.map((g) => `${g.title}:\n` +
    EDU.filter((e) => e.guide === g.id).map((e) => `- ${e.id} | ${e.title}`).join('\n')).join('\n');
  const SYSTEM = `Você é o assistente do site CalcMed, um conjunto de calculadoras médicas e material educativo em português do Brasil.
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

Abas do site: clinica (Clínica), cirurgia (Cirúrgica), gineco (Ginecologia & Obstetrícia), geriatria (Geriatria), paliativos (Cuidados paliativos), educacao (Paciente: guias sobre hipertensão, diabetes, colesterol, insuficiência cardíaca, quedas, asma, DPOC, fibromialgia, depressão e ansiedade).

Catálogo de calculadoras (ID | nome | categoria | abas | descrição):
${catalog}

Material educativo para pacientes, por guia (ID | título):
${eduCatalog}`;

  /* ---------- modo guia (offline) ---------- */
  const STOP = new Set(('de da do das dos para com sem uma umas uns por que qual quais como sobre meu minha seu sua ' +
    'paciente pacientes risco calcular calculadora escore usar posso devo tem ter esta este isso essa esse nos nas ' +
    'mais muito ajuda ajude quero preciso saber fazer avaliar anos ano idade mulher homem senhora senhor ' +
    'adulto adulta').split(' '));
  const SYN = {
    idoso: 'geriatria idoso', idosa: 'geriatria idoso', idosos: 'geriatria idoso', velhice: 'geriatria idoso',
    demencia: 'cognicao memoria', memoria: 'cognicao demencia', esquecimento: 'memoria cognicao',
    confuso: 'delirium', confusao: 'delirium', depressao: 'humor gds phq-9', triste: 'depressao humor',
    queda: 'quedas', caiu: 'queda', desnutricao: 'nutricao mna', escara: 'lesao por pressao braden',
    fragil: 'fragilidade', dependente: 'funcionalidade dependencia',
    gravida: 'gestacao gravidez pre-natal', gestante: 'gestacao gravidez pre-natal', gestacao: 'gravidez pre-natal',
    gravidez: 'gestacao pre-natal', grávida: 'gestacao', prenatal: 'pre-natal',
    cirurgia: 'pre-operatorio cirurgico', operar: 'pre-operatorio', operatorio: 'pre-operatorio',
    coracao: 'cardiovascular infarto', cardiaco: 'cardiovascular', infarto: 'cardiovascular',
    osso: 'osteoporose fratura', ossos: 'osteoporose fratura', fraturas: 'fratura osteoporose',
    trombose: 'tev tvp', embolia: 'tep', tev: 'trombose', rim: 'renal tfg creatinina', rins: 'renal tfg',
    figado: 'cirrose hepatica', acucar: 'diabetes glicemia', glicose: 'diabetes glicemia',
    pressao: 'hipertensao pa', colesterol: 'ldl dislipidemia', triglicerides: 'dislipidemia', estatina: 'colesterol ldl',
    dpoc: 'gold pneumologia', enfisema: 'dpoc gold', asma: 'gina pneumologia', asmatico: 'asma gina', bronquite: 'dpoc asma',
    paliativo: 'paliativos spict pps', paliativos: 'spict pps ppi esas', terminal: 'paliativos prognostico', prognostico: 'ppi pps',
    fibromialgia: 'dor cronica', ansiedade: 'gad-7 depressao', panico: 'ansiedade gad-7', deprimido: 'depressao phq-9',
    diabetico: 'diabetes glicemia', insulina: 'diabetes', cardiaca: 'insuficiencia coracao', inchaco: 'insuficiencia cardiaca', hipertenso: 'hipertensao pa', hipertensao: 'pa pressao',
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
      const g = window.EDU_GUIDES.find((x) => x.id === e.guide);
      const hay = norm(e.title + ' ' + e.keywords + ' ' + (g ? g.title : ''));
      return { e, s: toks.filter((t) => hay.includes(t)).length };
    }).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 3).map((x) => x.e);
  }

  function offlineReply(text) {
    const n = norm(text);
    if (/^(oi|ola|bom dia|boa tarde|boa noite|ajuda|help|menu)\b/.test(n) && n.length < 30) {
      return 'Olá! Sou o guia do CalcMed. Diga o cenário clínico — por exemplo, *“mulher de 60 anos com risco de fratura”* ou ' +
        '*“pré-operatório de cirurgia abdominal”* — e eu indico as calculadoras certas.\n\n' +
        'Atalhos: [[calc:framingham]] [[calc:rcri]] [[calc:ig_dum]] [[calc:frax_fatores]] [[edu:has-oque]]';
    }
    if (n.startsWith('ajude-me a interpretar')) {
      const name = text.split('\n')[1] || '';
      const calc = CALCS.find((c) => c.name === name.trim());
      const rel = calc ? CALCS.filter((c) => c.category === calc.category && c.id !== calc.id).slice(0, 4) : [];
      return 'No modo guia (offline) eu não interpreto casos individualmente — a interpretação de referência já aparece no quadro do resultado. ' +
        'Para uma discussão detalhada com IA, configure sua chave da Anthropic em Configurações (botão do painel).' +
        (rel.length ? '\n\nFerramentas relacionadas que podem complementar a avaliação:\n' + rel.map((c) => `- [[calc:${c.id}]]`).join('\n') : '');
    }
    const calcs = rankCalcs(text);
    const wantsPatient = /paciente|orientar|orientac|educa|explicar|leigo|material/.test(n);
    const edus = rankEdu(text);
    let out = '';
    if (calcs.length) {
      out += 'Estas calculadoras parecem relevantes:\n' + calcs.map((c) => `- [[calc:${c.id}]] — ${c.short}`).join('\n');
    }
    if (edus.length && (wantsPatient || !calcs.length || /hipertens|pressao|diabet|glicemia|colesterol|triglic|insuficiencia cardiaca|queda|asma|dpoc|fibromialg|depress|ansied/.test(n))) {
      out += (out ? '\n\n' : '') + 'Material para o paciente:\n' + edus.map((e) => `- [[edu:${e.id}]]`).join('\n');
    }
    if (!out) {
      out = 'Não encontrei uma ferramenta específica para isso. Tente palavras como *risco cardiovascular*, *fratura*, ' +
        '*trombose*, *pré-operatório*, *gestação*, *rim* ou *pressão alta*.';
    }
    if (!state.key) out += '\n\n_Modo guia por palavras-chave. Para respostas completas com IA, configure sua chave em Configurações._';
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
        return c ? `<button type="button" class="tool-link" data-calc="${id}">${window.ICON('calculator')}${esc(c.name)}</button>` : '';
      })
      .replace(/\[\[edu:([a-z0-9-]+)\]\]/g, (m, id) => {
        const e = EDU.find((x) => x.id === id);
        return e ? `<button type="button" class="tool-link" data-edu="${id}">${window.ICON('book')}${esc(e.title)}</button>` : '';
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

  function modelLabel(p, id) {
    const m = PROVIDERS[p].models.find((x) => x[0] === id);
    return m ? m[1].replace(/ \(.*\)/, '') : id;
  }

  function updateMode() {
    $('#ai-mode').textContent = state.key ? `${PROVIDERS[state.provider].name} • ${modelLabel(state.provider, state.model)}` : 'Modo guia (offline)';
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

  /* ---------- Gemini e ChatGPT (REST com streaming SSE) ---------- */
  class HttpError extends Error {
    constructor(status, message) { super(message); this.status = status; }
  }

  async function readSse(res, onData) {
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (!data || data === '[DONE]') continue;
        let j;
        try { j = JSON.parse(data); } catch (e) { continue; /* linha incompleta ou não JSON */ }
        // OpenRouter pode enviar um erro no meio do streaming (ex.: falha do provedor).
        if (j.error) throw new HttpError(j.error.code || 500, j.error.message || 'erro no streaming');
        onData(j);
      }
    }
  }

  async function failIfBad(res) {
    if (res.ok) return;
    let msg = res.statusText;
    try { const j = await res.json(); msg = (j.error && (j.error.message || j.error.status)) || msg; } catch (e) { /* ignora */ }
    throw new HttpError(res.status, msg);
  }

  function geminiRequest() {
    return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(state.model)}:streamGenerateContent?alt=sse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': state.key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: state.chat.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.text }] })),
        generationConfig: { maxOutputTokens: 8192 },
      }),
    });
  }
  function geminiDelta(j) {
    const c = j.candidates && j.candidates[0];
    if (!c) return { text: '', blocked: !!(j.promptFeedback && j.promptFeedback.blockReason) };
    const text = ((c.content && c.content.parts) || []).filter((p) => !p.thought).map((p) => p.text || '').join('');
    return { text, cut: c.finishReason === 'MAX_TOKENS', blocked: ['SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST'].includes(c.finishReason) };
  }

  function openaiRequest() {
    const cfg = PROVIDERS[state.provider];
    return fetch(cfg.url, {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json', Authorization: `Bearer ${state.key}` }, cfg.headers),
      body: JSON.stringify({
        model: state.model,
        stream: true,
        messages: [{ role: 'system', content: SYSTEM }].concat(state.chat.map((m) => ({ role: m.role, content: m.text }))),
      }),
    });
  }
  function openaiDelta(j) {
    const c = j.choices && j.choices[0];
    if (!c) return { text: '' };
    return { text: (c.delta && c.delta.content) || '', cut: c.finish_reason === 'length', blocked: c.finish_reason === 'content_filter' };
  }

  async function restReply(text) {
    const api = state.provider === 'gemini' ? [geminiRequest, geminiDelta] : [openaiRequest, openaiDelta];
    state.chat.push({ role: 'user', text });
    const div = addMsg('bot', '');
    div.classList.add('typing');
    let acc = '', cut = false, blocked = false;
    try {
      const res = await api[0]();
      await failIfBad(res);
      await readSse(res, (j) => {
        const d = api[1](j);
        if (d.cut) cut = true;
        if (d.blocked) blocked = true;
        if (!d.text) return;
        acc += d.text;
        div.innerHTML = md(acc);
        $('#ai-log').scrollTop = $('#ai-log').scrollHeight;
      });
    } catch (err) {
      div.remove();
      state.chat.pop();
      throw err;
    }
    div.classList.remove('typing');
    if (blocked && !acc.trim()) {
      state.chat.pop();
      div.innerHTML = md('Não posso ajudar com essa solicitação. Reformule a pergunta com foco no uso das calculadoras ou no material educativo.');
      return;
    }
    state.chat.push({ role: 'assistant', text: acc || '…' });
    if (cut) acc += '\n\n_(resposta interrompida por limite de tamanho)_';
    div.innerHTML = md(acc.trim() ? acc : '…');
  }

  function explainHttp(err) {
    const s = err.status;
    if (s === 401 || (s === 400 && /api key|api_key/i.test(err.message))) return 'Chave de API inválida. Confira em Configurações.';
    if (s === 403) return 'Sua chave não tem permissão para este modelo (ou a API não está ativada na conta). Tente outro modelo em Configurações.';
    if (s === 404) return 'Modelo não encontrado para esta conta. Escolha outro modelo em Configurações.';
    if (s === 402) return 'Créditos insuficientes na conta. Confira o saldo na plataforma.';
    if (s === 429) return 'Limite de uso ou de créditos atingido. Aguarde alguns instantes ou confira o saldo da conta.';
    return `Erro da API (${s}): ${err.message}`;
  }

  function explainError(err, Anthropic) {
    if (err instanceof HttpError) return explainHttp(err);
    if (state.provider !== 'anthropic') {
      return `Sem conexão com a API do ${PROVIDERS[state.provider].name}. Verifique sua internet.`;
    }
    if (Anthropic) {
      if (err instanceof Anthropic.AuthenticationError) return 'Chave de API inválida. Confira em Configurações.';
      if (err instanceof Anthropic.PermissionDeniedError) return 'Sua chave não tem permissão para este modelo. Tente outro modelo em Configurações.';
      if (err instanceof Anthropic.NotFoundError) return 'Modelo não encontrado para esta conta. Escolha outro modelo em Configurações.';
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
      if (!state.key) addMsg('bot', offlineReply(text));
      else if (state.provider === 'anthropic') await claudeReply(text);
      else await restReply(text);
    } catch (err) {
      console.error(err);
      addMsg('bot err', explainError(err, state.sdk));
      if (state.provider === 'anthropic' && !state.sdk) addMsg('bot', offlineReply(text));
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
    'Orientar paciente com diabetes',
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
    state.chat = [];
    $('#ai-log').innerHTML = '';
    addMsg('bot', 'Olá! Sou o assistente do CalcMed. Descreva o paciente ou a dúvida e eu indico **quais calculadoras usar**, ' +
      'como **interpretar** os resultados e qual **material educativo** entregar. Não informe dados que identifiquem o paciente.');
    renderSuggestions();
  }

  function toggleCustom() {
    const custom = $('#ai-model').value === CUSTOM;
    $('#ai-custom-wrap').hidden = !custom;
    if (custom) $('#ai-custom-model').focus();
  }

  // Preenche chave, modelos e link de ajuda da plataforma escolhida (sem salvar).
  function fillSettings(p) {
    const cfg = PROVIDERS[p];
    const model = p === state.provider ? state.model : savedModel(p);
    $('#ai-key-label').textContent = `Chave da API ${cfg.keyName}`;
    $('#ai-key').placeholder = cfg.placeholder;
    $('#ai-key').value = p === state.provider ? state.key : savedKey(p);
    $('#ai-key-link').href = cfg.keyUrl;
    $('#ai-key-link').textContent = `Criar ou ver sua chave do ${cfg.name}`;
    const opts = cfg.models.concat(p === 'anthropic' ? [] : [[CUSTOM, 'Outro modelo (digitar o ID)']]);
    $('#ai-model').innerHTML = opts.map(([id, label]) => `<option value="${esc(id)}">${esc(label)}</option>`).join('');
    const known = cfg.models.some((m) => m[0] === model);
    $('#ai-model').value = known ? model : (p === 'anthropic' ? cfg.models[0][0] : CUSTOM);
    $('#ai-custom-model').value = known ? '' : model;
    $('#ai-custom-model').placeholder = { gemini: 'ex.: gemini-3.7-flash', openai: 'ex.: gpt-5.6-luna', openrouter: 'ex.: deepseek/…' }[p] || '';
    $('#ai-custom-wrap').hidden = $('#ai-model').value !== CUSTOM;
  }

  function bind() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-open-ai]')) open();
    });
    $('#ai-close').addEventListener('click', close);
    $('#ai-clear').addEventListener('click', reset);
    $('#ai-settings-btn').addEventListener('click', () => { $('#ai-settings').hidden = !$('#ai-settings').hidden; });
    $('#ai-provider').value = state.provider;
    fillSettings(state.provider);
    $('#ai-provider').addEventListener('change', () => fillSettings($('#ai-provider').value));
    $('#ai-model').addEventListener('change', toggleCustom);
    $('#ai-save').addEventListener('click', () => {
      const p = $('#ai-provider').value;
      const key = $('#ai-key').value.trim();
      const model = $('#ai-model').value === CUSTOM ? $('#ai-custom-model').value.trim() : $('#ai-model').value;
      if (!model) { $('#ai-custom-model').focus(); return; }
      if (p !== state.provider) { state.history = []; state.chat = []; }
      state.provider = p; state.key = key; state.model = model;
      store.set('ai_provider', p);
      if (key) store.set(p + '_key', key); else store.del(p + '_key');
      store.set(p + '_model', model);
      $('#ai-settings').hidden = true;
      updateMode();
      addMsg('bot', key ? `Pronto! Respostas agora geradas pelo ${PROVIDERS[p].name}.` : 'Sem chave: usando o modo guia (offline).');
    });
    $('#ai-forget').addEventListener('click', () => {
      const p = $('#ai-provider').value;
      store.del(p + '_key'); $('#ai-key').value = '';
      if (p === state.provider) state.key = '';
      updateMode();
      addMsg('bot', `Chave do ${PROVIDERS[p].name} removida deste navegador.` + (state.key ? '' : ' Usando o modo guia (offline).'));
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
