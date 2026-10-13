const test = require('node:test'), assert = require('node:assert');
const IA = require('../js/lc-ia.js');
const ARTIGO = 'Methods. Randomisation was done with a computer-generated sequence by an independent\ncentre. Alloca-\ntion was concealed using a central telephone service. Outcome assessors were blinded to treatment. Missing data were 2%.';
const P = [{ id: '1.1', en: 'Was the allocation sequence random?' }, { id: '1.2', en: 'Was concealed?' }, { id: '3.2', en: 'Evidence?' }, { id: '5.1', en: 'Plan?' }];
test('extrairJson: com cercas de código e texto ao redor', () => {
  assert.deepEqual(IA.extrairJson('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(IA.extrairJson('Segue: {"a":{"b":2}} fim'), { a: { b: 2 } });
  assert.equal(IA.extrairJson('sem json'), null); assert.equal(IA.extrairJson('{quebrado'), null); assert.equal(IA.extrairJson(null), null);
});
test('citação verificada: espaços, hifenização, maiúsculas, aspas e reticências', () => {
  assert.ok(IA.citacaoVerificada('computer-generated sequence by an independent centre', ARTIGO));
  assert.ok(IA.citacaoVerificada('Allocation was concealed using a central telephone service', ARTIGO), 'hifenização de fim de linha');
  assert.ok(IA.citacaoVerificada('Randomisation was done ... independent centre', ARTIGO), 'reticências');
  assert.ok(!IA.citacaoVerificada('The trial was double-blind and placebo controlled', ARTIGO));
  assert.ok(!IA.citacaoVerificada('', ARTIGO)); assert.ok(!IA.citacaoVerificada('curto', ARTIGO));
});
test('tratarResposta: valida códigos, verifica citações, descarta inválidos', () => {
  const obj = { desfecho_considerado: 'Mortalidade', respostas: {
    '1.1': { r: 'y', trecho: 'computer-generated sequence by an independent centre', just: 'ok' },
    '1.2': { r: 'PY', trecho: 'Citação inventada que não existe no texto do artigo', just: 'x' },
    '3.2': { r: 'NI', trecho: '', just: 'sem info' },          // NI não permitido em 3.2
    '5.1': { r: 'NI', trecho: '', just: 'sem plano' } } };
  const o = IA.tratarResposta(obj, P, ARTIGO);
  assert.equal(o.sugestoes['1.1'].resp, 'Y'); assert.equal(o.sugestoes['1.1'].verif, true);
  assert.equal(o.sugestoes['1.2'].verif, false);
  assert.equal(o.sugestoes['3.2'], undefined);
  assert.equal(o.sugestoes['5.1'].verif, null);
  assert.equal(o.desfecho, 'Mortalidade');
  assert.ok(o.avisos.some((a) => a.includes('não foi encontrada')) && o.avisos.some((a) => a.includes('inválido')));
  assert.ok(IA.tratarResposta(null, P, ARTIGO).avisos.length === 1);
  assert.ok(IA.tratarResposta({ respostas: 'x' }, P, ARTIGO).avisos.length === 1);
});
test('montarPrompt: artigo isolado entre marcas e pergunta no original', () => {
  const p = IA.montarPrompt(P, { artigo: ARTIGO, desfecho: 'AVC' });
  assert.ok(p.user.includes('<artigo>') && p.user.includes('</artigo>') && p.user.includes('1.1 | Was the allocation sequence random?') && p.user.includes('AVC'));
  assert.ok(p.system.includes('nunca instrução'));
});
