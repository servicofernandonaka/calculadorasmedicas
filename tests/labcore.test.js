const test = require('node:test'), assert = require('node:assert');
const L = require('../js/labcore-engine.js');
const near = (a, b, tol = 0.05) => assert.ok(Math.abs(a - b) <= tol, `${a} != ${b} (±${tol})`);
const item = (a, id) => a.items.find((i) => i.id === id);

/* Valores de referência: as equações foram avaliadas à mão a partir das fórmulas publicadas
   (Inker NEJM 2021; Sampson JAMA Cardiol 2020), não geradas pelo próprio código. */

test('CKD-EPI 2021: homem, Cr 1,0, 50 anos ≈ 91,7 (ramo Scr > κ)', () => {
  // 142 × (1,0/0,9)^-1,2 × 0,9938^50 = 142 × 0,8812 × 0,7328
  near(L.ckdepi(1.0, 50, 'M'), 91.7, 0.1);
});
test('CKD-EPI 2021: mulher, Cr 1,0, 60 anos ≈ 64,5 (fator 1,012)', () => {
  near(L.ckdepi(1.0, 60, 'F'), 64.5, 0.1);
});
test('CKD-EPI 2021: ramo Scr ≤ κ usa o expoente suave (mulher Cr 0,6, 40 anos ≈ 116,3)', () => {
  near(L.ckdepi(0.6, 40, 'F'), 116.3, 0.1);
});
test('CKD-EPI 2021: continuidade no ponto κ (valor igual dos dois lados)', () => {
  near(L.ckdepi(0.9, 40, 'M'), L.ckdepi(0.9000001, 40, 'M'), 0.01);
  near(L.ckdepi(0.7, 40, 'F'), L.ckdepi(0.7000001, 40, 'F'), 0.01);
});
test('Estadiamento KDIGO: limites G e A', () => {
  const R = L.REGISTRY;
  assert.equal(L.stageG(90, R), 'G1'); assert.equal(L.stageG(89.9, R), 'G2'); assert.equal(L.stageG(60, R), 'G2');
  assert.equal(L.stageG(59.9, R), 'G3a'); assert.equal(L.stageG(45, R), 'G3a'); assert.equal(L.stageG(44.9, R), 'G3b');
  assert.equal(L.stageG(30, R), 'G3b'); assert.equal(L.stageG(29.9, R), 'G4'); assert.equal(L.stageG(15, R), 'G4'); assert.equal(L.stageG(14.9, R), 'G5');
  assert.equal(L.stageA(29.9, R), 'A1'); assert.equal(L.stageA(30, R), 'A2'); assert.equal(L.stageA(300, R), 'A2'); assert.equal(L.stageA(300.1, R), 'A3');
});
test('Matriz de risco KDIGO: G1A1 baixo, G3aA1 moderado, G3bA2 muito alto, G4A1 muito alto', () => {
  assert.equal(L.riscoKdigo('G1', 'A1'), 'baixo'); assert.equal(L.riscoKdigo('G2', 'A2'), 'moderado'); assert.equal(L.riscoKdigo('G1', 'A3'), 'alto');
  assert.equal(L.riscoKdigo('G3a', 'A1'), 'moderado'); assert.equal(L.riscoKdigo('G3b', 'A1'), 'alto'); assert.equal(L.riscoKdigo('G3b', 'A2'), 'muito alto');
  assert.equal(L.riscoKdigo('G4', 'A1'), 'muito alto'); assert.equal(L.riscoKdigo('G5', 'A3'), 'muito alto');
});
test('TFGe: sem DRC persistente avisa; com A3 + persistente indica IECA/BRA e Nefrologia', () => {
  const a = L.analyze({ idade: 60, sexo: 'M', cr: 1.0, rac: 500, persistente: false });
  assert.match(item(a, 'tfge').details.join(' '), /3 meses/);
  const b = L.analyze({ idade: 60, sexo: 'M', cr: 1.0, rac: 500, persistente: true });
  const rec = item(b, 'tfge').recs.join(' ');
  assert.match(rec, /IECA\/BRA/); assert.match(rec, /Nefrologia/); assert.match(rec, /iSGLT2/);
});
test('FIB-4: (idade × AST) / (plaq × √ALT) e faixas por idade', () => {
  // 50 × 55 / (140 × √62) = 2750 / 1102,36 = 2,49 → zona cinzenta
  const a = L.analyze({ idade: 50, sexo: 'M', ast: 55, alt: 62, plaq: 140 });
  near(item(a, 'fib4').value, 2.495, 0.01); assert.equal(item(a, 'fib4').level, 'mod');
  near(item(a, 'fib4').ritis, 0.887, 0.001);
});
test('FIB-4: plaquetas 140000 e 140 dão o mesmo resultado (normalização de unidade)', () => {
  const a = L.analyze({ idade: 50, ast: 55, alt: 62, plaq: '140000' }), b = L.analyze({ idade: 50, ast: 55, alt: 62, plaq: '140' });
  assert.equal(item(a, 'fib4').value, item(b, 'fib4').value);
  assert.ok(a.notes.some((n) => /convertidas/.test(n)));
});
test('FIB-4: limites 35-64 (1,30 e 2,67) e ≥65 (2,0), idade <35 inconclusiva', () => {
  const mk = (idade, ast, alt, plaq) => item(L.analyze({ idade, ast, alt, plaq }), 'fib4');
  assert.equal(mk(34, 40, 40, 200).level, 'info');
  // 40×30/(250×√36)=1200/1500=0,80
  assert.equal(mk(40, 30, 36, 250).level, 'low');
  // 60×60/(150×√16)=3600/600=6,0
  assert.equal(mk(60, 60, 16, 150).level, 'high');
  // 65×40/(130×√100)=2600/1300=2,0 → intermediário (limite inferior inclusivo)
  const old = mk(65, 40, 100, 130); near(old.value, 2.0, 1e-9); assert.equal(old.level, 'mod');
  // 70×20/(100×√100)=1400/1000=1,4 → baixo risco após 65 anos
  assert.equal(mk(70, 20, 100, 100).level, 'low');
});
test('Lipídios: Friedewald até TG 400 (CT 200, HDL 50, TG 150 → LDL 120)', () => {
  const l = item(L.analyze({ ct: 200, hdl: 50, tg: 150 }), 'lipid');
  assert.equal(l.metodo, 'Friedewald'); near(l.value, 120, 1e-9); near(l.naoHdl, 150, 1e-9);
});
test('Lipídios: TG 400 ainda usa Friedewald; 401 usa Sampson', () => {
  assert.equal(item(L.analyze({ ct: 250, hdl: 40, tg: 400 }), 'lipid').metodo, 'Friedewald');
  assert.equal(item(L.analyze({ ct: 250, hdl: 40, tg: 401 }), 'lipid').metodo, 'Sampson (NIH)');
});
test('Lipídios: Sampson (CT 250, HDL 40, TG 500 → LDL ≈ 121,1)', () => {
  // 250/0,948 − 40/0,971 − (500/8,56 + 500×210/2140 − 500²/16100) − 9,44
  const l = item(L.analyze({ ct: 250, hdl: 40, tg: 500 }), 'lipid');
  near(l.value, 121.1, 0.1);
});
test('Lipídios: TG > 800 bloqueia LDL e alerta pancreatite', () => {
  const a = L.analyze({ ct: 300, hdl: 30, tg: 900 });
  assert.equal(item(a, 'lipid').value, null); assert.ok(a.alerts.some((x) => /pancreatite/.test(x.text)));
});
test('Mentzer: 71/5,6 = 12,7 → traço talassêmico; 71/4,0 = 17,75 → ferropriva; VCM normal não se aplica', () => {
  assert.match(item(L.analyze({ vcm: 71, rbc: 5.6 }), 'mentzer').sub, /talass/);
  assert.match(item(L.analyze({ vcm: 71, rbc: 4.0 }), 'mentzer').sub, /ferropriva/);
  assert.match(item(L.analyze({ vcm: 90, rbc: 4.5 }), 'mentzer').sub, /só se aplica/);
});
test('Eritrócitos 4500000/mm³ normalizam para 4,5 milhões', () => {
  near(item(L.analyze({ vcm: 72, rbc: '4500000' }), 'mentzer').value, 16, 0.01);
});
test('Saturação de transferrina: ferro 40 / CTLF 400 = 10%', () => {
  const t = item(L.analyze({ ferro: 40, ctlf: 400, ferritina: 150 }), 'tsat');
  near(t.value, 10, 1e-9); assert.equal(t.level, 'mod'); assert.match(t.details.join(' '), /fase aguda/);
});
test('Na corrigido (Katz), Ca corrigido, HOMA-IR e ânion gap', () => {
  const a = L.analyze({ na: 130, glicemia: 600, ca: 8.0, albumina: 2.0, insulina: 10, cl: 100, hco3: 20 });
  near(item(a, 'na_corr').value, 138, 1e-9);                 // 130 + 0,016 × 500
  near(item(a, 'ca_corr').value, 9.6, 1e-9);                 // 8,0 + 0,8 × 2,0
  near(item(a, 'homa').value, 14.81, 0.01);                  // 600 × 10 / 405
  near(item(a, 'ag').value, 10, 1e-9);                       // 130 − (100 + 20)
});
test('Albumina em g/L converte para g/dL', () => {
  near(item(L.analyze({ ca: 8.0, albumina: '20' }), 'ca_corr').value, 9.6, 1e-9);
});
test('Hemólise: K+ alto assinalado gera alerta vermelho; K+ > 6,0 pede ECG', () => {
  const a = L.analyze({ k: 6.4, ast: 80, ldh: 400, flags: { hemolise: true } });
  const al = a.alerts.find((x) => /Hemólise/.test(x.title));
  assert.equal(al.level, 'high'); assert.match(al.text, /ECG/); assert.match(al.text, /garroteamento/); assert.match(al.text, /K\+ 6,4/);
});
test('Hemólise: K+ 5,8 não dispara ECG; sem hemólise e K+ 6,1 alerta ECG', () => {
  assert.doesNotMatch(L.analyze({ k: 5.8, flags: { hemolise: true } }).alerts[0].text, /ECG/);
  assert.match(L.analyze({ k: 6.1 }).alerts[0].text, /ECG/);
});
test('Biotina com TSH/T4L informados explica o risco de artefato', () => {
  const a = L.analyze({ tsh: 0.02, t4l: 3.5, flags: { biotina: true } });
  assert.match(a.alerts[0].text, /biotina-estreptavidina/); assert.match(a.alerts[0].text, /artefato/);
});
test('Entradas inválidas geram aviso e não resultado', () => {
  const a = L.analyze({ idade: 50, sexo: 'F', cr: 'abc' });
  assert.equal(item(a, 'tfge'), undefined); assert.ok(a.warnings.length);
  const b = L.analyze({ idade: 50, sexo: 'F', cr: 90 });  // µmol/L digitado como mg/dL
  assert.equal(item(b, 'tfge'), undefined); assert.match(b.warnings.join(' '), /plaus/);
  const c = L.analyze({ idade: 15, sexo: 'F', cr: 1 });
  assert.equal(item(c, 'tfge'), undefined);
});
test('parseNum aceita vírgula, ponto e milhar', () => {
  assert.equal(L.parseNum('1,4'), 1.4); assert.equal(L.parseNum('1.4'), 1.4); assert.equal(L.parseNum('1.234,5'), 1234.5); assert.equal(L.parseNum(''), null); assert.equal(L.parseNum('x'), null);
});

/* ---------- parser ---------- */
test('Parser: exemplo do prontuário', () => {
  const r = L.parseReport('Hb 10.5 VCM 71 Plaq 140000 Cr 1.4 K 5.8 Glic 142 HbA1c 7.4 AST 55 ALT 62');
  assert.deepEqual(r.values, { hb: 10.5, vcm: 71, plaq: 140000, cr: 1.4, k: 5.8, glicemia: 142, hba1c: 7.4, ast: 55, alt: 62 });
});
test('Parser: HbA1c não vira Hb; vírgula decimal; acentos; milhar em plaquetas', () => {
  const r = L.parseReport('Hemoglobina glicada: 8,1  Hemoglobina 12,3  Potássio 4,2  Plaquetas 150.000  Triglicerídeos 210');
  assert.equal(r.values.hba1c, 8.1); assert.equal(r.values.hb, 12.3); assert.equal(r.values.k, 4.2); assert.equal(r.values.plaq, 150000); assert.equal(r.values.tg, 210);
});
test('Parser: sigla dentro de palavra não casa; idade, sexo e gestante', () => {
  const r = L.parseReport('Paciente 54 anos, feminino, gestante. Kappa 3 Nao 4');
  assert.equal(r.values.idade, 54); assert.equal(r.values.sexo, 'F'); assert.equal(r.values.gestante, true);
  assert.equal(r.values.k, undefined); assert.equal(r.values.na, undefined);
});
test('Parser + análise: valores extraídos alimentam o motor (homem, 60 anos, Cr 1,0 ≈ 86,2)', () => {
  const r = L.parseReport('idade 60 masc Cr 1.0');
  near(item(L.analyze(Object.assign({}, r.values)), 'tfge').value, 86.2, 0.1);
});

/* ---------- governança ---------- */
test('Selo: [KDIGO 2024 | Auditado: Out/2026]', () => {
  assert.equal(L.selo(L.REGISTRY, 'kdigo'), '[KDIGO 2024 | Auditado: Out/2026]');
});
test('Registry: 12 fontes, todo parâmetro com faixa min/max e valor dentro dela', () => {
  assert.equal(L.REGISTRY.sources.length, 12);
  Object.values(L.REGISTRY.guidelines).forEach((g) => {
    g.sources.forEach((id) => assert.ok(L.REGISTRY.sources.some((s) => s.id === id), `fonte ${id}`));
    Object.entries(g.params).forEach(([k, p]) => assert.ok(p.value >= p.min && p.value <= p.max, `${g.title}/${k}`));
  });
});
test('Relógio de 30 dias: 30 dias não vence, 31 vence', () => {
  const reg = L.effective({}, {});
  assert.equal(L.daysSince('2026-10-15', '2026-11-14'), 30);
  assert.equal(L.cycleStatus(reg, '2026-11-14').overdue, false);
  assert.equal(L.cycleStatus(reg, '2026-11-15').overdue, true);
  assert.equal(L.cycleStatus(reg, '2026-11-15').maxDays, 31);
});
test('Auditoria por fonte atualiza a data da diretriz pela fonte mais antiga', () => {
  const reg = L.effective({}, { kdigo: '2026-12-01' });
  assert.equal(reg.guidelines.kdigo.lastAuditedISO, '2026-12-01');
  assert.equal(reg.guidelines.fib4.lastAuditedISO, '2026-10-15');
  assert.equal(reg.guidelines.lipid.lastAuditedISO, '2026-10-15');
});
test('Ajuste local altera o cálculo e o original permanece intacto', () => {
  const reg = L.effective({ 'fib4:mid.low': { value: 1.45, origin: 'manual' } }, {});
  const a = L.analyze({ idade: 50, ast: 40, alt: 36, plaq: 150 }, reg);   // 50×40/(150×6)=2,22 → cinza
  assert.equal(reg.guidelines.fib4.params['mid.low'].value, 1.45);
  assert.equal(L.REGISTRY.guidelines.fib4.params['mid.low'].value, 1.3);
  const b = L.analyze({ idade: 50, ast: 20, alt: 36, plaq: 150 }, reg);   // 1,11 → baixo em ambos
  assert.equal(item(b, 'fib4').level, 'low'); assert.equal(item(a, 'fib4').level, 'mod');
});
test('Pacote: valida esquema, fonte obrigatória, faixa e parâmetro inexistente', () => {
  const reg = L.effective({}, {});
  assert.equal(L.validatePackage({ schema: 'x', proposals: [] }, reg).ok, false);
  assert.equal(L.validatePackage(null, reg).ok, false);
  const r = L.validatePackage({ schema: 'labcore-update/1', proposals: [
    { guideline: 'fib4', param: 'mid.low', value: 1.5, source: 'EASL 2026' },
    { guideline: 'fib4', param: 'mid.low', value: 1.5, source: '' },
    { guideline: 'fib4', param: 'mid.low', value: 99, source: 'x' },
    { guideline: 'fib4', param: 'nao.existe', value: 1, source: 'x' },
    { guideline: 'fib4', param: 'mid.low', value: 1.3, source: 'x' },
    { guideline: 'fib4', param: 'mid.low', value: '1.5', source: 'x' },
  ] }, reg);
  assert.deepEqual(r.rows.map((x) => x.valid), [true, false, false, false, false, false]);
  assert.match(r.rows[1].problem, /fonte/); assert.match(r.rows[2].problem, /faixa/); assert.match(r.rows[3].problem, /inexistente/);
});
test('Aplicar propostas gera changelog com valor antigo, novo e fonte', () => {
  const reg = L.effective({}, {});
  const v = L.validatePackage({ schema: 'labcore-update/1', proposals: [{ guideline: 'fib4', param: 'mid.low', value: 1.5, source: 'EASL 2026', evidence: 'texto' }] }, reg);
  const { custom, log } = L.applyRows({}, v.rows, '2026-11-02');
  assert.equal(custom['fib4:mid.low'].value, 1.5);
  assert.equal(log.length, 1); assert.equal(log[0].from, 1.3); assert.equal(log[0].to, 1.5); assert.equal(log[0].source, 'EASL 2026');
});
test('extractJson tolera cerca ```json e texto em volta', () => {
  assert.deepEqual(L.extractJson('Segue:\n```json\n{"a":1}\n```\nfim'), { a: 1 });
  assert.equal(L.extractJson('sem json'), null); assert.equal(L.extractJson('{quebrado'), null);
});
test('Prompt de auditoria traz o mês, as 12 fontes e o JSON do Registry', () => {
  const p = L.buildAuditPrompt(L.effective({}, {}), '2026-11-02');
  assert.match(p, /Novembro\/2026/); assert.match(p, /labcore-update\/1/); assert.match(p, /"mid\.low"/); assert.match(p, /PCDT-MS/);
  assert.equal((p.match(/^- /gm) || []).length, 12);
});
test('SOAP traz exames, índices com selo e alertas', () => {
  const a = L.analyze({ idade: 54, sexo: 'F', cr: 1.4, rac: 120, k: 6.4, flags: { hemolise: true } });
  const t = L.soap({}, a, '2026-10-15');
  assert.match(t, /^S:/m); assert.match(t, /^O:/m); assert.match(t, /^A:/m); assert.match(t, /^P:/m);
  assert.match(t, /\[KDIGO 2024 \| Auditado: Out\/2026\]/); assert.match(t, /Hemólise/); assert.match(t, /15\/10\/2026/);
});

/* ---------- OpenRouter (Modo A) ---------- */
test('OpenRouter: corpo da requisição com plugin de busca na web, baixa temperatura e limite de tokens', () => {
  const b = L.openrouterBody('anthropic/claude-sonnet-5.5', 'PROMPT');
  assert.equal(b.model, 'anthropic/claude-sonnet-5.5'); assert.deepEqual(b.plugins, [{ id: 'web', max_results: 8 }]);
  assert.equal(b.temperature, 0.1); assert.ok(b.max_tokens >= 2000);
  assert.equal(b.messages[0].role, 'system'); assert.equal(b.messages[1].content, 'PROMPT');
  assert.equal(L.OPENROUTER_URL, 'https://openrouter.ai/api/v1/chat/completions');
});
test('OpenRouter: leitura da resposta, citações da web (sem duplicar, só http/https) e corte por tamanho', () => {
  const j = { choices: [{ finish_reason: 'stop', message: { content: '{"a":1}', annotations: [
    { type: 'url_citation', url_citation: { url: 'https://kdigo.org/x', title: 'KDIGO' } },
    { type: 'url_citation', url_citation: { url: 'https://kdigo.org/x', title: 'repetida' } },
    { type: 'url_citation', url_citation: { url: 'javascript:alert(1)', title: 'ruim' } },
    { type: 'outro' }] } }] };
  const o = L.openrouterParse(j);
  assert.equal(o.text, '{"a":1}'); assert.deepEqual(o.citations, [{ uri: 'https://kdigo.org/x', title: 'KDIGO' }]); assert.equal(o.truncated, false);
  assert.equal(L.openrouterParse({ choices: [{ finish_reason: 'length', message: { content: 'x' } }] }).truncated, true);
  assert.equal(L.openrouterParse({ choices: [{ message: { content: [{ text: 'a' }, { text: 'b' }] } }] }).text, 'ab');
  assert.match(L.openrouterParse({ error: { message: 'falha do provedor' } }).error, /falha do provedor/);
  assert.match(L.openrouterParse({}).error, /não devolveu/);
});
test('OpenRouter: mensagens de erro por status (chave, crédito, modelo, limite)', () => {
  assert.match(L.openrouterErro(401, null), /Chave.*recusada/); assert.match(L.openrouterErro(402, null), /Créditos insuficientes/);
  assert.match(L.openrouterErro(404, { error: { message: 'No endpoints' } }), /Modelo não encontrado.*No endpoints/);
  assert.match(L.openrouterErro(429, null), /Limite/); assert.match(L.openrouterErro(500, null), /Erro 500/);
});
test('OpenRouter: resposta com JSON dentro de texto vira pacote validável', () => {
  const reg2 = L.effective({}, {});
  const o = L.openrouterParse({ choices: [{ message: { content: 'Segue:\n```json\n{"schema":"labcore-update/1","proposals":[{"guideline":"fib4","param":"mid.low","value":1.45,"source":"EASL 2026"}]}\n```' } }] });
  const v = L.validatePackage(L.extractJson(o.text), reg2);
  assert.ok(v.ok); assert.equal(v.rows[0].valid, true);
});
