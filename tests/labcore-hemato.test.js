const test = require('node:test'), assert = require('node:assert');
const L = require('../js/labcore-engine.js');
const H = require('../js/labcore-hemato.js');
const P = require('../js/labcore-plugins.js');
const F = require('../js/labcore-fluxos.js');
const E = require('../js/labcore-enciclopedia.js');
const reg = L.effective({}, {});
const near = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `${a} != ${b}`);
const item = (a, id) => a.items.find((i) => i.id === id);
const alertTxt = (a) => a.alerts.map((x) => x.title + ' ' + x.text).join(' | ');

/* Referências: fórmulas da especificação avaliadas à mão. */

test('Proteínas: globulinas = PT − albumina e A/G; hiperglobulinemia por G > 4,0 ou A/G < 1,0', () => {
  const a = L.analyze({ pt: 9.0, albumina: 3.5 });     // G = 5,5; A/G = 0,636
  near(item(a, 'prot').value, 5.5); near(item(a, 'prot').ag, 0.636, 0.001);
  assert.match(alertTxt(a), /Hiperglobulinemia/); assert.match(alertTxt(a), /EPS/);
  const b = L.analyze({ pt: 7.0, albumina: 4.0 });     // G = 3,0; A/G = 1,33
  assert.equal(item(b, 'prot').level, 'info'); assert.doesNotMatch(alertTxt(b), /Hiperglobulinemia/);
  const c = L.analyze({ pt: 7.0, albumina: 3.4 });     // G = 3,6; A/G = 0,94 → A/G < 1
  assert.match(alertTxt(c), /Hiperglobulinemia/);
  const d = L.analyze({ pt: 8.0, albumina: 4.0 });     // G = 4,0 exato (não é > 4,0); A/G = 1,0 exato (não é < 1,0)
  assert.doesNotMatch(alertTxt(d), /Hiperglobulinemia/);
});
test('CRAB automático: globulinas > 4 (ou pico M) + cálcio corrigido > 11, creatinina > 2, TFGe < 40 ou Hb < 10', () => {
  // Ca 9,0 com albumina 2,0 → corrigido 9,0 + 0,8 × 2,0 = 10,6 (não); Ca 10,0 → 11,6 (sim)
  const base = { pt: 9.0, albumina: 2.0 };
  assert.doesNotMatch(alertTxt(L.analyze(Object.assign({ ca: 9.0 }, base))), /CRAB/);
  assert.match(alertTxt(L.analyze(Object.assign({ ca: 10.0 }, base))), /CRAB/);
  assert.match(alertTxt(L.analyze(Object.assign({ ca: 10.0 }, base))), /cálcio corrigido 11,6/);
  assert.match(alertTxt(L.analyze(Object.assign({ cr: 2.1 }, base))), /creatinina 2,1/);
  assert.doesNotMatch(alertTxt(L.analyze(Object.assign({ cr: 2.0 }, base))), /CRAB/);
  assert.match(alertTxt(L.analyze(Object.assign({ hb: 9.9 }, base))), /hemoglobina 9,9/);
  assert.doesNotMatch(alertTxt(L.analyze(Object.assign({ hb: 10 }, base))), /CRAB/);
  // TFGe < 40: homem 80 anos Cr 1,8 → ≈ 38
  const t = L.analyze(Object.assign({ cr: 1.8, idade: 80, sexo: 'M' }, base));
  assert.ok(item(t, 'tfge').value < 40); assert.match(alertTxt(t), /TFGe/);
  // sem gatilho (globulinas normais e sem pico): nada
  assert.doesNotMatch(alertTxt(L.analyze({ pt: 7, albumina: 4.2, hb: 8 })), /CRAB/);
  // pico M presente como gatilho
  assert.match(alertTxt(L.analyze({ picoM: true, hb: 9 })), /Pico monoclonal presente/);
});
test('IPR: CRC = Ret × Ht/45; FM por faixa de Ht; corte 2,0', () => {
  // Ret 3%, Ht 30 → CRC 2,0; FM 1,5 → IPR 1,33 (hipoproliferativa)
  const a = L.analyze({ ret: 3, ht: 30 }); near(item(a, 'ipr').value, 1.333, 0.001); assert.match(item(a, 'ipr').sub, /hipoproliferativa/);
  // Ret 8%, Ht 27 → CRC 4,8; FM 2,0 → 2,4 (hiperproliferativa)
  const b = L.analyze({ ret: 8, ht: 27 }); near(item(b, 'ipr').value, 2.4); assert.match(item(b, 'ipr').sub, /hiperproliferativa/);
  // fatores: Ht 45 → 1,0; Ht 40 → 1,0; 39,9 → 1,5; 30 → 1,5; 29,9 → 2,0; 20 → 2,0; 19,9 → 2,5
  const fm = (ht) => { const x = item(L.analyze({ ret: 1, ht }), 'ipr'); return (1 * (ht / 45)) / x.value; };
  [[45, 1], [40, 1], [39.9, 1.5], [30, 1.5], [29.9, 2], [20, 2], [19.9, 2.5]].forEach(([ht, f]) => near(fm(ht), f, 1e-9));
  // IPR exatamente 2,0 → hiperproliferativa (≥ 2,0): Ret 3, Ht 45 → CRC 3,0 /1,0 = 3 ; use Ret 2 Ht 45 → 2,0
  assert.match(item(L.analyze({ ret: 2, ht: 45 }), 'ipr').sub, /hiperproliferativa/);
  assert.match(item(L.analyze({ ret: 2, ht: 45 }), 'ipr').details.join(' '), /Coombs/);
});
test('Green & King: (VCM² × RDW)/(100 × Hb); <65 talassemia, >65 ferropenia', () => {
  // VCM 70, RDW 14, Hb 10 → 4900 × 14 / 1000 = 68,6 (ferropenia)
  const a = L.analyze({ vcm: 70, rdw: 14, hb: 10 }); near(item(a, 'green').value, 68.6, 0.01); assert.match(item(a, 'green').sub, /ferropenia/);
  // VCM 65, RDW 13, Hb 11 → 4225 × 13 / 1100 = 49,9 (talassemia)
  const b = L.analyze({ vcm: 65, rdw: 13, hb: 11 }); near(item(b, 'green').value, 49.93, 0.01); assert.match(item(b, 'green').sub, /talassemia/);
  assert.match(item(L.analyze({ vcm: 90, rdw: 13, hb: 13 }), 'green').sub, /sem aplicação/);
});
test('Cinética do ferro: ferropenia, inflamação, sobrecarga e CTLF estimada pela transferrina', () => {
  const k = (o) => item(L.analyze(Object.assign({ sexo: 'M' }, o)), 'ferro_cin');
  assert.match(k({ ferritina: 12, ferro: 30, ctlf: 400 }).sub, /Ferropenia clássica/);                         // IST 7,5%
  assert.match(k({ ferritina: 250, ferro: 30, ctlf: 200 }).sub, /Anemia da inflamação/);                      // IST 15%, CTLF 200 < 250
  assert.match(k({ ferritina: 250, ferro: 40, ctlf: 300 }).sub, /CTLF não baixa/);                            // IST 13%, CTLF 300
  assert.match(k({ ferritina: 60, ferro: 30, ctlf: 400 }).sub, /intermediária/);
  assert.match(k({ ferritina: 800, ferro: 180, ctlf: 300 }).sub, /Sobrecarga/);                              // IST 60%
  assert.equal(k({ ferritina: 800, ferro: 180, ctlf: 300 }).level, 'high');
  assert.match(k({ ferritina: 100, ferro: 180, ctlf: 300 }).sub, /elevada com ferritina não alta/);
  assert.match(k({ ferritina: 80, ferro: 100, ctlf: 300 }).sub, /Sem padrão/);
  // ferritina alta depende do sexo: 250 é alta para mulher (>200) e não para homem (>300)
  assert.match(item(L.analyze({ sexo: 'F', ferritina: 250, ferro: 180, ctlf: 300 }), 'ferro_cin').sub, /Sobrecarga/);
  assert.doesNotMatch(item(L.analyze({ sexo: 'M', ferritina: 250, ferro: 180, ctlf: 300 }), 'ferro_cin').sub, /Sobrecarga/);
  // transferrina 200 mg/dL → CTLF 250 µg/dL; ferro 50 → IST 20% (não é < 20)
  const t = L.analyze({ ferritina: 20, ferro: 50, transf: 200 });
  near(item(t, 'tsat').value, 20, 1e-9); assert.match(item(t, 'tsat').details.join(' '), /estimada/);
  near(item(L.analyze({ ferritina: 20, ferro: 40, transf: 200 }), 'tsat').value, 16, 1e-9);
});
test('Alerta de pseudotrombocitopenia por EDTA: plaquetas <100 isoladas', () => {
  assert.match(alertTxt(L.analyze({ plaq: '90000', hb: 14, leuco: 6, sexo: 'M' })), /EDTA/);
  assert.match(alertTxt(L.analyze({ plaq: '90000', hb: 14, leuco: 6, sexo: 'M' })), /citrato/);
  assert.doesNotMatch(alertTxt(L.analyze({ plaq: '110000', hb: 14, leuco: 6 })), /EDTA/);
  assert.doesNotMatch(alertTxt(L.analyze({ plaq: '90000', hb: 9, leuco: 6, sexo: 'M' })), /EDTA/);      // anemia
  assert.doesNotMatch(alertTxt(L.analyze({ plaq: '90000', hb: 14, leuco: 2.5 })), /EDTA/);              // leucopenia
  assert.match(alertTxt(L.analyze({ plaq: 80 })), /confirme/);                                          // sem Hb/leucócitos: avisa que confirme
});
test('ANC e coagulograma', () => {
  // 5000/mm³ × (40 + 5)% = 2,25 ×10⁹/L
  near(item(L.analyze({ leuco: 5000, seg: 40, bast: 5 }), 'anc').value, 2.25);
  assert.match(item(L.analyze({ leuco: 3.0, seg: 40 }), 'anc').sub, /leve/);       // 1,2
  assert.match(item(L.analyze({ leuco: 2.0, seg: 40 }), 'anc').sub, /moderada/);   // 0,8
  assert.match(item(L.analyze({ leuco: 1.0, seg: 40 }), 'anc').sub, /grave/);      // 0,4
  // INR = (TP/controle)^ISI = (18/12)^1,1
  near(item(L.analyze({ tp: 18, tpC: 12, isi: 1.1 }), 'coag').value, Math.pow(1.5, 1.1), 1e-9);
  near(item(L.analyze({ ttpa: 45, ttpaC: 30 }), 'coag').ratio, 1.5, 1e-9);
  near(item(L.analyze({ inr: 2.5 }), 'coag').value, 2.5, 1e-9);
});
test('Parser: novos campos e pico monoclonal', () => {
  const r = L.parseReport('Proteínas totais 9,2 Alb 3,1 Ret 3,2 Ht 28 RDW 16,5 Ferritina 12 Transferrina 410 Leucócitos 5200 TP 16 TP controle 12 ISI 1.1 TTPa 40 TTPa controle 30 pico monoclonal');
  assert.deepEqual([r.values.pt, r.values.albumina, r.values.ret, r.values.ht, r.values.rdw, r.values.transf, r.values.leuco], [9.2, 3.1, 3.2, 28, 16.5, 410, 5200]);
  assert.equal(r.values.tp, 16); assert.equal(r.values.tpC, 12); assert.equal(r.values.ttpa, 40); assert.equal(r.values.ttpaC, 30); assert.equal(r.values.picoM, true);
  assert.equal(L.parseReport('sem pico monoclonal').values.picoM, undefined);
});
test('Itens anteriores continuam iguais (Mentzer, TSAT, FIB-4 intactos)', () => {
  const a = L.analyze({ idade: 50, ast: 55, alt: 62, plaq: 140, vcm: 71, rbc: 5.6, ferro: 40, ctlf: 400 });
  near(item(a, 'fib4').value, 2.495, 0.01); near(item(a, 'mentzer').value, 12.68, 0.01); near(item(a, 'tsat').value, 10, 1e-9);
});

/* ---------- EPS ---------- */
const eps = (o) => H.eps(o, reg);
const ids = (r) => r.padroes.map((p) => p.id);
test('EPS: padrões a partir das faixas do Registry', () => {
  assert.deepEqual(ids(eps({ alb: 4.2, a1: 0.25, a2: 0.65, b1: 0.45, b2: 0.35, gama: 1.1 })), ['normal']);
  assert.ok(ids(eps({ alb: 3.0, a1: 0.6, a2: 1.2, b1: 0.4, b2: 0.3, gama: 1.2 })).includes('inflamacao'));
  assert.ok(ids(eps({ alb: 2.0, a1: 0.2, a2: 1.4, b1: 0.4, b2: 0.3, gama: 0.5 })).includes('nefrotico'));
  assert.ok(ids(eps({ alb: 3.0, a1: 0.2, a2: 0.6, b1: 0.4, b2: 0.7, gama: 2.2 })).includes('cirrose'));
  assert.ok(ids(eps({ alb: 4.0, a1: 0.05, a2: 0.6, b1: 0.4, b2: 0.3, gama: 1.0 })).includes('aat'));
  assert.ok(ids(eps({ alb: 4.0, a1: 0.25, a2: 0.6, b1: 0.8, b2: 0.3, gama: 1.0 })).includes('ferropenia'));
  assert.ok(ids(eps({ alb: 4.0, a1: 0.25, a2: 0.6, b1: 0.4, b2: 0.3, gama: 0.4 })).includes('hipogama'));
  assert.ok(ids(eps({ alb: 3.8, a1: 0.25, a2: 0.6, b1: 0.4, b2: 0.3, gama: 2.3 })).includes('policlonal'));
});
test('EPS: pico < 3 sem CRAB é MGUS; ≥ 3 ou CRAB é mieloma', () => {
  const base = { alb: 3.8, a1: 0.25, a2: 0.6, b1: 0.4, b2: 0.3, gama: 2.5 };
  assert.ok(ids(eps(Object.assign({ pico: 1.2 }, base))).includes('pico_mgus'));
  assert.ok(ids(eps(Object.assign({ pico: 2.99 }, base))).includes('pico_mgus'));
  assert.ok(ids(eps(Object.assign({ pico: 3.0 }, base))).includes('pico_mm'));
  const c = eps(Object.assign({ pico: 1.2, ca: 11.5 }, base)); assert.ok(ids(c).includes('pico_mm')); assert.deepEqual(c.pico.crab, ['hipercalcemia']);
  assert.ok(ids(eps(Object.assign({ pico: 1.2, osso: true }, base))).includes('pico_mm'));
  assert.ok(!ids(eps(Object.assign({ pico: 1.2 }, base))).includes('policlonal'));
});
test('EPS: o limite do Registry vem do laboratório (ajuste local muda o padrão)', () => {
  const r2 = L.effective({ 'eps:g.hi': { value: 2.5, origin: 'manual' } }, {});
  assert.ok(!ids(H.eps({ alb: 3.8, gama: 2.3 }, r2)).includes('policlonal'));
});
test('EPS: o SVG traz a curva normal tracejada, a do paciente e rótulos acessíveis', () => {
  const r = eps({ alb: 3.8, a1: 0.25, a2: 0.6, b1: 0.4, b2: 0.3, gama: 2.5, pico: 1.5 });
  assert.match(r.svg, /^<svg/); assert.match(r.svg, /stroke-dasharray/); assert.match(r.svg, /role="img"/); assert.match(r.svg, /pico monoclonal 1,50 g\/dL/);
  assert.equal((r.svg.match(/<path/g) || []).length, 2);
  assert.doesNotMatch(r.svg, /NaN|Infinity|undefined/);
  assert.notEqual(H.svgEps({ alb: 4, pico: 2 }, reg), H.svgEps({ alb: 4 }, reg));
});

/* ---------- HPLC ---------- */
const hp = (o) => H.hplc(o, reg);
const hid = (r) => r.padroes.map((p) => p.id);
test('HPLC: normal e HbA2/HbF fora do normal', () => {
  assert.deepEqual(hid(hp({ a1: 96.5, a2: 2.6, f: 0.9, vcm: 88 })), ['normal']);
  assert.deepEqual(hid(hp({ a1: 93, a2: 2.5, f: 4.0, vcm: 88 })), ['f_alta']);
  assert.deepEqual(hid(hp({ a1: 96, a2: 1.0, f: 0.5, vcm: 88 })), ['a2_baixa']);
});
test('HPLC: beta-talassemia menor (HbA2 3,6-8,5% com microcitose) e HbA2 muito alta', () => {
  assert.deepEqual(hid(hp({ a1: 91, a2: 5.2, f: 1.5, vcm: 66 })), ['betaMenor']);
  assert.deepEqual(hid(hp({ a1: 96, a2: 3.5, f: 0.5, vcm: 70 })).includes('betaMenor'), false);   // 3,5 não é elevada
  assert.deepEqual(hid(hp({ a1: 96, a2: 3.6, f: 0.5, vcm: 70 })), ['betaMenor']);
  assert.deepEqual(hid(hp({ a1: 85, a2: 8.5, f: 1, vcm: 66 })), ['betaMenor']);
  assert.deepEqual(hid(hp({ a1: 85, a2: 8.6, f: 1, vcm: 66 })), ['a2_muito']);
  assert.deepEqual(hid(hp({ a1: 91, a2: 5.2, f: 1.5, vcm: 88 })), ['a2_semmicro']);
});
test('HPLC: ferropenia com HbA2 normal não descarta beta-talassemia (alerta crítico)', () => {
  const r = hp({ a1: 96.8, a2: 2.9, f: 0.3, vcm: 68, ferropenia: true });
  assert.deepEqual(hid(r), ['ferropenia_ocultando']);
  assert.equal(r.alertas[0].level, 'high'); assert.match(r.alertas[0].text, /reduz falsamente a HbA2/); assert.match(r.alertas[0].text, /repita/);
  const r2 = hp({ a1: 96.8, a2: 3.5, f: 0.3, vcm: 68, ferropenia: true }); assert.deepEqual(hid(r2), ['ferropenia_ocultando']);   // limítrofe
  // HbA2 elevada mesmo com ferropenia sustenta o diagnóstico
  const r3 = hp({ a1: 91, a2: 5.0, f: 1, vcm: 66, ferropenia: true }); assert.deepEqual(hid(r3), ['betaMenor']); assert.match(r3.padroes[0].recs.join(' '), /sustenta/);
});
test('HPLC: sulfato ferroso só com ferropenia comprovada', () => {
  assert.match(hp({ a1: 91, a2: 5.2, f: 1.5, vcm: 66 }).padroes[0].recs.join(' '), /sulfato ferroso/);
  assert.match(hp({ a1: 91, a2: 5.2, f: 1.5, vcm: 66, ferritina: 150 }).padroes[0].recs.join(' '), /Ferritina normal/);
  assert.equal(hp({ a1: 91, a2: 5.2, f: 1.5, vcm: 66, ferritina: 10 }).padroes[0].recs.join(' ').includes('Ferritina normal'), false);
});
test('HPLC: traço alfa-talassêmico (microcitose, Mentzer < 13, sem ferropenia, HPLC normal)', () => {
  assert.deepEqual(hid(hp({ a1: 97, a2: 2.5, f: 0.5, vcm: 68, rbc: 5.8 })), ['alfa']);                // 11,7
  assert.deepEqual(hid(hp({ a1: 97, a2: 2.5, f: 0.5, vcm: 68, rbc: 4.0 })), ['micro_mentzer_alto']);  // 17
  assert.deepEqual(hid(hp({ a1: 97, a2: 2.5, f: 0.5, vcm: 68 })), ['micro_sem_mentzer']);
});
test('HPLC: traço falciforme, anemia falciforme, S-beta⁰, S-beta⁺, HbSC', () => {
  assert.deepEqual(hid(hp({ a1: 60, a2: 2.5, f: 0.5, s: 38, vcm: 85 })), ['as']);
  assert.deepEqual(hid(hp({ a1: 0, a2: 2.8, f: 8, s: 89, vcm: 88 })), ['ss']);
  assert.deepEqual(hid(hp({ a1: 0, a2: 5.0, f: 6, s: 88, vcm: 68 })), ['sbeta0']);
  assert.deepEqual(hid(hp({ a1: 15, a2: 5.0, f: 3, s: 77, vcm: 70 })), ['sbeta1']);
  assert.deepEqual(hid(hp({ a1: 3, a2: 5.0, f: 3, s: 89, vcm: 70 })), ['sbeta_i']);
  assert.deepEqual(hid(hp({ a1: 0, a2: 2.5, f: 1.5, s: 49, c: 48, vcm: 80 })), ['sc']);
  assert.deepEqual(hid(hp({ a1: 0, a2: 2.5, f: 1.5, s: 20, c: 75, vcm: 80 })), ['sc_indef']);
  assert.deepEqual(hid(hp({ a1: 65, a2: 2.5, f: 0.5, c: 32, vcm: 85 })), ['ac']);
});
test('HPLC: limites da anemia falciforme (HbS 80 exato não é SS; HbA2 ≤3,5)', () => {
  assert.deepEqual(hid(hp({ a1: 0, a2: 2.8, f: 8, s: 80, vcm: 88 })), ['s_indef']);
  assert.deepEqual(hid(hp({ a1: 0, a2: 3.5, f: 8, s: 89, vcm: 88 })), ['ss']);
  assert.match(hp({ a1: 50, a2: 2, f: 1, s: 20 }).avisos.join(' '), /somam/);
  assert.match(hp({ a1: 96, a2: 2.5, f: 0.5 }).avisos.join(' '), /VCM não informado/);
});

/* ---------- plugins ---------- */
const OK = ['hb', 'vcm', 'rbc'];
test('Fórmulas: precedência, potência, funções, vírgula decimal e erros (sem eval)', () => {
  const v = (s, vars) => P.evalFormula(s, vars || {});
  assert.equal(v('2 + 3 * 4').value, 14); assert.equal(v('(2 + 3) * 4').value, 20); assert.equal(v('2 ^ 3 ^ 2').value, 512);
  assert.equal(v('-2 ^ 2').value, -4); assert.equal(v('sqrt(16) + abs(-3)').value, 7); assert.equal(v('max(1, 5, 3) - min(2, 4)').value, 3);
  assert.equal(v('vcm / rbc', { vcm: 71, rbc: 5.6 }).value, 71 / 5.6);
  assert.equal(v('1,5 * 2').value, 3);
  assert.deepEqual(v('vcm / rbc', { vcm: 71 }).falta, ['rbc']);
  assert.match(v('1 / 0').erro, /indefinido/); assert.match(v('sqrt(-1)').erro, /indefinido/);
  assert.match(v('2 +').erro, /incompleta/); assert.match(v('foo(2)').erro, /desconhecida/); assert.match(v('2 $ 3').erro, /inválido/);
  assert.match(v('process.exit(1)').erro, /inválido|desconhecida/);
  assert.ok(v('constructor').falta);          // nome perigoso é só variável ausente
  assert.match(v('(((((((((((((((((((((((((((((((((((((((((1)))))))))))))))))))))))))))))))))))))))))').erro, /aninhada/);
  assert.match(v('1 + '.repeat(120) + '1').erro, /longa/);
});
test('Cadastro: valida nome, id, referência, fórmula e variáveis', () => {
  const ok = P.validar({ nome: 'Vitamina B12', siglas: 'B12, Cobalamina', unidade: 'pg/mL', refMin: '200', refMax: '900,5' }, OK, OK);
  assert.ok(ok.ok); assert.equal(ok.plugin.id, 'x_vitamina_b12'); assert.deepEqual(ok.plugin.siglas, ['B12', 'Cobalamina']); assert.equal(ok.plugin.refMax, 900.5); assert.equal(ok.plugin.categoria, 'Personalizados');
  assert.match(P.validar({ nome: '' }, OK, OK).erros.join(' '), /nome/);
  assert.match(P.validar({ nome: 'X', refMin: 10, refMax: 5 }, OK, OK).erros.join(' '), /inferior/);
  assert.match(P.validar({ nome: 'X', refMin: 'abc' }, OK, OK).erros.join(' '), /números/);
  assert.match(P.validar({ nome: 'X', id: 'hb' }, ['hb'], OK).erros.join(' '), /Já existe/);
  assert.match(P.validar({ nome: 'X', id: 'Bad Id!' }, OK, OK).erros.join(' '), /Identificador/);
  assert.match(P.validar({ nome: 'IPS', formula: 'vcm / banana' }, OK, OK).erros.join(' '), /banana/);
  assert.match(P.validar({ nome: 'Auto', id: 'x_auto', formula: 'x_auto + 1' }, OK, OK).erros.join(' '), /x_auto/);
  assert.ok(P.validar({ nome: 'IPS', formula: 'vcm / rbc' }, OK, OK).ok);
  assert.equal(P.validar({ nome: 'T'.repeat(200) }, OK, OK).plugin.nome.length, 60);
});
test('Avaliação: referência, interpretação, fórmula e variáveis ausentes', () => {
  const b12 = P.validar({ nome: 'B12', id: 'x_b12', siglas: 'B12', unidade: 'pg/mL', refMin: 200, refMax: 900, interpretaBaixo: 'Considere deficiência.', interferentes: 'Biotina.', fonte: 'Minha fonte' }, OK, OK).plugin;
  const lo = P.avaliar(b12, { x_b12: 150 }); assert.equal(lo.sub, 'Abaixo da referência'); assert.equal(lo.level, 'mod'); assert.match(lo.details.join(' '), /Considere deficiência/); assert.match(lo.details.join(' '), /Biotina/); assert.equal(lo.selo, '[Personalizado | Personalizados]');
  assert.equal(P.avaliar(b12, { x_b12: 200 }).sub, 'Dentro da referência'); assert.equal(P.avaliar(b12, { x_b12: 900 }).sub, 'Dentro da referência');
  assert.equal(P.avaliar(b12, { x_b12: 901 }).sub, 'Acima da referência');
  assert.equal(P.avaliar(b12, {}), null);
  const f = P.validar({ nome: 'VCM por RBC', id: 'x_mz', formula: 'vcm / rbc', refMax: 13 }, OK, OK).plugin;
  const it = P.avaliar(f, { vcm: 71, rbc: 5.6 }); assert.equal(it.main, '12,7'); assert.equal(it.sub, 'Dentro da referência');
  assert.equal(P.avaliar(f, { vcm: 71 }), null);
  assert.match(P.avaliar({ id: 'x_d', nome: 'D', categoria: 'C', siglas: [], unidade: '', refMin: null, refMax: null, formula: 'vcm / zero', interferentes: '', interpretaAlto: '', interpretaBaixo: '', regulacao: '', fonte: '' }, { vcm: 1, zero: 0 }).sub, /indefinido/);
  assert.equal(P.avaliar({ id: 'x_s', nome: 'S', categoria: 'C', siglas: [], unidade: 'u', refMin: null, refMax: null, formula: '', interferentes: '', interpretaAlto: '', interpretaBaixo: '', regulacao: '', fonte: '' }, { x_s: 5 }).sub, 'Sem referência cadastrada');
});
test('Plugin integrado ao parser, à Bancada, ao SOAP e à Enciclopédia', () => {
  const b12 = P.validar({ nome: 'Vitamina B12', id: 'x_b12', siglas: 'B12, Cobalamina', unidade: 'pg/mL', refMin: 200, refMax: 900, regulacao: 'Protocolo local' }, OK, OK).plugin;
  const ipx = P.validar({ nome: 'Razão VCM/RBC', id: 'x_razao', formula: 'x_b12 / 100 + vcm', refMax: 500 }, OK.concat('x_b12'), OK.concat('x_b12')).plugin;
  const lista = [b12, ipx];
  // parser: reconhece as siglas do plugin (sem acento, com vírgula)
  const r = L.parseReport('Hb 10,5 Cobalamina 150', P.aliases(lista));
  assert.equal(r.values.x_b12, 150);
  assert.equal(L.parseReport('B12: 180', P.aliases(lista)).values.x_b12, 180);
  assert.equal(r.values.hb, 10.5);
  // bancada: valores nativos + plugin
  const a = L.analyze({ hb: 10.5, vcm: 80 });
  const vars = Object.assign({}, a.v, { x_b12: 150 });
  const itens = P.avaliarTodos(lista, vars);
  assert.deepEqual(itens.map((i) => i.id), ['cx_x_b12', 'cx_x_razao']);
  assert.equal(itens[1].main, '81,5');                              // 150/100 + 80
  // SOAP lista o item personalizado com seu selo
  a.items = a.items.concat(itens);
  assert.match(L.soap({}, a, '2026-10-15'), /Vitamina B12: 150 pg\/mL \(Abaixo da referência\) \[Personalizado \| Personalizados\]/);
  // enciclopédia
  const e = P.paraEnciclopedia(b12);
  assert.equal(e.cat, 'personalizados'); assert.equal(e.regulacaoPadrao, 'Protocolo local');
  assert.deepEqual(E.buscar('cobalamina', '', reg, [e]).map((x) => x.id), ['custom_x_b12']);
  assert.equal(E.buscar('cobalamina', '', reg).length, 0);
  assert.equal(E.buscar('', 'personalizados', reg, [e]).length, 1);
});
test('Exportar/importar .json: valida esquema, ids repetidos e itens inválidos', () => {
  const a = P.validar({ nome: 'A', id: 'x_a', siglas: 'A1', refMin: 1, refMax: 2 }, OK, OK).plugin;
  const txt = P.exportar([a], '2026-10-15');
  const r = P.importar(txt, OK, OK); assert.ok(r.ok); assert.equal(r.novos.length, 1); assert.equal(r.novos[0].id, 'x_a');
  const dup = P.importar(txt, OK.concat('x_a'), OK.concat('x_a')); assert.equal(dup.novos.length, 0); assert.match(dup.ignorados[0], /Já existe/);
  assert.equal(P.importar('{', OK, OK).ok, false);
  assert.equal(P.importar(JSON.stringify({ schema: 'outro', exams: [] }), OK, OK).ok, false);
  const mix = P.importar(JSON.stringify({ schema: 'labcore-exams/1', exams: [{ nome: 'Bom', id: 'x_bom' }, { nome: '' }, { nome: 'Ruim', formula: '1 +' }, { nome: 'Perigo', id: 'x_p', formula: 'constructor.constructor(1)' }] }), OK, OK);
  assert.equal(mix.novos.length, 1); assert.equal(mix.ignorados.length, 3);
});
test('CUSTOM_EXAMS_PLUGINS e CUSTOM_FLOWS_PLUGINS existem como arrays para extensão por código', () => {
  assert.ok(Array.isArray(P.CUSTOM_EXAMS_PLUGINS)); assert.ok(Array.isArray(P.CUSTOM_FLOWS_PLUGINS));
});
test('Fluxo por plugin: registra, roda e recusa estruturas inválidas', () => {
  const flow = { id: 'x_teste', titulo: 'Teste', start: 'n0', nodes: { n0: { t: 'choice', q: 'Q?', opts: [{ v: 'a', label: 'A', next: 'r1' }] }, r1: { t: 'result', level: 'info', title: 'Fim', texts: ['ok'], recs: [] } } };
  assert.ok(F.registrar(flow).ok);
  const x = F.play('x_teste', ['a'], reg); assert.equal(x.result.title, 'Fim'); assert.deepEqual(x.result.selos, []);
  assert.equal(F.registrar(flow).ok, false);                                                         // id repetido
  assert.match(F.registrar({ id: 'x_ruim', titulo: 'R', start: 'n0', nodes: { n0: { t: 'choice', q: '', opts: [{ v: 'a', label: 'A', next: 'nada' }] } } }).erros.join(' '), /não existe/);
  assert.equal(F.registrar({ id: 'Ruim Id', titulo: 'R', start: 'n0', nodes: {} }).ok, false);
  assert.match(F.registrar({ id: 'x_f', titulo: 'F', start: 'n0', nodes: { n0: { t: 'form', fields: [] } } }).erros.join(' '), /route/);
  assert.match(F.nota(F.byId('x_teste'), x.result, '2026-10-15'), /Teste \(LabCore APS\)/);
});
