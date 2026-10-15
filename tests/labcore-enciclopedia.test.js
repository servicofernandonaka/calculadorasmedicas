const test = require('node:test'), assert = require('node:assert');
const L = require('../js/labcore-engine.js');
const En = require('../js/labcore-enciclopedia.js');

/* ---------- Parser de laudo (parseReport) ---------- */
test('parseReport: extrai valores com vírgula decimal e aliases', () => {
  const r = L.parseReport('Creatinina: 1,2 mg/dL\nHbA1c 6,8 %\nTSH = 4,5\nFerritina 30');
  assert.equal(r.values.cr, 1.2);
  assert.equal(r.values.hba1c, 6.8);
  assert.equal(r.values.tsh, 4.5);
  assert.equal(r.values.ferritina, 30);
});
test('parseReport: ignora acentos e caixa (potássio, sódio)', () => {
  const r = L.parseReport('POTÁSSIO 4,1  Sódio: 140');
  assert.equal(r.values.k, 4.1);
  assert.equal(r.values.na, 140);
});
test('parseReport: milhar com ponto em contagens (plaquetas 250.000)', () => {
  assert.equal(L.parseReport('Plaquetas: 250.000').values.plaq, 250000);
});
test('parseReport: idade, sexo e gestação', () => {
  const r = L.parseReport('Paciente feminino, 34 anos, gestante. Hb 11,2');
  assert.equal(r.values.idade, 34);
  assert.equal(r.values.sexo, 'F');
  assert.equal(r.values.gestante, true);
  assert.equal(r.values.hb, 11.2);
});
test('parseReport: texto vazio ou nulo não quebra', () => {
  assert.deepEqual(L.parseReport('').values, {});
  assert.deepEqual(L.parseReport(null).values, {});
});
test('parseReport: alias curto não casa dentro de outra palavra (ex.: "ca" em "calcio" já usado)', () => {
  const r = L.parseReport('Cálcio 9,4');
  assert.equal(r.values.ca, 9.4);
  assert.equal(r.found.filter((f) => f.field === 'ca').length, 1);
});

/* ---------- Enciclopédia ---------- */
test('Enciclopédia: ids únicos, categorias válidas e campos obrigatórios', () => {
  const ids = new Set();
  for (const e of En.ENTRADAS) {
    assert.ok(!ids.has(e.id), `id duplicado: ${e.id}`); ids.add(e.id);
    assert.ok(En.CATS[e.cat], `categoria inválida em ${e.id}`);
    assert.ok(e.titulo && e.resumo && e.fonte, `campo vazio em ${e.id}`);
    assert.ok(Array.isArray(e.pontos) && e.pontos.length > 0, `sem pontos em ${e.id}`);
  }
});
test('Enciclopédia: busca sem acento e por termos (AND)', () => {
  const r = En.buscar('pseudotrombocitopenia edta');
  assert.ok(r.some((e) => e.id === 'edta'));
  assert.deepEqual(En.buscar('zzzinexistente'), []);
});
test('Enciclopédia: filtro por categoria e ordenação por relevância', () => {
  const r = En.buscar('', 'interferentes');
  assert.ok(r.length > 0 && r.every((e) => e.cat === 'interferentes'));
  assert.equal(En.buscar('plaquetas')[0].titulo.toLowerCase().includes('plaquetas'), true);
});
test('Enciclopédia: pontos dinâmicos (função) só resolvem com Registry', () => {
  const dyn = En.ENTRADAS.find((e) => e.pontos.some((p) => typeof p === 'function'));
  if (!dyn) return;
  assert.ok(En.textoPontos(dyn, L.REGISTRY).every((p) => typeof p === 'string'));
  assert.ok(En.textoPontos(dyn).some((p) => p === ''));
});
