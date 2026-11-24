// FIB-4 (calculadora da aba Clínica): fórmula de Sterling 2006 e cortes por idade (Shah 2009; McPherson 2017; AASLD 2023)
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ctx = { window: {}, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/calculators.js'), 'utf8'), ctx);
const calc = ctx.window.CALCS.find((c) => c.id === 'fib4');
const run = (v) => calc.compute.call(calc, v);
const fib4 = (v) => (v.idade * v.ast) / (v.plaq * Math.sqrt(v.alt));

test('existe na aba Clínica, categoria Hepatologia, e a busca acha esteatose', () => {
  assert.ok(calc);
  assert.deepEqual([...calc.tabs], ['clinica']);
  assert.equal(calc.category, 'Hepatologia');
  assert.match(calc.keywords, /esteatose/);
  assert.match(calc.keywords, /masld/);
  assert.match(calc.ref, /Sterling/);
});

test('fórmula: idade × AST / (plaquetas × √ALT)', () => {
  // 52 × 58 / (168 × √74) = 2,087
  const v = { idade: 52, ast: 58, alt: 74, plaq: 168 };
  assert.equal(Math.round(fib4(v) * 1000) / 1000, 2.087);
  assert.equal(run(v).main, 'FIB-4 2,09');
});

test('35 a 64 anos: < 1,3 baixo, 1,3 a 2,67 indeterminado, > 2,67 alto', () => {
  assert.equal(run({ idade: 45, ast: 20, alt: 25, plaq: 250 }).level, 'low');      // 0,72
  assert.equal(run({ idade: 52, ast: 58, alt: 74, plaq: 168 }).level, 'mod');      // 2,09
  assert.equal(run({ idade: 60, ast: 80, alt: 49, plaq: 100 }).level, 'high');     // 6,86
  // limites exatos: 1,3 e 2,67 ainda são indeterminados
  assert.equal(run({ idade: 50, ast: 26, alt: 100, plaq: 100 }).level, 'mod');     // 1,30
  assert.equal(run({ idade: 50, ast: 26, alt: 100, plaq: 101 }).level, 'low');     // 1,287
  assert.equal(run({ idade: 50, ast: 53.4, alt: 100, plaq: 100 }).level, 'mod');   // 2,67
  assert.equal(run({ idade: 50, ast: 53.5, alt: 100, plaq: 100 }).level, 'high');  // 2,675
});

test('65 anos ou mais: corte inferior 2,0', () => {
  const v = { idade: 70, ast: 30, alt: 36, plaq: 200 }; // 1,75
  assert.ok(fib4(v) > 1.3 && fib4(v) < 2.0);
  assert.equal(run(v).level, 'low');
  assert.equal(run({ idade: 64, ast: 30, alt: 36, plaq: 180 }).level, 'mod'); // 1,78 aos 64 anos
});

test('abaixo de 35 anos: inconclusivo, sem estratificar', () => {
  const r = run({ idade: 30, ast: 90, alt: 49, plaq: 100 });
  assert.equal(r.level, 'info');
  assert.match(r.sub, /não é validado/);
});

test('mesmo valor e mesma faixa do motor da LabCore', () => {
  const L = require('../js/labcore-engine.js');
  const casos = [
    { idade: 45, ast: 20, alt: 25, plaq: 250 }, { idade: 52, ast: 58, alt: 74, plaq: 168 },
    { idade: 60, ast: 80, alt: 49, plaq: 100 }, { idade: 70, ast: 30, alt: 36, plaq: 200 },
    { idade: 30, ast: 90, alt: 49, plaq: 100 },
  ];
  for (const v of casos) {
    const lab = L.analyze(v).items.find((i) => i.id === 'fib4');
    assert.ok(Math.abs(lab.value - fib4(v)) < 1e-9);
    assert.equal(run(v).level, lab.level, JSON.stringify(v));
  }
});
