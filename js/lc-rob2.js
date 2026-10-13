/* Motor determinístico do RoB 2 (parallel-group). Regras: Sterne 2019, guia de 22/08/2019.
   Respostas: Y, PY, PN, N, NI, NA. Nenhuma IA envolvida no julgamento. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RoB2 = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const SIM = ['Y', 'PY'], NAO = ['N', 'PN'];
  const isY = (a) => SIM.includes(a), isN = (a) => NAO.includes(a), isNI = (a) => a === 'NI';
  const PEND = { pendente: true };

  /* Percorre uma árvore pedindo respostas só das perguntas realmente visitadas. */
  function percurso(resp, opcoes, fn) {
    const visitadas = [];
    let pend = null;
    const ask = (id) => {
      if (!visitadas.includes(id)) visitadas.push(id);
      const v = resp[id];
      const validas = opcoes[id];
      if (v === undefined || v === null || v === '' || !validas.includes(v)) { pend = id; throw PEND; }
      return v;
    };
    let j = null;
    try { j = fn(ask); } catch (e) { if (e !== PEND) throw e; j = null; }
    return { julgamento: j, visitadas, pendente: j ? null : pend };
  }
  const BASE = ['Y', 'PY', 'PN', 'N', 'NI'];
  const op = (extra) => Object.assign({}, extra);

  const D1 = (a) => {
    const c = a('1.2');
    if (isN(c)) return 'alto';
    if (isNI(c)) return isY(a('1.3')) ? 'alto' : 'algumas';
    if (isN(a('1.1'))) return 'algumas';
    return isY(a('1.3')) ? 'algumas' : 'baixo';
  };
  const D2a = (a) => {
    let p1;
    if (isN(a('2.1')) && isN(a('2.2'))) p1 = 'baixo';
    else {
      const d = a('2.3');
      if (isN(d)) p1 = 'baixo';
      else if (isNI(d)) p1 = 'algumas';
      else if (isN(a('2.4'))) p1 = 'algumas';
      else p1 = isY(a('2.5')) ? 'algumas' : 'alto';
    }
    let p2;
    if (isY(a('2.6'))) p2 = 'baixo';
    else p2 = isN(a('2.7')) ? 'algumas' : 'alto';
    return pior(p1, p2);
  };
  const D2b = (a) => {
    const cegos = isN(a('2.1')) && isN(a('2.2'));
    let impl;
    if (cegos) impl = true;
    else { const b = a('2.3'); impl = (b === 'NA' || isY(b)); }
    if (impl) {
      const f = a('2.4'), n = a('2.5');
      const ok = (x) => x === 'NA' || isN(x);
      if (ok(f) && ok(n)) return 'baixo';
    }
    return isY(a('2.6')) ? 'algumas' : 'alto';
  };
  const D3 = (a) => {
    if (isY(a('3.1'))) return 'baixo';
    if (isY(a('3.2'))) return 'baixo';
    if (isN(a('3.3'))) return 'baixo';
    return isN(a('3.4')) ? 'algumas' : 'alto';
  };
  const D4 = (a) => {
    if (isY(a('4.1'))) return 'alto';
    const d = a('4.2');
    if (isY(d)) return 'alto';
    const inc = isNI(d); // 4.2 sem informação: nunca 'baixo'
    const aware = a('4.3');
    if (isN(aware)) return inc ? 'algumas' : 'baixo';
    if (isN(a('4.4'))) return inc ? 'algumas' : 'baixo';
    return isN(a('4.5')) ? 'algumas' : 'alto';
  };
  const D5 = (a) => {
    const o = a('5.2'), an = a('5.3');
    if (isY(o) || isY(an)) return 'alto';
    if (isN(o) && isN(an)) return isY(a('5.1')) ? 'baixo' : 'algumas';
    return 'algumas';
  };
  const ORD = { baixo: 0, algumas: 1, alto: 2 };
  function pior(a, b) { return ORD[a] >= ORD[b] ? a : b; }

  const IDS = {
    D1: ['1.1', '1.2', '1.3'],
    D2a: ['2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7'],
    D2b: ['2.1', '2.2', '2.3', '2.4', '2.5', '2.6'],
    D3: ['3.1', '3.2', '3.3', '3.4'],
    D4: ['4.1', '4.2', '4.3', '4.4', '4.5'],
    D5: ['5.1', '5.2', '5.3']
  };
  function opcoesDe(chave) {
    const o = {};
    IDS[chave].forEach((id) => { o[id] = BASE.slice(); });
    if (chave === 'D3') o['3.2'] = ['Y', 'PY', 'PN', 'N'];
    if (chave === 'D2b') ['2.3', '2.4', '2.5'].forEach((id) => { o[id] = BASE.concat('NA'); });
    return o;
  }
  const FN = { D1, D2a, D2b, D3, D4, D5 };
  const NOMES = { D1: 'Processo de randomização', D2: 'Desvios das intervenções pretendidas', D3: 'Dados de desfecho ausentes', D4: 'Aferição do desfecho', D5: 'Seleção do resultado relatado' };

  /* efeito: 'assignment' (padrão) ou 'adhering' */
  function avaliarRob2(resp, efeito) {
    resp = resp || {};
    const ef = efeito === 'adhering' ? 'adhering' : 'assignment';
    const chaves = ['D1', ef === 'adhering' ? 'D2b' : 'D2a', 'D3', 'D4', 'D5'];
    const dominios = chaves.map((k) => {
      const r = percurso(resp[k.slice(0, 2)] || {}, opcoesDe(k), FN[k]);
      return { id: k.slice(0, 2), titulo: NOMES[k.slice(0, 2)], julgamento: r.julgamento, visitadas: r.visitadas, pendente: r.pendente };
    });
    const alertas = [];
    const completos = dominios.every((d) => d.julgamento);
    let global = null;
    if (completos) {
      const n = (x) => dominios.filter((d) => d.julgamento === x).length;
      global = n('alto') ? 'alto' : n('algumas') ? 'algumas' : 'baixo';
      if (global === 'algumas' && n('algumas') >= 2)
        alertas.push('Algumas preocupações em mais de um domínio: o guia admite elevar o julgamento global para Alto risco se isso reduzir substancialmente a confiança no resultado. Decisão do avaliador.');
    }
    return { efeito: ef, dominios, global, alertas, completo: completos };
  }
  return { avaliarRob2, _opcoes: opcoesDe, _IDS: IDS };
});
