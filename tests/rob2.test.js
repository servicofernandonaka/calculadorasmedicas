const test = require('node:test'), assert = require('node:assert');
const { avaliarRob2, _opcoes } = require('../js/lc-rob2.js');
const S = { 'Y/PY': ['Y', 'PY'], 'N/PN': ['N', 'PN'], 'NI': ['NI'], 'NA': ['NA'], 'Y/PY/NI': ['Y', 'PY', 'NI'], 'N/PN/NI': ['N', 'PN', 'NI'], 'Any': ['Y', 'PY', 'N', 'PN', 'NI'] };
const J = { Low: 'baixo', SC: 'algumas', High: 'alto' };
function combos(cols) { // cols: array of arrays -> cartesian
  return cols.reduce((acc, c) => acc.flatMap((x) => c.map((v) => x.concat([v]))), [[]]);
}
function runTable(dom, ids, rows, efeito) {
  let n = 0;
  rows.forEach(([cols, esperado], i) => {
    combos(cols.map((c) => S[c])).forEach((vals) => {
      const resp = {}; resp[dom] = {}; ids.forEach((id, k) => { resp[dom][id] = vals[k]; });
      const out = avaliarRob2(resp, efeito).dominios.find((d) => d.id === dom);
      assert.equal(out.julgamento, J[esperado], `${dom} linha ${i + 1} ${JSON.stringify(vals)}`);
      n++;
    });
  });
  return n;
}
test('Tabela 4 (D1) e Figura 1', () => {
  const n = runTable('D1', ['1.1', '1.2', '1.3'], [
    [['Y/PY/NI', 'Y/PY', 'N/PN/NI'], 'Low'],
    [['Y/PY', 'Y/PY', 'Y/PY'], 'SC'],
    [['N/PN/NI', 'Y/PY', 'Y/PY'], 'SC'],
    [['Any', 'NI', 'N/PN/NI'], 'SC'],
    [['Any', 'NI', 'Y/PY'], 'High'],
    [['Any', 'N/PN', 'Any'], 'High'],
    // linha ausente da Tabela 4, definida pela Tabela 3 e Figura 1: sequência não aleatória com ocultação adequada
    [['N/PN', 'Y/PY', 'N/PN/NI'], 'SC']
  ]);
  assert.ok(n > 50);
});
test('Tabela 6 (D2, efeito da designação)', () => {
  const ids = ['2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7'];
  // Parte 1 (2.6=Y => parte 2 baixa, assim o resultado é o da parte 1)
  const p1 = (a, b, c, d, e) => [[a, b, c, d, e, 'Y/PY', 'NA'], null];
  const rows1 = [
    [['N/PN', 'N/PN', 'NA', 'NA', 'NA'], 'Low'],
    [['Y/PY/NI', 'Any', 'N/PN', 'NA', 'NA'], 'Low'],
    [['Y/PY/NI', 'Any', 'NI', 'NA', 'NA'], 'SC'],
    [['Y/PY/NI', 'Any', 'Y/PY', 'N/PN', 'NA'], 'SC'],
    [['Y/PY/NI', 'Any', 'Y/PY', 'Y/PY/NI', 'Y/PY'], 'SC'],
    [['Y/PY/NI', 'Any', 'Y/PY', 'Y/PY/NI', 'N/PN/NI'], 'High']
  ];
  rows1.forEach(([c5, esp], i) => {
    // 2.1 e 2.2: "Either Y/PY/NI" => pelo menos um; testar (Y/PY/NI, Any) e (Any, Y/PY/NI)
    const par = i === 0 ? [['N/PN', 'N/PN']] : [['Y/PY/NI', 'Any'], ['Any', 'Y/PY/NI']];
    par.forEach(([x, y]) => {
      runTable('D2', ids, [[[x, y, c5[2], c5[3], c5[4], 'Y/PY', 'NA'], esp]]);
    });
  });
  // exceto o caso 'Any,Any' que seja ambos N/PN, que pertence à linha 1; validado acima de forma explícita
  // Parte 2
  runTable('D2', ids, [
    [['N/PN', 'N/PN', 'NA', 'NA', 'NA', 'Y/PY', 'NA'], 'Low'],
    [['N/PN', 'N/PN', 'NA', 'NA', 'NA', 'N/PN/NI', 'N/PN'], 'SC'],
    [['N/PN', 'N/PN', 'NA', 'NA', 'NA', 'N/PN/NI', 'Y/PY/NI'], 'High']
  ]);
  // Critério do domínio: pior das duas partes
  const r = avaliarRob2({ D2: { '2.1': 'Y', '2.2': 'Y', '2.3': 'NI', '2.6': 'Y' } }).dominios[1];
  assert.equal(r.julgamento, 'algumas');
  const r2 = avaliarRob2({ D2: { '2.1': 'N', '2.2': 'N', '2.6': 'N', '2.7': 'NI' } }).dominios[1];
  assert.equal(r2.julgamento, 'alto');
});
test('Tabela 8 (D2, efeito de aderir)', () => {
  const ids = ['2.1', '2.2', '2.3', '2.4', '2.5', '2.6'];
  const lin = (aw, c3, c4, c5, c6, esp) => {
    const par = aw === 'both' ? [['N/PN', 'N/PN']] : [['Y/PY/NI', 'Any'], ['Any', 'Y/PY/NI']];
    par.forEach(([x, y]) => runTable('D2', ids, [[[x, y, c3, c4, c5, c6], esp]], 'adhering'));
  };
  const A = (c) => c; // legibilidade
  // cada linha da tabela; 'N/PN or NA' = N/PN e NA
  const NOrNA = ['N/PN']; // NA tratado em separado abaixo
  const variantsNN = [['N/PN'], ['NA']];
  const yy = (c3list, c4list, c5list, c6, esp, aw) => {
    c3list.forEach((c3) => c4list.forEach((c4) => c5list.forEach((c5) => lin(aw, c3, c4, c5, c6, esp))));
  };
  yy(['NA'], ['N/PN', 'NA'], ['N/PN', 'NA'], 'NA', 'Low', 'both');
  yy(['Y/PY', 'NA'], ['N/PN', 'NA'], ['N/PN', 'NA'], 'NA', 'Low', 'either');
  yy(['NA'], ['Y/PY/NI'], ['N/PN', 'NA'], 'Y/PY', 'SC', 'both');
  yy(['NA'], ['N/PN', 'NA'], ['Y/PY/NI'], 'Y/PY', 'SC', 'both');
  yy(['Y/PY', 'NA'], ['Y/PY/NI'], ['N/PN', 'NA'], 'Y/PY', 'SC', 'either');
  yy(['Y/PY', 'NA'], ['N/PN', 'NA'], ['Y/PY/NI'], 'Y/PY', 'SC', 'either');
  yy(['N/PN/NI'], ['Any'], ['Any'], 'Y/PY', 'SC', 'either');
  yy(['NA'], ['Y/PY/NI'], ['N/PN', 'NA'], 'N/PN/NI', 'High', 'both');
  yy(['NA'], ['N/PN', 'NA'], ['Y/PY/NI'], 'N/PN/NI', 'High', 'both');
  yy(['Y/PY', 'NA'], ['Y/PY/NI'], ['N/PN', 'NA'], 'N/PN/NI', 'High', 'either');
  yy(['Y/PY', 'NA'], ['N/PN', 'NA'], ['Y/PY/NI'], 'N/PN/NI', 'High', 'either');
  yy(['N/PN/NI'], ['Any'], ['Any'], 'N/PN/NI', 'High', 'either');
});
test('Tabela 10 (D3)', () => {
  runTable('D3', ['3.1', '3.2', '3.3', '3.4'], [
    [['Y/PY', 'NA', 'NA', 'NA'], 'Low'],
    [['N/PN/NI', 'Y/PY', 'NA', 'NA'], 'Low'],
    [['N/PN/NI', 'N/PN', 'N/PN', 'NA'], 'Low'],
    [['N/PN/NI', 'N/PN', 'Y/PY/NI', 'N/PN'], 'SC'],
    [['N/PN/NI', 'N/PN', 'Y/PY/NI', 'Y/PY/NI'], 'High']
  ]);
  // 3.2 não admite 'Sem informação' (Caixa 8): resposta inválida deixa o domínio pendente
  const r = avaliarRob2({ D3: { '3.1': 'N', '3.2': 'NI' } }).dominios[2];
  assert.equal(r.julgamento, null); assert.equal(r.pendente, '3.2');
});
test('Tabela 12 (D4)', () => {
  runTable('D4', ['4.1', '4.2', '4.3', '4.4', '4.5'], [
    [['N/PN/NI', 'N/PN', 'N/PN', 'NA', 'NA'], 'Low'],
    [['N/PN/NI', 'N/PN', 'Y/PY/NI', 'N/PN', 'NA'], 'Low'],
    [['N/PN/NI', 'N/PN', 'Y/PY/NI', 'Y/PY/NI', 'N/PN'], 'SC'],
    [['N/PN/NI', 'N/PN', 'Y/PY/NI', 'Y/PY/NI', 'Y/PY/NI'], 'High'],
    [['N/PN/NI', 'NI', 'N/PN', 'NA', 'NA'], 'SC'],
    [['N/PN/NI', 'NI', 'Y/PY/NI', 'N/PN', 'NA'], 'SC'],
    [['N/PN/NI', 'NI', 'Y/PY/NI', 'Y/PY/NI', 'N/PN'], 'SC'],
    [['N/PN/NI', 'NI', 'Y/PY/NI', 'Y/PY/NI', 'Y/PY/NI'], 'High'],
    [['Y/PY', 'Any', 'Any', 'Any', 'Any'], 'High'],
    [['Any', 'Y/PY', 'Any', 'Any', 'Any'], 'High']
  ]);
});
test('Tabela 14 (D5)', () => {
  runTable('D5', ['5.1', '5.2', '5.3'], [
    [['Y/PY', 'N/PN', 'N/PN'], 'Low'],
    [['N/PN/NI', 'N/PN', 'N/PN'], 'SC'],
    [['Any', 'N/PN', 'NI'], 'SC'],
    [['Any', 'NI', 'N/PN'], 'SC'],
    [['Any', 'NI', 'NI'], 'SC'],
    [['Any', 'Y/PY', 'Any'], 'High'],
    [['Any', 'Any', 'Y/PY'], 'High']
  ]);
});
test('Tabela 1: julgamento global e alertas', () => {
  const baixo = { D1: { '1.1': 'Y', '1.2': 'Y', '1.3': 'N' }, D2: { '2.1': 'N', '2.2': 'N', '2.6': 'Y' }, D3: { '3.1': 'Y' }, D4: { '4.1': 'N', '4.2': 'N', '4.3': 'N' }, D5: { '5.1': 'Y', '5.2': 'N', '5.3': 'N' } };
  let r = avaliarRob2(baixo); assert.equal(r.global, 'baixo'); assert.equal(r.completo, true);
  const um = JSON.parse(JSON.stringify(baixo)); um.D3 = { '3.1': 'N', '3.2': 'N', '3.3': 'Y', '3.4': 'N' };
  r = avaliarRob2(um); assert.equal(r.global, 'algumas'); assert.equal(r.alertas.length, 0);
  const dois = JSON.parse(JSON.stringify(um)); dois.D5 = { '5.1': 'N', '5.2': 'N', '5.3': 'N' };
  r = avaliarRob2(dois); assert.equal(r.global, 'algumas'); assert.equal(r.alertas.length, 1);
  const alto = JSON.parse(JSON.stringify(dois)); alto.D1 = { '1.2': 'N' };
  assert.equal(avaliarRob2(alto).global, 'alto');
  const inc = JSON.parse(JSON.stringify(baixo)); delete inc.D5;
  r = avaliarRob2(inc); assert.equal(r.global, null); assert.equal(r.completo, false);
});
test('pendências, perguntas visitadas e respostas inválidas', () => {
  let r = avaliarRob2({});
  assert.deepEqual(r.dominios[0].visitadas, ['1.2']); assert.equal(r.dominios[0].pendente, '1.2');
  r = avaliarRob2({ D1: { '1.2': 'Y', '1.1': 'Y', '1.3': 'N', lixo: 'Y' } });
  assert.equal(r.dominios[0].julgamento, 'baixo'); assert.deepEqual(r.dominios[0].visitadas, ['1.2', '1.1', '1.3']);
  r = avaliarRob2({ D1: { '1.2': 'Talvez' } }); assert.equal(r.dominios[0].julgamento, null);
  r = avaliarRob2({ D2: { '2.1': 'N', '2.2': 'N' } }, 'adhering').dominios[1]; assert.equal(r.pendente, '2.4');
  // NA só é aceito onde o instrumento permite
  r = avaliarRob2({ D2: { '2.1': 'N', '2.2': 'N', '2.4': 'NA', '2.5': 'NA' } }, 'adhering').dominios[1]; assert.equal(r.julgamento, 'baixo');
  r = avaliarRob2({ D2: { '2.1': 'NA' } }).dominios[1]; assert.equal(r.julgamento, null);
});
