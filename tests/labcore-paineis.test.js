const test = require('node:test'), assert = require('node:assert');
const L = require('../js/labcore-engine.js');
const Q = require('../js/labcore-liquidos.js');
const reg = L.effective({}, {});
const near = (a, b, tol = 0.001) => assert.ok(Math.abs(a - b) <= tol, `${a} != ${b}`);
const item = (a, id) => a.items.find((i) => i.id === id);
const alertas = (a) => a.alerts.map((x) => x.title + ' ' + x.text).join(' | ');
const sub = (a, id) => (item(a, id) || {}).sub;

/* Cortes e regras da especificação do Fernando; valores avaliados à mão. */

test('Hipogamaglobulinemia: globulinas < 1,8 g/dL (1,8 exato não dispara)', () => {
  assert.match(alertas(L.analyze({ pt: 5.0, albumina: 3.5 })), /Hipogamaglobulinemia/);
  assert.match(alertas(L.analyze({ pt: 5.0, albumina: 3.5 })), /nefrótica|cadeias leves/);
  assert.doesNotMatch(alertas(L.analyze({ pt: 5.5, albumina: 3.7 })), /Hipogamaglobulinemia/);   // 1,8
  assert.doesNotMatch(alertas(L.analyze({ pt: 7.0, albumina: 4.0 })), /Hipogamaglobulinemia/);
});
test('CRAB: alerta cita encaminhamento prioritário CROSS/SISREG', () => {
  assert.match(alertas(L.analyze({ pt: 9, albumina: 2, hb: 8 })), /CROSS\/SISREG/);
});

/* ---- PSA ---- */
test('PSA: 5-ARI dobra o PSA; relação L/T só entre 2,5 e 10; limites 15% e 10%', () => {
  const a = L.analyze({ psaT: 5.0, psaL: 0.5, ari: true });          // corrigido 10,0; L/T 10%
  near(item(a, 'psa_corr').value, 10.0); assert.match(alertas(a), /reduzem o PSA sérico em ~50%/); assert.equal(item(a, 'psa_corr').level, 'high');
  assert.match(sub(a, 'psa_lt'), /^Alto risco/); near(item(a, 'psa_lt').value, 10);                     // 10% não é < 10% → "alto", não "muito alto"
  assert.match(sub(L.analyze({ psaT: 4, psaL: 0.36 }), 'psa_lt'), /muito alto/);                       // 9%
  assert.match(sub(L.analyze({ psaT: 4, psaL: 0.6 }), 'psa_lt'), /intermediária/);                     // 15% exato → não < 15%
  assert.match(sub(L.analyze({ psaT: 4, psaL: 0.56 }), 'psa_lt'), /^Alto risco/);                      // 14%
  assert.match(sub(L.analyze({ psaT: 4, psaL: 0.8 }), 'psa_lt'), /intermediária/);                     // 20%
  assert.match(sub(L.analyze({ psaT: 4, psaL: 1.1 }), 'psa_lt'), /HPB/);                              // 27,5%
  assert.match(sub(L.analyze({ psaT: 2.0, psaL: 0.2 }), 'psa_lt'), /aplicável com PSA entre/);          // 2,0 < 2,5
  assert.match(sub(L.analyze({ psaT: 10.1, psaL: 1 }), 'psa_lt'), /aplicável com PSA entre/);
  assert.match(sub(L.analyze({ psaT: 2.5, psaL: 0.2 }), 'psa_lt'), /^Alto risco|muito alto/);          // 2,5 entra
});
test('PSA: densidade ≥ 0,15 (corrigida na vigência de 5-ARI)', () => {
  near(item(L.analyze({ psaT: 6, vprost: 40 }), 'psad').value, 0.15); assert.equal(item(L.analyze({ psaT: 6, vprost: 40 }), 'psad').level, 'high');   // 0,15 exato
  assert.equal(item(L.analyze({ psaT: 5.9, vprost: 40 }), 'psad').level, 'low');
  near(item(L.analyze({ psaT: 3, vprost: 40, ari: true }), 'psad').value, 0.15);                         // corrigido 6,0 / 40
});
test('PSA: interferentes pré-analíticos listados', () => {
  const t = alertas(L.analyze({ psaT: 5, psaProstatite: true, psaEjac: true, psaBike: true, psaInstr: true }));
  ['prostatite', 'ejaculação', 'bicicleta', 'instrumentação'].forEach((k) => assert.match(t, new RegExp(k)));
  assert.match(t, /4 a 6 semanas/);
  assert.doesNotMatch(alertas(L.analyze({ psaT: 5 })), /Interferente/);
});

/* ---- Metabolismo ósseo ---- */
const os = (o) => L.analyze(o).items.filter((i) => i.id.startsWith('osso_')).map((i) => i.id.slice(5));
test('Osso: HPP, PTH-independente, secundário (vitamina D e DRC) e hipoparatireoidismo', () => {
  assert.deepEqual(os({ ca: 11.0, albumina: 4.0, pth: 80, fosforo: 2.5 }), ['hpp']);
  assert.match(sub(L.analyze({ ca: 11.0, albumina: 4.0, pth: 80, fosforo: 2.5 }), 'osso_hpp'), /Fósforo baixo/);
  assert.match(item(L.analyze({ ca: 11.0, albumina: 4.0, pth: 80, fosforo: 2.5 }), 'osso_hpp').recs.join(' '), /calciúria de 24 h/);
  assert.deepEqual(os({ ca: 10.4, albumina: 4.0, pth: 41 }), ['hpp']);                                  // PTH inapropriadamente normal
  assert.deepEqual(os({ ca: 12.0, albumina: 4.0, pth: 10 }), ['malig']);
  assert.deepEqual(os({ ca: 9.5, albumina: 4.0, pth: 90, vitd: 15, fosforo: 3.2 }), ['sec_vitd']);
  assert.deepEqual(os({ ca: 9.5, albumina: 4.0, pth: 90, vitd: 45, cr: 2.5, idade: 70, sexo: 'M', fosforo: 5.0 }), ['sec_drc']);
  assert.deepEqual(os({ ca: 9.5, albumina: 4.0, pth: 90, vitd: 15, cr: 2.5, idade: 70, sexo: 'M', fosforo: 4.0 }), ['sec_vitd', 'sec_drc']);
  assert.deepEqual(os({ ca: 9.5, albumina: 4.0, pth: 90, vitd: 45 }), ['sec']);
  assert.deepEqual(os({ ca: 7.5, albumina: 4.0, pth: 10, fosforo: 5.5 }), ['hipo']);
  assert.deepEqual(os({ ca: 9.5, albumina: 4.0, pth: 45 }), ['sem']);
});
test('Osso: limites exatos (Ca 10,2; PTH 65; vitamina D 20/30; hipocalcemia 8,5) e Ca corrigido pela albumina', () => {
  assert.deepEqual(os({ ca: 10.2, pth: 90 }), ['sec']);                                                // 10,2 não é > 10,2
  assert.deepEqual(os({ ca: 9.5, albumina: 4.0, pth: 65 }), ['sem']);                                   // 65 não é > 65
  assert.match(sub(L.analyze({ ca: 9.5, albumina: 4.0, pth: 90, vitd: 25 }), 'osso_sec_vitd'), /Insuficiência/);
  assert.equal(os({ ca: 9.5, albumina: 4.0, pth: 90, vitd: 30 })[0], 'sec');                          // 30 não é < 30
  assert.deepEqual(os({ ca: 8.5, albumina: 4.0, pth: 10, fosforo: 5 }), ['sem']);                       // 8,5 não é < 8,5
  // Ca 9,0 com albumina 2,0 → corrigido 10,6 > 10,2 → hiperparatireoidismo com PTH alto
  assert.deepEqual(os({ ca: 9.0, albumina: 2.0, pth: 80 }), ['hpp']);
  assert.match(item(L.analyze({ ca: 9.0, albumina: 2.0, pth: 80, fa: 300 }), 'osso_hpp').details.join(' '), /Fosfatase alcalina 300/);
});

/* ---- B12 ---- */
test('B12: < 200 deficiência; 200-350 zona cinzenta; > 350 não; alerta de metformina/IBP', () => {
  assert.equal(sub(L.analyze({ b12: 199 }), 'b12'), 'Deficiência confirmada');
  assert.equal(sub(L.analyze({ b12: 200 }), 'b12'), 'Zona cinzenta metrológica');
  assert.equal(sub(L.analyze({ b12: 350 }), 'b12'), 'Zona cinzenta metrológica');
  assert.equal(sub(L.analyze({ b12: 351 }), 'b12'), 'Acima da zona cinzenta');
  assert.match(alertas(L.analyze({ b12: 280, metIBP: true })), /Metformina reduz a absorção ileal de cobalamina/);
  assert.match(alertas(L.analyze({ b12: 280, sintB12: true })), /NÃO excluem deficiência funcional/);
  assert.doesNotMatch(alertas(L.analyze({ b12: 280 })), /Metformina/);
  assert.doesNotMatch(alertas(L.analyze({ b12: 400, metIBP: true })), /Metformina/);
  assert.match(item(L.analyze({ b12: 150, sintB12: true }), 'b12').recs.join(' '), /parenteral/);
});
test('B12: homocisteína + AMM e a regra de ouro do ácido fólico', () => {
  assert.match(sub(L.analyze({ hcy: 25, mma: 500 }), 'b12_dupla'), /Deficiência tecidual confirmada de vitamina B12/);
  const f = L.analyze({ hcy: 25, mma: 100 });
  assert.match(sub(f, 'b12_dupla'), /isolada de ácido fólico/); assert.match(alertas(f), /Não repor ácido fólico isoladamente/); assert.match(alertas(f), /degeneração combinada subaguda/);
  assert.match(sub(L.analyze({ hcy: 10, mma: 100 }), 'b12_dupla'), /normais/);
  assert.match(sub(L.analyze({ hcy: 10, mma: 500 }), 'b12_dupla'), /AMM elevado isolado/);
  assert.equal(sub(L.analyze({ hcy: 25 }), 'b12_dupla'), 'Falta o par');
  assert.match(alertas(L.analyze({ vcm: 100, b12: 500 })), /Macrocitose/);
  assert.doesNotMatch(alertas(L.analyze({ vcm: 98, b12: 500 })), /Macrocitose/);
});

/* ---- Gastro ---- */
test('Celíaca: regra da IgA, glúten prévio e conduta na sorologia positiva', () => {
  assert.match(alertas(L.analyze({ ttgIgA: 'neg' })), /Confira a IgA sérica total/); assert.match(alertas(L.analyze({ ttgIgA: 'neg' })), /10 a 15x/);
  const inv = alertas(L.analyze({ ttgIgA: 'neg', iga: 5 }));
  assert.match(inv, /Exame inválido: falso-negativo por deficiência de IgA/); assert.match(inv, /anti-tTG IgG/); assert.match(inv, /deficiência seletiva/);
  assert.match(alertas(L.analyze({ ttgIgA: 'neg', iga: 50 })), /Exame inválido/);
  assert.doesNotMatch(alertas(L.analyze({ ttgIgA: 'neg', iga: 70 })), /Exame inválido/);              // 70 não é < 70
  assert.doesNotMatch(alertas(L.analyze({ ttgIgA: 'neg', iga: 200 })), /Exame inválido|Confira a IgA/);
  assert.match(alertas(L.analyze({ ttgIgA: 'neg', iga: 200, semGluten: true })), /Falso-negativo pré-analítico/);
  assert.doesNotMatch(alertas(L.analyze({ ttgIgA: 'pos', semGluten: true })), /Falso-negativo pré-analítico/);
  const p = L.analyze({ ttgIgA: 'pos', iga: 200 });
  assert.match(item(p, 'celiaca').recs.join(' '), /segunda porção duodenal.*Marsh/); assert.equal(item(p, 'celiaca').level, 'high');
  assert.match(item(L.analyze({ ttgIgA: 'neg', iga: 5, dgpIgG: 'pos' }), 'celiaca').sub, /Compatível/);
});
test('Calprotectina e elastase fecais: limites', () => {
  assert.match(sub(L.analyze({ calpro: 49 }), 'calpro'), /síndrome do intestino irritável/);
  assert.equal(sub(L.analyze({ calpro: 50 }), 'calpro'), 'Zona cinzenta');
  assert.equal(sub(L.analyze({ calpro: 200 }), 'calpro'), 'Zona cinzenta');
  assert.match(item(L.analyze({ calpro: 150 }), 'calpro').recs.join(' '), /AINEs/);
  assert.equal(sub(L.analyze({ calpro: 201 }), 'calpro'), 'Inflamação intestinal orgânica ativa');
  assert.match(item(L.analyze({ calpro: 400 }), 'calpro').recs.join(' '), /íleo terminal/);
  assert.equal(sub(L.analyze({ elastase: 201 }), 'elastase'), 'Normal');
  assert.match(sub(L.analyze({ elastase: 200 }), 'elastase'), /leve a moderada/); assert.match(sub(L.analyze({ elastase: 100 }), 'elastase'), /leve a moderada/);
  assert.match(sub(L.analyze({ elastase: 99 }), 'elastase'), /grave/); assert.match(item(L.analyze({ elastase: 99 }), 'elastase').recs.join(' '), /pancreatina/);
  assert.match(item(L.analyze({ elastase: 300 }), 'elastase').details.join(' '), /diluem/);
});
test('Parser dos painéis novos', () => {
  const r = L.parseReport('PSA 6,2 PSA livre 0,8 volume prostático 40 em uso de finasterida. PTH 95 25-OH-vitamina D 14 fósforo 2,6 B12 180 homocisteína 22 IgA 5 anti-tTG IgA negativo calprotectina fecal 320 elastase fecal 90');
  const v = r.values;
  assert.deepEqual([v.psaT, v.psaL, v.vprost, v.pth, v.vitd, v.fosforo, v.b12, v.hcy, v.iga, v.calpro, v.elastase], [6.2, 0.8, 40, 95, 14, 2.6, 180, 22, 5, 320, 90]);
  assert.equal(v.ari, true); assert.equal(v.ttgIgA, 'neg');
  assert.equal(L.parseReport('Anti-transglutaminase IgA: reagente').values.ttgIgA, 'pos');
  assert.equal(L.parseReport('anti-DGP IgG positivo').values.dgpIgG, 'pos');
});

/* ---- Líquido ascítico ---- */
const as = (o, r) => Q.ascite(o, r || reg);
const pid = (r) => r.padroes.map((p) => p.id);
test('Ascite: GASA ≥ 1,1 (transudato) × < 1,1 (exsudato) e proteína 2,5', () => {
  assert.deepEqual(pid(as({ albS: 3.0, albA: 1.0, protA: 1.0, pmn: 100 })), ['cirrose', 'sem_pbe']);
  const c = as({ albS: 3.0, albA: 1.0, protA: 1.0 }); near(c.gasa, 2.0); assert.match(c.padroes[0].recs.join(' '), /100 mg para 40 mg/);
  assert.deepEqual(pid(as({ albS: 3.0, albA: 1.0, protA: 3.0 })), ['cardiaca']);
  assert.deepEqual(pid(as({ albS: 3.0, albA: 1.0, protA: 2.5 })), ['cardiaca']);                         // 2,5 não é < 2,5
  assert.deepEqual(pid(as({ albS: 3.0, albA: 1.0 })), ['portal']);
  assert.deepEqual(pid(as({ albS: 3.0, albA: 2.5, protA: 3.0 })), ['exsudato']);
  assert.match(as({ albS: 3.0, albA: 2.5 }).padroes[0].text, /carcinomatose.*tuberculose.*pancreatite.*nefrótica/);
  assert.equal(as({ albS: 3.0, albA: 2.0 }, L.effective({ 'liquidos:gasa.cut': { value: 1.0, origin: 'manual' } }, {})).hipertensaoPortal, true);   // GASA 1,0 com corte 1,0
  assert.equal(as({ albS: 3.0, albA: 2.0 }).hipertensaoPortal, false);
});
test('Ascite: tuberculose peritoneal exige linfocítico e ADA > 40', () => {
  assert.ok(pid(as({ albS: 3.0, albA: 2.5, linfocitico: true, ada: 41 })).includes('tb'));
  assert.ok(!pid(as({ albS: 3.0, albA: 2.5, linfocitico: true, ada: 40 })).includes('tb'));
  assert.ok(!pid(as({ albS: 3.0, albA: 2.5, ada: 80 })).includes('tb'));
});
test('Ascite: PBE com PMN ≥ 250, albumina por kg e peritonite secundária', () => {
  const pbe = as({ pmn: 250, peso: 70 });
  assert.equal(pbe.alertas[0].level, 'high'); assert.match(pbe.alertas[0].title, /PBE.*confirmada/); assert.match(pbe.alertas[0].text, /cefotaxima ou ceftriaxona/);
  assert.match(pbe.alertas[0].text, /1,5 g\/kg no dia 1 e 1,0 g\/kg no dia 3/); assert.match(pbe.alertas[0].text, /105 g no dia 1 e 70 g no dia 3/); assert.match(pbe.alertas[0].text, /hepatorrenal/);
  assert.equal(as({ pmn: 249 }).alertas.length, 0);
  assert.match(as({ pmn: 100 }).avisos.join(' '), /GASA/);
  assert.match(as({ albS: 3, albA: 1 }).avisos.join(' '), /PMN/);
  const sec = as({ pmn: 300, protA: 2, glicA: 40, ldhA: 500, ldhLsn: 250 });
  assert.ok(sec.alertas.some((a) => /perfuração de víscera oca/.test(a.title)));
  const dois = as({ protA: 2, glicA: 60, ldhA: 500, ldhLsn: 250 });
  assert.ok(dois.alertas.some((a) => /Possível peritonite bacteriana secundária/.test(a.title)));
  assert.equal(as({ protA: 0.8, glicA: 60, ldhA: 100, ldhLsn: 250 }).alertas.length, 0);
  assert.equal(as({ protA: 2, glicA: 50, ldhA: 500, ldhLsn: 250 }).alertas.length, 1);               // glicose 50 não é < 50: só 2 de 3
});

/* ---- Derrame pleural ---- */
const pl = (o, r) => Q.pleural(Object.assign({ ldhLsn: 225 }, o), r || reg);
test('Light: 3 critérios; limites exatos não contam; 0 = transudato', () => {
  const t = pl({ protP: 3, protS: 6, ldhP: 150, ldhS: 250 });                                          // 0,5; 0,6; 150 = 2/3 × 225
  assert.equal(t.exsudato, false); assert.deepEqual(pid(t), ['transudato']);
  assert.equal(pl({ protP: 4, protS: 6, ldhP: 100, ldhS: 250 }).exsudato, true);                       // só proteína (0,667)
  assert.equal(pl({ protP: 2, protS: 6, ldhP: 160, ldhS: 250 }).exsudato, true);                       // LDH 0,64 e > 150
  assert.equal(pl({ protP: 2, protS: 6, ldhP: 100, ldhS: 100 }).exsudato, true);                       // razão LDH 1,0
  assert.equal(pl({ protP: 2, protS: 6, ldhP: 151, ldhS: 400 }).exsudato, true);                       // só o critério 3
  const e = pl({ protP: 4, protS: 6, ldhP: 300, ldhS: 250 });
  assert.equal(e.criterios.filter((c) => c.ok).length, 3); assert.match(e.padroes[0].title, /Exsudato \(3 de 3/);
  near(e.razaoProt, 0.6667, 0.001); near(e.razaoLdh, 1.2);
});
test('Light incompleto: avisa e não declara transudato', () => {
  const r = Q.pleural({ protP: 2, protS: 6 }, reg);
  assert.match(r.avisos.join(' '), /Só 1 de 3/); assert.deepEqual(pid(r), ['provavel_transudato']);
  assert.match(Q.pleural({}, reg).avisos.join(' '), /Informe proteína/);
});
test('Pós-diurético: gradientes reclassificam o falso exsudato', () => {
  const base = { protP: 3.5, protS: 6, ldhP: 100, ldhS: 250 };                                         // exsudato só pelo critério 1 (0,58)
  const d = pl(Object.assign({ diuretico: true, albS: 3.5, albP: 2.0 }, base));                         // gradiente 1,5 > 1,2
  assert.deepEqual(pid(d), ['exsudato', 'pseudoexsudato']); assert.equal(d.pseudoexsudato, true); assert.equal(d.exsudato, false);
  assert.match(d.padroes[1].title, /Pseudoexsudato induzido por diurético/); assert.equal(d.padroes[1].level, 'info');
  assert.equal(pl(Object.assign({ diuretico: true, albS: 3.0, albP: 2.2 }, base)).pseudoexsudato, false);   // 0,8 e gradiente de proteína 2,5
  assert.equal(pl(Object.assign({ diuretico: true }, base, { protP: 2.5, protS: 6.0, ldhP: 160, albS: 3.0, albP: 2.2 })).pseudoexsudato, true);   // gradiente de proteína 3,5 > 3,1
  assert.equal(pl(Object.assign({ albS: 3.5, albP: 2.0 }, base)).pseudoexsudato, false);                // sem diurético não reclassifica
  assert.match(pl({ ldhP: 300, ldhS: 250, diuretico: true }).avisos.join(' '), /gradientes/);          // exsudato só pelo LDH, sem albumina nem proteína para o gradiente
  const m = pl(Object.assign({ diuretico: true, albS: 3.0, albP: 2.5, protS: 6, protP: 3.5 }, { ldhP: 100, ldhS: 250 }));
  assert.ok(pid(m).includes('diur_mantem'));
});
test('Empiema: pH < 7,20, glicose < 60 ou LDH > 1000 indicam drenagem', () => {
  const t = (o) => pl(Object.assign({ protP: 4, protS: 6 }, o)).alertas.length;
  assert.equal(t({ ph: 7.1 }), 1); assert.equal(t({ ph: 7.2 }), 0); assert.equal(t({ glicP: 59 }), 1); assert.equal(t({ glicP: 60 }), 0);
  assert.equal(t({ ldhP: 1001, ldhS: 400 }), 1); assert.equal(t({ ldhP: 1000, ldhS: 800 }), 0);
  const a = pl({ protP: 4, protS: 6, ph: 7.0, glicP: 30, ldhP: 2000, ldhS: 300 }).alertas[0];
  assert.match(a.title, /drenagem torácica/); assert.match(a.text, /pH 7,00.*glicose 30.*LDH 2\.000/); assert.equal(a.level, 'high');
});
test('Pleural: tuberculose provável (linfocítico + ADA > 40) só em exsudato', () => {
  const x = { protP: 4, protS: 6, ldhP: 300, ldhS: 250, linfocitico: true };
  assert.ok(pid(pl(Object.assign({ adaP: 41 }, x))).includes('tb')); assert.ok(!pid(pl(Object.assign({ adaP: 40 }, x))).includes('tb'));
  assert.ok(!pid(pl({ protP: 3, protS: 6, ldhP: 150, ldhS: 250, linfocitico: true, adaP: 80 })).includes('tb'));
});
