const test = require('node:test'), assert = require('node:assert');
const L = require('../js/labcore-engine.js');
const F = require('../js/labcore-fluxos.js');
const E = require('../js/labcore-enciclopedia.js');
const reg = L.effective({}, {});
const play = (id, ans, r) => F.play(id, ans, r || reg);
const end = (id, ans, r) => { const x = play(id, ans, r); assert.ok(!x.error, x.error); assert.ok(x.result, 'sem resultado: ' + JSON.stringify(x.path)); return x; };

/* Os cenários abaixo seguem a lógica das fontes citadas no Registry (ETA 2013, ATA 2017, PCDT IST 2022, IMWG 2014, IDSA 2019, ICAP);
   são testes de regra, não de validação clínica. */

test('Toda ponta de todo fluxo existe e todo nó resultado tem título e selo', () => {
  F.FLUXOS.forEach((f) => {
    assert.ok(f.nodes[f.start], f.id);
    Object.entries(f.nodes).forEach(([id, n]) => {
      if (n.t === 'choice') n.opts.forEach((o) => assert.ok(f.nodes[o.next], `${f.id}.${id}->${o.next}`));
      if (n.t === 'result') assert.ok(n.title && ['low', 'mod', 'high', 'info'].includes(n.level), `${f.id}.${id}`);
    });
    f.guideline.forEach((g) => assert.ok(reg.guidelines[g], `${f.id} registry ${g}`));
  });
});

/* ---- tireoide ---- */
const ad = (o) => Object.assign({ tshLo: 0.4, tshHi: 4.0, t4lLo: 0.8, t4lHi: 1.8, idade: 40 }, o);
test('Tireoide adulto: hipotireoidismo, subclínico (TSH ≥10 e <10), hipertireoidismo, central, normal', () => {
  assert.equal(end('tireoide', ['nao', ad({ tsh: 12, t4l: 0.5 })]).path.at(-1), 'r_hipo');
  assert.equal(end('tireoide', ['nao', ad({ tsh: 12, t4l: 1.2 })]).path.at(-1), 'r_sch_alto');
  assert.equal(end('tireoide', ['nao', ad({ tsh: 10, t4l: 1.2 })]).path.at(-1), 'r_sch_alto');
  assert.equal(end('tireoide', ['nao', ad({ tsh: 9.9, t4l: 1.2 })]).path.at(-1), 'r_sch_leve');
  assert.equal(end('tireoide', ['nao', ad({ tsh: 0.01, t4l: 2.5 })]).path.at(-1), 'r_hiper');
  assert.equal(end('tireoide', ['nao', ad({ tsh: 0.1, t4l: 1.2 })]).path.at(-1), 'r_hiper_sub');
  assert.equal(end('tireoide', ['nao', ad({ tsh: 2, t4l: 0.5 })]).path.at(-1), 'r_central');
  assert.equal(end('tireoide', ['nao', ad({ tsh: 2, t4l: 1.2 })]).path.at(-1), 'r_normal');
});
test('Tireoide: limite exato do laudo é normal; limites invertidos dão erro', () => {
  assert.equal(end('tireoide', ['nao', ad({ tsh: 4.0, t4l: 1.2 })]).path.at(-1), 'r_normal');
  assert.match(play('tireoide', ['nao', ad({ tsh: 2, t4l: 1.2, tshLo: 5 })]).error, /limites/);
});
test('Tireoide subclínico: idade e sintomas mudam o texto; biotina acrescenta o aviso', () => {
  const novo = end('tireoide', ['nao', ad({ tsh: 6, t4l: 1.2, sintomas: true, idade: 45 })]).result.texts.join(' ');
  assert.match(novo, /prova terapêutica/);
  const muito = end('tireoide', ['nao', ad({ tsh: 6, t4l: 1.2, idade: 85 })]).result.texts.join(' ');
  assert.match(muito, /expectante/);
  const b = end('tireoide', ['nao', ad({ tsh: 0.01, t4l: 2.5, biotina: true })]).result.texts.join(' ');
  assert.match(b, /biotina/i);
});
const gs = (o) => Object.assign({ tri: '2', t4lLo: 0.8, t4lHi: 1.8 }, o);
test('Tireoide gestação: limite de 4,0 se o laudo não tem faixa; TPO e TSH ≥10', () => {
  assert.equal(end('tireoide', ['sim', gs({ tsh: 4.5, t4l: 1.2, tpo: 'neg' })]).path.at(-1), 'g_considerar');
  assert.equal(end('tireoide', ['sim', gs({ tsh: 4.5, t4l: 1.2, tpo: 'pos' })]).path.at(-1), 'g_tratar_tpo');
  assert.equal(end('tireoide', ['sim', gs({ tsh: 10, t4l: 1.2, tpo: 'neg' })]).path.at(-1), 'g_tratar');
  assert.equal(end('tireoide', ['sim', gs({ tsh: 4.5, t4l: 0.5, tpo: 'neg' })]).path.at(-1), 'g_tratar');
  assert.equal(end('tireoide', ['sim', gs({ tsh: 4.0, t4l: 1.2, tpo: 'neg' })]).path.at(-1), 'g_ok');
  assert.equal(end('tireoide', ['sim', gs({ tsh: 3.0, t4l: 1.2, tpo: 'pos' })]).path.at(-1), 'g_tpo_limite');
  assert.equal(end('tireoide', ['sim', gs({ tsh: 2.5, t4l: 1.2, tpo: 'pos' })]).path.at(-1), 'g_ok');
});
test('Tireoide gestação: faixa do laboratório por trimestre substitui o 4,0; TSH baixo no 1º trimestre é fisiológico', () => {
  assert.equal(end('tireoide', ['sim', gs({ tsh: 3.2, t4l: 1.2, tpo: 'neg', tshUrl: 3.0 })]).path.at(-1), 'g_considerar');
  assert.equal(end('tireoide', ['sim', gs({ tri: '1', tsh: 0.05, t4l: 1.2, tpo: 'nd', tshLo: 0.1 })]).path.at(-1), 'g_supr');
  assert.equal(end('tireoide', ['sim', gs({ tri: '1', tsh: 0.05, t4l: 2.5, tpo: 'nd', tshLo: 0.1 })]).path.at(-1), 'g_hiper');
});
test('Tireoide: o corte ajustado no Registry muda o fluxo', () => {
  const r2 = L.effective({ 'tireoide:sch.tshTreat': { value: 8, origin: 'manual' } }, {});
  assert.equal(end('tireoide', ['nao', ad({ tsh: 9, t4l: 1.2 })], r2).path.at(-1), 'r_sch_alto');
});

/* ---- sífilis ---- */
test('Sífilis diagnóstico: matriz treponêmico × VDRL', () => {
  const d = (tt, nt, o) => end('sifilis', ['diag', Object.assign({ tt, nt, trat: 'nao' }, o)]).path.at(-1);
  assert.equal(d('R', 'R'), 'r_conf');
  assert.equal(d('R', 'R', { trat: 'ns' }), 'r_conf_ns');
  assert.equal(d('R', 'NR'), 'r_tt2');
  assert.equal(d('NR', 'R'), 'r_nt_isol');
  assert.equal(d('NR', 'NR'), 'r_neg');
  assert.equal(d('ND', 'R'), 'r_pedir');
  assert.equal(d('R', 'ND'), 'r_pedir_nt');
});
test('Sífilis: treponêmico reagente com VDRL negativo e lesão aciona o aviso de prozona', () => {
  const t = end('sifilis', ['diag', { tt: 'R', nt: 'NR', trat: 'nao', lesao: true }]).result.texts.join(' ');
  assert.match(t, /prozona/);
});
test('Sífilis: já tratou com VDRL reagente cai no seguimento', () => {
  assert.equal(play('sifilis', ['diag', { tt: 'R', nt: 'R', trat: 'sim' }]).pending, 'seg');
});
const sg = (pre, pos, meses, est) => end('sifilis', ['seg', { pre, pos, meses, est: est || 'rec' }]).path.at(-1);
test('Sífilis seguimento: 1:32 → 1:8 (2 diluições) é resposta; 1:32 → 1:16 não', () => {
  assert.equal(sg(32, 8, 6), 'r_resp');
  assert.equal(sg(128, 32, 3), 'r_resp');
  assert.equal(sg(32, 0, 6), 'r_resp');
  assert.equal(sg(32, 16, 3), 'r_aguarda');
  assert.equal(sg(32, 16, 6), 'r_inadequada');
});
test('Sífilis seguimento: prazo de 6 meses (recente) e de 12 meses (tardia); aumento de 2 diluições é falha', () => {
  assert.equal(sg(16, 8, 11, 'tar'), 'r_aguarda');
  assert.equal(sg(16, 8, 12, 'tar'), 'r_inadequada');
  assert.equal(sg(4, 16, 3), 'r_falha');
  assert.equal(sg(4, 8, 3), 'r_aguarda');
});
test('Sífilis seguimento: título baixo e estável após o prazo é cicatriz sorológica', () => {
  assert.equal(sg(4, 4, 12), 'r_cicatriz');
  assert.equal(sg(8, 8, 12, 'tar'), 'r_inadequada');
  assert.match(play('sifilis', ['seg', { pre: 0, pos: 0, meses: 6, est: 'rec' }]).error, /≥1/);
});

/* ---- toxoplasmose ---- */
const tx = (o) => end('toxo', [Object.assign({ igg: 'R', igm: 'R', ga: 12, av: 'alta' }, o)]).path.at(-1);
test('Toxoplasmose: IgG/IgM e avidez até 16 semanas', () => {
  assert.equal(tx({ igg: 'NR', igm: 'NR' }), 'r_susc');
  assert.equal(tx({ igm: 'NR' }), 'r_imune');
  assert.equal(tx({ igg: 'NR' }), 'r_igm');
  assert.equal(tx({ av: 'nd' }), 'r_avidez');
  assert.equal(tx({ av: 'alta', ga: 16 }), 'r_afasta');
  assert.equal(tx({ av: 'alta', ga: 17 }), 'r_agudo');
  assert.equal(tx({ av: 'baixa', ga: 10 }), 'r_agudo');
  assert.equal(tx({ av: 'inter', ga: 10 }), 'r_inter');
});

/* ---- hepatite B ---- */
const hb = (o) => end('hbv', [Object.assign({ hbsag: 'NR', hbc: 'NR', hbs: 'NR' }, o)]).path.at(-1);
test('Hepatite B: matriz de marcadores', () => {
  assert.equal(hb({}), 'r_susc');
  assert.equal(hb({ hbs: 'R' }), 'r_imune_vac');
  assert.equal(hb({ hbs: 'R', hbc: 'R' }), 'r_imune_nat');
  assert.equal(hb({ hbc: 'R' }), 'r_hbc_iso');
  assert.equal(hb({ hbsag: 'R', hbc: 'R', igm: 'R' }), 'r_agudo');
  assert.equal(hb({ hbsag: 'R', hbc: 'R', igm: 'NR' }), 'r_cronico');
  assert.equal(hb({ hbsag: 'R', hbc: 'R', igm: 'ND' }), 'r_agudo_ou_cronico');
  assert.equal(hb({ hbsag: 'R', hbc: 'NR' }), 'r_hbsag_iso');
});

/* ---- hepatologia ---- */
const en = (o) => end('hepato', ['enz', Object.assign({ altLsn: 40, faLsn: 120 }, o)]);
test('Fator R: (ALT/LSN)/(FA/LSN), limites 5 e 2 inclusivos', () => {
  // ALT 400 (10×), FA 120 (1×) → R = 10
  const h = en({ alt: 400, fa: 120 }); assert.equal(h.path.at(-1), 'r_hepatocelular'); assert.equal(h.ctx.R, 10);
  // ALT 200 (5×), FA 120 (1×) → R = 5 → hepatocelular
  assert.equal(en({ alt: 200, fa: 120 }).path.at(-1), 'r_hepatocelular');
  // ALT 80 (2×), FA 120 (1×) → R = 2 → colestático
  assert.equal(en({ alt: 80, fa: 120 }).path.at(-1), 'r_colestatico');
  // ALT 120 (3×), FA 120 (1×) → R = 3 → misto
  assert.equal(en({ alt: 120, fa: 120 }).path.at(-1), 'r_misto');
  // FA alta isolada: R < 1
  assert.equal(en({ alt: 30, fa: 480 }).path.at(-1), 'r_colestatico');
  assert.equal(en({ alt: 30, fa: 100 }).path.at(-1), 'r_normal');
  assert.match(play('hepato', ['enz', { alt: 10, altLsn: 0, fa: 10, faLsn: 10 }]).error, /maiores que zero/);
});
test('Fator R usa os LSN do laudo (mesmo valor bruto, LSN diferente, padrão diferente)', () => {
  assert.equal(en({ alt: 200, fa: 120 }).path.at(-1), 'r_hepatocelular');
  assert.equal(en({ alt: 200, fa: 120, altLsn: 100 }).path.at(-1), 'r_colestatico');   // ALT 2× e FA 1× → R = 2
});
const bl = (o) => end('hepato', ['bil', Object.assign({ bt: 2.0, btLsn: 1.2, bd: 0.4, enzOk: true }, o)]).path.at(-1);
test('Gilbert: indireta ≥70%, enzimas normais, sem hemólise, bilirrubina < 3× LSN', () => {
  assert.equal(bl({}), 'r_gilbert');            // 80% indireta, 2,0 < 3,6
  assert.equal(bl({ hemolise: true }), 'r_hemolise');
  assert.equal(bl({ enzOk: false }), 'r_indireta');
  assert.equal(bl({ bt: 4.0 }), 'r_indireta');  // 4,0 ≥ 3,6
  assert.equal(bl({ bd: 1.0 }), 'r_direta');    // 50% indireta
  assert.match(play('hepato', ['bil', { bt: 1, btLsn: 1.2, bd: 2, enzOk: true }]).error, /direta/);
});

/* ---- FAN ---- */
const fn = (t, p, o) => end('fan', [Object.assign({ titulo: String(t), padrao: p }, o)]).path.at(-1);
test('FAN: abaixo do corte é negativo; AC-2 é tratado à parte; padrões mapeiam para os blocos', () => {
  assert.equal(fn(0, 'ac1'), 'r_neg');
  assert.equal(fn(40, 'ac1'), 'r_neg');
  assert.equal(fn(80, 'ac1'), 'p1');
  assert.equal(fn(1280, 'ac2'), 'p2');
  assert.equal(fn(320, 'ac3'), 'p3'); assert.equal(fn(320, 'ac4'), 'p4'); assert.equal(fn(320, 'ac5'), 'p5');
  assert.equal(fn(320, 'ac8'), 'pnuc'); assert.equal(fn(320, 'ac9'), 'pnuc'); assert.equal(fn(320, 'ac10'), 'pnuc');
  assert.equal(fn(320, 'ac21'), 'p21'); assert.equal(fn(320, 'out'), 'pout'); assert.equal(fn(320, undefined), 'pout');
});
test('FAN: AC-2 isolado sem clínica fala em baixa probabilidade; AC-4 lembra o risco de bloqueio cardíaco fetal', () => {
  const t = end('fan', [{ titulo: '640', padrao: 'ac2' }]).result;
  assert.match(t.texts.join(' '), /anti-DFS70/); assert.match(t.texts.join(' '), /1:640/);
  assert.match(end('fan', [{ titulo: '160', padrao: 'ac4' }]).result.recs.join(' '), /bloqueio cardíaco/);
});
test('FAN: o corte do título vem do Registry', () => {
  const r2 = L.effective({ 'fan:titer.cut': { value: 160, origin: 'manual' } }, {});
  assert.equal(end('fan', [{ titulo: '80', padrao: 'ac1' }], r2).path.at(-1), 'r_neg');
});

/* ---- IMWG ---- */
const im = (o) => end('imwg', ['sim', Object.assign({ m: 1.0, ig: 'IgG' }, o)]);
test('IMWG: sem componente M o resultado é policlonal', () => {
  assert.equal(end('imwg', ['nao']).path.at(-1), 'r_poli');
});
test('IMWG: MGUS, mieloma indolente, mieloma por CRAB e por SLiM', () => {
  assert.equal(im({ m: 1.0, pc: 5 }).path.at(-1), 'r_mgus');
  assert.equal(im({ m: 2.9 }).path.at(-1), 'r_mgus');
  assert.equal(im({ m: 3.0, pc: 5 }).path.at(-1), 'r_smm');
  assert.equal(im({ m: 1.0, pc: 10 }).path.at(-1), 'r_smm');
  assert.equal(im({ m: 3.5, pc: 30, ca: 11.5 }).path.at(-1), 'r_mm');
  assert.equal(im({ m: 3.5, pc: 30, cr: 2.5 }).path.at(-1), 'r_mm');
  assert.equal(im({ m: 3.5, pc: 30, hb: 9.5 }).path.at(-1), 'r_mm');
  assert.equal(im({ m: 3.5, pc: 30, osso: true }).path.at(-1), 'r_mm');
  assert.equal(im({ m: 3.5, pc: 61 }).path.at(-1), 'r_mm');
  assert.equal(im({ m: 3.5, pc: 30, ratio: 100, flcInv: 120 }).path.at(-1), 'r_mm');
  assert.equal(im({ m: 3.5, pc: 30, rm: true }).path.at(-1), 'r_mm');
  assert.equal(im({ m: 1.0, plasmocitoma: true, osso: true }).path.at(-1), 'r_mm');
});
test('IMWG: limites exatos (cálcio 11, creatinina 2, Hb 10, 60%, razão 99) não disparam CRAB/SLiM', () => {
  assert.equal(im({ m: 3.5, pc: 30, ca: 11, cr: 2, hb: 10 }).path.at(-1), 'r_smm');
  assert.equal(im({ m: 3.5, pc: 59 }).path.at(-1), 'r_smm');
  assert.equal(im({ m: 3.5, pc: 30, ratio: 99, flcInv: 500 }).path.at(-1), 'r_smm');
  assert.equal(im({ m: 3.5, pc: 30, ratio: 150, flcInv: 90 }).path.at(-1), 'r_smm');   // razão ≥100 mas cadeia envolvida <100 mg/L
});
test('IMWG: cálcio acima do LSN em mais de 1 mg/dL, LIN da hemoglobina e depuração <40 contam como CRAB', () => {
  assert.equal(im({ m: 3.5, pc: 30, ca: 10.9, caLsn: 9.8 }).path.at(-1), 'r_mm');
  assert.equal(im({ m: 3.5, pc: 30, ca: 10.8, caLsn: 9.8 }).path.at(-1), 'r_smm');
  assert.equal(im({ m: 3.5, pc: 30, hb: 10.5, hbLln: 13 }).path.at(-1), 'r_mm');
  assert.equal(im({ m: 3.5, pc: 30, crcl: 39 }).path.at(-1), 'r_mm');
  assert.equal(im({ m: 3.5, pc: 30, crcl: 40 }).path.at(-1), 'r_smm');
});
test('IMWG: CRAB sem contagem de plasmócitos é suspeita, não classificação', () => {
  assert.equal(im({ m: 3.5, ca: 12 }).path.at(-1), 'r_suspeita');
  assert.match(im({ m: 1.0, pc: 3, ig: 'IgM' }).result.texts.join(' '), /Waldenström/);
});

/* ---- urina ---- */
const ur = (o) => end('urina', ['cult', Object.assign({ ufc: 100000, esp: 1, mat: 'jm', sexo: 'F', pop: 'nenhum' }, o)]).path.at(-1);
test('Urocultura: contaminação, sintomas, bacteriúria assintomática (quando tratar)', () => {
  assert.equal(ur({ esp: 3 }), 'r_contam');
  assert.equal(ur({ escamosas: true }), 'r_contam');
  assert.equal(ur({ sint: true }), 'r_itu');
  assert.equal(ur({ sint: true, ufc: 100 }), 'r_sint_neg');
  assert.equal(ur({ ufc: 1000 }), 'r_sem');
  assert.equal(ur({}), 'r_nao');
  assert.equal(ur({ gest: true }), 'r_gest');
  assert.equal(ur({ proc: true }), 'r_proc');
  assert.equal(ur({ mat: 'cl' }), 'r_nao_cat');
  assert.equal(ur({ pop: 'dm' }), 'r_nao');
  assert.equal(ur({ pop: 'tx' }), 'r_nao');
});
test('Urocultura: cateterismo de alívio usa o limiar de 10² e a gestação cita 4 a 7 dias', () => {
  assert.equal(ur({ mat: 'cn', ufc: 100 }), 'r_nao');
  assert.equal(ur({ mat: 'cn', ufc: 99 }), 'r_sem');
  assert.match(end('urina', ['cult', { ufc: 100000, esp: 1, mat: 'jm', sexo: 'F', gest: true, pop: 'nenhum' }]).result.texts.join(' '), /4 a 7 dias/);
});
test('Urocultura: idoso com bacteriúria recebe o aviso sobre delirium', () => {
  assert.match(end('urina', ['cult', { ufc: 100000, esp: 1, mat: 'jm', sexo: 'F', pop: 'idoso' }]).result.texts.join(' '), /delirium/);
});
const sd = (o) => end('urina', ['sed', Object.assign({}, o)]).path.at(-1);
test('Sedimento: acantócitos ≥5%, cilindros e hematúria isomórfica', () => {
  assert.equal(sd({ hemacias: true, acant: 5 }), 'r_glom');
  assert.equal(sd({ hemacias: true, acant: 4.9 }), 'r_iso');
  assert.equal(sd({ hemacias: true, cHemat: true }), 'r_glom');
  assert.equal(sd({ cLeuc: true }), 'r_leuc');
  assert.equal(sd({ cGran: true }), 'r_gran');
  assert.equal(sd({}), 'r_sed_ok');
});

/* ---- motor e prontuário ---- */
test('Formulário: campo obrigatório vazio, select inválido e número inválido dão erro', () => {
  assert.match(play('tireoide', ['nao', {}]).error, /Informe um número/);
  assert.match(play('sifilis', ['diag', { tt: 'X', nt: 'R' }]).error, /inválido/);
  assert.match(play('sifilis', ['xx']).error, /opções/);
});
test('Nota de prontuário traz resultado, sugestões, selo e aviso', () => {
  const x = end('imwg', ['sim', { m: 3.5, pc: 30, ca: 11.5, ig: 'IgG' }]);
  const t = F.nota(F.byId('imwg'), x.result, '2026-10-15');
  assert.match(t, /Critérios de mieloma múltiplo/); assert.match(t, /\[IMWG 2014 \| Auditado: Out\/2026\]/); assert.match(t, /15\/10\/2026/); assert.match(t, /Sugestões/);
});

/* ---- enciclopédia ---- */
test('Enciclopédia: busca sem acento e por categoria; cada entrada tem fonte e confiança', () => {
  E.ENTRADAS.forEach((e) => { assert.ok(e.fonte && e.resumo && e.pontos.length && ['livro', 'a_verificar'].includes(e.conf), e.id); assert.ok(E.CATS[e.cat], e.id); });
  assert.ok(E.buscar('hemolise').some((e) => e.id === 'hemolise'));
  assert.ok(E.buscar('pseudotrombocitopenia')[0].id === 'edta');
  assert.ok(E.buscar('gancho', 'interferentes').length >= 1);
  assert.equal(E.buscar('gancho', 'fisiologia').filter((e) => e.id === 'gancho').length, 0);
  assert.equal(E.buscar('xyzzy').length, 0);
  assert.ok(E.buscar('').length === E.ENTRADAS.length);
});
test('Enciclopédia: critérios de encaminhamento leem o Registry e não inventam exames de regulação', () => {
  const nefro = E.ENTRADAS.find((e) => e.id === 'enc_nefro');
  const t = E.textoPontos(nefro, reg).join(' ');
  assert.match(t, /30 mL\/min/); assert.match(t, /300 mg\/g/);
  const r2 = L.effective({ 'kdigo:neph.egfr': { value: 25, origin: 'manual' } }, {});
  assert.match(E.textoPontos(nefro, r2).join(' '), /25 mL\/min/);
  E.ENTRADAS.filter((e) => e.cat === 'encaminhamento').forEach((e) => { assert.ok(e.regulacao); assert.equal(e.exames, undefined); });
});
