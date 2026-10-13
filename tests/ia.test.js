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

test('Textos longos: corta a partir de Referências/apêndices e avisa; texto curto não muda', () => {
  const I = require('../js/lc-ia.js');
  const t = 'Título\nMétodos\n' + 'texto de metodos. '.repeat(30000) + '\nReferences\n' + 'ref. '.repeat(20000);
  const r = I.reduzirTexto(t, 400000);
  assert.ok(r.texto.length <= 400000 && r.cortes.length >= 1 && /References/.test(r.cortes[0]));
  assert.ok(!r.texto.includes('\nReferences\n'));
  assert.equal(I.reduzirTexto('curto', 400000).texto, 'curto');
  assert.equal(I.reduzirTexto('a\n'.repeat(500000), 400000).texto.length, 400000);
});
test('Documento de outro tipo é sinalizado (RoB 2 e AMSTAR 2)', () => {
  const I = require('../js/lc-ia.js');
  assert.equal(I.tratarResposta({ tipo_documento: 'outro', descricao: 'revisão sistemática', respostas: {} }, [], 'x').outroTipo, 'revisão sistemática');
  assert.equal(I.tratarAmstar({ tipo_documento: 'outro', descricao: 'ensaio' }, [], 'x').outroTipo, 'ensaio');
});
test('AMSTAR 2: sugestões validadas, citação verificada e desenhos/meta-análise', () => {
  const I = require('../js/lc-ia.js');
  const artigo = 'We searched MEDLINE and Embase from inception. The protocol was registered in PROSPERO before the review began. ' + 'x '.repeat(100);
  const crit = [{ key: '4.x.db', item: 'i', en: 'e' }, { key: '2.x.reg', item: 'i', en: 'e' }, { key: '7.x.l', item: 'i', en: 'e' }, { key: '5.x.a', item: 'i', en: 'e' }];
  const tr = I.tratarAmstar({ tipo_documento: 'revisao_sistematica', desenhos: 'rct', meta_analise: 'Y', respostas: {
    '4.x.db': { r: 'Y', trecho: 'We searched MEDLINE and Embase from inception.', just: 'ok' },
    '2.x.reg': { r: 'Y', trecho: 'trecho inventado que nao existe no texto', just: 'ok' },
    '7.x.l': { r: 'NI', trecho: '', just: '' }, '5.x.a': { r: 'talvez' } } }, crit, artigo);
  assert.equal(tr.sugestoes['4.x.db'].verif, true);
  assert.equal(tr.sugestoes['2.x.reg'].verif, false);
  assert.equal(tr.sugestoes['7.x.l'].verif, null);
  assert.ok(!tr.sugestoes['5.x.a']);
  assert.equal(tr.desenhos, 'rct'); assert.equal(tr.ma, true);
  assert.ok(tr.avisos.some((a) => /citação/.test(a)));
  const pr = I.montarPromptAmstar(crit, artigo);
  assert.ok(pr.user.includes('4.x.db | i | e') && pr.user.includes('<artigo>') && /nunca instrução/.test(pr.system));
});
