/* LabCore APS — sistema plug-and-play de adendos ("Criador de Exames & Fórmulas Customizadas").
   Dois caminhos para acrescentar exames sem mexer no resto do app:
     1) PELA TELA: botão "+ Adicionar Novo Exame / Índice" (salva no localStorage, exporta/importa .json);
     2) PELO CÓDIGO: acrescente objetos nos arrays CUSTOM_EXAMS_PLUGINS e CUSTOM_FLOWS_PLUGINS abaixo (valem em segundos, para todos os navegadores).
   Os exames daqui entram sozinhos no Parser de laudos, na Bancada Rápida, no SOAP e na Enciclopédia. Sem eval: as fórmulas passam por um avaliador próprio.
   Pontos de corte de exames personalizados são do usuário (ficam no próprio plugin, com fonte opcional) e NÃO passam pela conferência do Registry. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LabCorePlugins = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * @typedef {Object} CustomExamPlugin
   * @property {string}   id            identificador único: letras minúsculas, números e "_" (ex.: "x_b12"); gerado a partir do nome se faltar
   * @property {string}   nome          nome do exame ou índice (ex.: "Vitamina B12")
   * @property {string}   categoria     categoria na Enciclopédia (ex.: "Hematologia")
   * @property {string[]} siglas        siglas e apelidos que o Parser reconhece (ex.: ["B12", "Cobalamina"])
   * @property {string}   unidade       unidade (ex.: "pg/mL")
   * @property {number|null} refMin     limite inferior de referência (ou null)
   * @property {number|null} refMax     limite superior de referência (ou null)
   * @property {string}   [formula]     fórmula opcional com variáveis existentes (ex.: "vcm / rbc"); se existir, o exame é calculado e não digitado
   * @property {string}   [interferentes] interferentes pré-analíticos/analíticos (texto livre)
   * @property {string}   [interpretaAlto]  interpretação se acima da referência
   * @property {string}   [interpretaBaixo] interpretação se abaixo da referência
   * @property {string}   [regulacao]   critério de regulação (CROSS/SISREG) do seu município
   * @property {string}   [fonte]       fonte/diretriz que sustenta os valores
   */

  /** Exames adicionados por código. Exemplo (remova os comentários para ativar):
   *  { id: 'x_b12', nome: 'Vitamina B12', categoria: 'Hematologia', siglas: ['B12', 'Cobalamina'], unidade: 'pg/mL', refMin: 200, refMax: 900,
   *    interpretaBaixo: 'Considere deficiência de B12; avalie macrocitose e neuropatia.', interferentes: 'Biotina pode interferir em alguns imunoensaios.',
   *    regulacao: '', fonte: 'Sua fonte aqui' }
   *  @type {CustomExamPlugin[]} */
  const CUSTOM_EXAMS_PLUGINS = [
    // ← acrescente novos exames aqui
  ];

  /** Árvores de decisão adicionadas por código, no mesmo formato de js/labcore-fluxos.js:
   *  { id, titulo, resumo, guideline: [], start: 'n0', nodes: { n0: { t: 'choice', q, opts: [{ v, label, next }] }, r1: { t: 'result', level, title, texts: [], recs: [] } } }
   *  Use guideline: [] quando não houver entrada no Registry. @type {Object[]} */
  const CUSTOM_FLOWS_PLUGINS = [
    // ← acrescente novos fluxogramas aqui
  ];

  /* ---------- avaliador de fórmulas (sem eval) ---------- */
  const FUNCOES = { sqrt: Math.sqrt, ln: Math.log, log: Math.log10, exp: Math.exp, abs: Math.abs, min: Math.min, max: Math.max, pow: Math.pow, round: Math.round };
  function tokenizar(src) {
    const t = []; let i = 0;
    while (i < src.length) {
      const c = src[i];
      if (/\s/.test(c)) { i++; continue; }
      let m;
      if ((m = /^\d+(\.\d+)?/.exec(src.slice(i)))) { t.push({ k: 'n', v: Number(m[0]) }); i += m[0].length; continue; }
      if ((m = /^[a-z_][a-z0-9_]*/.exec(src.slice(i)))) { t.push({ k: 'i', v: m[0] }); i += m[0].length; continue; }
      if ('+-*/^(),'.includes(c)) { t.push({ k: c }); i++; continue; }
      throw new Error(`Caractere inválido "${c}" na fórmula.`);
    }
    return t;
  }
  /* Devolve { ast, vars } ou lança Error. */
  function compilar(src) {
    src = String(src || '').trim().toLowerCase().replace(/,(?=\d)/g, '.').replace(/[×·]/g, '*').replace(/÷/g, '/');
    if (!src) throw new Error('Fórmula vazia.');
    if (src.length > 200) throw new Error('Fórmula longa demais (máximo 200 caracteres).');
    const t = tokenizar(src), vars = new Set(); let p = 0, prof = 0;
    const peek = () => t[p] && t[p].k, eat = (k) => { if (peek() !== k) throw new Error(`Fórmula incompleta: esperado "${k}".`); return t[p++]; };
    function expr() { let a = termo(); while (peek() === '+' || peek() === '-') { const o = t[p++].k; a = { o, a, b: termo() }; } return a; }
    function termo() { let a = unario(); while (peek() === '*' || peek() === '/') { const o = t[p++].k; a = { o, a, b: unario() }; } return a; }
    function unario() { if (peek() === '-') { p++; return { o: 'neg', a: unario() }; } return potencia(); }
    function potencia() { const a = primario(); if (peek() === '^') { p++; return { o: '^', a, b: unario() }; } return a; }
    function primario() {
      if (++prof > 40) throw new Error('Fórmula aninhada demais.');
      const x = t[p++];
      if (!x) throw new Error('Fórmula incompleta.');
      let r;
      if (x.k === 'n') r = { n: x.v };
      else if (x.k === '(') { r = expr(); eat(')'); }
      else if (x.k === 'i') {
        if (peek() === '(') {
          if (!FUNCOES[x.v]) throw new Error(`Função desconhecida: ${x.v}. Use ${Object.keys(FUNCOES).join(', ')}.`);
          p++; const args = [];
          if (peek() !== ')') { args.push(expr()); while (peek() === ',') { p++; args.push(expr()); } }
          eat(')'); r = { f: x.v, args };
        } else { vars.add(x.v); r = { v: x.v }; }
      } else throw new Error(`Símbolo inesperado "${x.k}" na fórmula.`);
      prof--; return r;
    }
    const ast = expr();
    if (p < t.length) throw new Error('Sobrou texto no fim da fórmula.');
    return { ast, vars: Array.from(vars) };
  }
  function calcular(n, vars) {
    if (n.n !== undefined) return n.n;
    if (n.v !== undefined) { const x = vars[n.v]; if (typeof x !== 'number' || !Number.isFinite(x)) throw new RangeError(n.v); return x; }
    if (n.f) return FUNCOES[n.f](...n.args.map((a) => calcular(a, vars)));
    const a = calcular(n.a, vars);
    if (n.o === 'neg') return -a;
    const b = calcular(n.b, vars);
    switch (n.o) { case '+': return a + b; case '-': return a - b; case '*': return a * b; case '/': return a / b; case '^': return Math.pow(a, b); default: throw new Error('operador'); }
  }
  /* Avalia a fórmula; devolve { value } ou { falta: [variáveis ausentes] } ou { erro }. */
  function evalFormula(src, vars) {
    let c;
    try { c = compilar(src); } catch (e) { return { erro: e.message }; }
    const falta = c.vars.filter((v) => typeof vars[v] !== 'number' || !Number.isFinite(vars[v]));
    if (falta.length) return { falta };
    try {
      const x = calcular(c.ast, vars);
      return Number.isFinite(x) ? { value: x } : { erro: 'Resultado indefinido (divisão por zero ou fora do domínio).' };
    } catch (e) { return { erro: e.message }; }
  }

  /* ---------- cadastro ---------- */
  const slug = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const txt = (x, max) => String(x == null ? '' : x).trim().slice(0, max);
  const numOuNulo = (x) => { if (x === '' || x == null) return null; const n = typeof x === 'number' ? x : Number(String(x).replace(',', '.')); return Number.isFinite(n) ? n : NaN; };

  /* Valida e normaliza um cadastro. existentes: ids já usados (nativos + outros plugins). varsOk: ids que a fórmula pode usar. */
  function validar(raw, existentes, varsOk) {
    const erros = [];
    const nome = txt(raw && raw.nome, 60);
    if (!nome) erros.push('Informe o nome do exame.');
    let id = txt(raw && raw.id, 30).toLowerCase() || ('x_' + slug(nome)).slice(0, 30);
    if (!/^[a-z][a-z0-9_]{1,29}$/.test(id)) erros.push('Identificador inválido (use letras minúsculas, números e "_").');
    if ((existentes || []).includes(id)) erros.push(`Já existe um exame com o identificador "${id}".`);
    const siglas = (Array.isArray(raw && raw.siglas) ? raw.siglas : String((raw && raw.siglas) || '').split(/[,;\n]/)).map((s) => txt(s, 30)).filter(Boolean).slice(0, 12);
    if (nome && !siglas.length) siglas.push(nome);
    const refMin = numOuNulo(raw && raw.refMin), refMax = numOuNulo(raw && raw.refMax);
    if (Number.isNaN(refMin) || Number.isNaN(refMax)) erros.push('Valores de referência devem ser números.');
    else if (refMin != null && refMax != null && refMin > refMax) erros.push('O limite inferior não pode ser maior que o superior.');
    let formula = txt(raw && raw.formula, 200);
    if (formula) {
      try {
        const c = compilar(formula);
        const ruins = c.vars.filter((v) => v === id || !(varsOk || []).includes(v));
        if (ruins.length) erros.push(`Variável(is) desconhecida(s) na fórmula: ${ruins.join(', ')}.`);
      } catch (e) { erros.push(e.message); }
    }
    const p = {
      id, nome, categoria: txt(raw && raw.categoria, 40) || 'Personalizados', siglas, unidade: txt(raw && raw.unidade, 20),
      refMin: Number.isNaN(refMin) ? null : refMin, refMax: Number.isNaN(refMax) ? null : refMax, formula,
      interferentes: txt(raw && raw.interferentes, 600), interpretaAlto: txt(raw && raw.interpretaAlto, 600), interpretaBaixo: txt(raw && raw.interpretaBaixo, 600),
      regulacao: txt(raw && raw.regulacao, 600), fonte: txt(raw && raw.fonte, 200),
    };
    return { ok: !erros.length, erros, plugin: p };
  }

  const fmtN = (x) => { const a = Math.abs(x); const d = a >= 100 ? 0 : a >= 10 ? 1 : 2; return x.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: d }); };
  const faixa = (p) => (p.refMin != null && p.refMax != null ? `${fmtN(p.refMin)} a ${fmtN(p.refMax)}` : p.refMin != null ? `≥ ${fmtN(p.refMin)}` : p.refMax != null ? `≤ ${fmtN(p.refMax)}` : '');

  /* vars: números dos exames nativos + dos personalizados digitados. Devolve um item no formato da Bancada, ou null. */
  function avaliar(p, vars) {
    let value;
    if (p.formula) {
      const r = evalFormula(p.formula, vars);
      if (r.value === undefined) return r.erro ? { id: 'cx_' + p.id, title: p.nome, main: '—', sub: r.erro, level: 'info', custom: true, selo: `[Personalizado | ${p.categoria}]`, details: [] } : null;
      value = r.value;
    } else {
      value = vars[p.id];
      if (typeof value !== 'number' || !Number.isFinite(value)) return null;
    }
    const alto = p.refMax != null && value > p.refMax, baixo = p.refMin != null && value < p.refMin;
    const sem = p.refMin == null && p.refMax == null;
    const det = [];
    if (!sem) det.push(`Referência definida por você: ${faixa(p)} ${p.unidade}.`.trim());
    if (alto && p.interpretaAlto) det.push(p.interpretaAlto);
    if (baixo && p.interpretaBaixo) det.push(p.interpretaBaixo);
    if (p.interferentes) det.push(`Interferentes: ${p.interferentes}`);
    det.push(p.fonte ? `Fonte: ${p.fonte}` : 'Fonte não informada no cadastro: confira o valor de referência.');
    if (p.formula) det.unshift(`Fórmula: ${p.formula}.`);
    return { id: 'cx_' + p.id, title: p.nome, main: `${fmtN(value)} ${p.unidade}`.trim(), sub: sem ? 'Sem referência cadastrada' : alto ? 'Acima da referência' : baixo ? 'Abaixo da referência' : 'Dentro da referência', level: sem ? 'info' : alto || baixo ? 'mod' : 'low', value, custom: true, selo: `[Personalizado | ${p.categoria}]`, guideline: [], details: det };
  }

  /* Ordem: os que não dependem de fórmula primeiro, depois as fórmulas (que podem usar os valores dos anteriores). */
  function avaliarTodos(lista, vars) {
    const v = Object.assign({}, vars), itens = [];
    const ordem = lista.filter((p) => !p.formula).concat(lista.filter((p) => p.formula));
    ordem.forEach((p) => { const it = avaliar(p, v); if (it) { itens.push(it); if (typeof it.value === 'number') v[p.id] = it.value; } });
    return itens;
  }
  const aliases = (lista) => Object.fromEntries(lista.filter((p) => !p.formula).map((p) => [p.id, p.siglas.concat([p.nome])]));

  function paraEnciclopedia(p) {
    const pontos = [];
    if (p.refMin != null || p.refMax != null) pontos.push(`Referência cadastrada: ${faixa(p)} ${p.unidade}.`.trim());
    if (p.formula) pontos.push(`Fórmula: ${p.formula}.`);
    if (p.interpretaAlto) pontos.push(`Se alto: ${p.interpretaAlto}`);
    if (p.interpretaBaixo) pontos.push(`Se baixo: ${p.interpretaBaixo}`);
    if (p.interferentes) pontos.push(`Interferentes: ${p.interferentes}`);
    if (!pontos.length) pontos.push('Sem detalhes cadastrados.');
    return { id: 'custom_' + p.id, cat: 'personalizados', titulo: p.nome, resumo: `${p.categoria}${p.unidade ? ' · ' + p.unidade : ''}. Exame cadastrado por você.`, pontos, fonte: p.fonte || 'Cadastro do usuário (fonte não informada)', tags: p.siglas.join(' ') + ' ' + p.categoria + ' personalizado', conf: 'a_verificar', regulacao: true, regulacaoPadrao: p.regulacao };
  }

  /* ---------- exportar / importar ---------- */
  const exportar = (lista, nowISO) => JSON.stringify({ schema: 'labcore-exams/1', exportedISO: nowISO, exams: lista }, null, 2);
  function importar(texto, existentes, varsOk) {
    let j;
    try { j = JSON.parse(texto); } catch (e) { return { ok: false, erros: ['O arquivo não é um JSON válido.'], novos: [], ignorados: [] }; }
    if (!j || j.schema !== 'labcore-exams/1' || !Array.isArray(j.exams)) return { ok: false, erros: ['Esquema inválido: esperado "schema": "labcore-exams/1" e a lista "exams".'], novos: [], ignorados: [] };
    const ids = (existentes || []).slice(), vars = (varsOk || []).slice(), novos = [], ignorados = [];
    j.exams.slice(0, 200).forEach((raw, i) => {
      const r = validar(raw, ids, vars);
      if (r.ok) { novos.push(r.plugin); ids.push(r.plugin.id); vars.push(r.plugin.id); } else ignorados.push(`#${i + 1} ${txt(raw && raw.nome, 40) || '(sem nome)'}: ${r.erros.join(' ')}`);
    });
    return { ok: true, erros: [], novos, ignorados };
  }

  return { CUSTOM_EXAMS_PLUGINS, CUSTOM_FLOWS_PLUGINS, evalFormula, compilar, validar, avaliar, avaliarTodos, aliases, paraEnciclopedia, exportar, importar, slug, faixa };
});
