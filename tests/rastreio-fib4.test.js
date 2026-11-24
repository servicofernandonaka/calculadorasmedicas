// Rastreio: regra de FIB-4 na esteatose (MASLD), conforme AASLD 2023 (Tabela 7) e EASL 2024
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Carrega só as regras e o motor (o resto do arquivo é interface com DOM)
const src = fs.readFileSync(path.join(__dirname, '../js/medscreening.js'), 'utf8');
const ini = src.indexOf('const REGRAS='), fim = src.indexOf('if (false && typeof module');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(src.slice(ini, fim) + '\nthis.REGRAS = REGRAS; this.avaliar = avaliar;', ctx);
const HOJE = new Date(2026, 10, 24);
const item = (idade, sexo, fatores, ultimos) =>
  ctx.avaliar({ idade, sexo, fatores, anos_desde_ultimo: ultimos }, ctx.REGRAS, HOJE).itens.find((i) => i.id === 'fibrose_hepatica_masld');

test('regra existe, com fontes, conferência e link para a calculadora', () => {
  const r = ctx.REGRAS.regras.find((x) => x.id === 'fibrose_hepatica_masld');
  assert.ok(r);
  assert.equal(r.calc, 'fib4');
  assert.equal(r.conferencia.nivel, 'primaria');
  assert.ok(r.fontes.some((f) => /AASLD/.test(f.nome) && f.tipo === 'primaria'));
});

test('sem fator de risco: não se aplica (rastreio populacional não recomendado)', () => {
  assert.equal(item(55, 'M', []).status, 'nao_aplicavel');
  assert.equal(item(55, 'F', ['tabagismo']).status, 'nao_aplicavel');
});

test('diabetes tipo 2 ou pré-diabetes: indicado', () => {
  assert.equal(item(50, 'F', ['dm']).status, 'indicado_agora');
  assert.equal(item(50, 'M', ['prediabetes']).status, 'indicado_agora');
});

test('obesidade só com outro fator metabólico; 2 fatores metabólicos quaisquer', () => {
  assert.equal(item(45, 'M', ['obesidade', 'sobrepeso_obesidade']).status, 'nao_aplicavel');
  assert.equal(item(45, 'M', ['obesidade', 'sobrepeso_obesidade', 'has']).status, 'indicado_agora');
  assert.equal(item(45, 'F', ['sobrepeso_obesidade', 'tg_alto']).status, 'indicado_agora');
  assert.equal(item(45, 'F', ['has', 'hdl_baixo']).status, 'indicado_agora');
  assert.equal(item(45, 'F', ['has']).status, 'nao_aplicavel');
  assert.equal(item(45, 'F', ['sobrepeso_obesidade']).status, 'nao_aplicavel');
});

test('repetir a cada 1 a 2 anos: em dia antes de 2 anos', () => {
  assert.equal(item(60, 'M', ['dm'], { fibrose_hepatica_masld: 1 }).status, 'em_dia');
  assert.equal(item(60, 'M', ['dm'], { fibrose_hepatica_masld: 2 }).status, 'indicado_agora');
});

test('menores de 18 anos: não se aplica', () => {
  assert.equal(item(16, 'M', ['dm']).status, 'nao_aplicavel');
});
