// Pedidos de exames especiais: integridade do catálogo (fontes, ids) e comportamento do motor de texto.
// Valores de referência: intervalos da Tabela 4 de Gupta 2020 (US Multi-Society Task Force), Baveno VII e as listas
// de contraindicação da Diretriz Brasileira de Ergometria 2024, conforme lidos nas fontes.
const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../js/pedidos-dados.js');
const E = require('../js/pedidos-engine.js');

const ex = (id) => D.exames.find((x) => x.id === id);
const crit = (e) => E.todosCriterios(e);
const base = { idade: 58, sexo: 'M', prioridade: 'eletivo' };
const pedido = (exame, extra) => E.montar(D, Object.assign({ exame, cid: ex(exame).cids[0][0] }, base, extra));

/* ---------- integridade do catálogo ---------- */
test('9 exames, cada um com sistema, nome, CIDs, fontes e conferência', () => {
  assert.equal(D.exames.length, 9);
  for (const e of D.exames) {
    assert.ok(e.sistema && e.nome && e.nomeCurto, e.id);
    assert.ok(e.cids.length >= 1 && e.cids.every((c) => /^[A-Z]\d{2}(\.\d)?$/.test(c[0]) && c[1]), e.id + ': CID');
    assert.ok(Object.keys(e.fontes).length >= 1, e.id);
    assert.ok(e.conferencia && e.conferencia.data && Array.isArray(e.conferencia.pendencias), e.id);
    assert.ok(e.naoIndicado.length >= 1, e.id + ': quando não indicado');
  }
});

test('ids de critérios são únicos em todo o catálogo', () => {
  const vistos = new Set();
  for (const e of D.exames) for (const c of crit(e)) { assert.ok(!vistos.has(c.id), 'repetido: ' + c.id); vistos.add(c.id); }
});

test('toda fonte tem nome, link https, nota e referência curta', () => {
  for (const e of D.exames) for (const [k, f] of Object.entries(e.fontes)) {
    assert.ok(f.nome && f.nota && f.curta, `${e.id}/${k}`);
    assert.match(f.link, /^https:\/\//, `${e.id}/${k}`);
  }
});

test('critério conferido (v: true) sempre cita uma fonte que existe; critério sem fonte é marcado v: false', () => {
  for (const e of D.exames) for (const c of crit(e)) {
    if (c.fonte) assert.ok(e.fontes[c.fonte], `${c.id}: fonte ${c.fonte} não existe em ${e.id}`);
    if (c.v !== false && !c.soContexto) assert.ok(c.fonte, `${c.id}: critério verificado sem fonte`);
  }
});

test('regras e campos só citam critérios e grupos que existem', () => {
  for (const e of D.exames) {
    const idsE = new Set(crit(e).map((c) => c.id));
    const grupos = new Set(crit(e).map((c) => c.grupo));
    const confere = (se, onde) => {
      for (const k of ['criterio', 'criterioAlgum']) for (const id of (se && se[k]) || []) assert.ok(idsE.has(id), `${onde}: ${id}`);
      for (const g of (se && se.semGrupo) || []) assert.ok(grupos.has(g), `${onde}: grupo ${g}`);
      if (se && se.grupoMenosQue) assert.ok(grupos.has(se.grupoMenosQue.grupo), `${onde}: grupo`);
      for (const k of ['criterio', 'criterioAlgum']) if (se && typeof se[k] === 'string') assert.fail(`${onde}: lista não resolvida (${se[k]})`);
    };
    (e.regras || []).forEach((r) => { assert.ok(r.id && r.aviso && ['alto', 'atencao', 'info'].includes(r.nivel), e.id + ' ' + r.id); confere(r.se, e.id + '/' + r.id); });
    (e.campos || []).forEach((c) => { if (c.exigidoQuando) confere(c.exigidoQuando, e.id + '/campo ' + c.id); });
  }
});

test('critério com intervaloMin informa a fonte do intervalo', () => {
  for (const e of D.exames) for (const c of crit(e)) if (c.intervaloMin != null) assert.ok(c.intervaloFonte, c.id);
});

/* ---------- valores de referência das fontes ---------- */
test('Gupta 2020, Tabela 4: intervalos mínimos de vigilância (anos)', () => {
  const min = (id) => crit(ex('colonoscopia')).find((c) => c.id === id).intervaloMin;
  assert.equal(min('col_vig_normal'), 10);
  assert.equal(min('col_vig_12'), 7);      // 1-2 adenomas tubulares < 10 mm: 7 a 10 anos
  assert.equal(min('col_vig_34'), 3);      // 3-4: 3 a 5 anos
  assert.equal(min('col_vig_510'), 3);
  assert.equal(min('col_vig_grande'), 3);
  assert.equal(min('col_vig_vilo'), 3);
  assert.equal(min('col_vig_hgd'), 3);
  assert.equal(min('col_vig_mais10'), 1);
  assert.equal(min('col_vig_piece'), 0.5); // 6 meses
  assert.equal(min('col_vig_hiper'), 10);  // Tabela 5
  assert.equal(min('col_vig_ssp12'), 5);
});

test('ACG 2022 (Barrett): vigilância a cada 5 anos se < 3 cm e a cada 3 anos se ≥ 3 cm', () => {
  const min = (id) => crit(ex('eda')).find((c) => c.id === id).intervaloMin;
  assert.equal(min('eda_barrett_curto'), 5);
  assert.equal(min('eda_barrett_longo'), 3);
});

test('Diretriz Brasileira de Valvopatias 2020: piso dos intervalos de seguimento (anos)', () => {
  const min = (id) => crit(ex('eco')).find((c) => c.id === id).intervaloMin;
  assert.equal(min('eco_seg_ea_i'), 0.5);  // estenose aórtica importante: 6 meses
  assert.equal(min('eco_seg_ea_m'), 1);
  assert.equal(min('eco_seg_ea_d'), 2);    // discreta: 2 a 3 anos
  assert.equal(min('eco_seg_ia_d'), 3);    // insuficiência aórtica discreta: 3 a 5 anos
  assert.equal(min('eco_seg_im_d'), 2);
});

/* ---------- motor: pendências e texto ---------- */
test('sem exame, sem idade, sem sexo, sem prioridade, sem CID e sem critério: lista o que falta', () => {
  assert.deepEqual(E.montar(D, {}).faltas, ['Escolha o exame a solicitar.']);
  const r = E.montar(D, { exame: 'eda' });
  assert.equal(r.pronto, false);
  assert.equal(r.texto, '');
  for (const t of [/idade/i, /sexo/i, /prioridade/i, /CID/, /critério/]) assert.ok(r.faltas.some((f) => t.test(f)), String(t));
});

test('idade inválida (decimal, negativa, > 120) não gera texto', () => {
  for (const idade of [-1, 121, 55.5, '']) assert.equal(pedido('eda', { idade, criterios: ['eda_disfagia'] }).pronto, false, String(idade));
});

test('texto da EDA por disfagia: cabeçalho, critérios marcados, referência e nada além do marcado', () => {
  const r = pedido('eda', { cid: 'R13', criterios: ['eda_disfagia'], quadro: 'Disfagia progressiva há 2 meses' });
  assert.equal(r.pronto, true);
  assert.match(r.texto, /^SOLICITAÇÃO: Endoscopia digestiva alta/);
  assert.match(r.texto, /Prioridade: Eletiva/);
  assert.match(r.texto, /sexo masculino, 58 anos/);
  assert.match(r.texto, /R13 - Disfagia/);
  assert.match(r.texto, /Quadro clínico: Disfagia progressiva há 2 meses\./);
  assert.match(r.texto, /- Disfagia\./);
  assert.match(r.texto, /Referência: ACG 2022 \(DRGE\)\./);
  assert.ok(!/perda de peso/i.test(r.texto), 'não pode incluir o que não foi marcado');
});

test('refluxo sem resposta ao IBP exige o relato do IBP; com ele, o texto sai', () => {
  const sem = pedido('eda', { cid: 'K21.9', criterios: ['eda_drge_refrataria'] });
  assert.equal(sem.pronto, false);
  assert.ok(sem.faltas.some((f) => /IBP/.test(f)));
  const com = pedido('eda', { cid: 'K21.9', criterios: ['eda_drge_refrataria'], campos: { ibp: 'Omeprazol 20 mg/dia por 8 semanas, sem melhora' } });
  assert.equal(com.pronto, true);
  assert.match(com.texto, /Tratamento prévio com IBP: Omeprazol 20 mg\/dia por 8 semanas, sem melhora\./);
});

test('rastreio de Barrett pede 3 fatores; com 3 não avisa; fatores entram como contexto', () => {
  const dois = pedido('eda', { cid: 'K22.7', criterios: ['eda_barrett_rastreio', 'eda_bf_homem', 'eda_bf_idade'] });
  assert.ok(dois.avisos.some((a) => a.id === 'eda-barrett-fatores' && a.nivel === 'atencao'));
  const tres = pedido('eda', { cid: 'K22.7', criterios: ['eda_barrett_rastreio', 'eda_bf_homem', 'eda_bf_idade', 'eda_bf_obes'] });
  assert.ok(!tres.avisos.some((a) => a.id === 'eda-barrett-fatores'));
  assert.equal(tres.pronto, true);
  assert.match(tres.texto, /Contexto e cuidados:\n- Fator de risco para Barrett: sexo masculino\./);
  // fator de risco sozinho não é critério de indicação
  assert.equal(pedido('eda', { cid: 'K22.7', criterios: ['eda_bf_homem'] }).pronto, false);
});

test('dispepsia: critério de 60 anos em paciente mais jovem avisa', () => {
  assert.ok(pedido('eda', { idade: 55, cid: 'K30', criterios: ['eda_disp_60'] }).avisos.some((a) => a.id === 'eda-disp60-jovem'));
  assert.ok(!pedido('eda', { idade: 60, cid: 'K30', criterios: ['eda_disp_60'] }).avisos.some((a) => a.id === 'eda-disp60-jovem'));
});

test('Barrett em mulher: aviso informativo de baixo rendimento', () => {
  const r = pedido('eda', { sexo: 'F', cid: 'K22.7', criterios: ['eda_barrett_rastreio'] });
  assert.ok(r.avisos.some((a) => a.id === 'eda-barrett-mulher' && a.nivel === 'info'));
});

test('colonoscopia: rastreio direto avisa o FIT no SUS e a idade mínima', () => {
  const sus = pedido('colonoscopia', { idade: 60, cid: 'Z12.1', criterios: ['col_rastreio_direto'] });
  assert.ok(sus.avisos.some((a) => a.id === 'col-sus-fit'));
  const jovem = pedido('colonoscopia', { idade: 40, cid: 'Z12.1', criterios: ['col_rastreio_direto'] });
  assert.ok(jovem.avisos.some((a) => a.id === 'col-idade-jovem'));
  assert.ok(!jovem.avisos.some((a) => a.id === 'col-sus-fit'));
  assert.ok(pedido('colonoscopia', { idade: 80, cid: 'Z12.1', criterios: ['col_rastreio_direto'] }).avisos.some((a) => a.id === 'col-idade-idoso'));
  // FIT positivo não gera o aviso do SUS
  const fit = pedido('colonoscopia', { idade: 60, cid: 'R19.5', criterios: ['col_fit_pos'], campos: { fit: '10/11/2026, positivo' } });
  assert.ok(!fit.avisos.some((a) => a.id === 'col-sus-fit'));
  assert.equal(fit.pronto, true);
});

test('vigilância pós-polipectomia: avisa se o exame anterior é mais recente que o intervalo', () => {
  const campos = (anos) => ({ anosDesde: String(anos), achados: '2019: 2 adenomas tubulares de 6 mm, preparo bom, chegou ao ceco' });
  const cedo = pedido('colonoscopia', { cid: 'K63.5', criterios: ['col_vig_12'], campos: campos(5) });
  assert.ok(cedo.avisos.some((a) => /^intervalo-/.test(a.id) && /7/.test(a.texto)));
  const ok = pedido('colonoscopia', { cid: 'K63.5', criterios: ['col_vig_12'], campos: campos(8) });
  assert.ok(!ok.avisos.some((a) => /^intervalo-/.test(a.id)));
  assert.equal(ok.pronto, true);
  assert.match(ok.texto, /intervalo recomendado de 7 a 10 anos/);
  assert.match(ok.texto, /Referência: US Multi-Society Task Force 2020 \(vigilância\)\./);
  // vírgula decimal e 6 meses
  assert.ok(pedido('colonoscopia', { cid: 'K63.5', criterios: ['col_vig_piece'], campos: campos('0,3') }).avisos.some((a) => /^intervalo-/.test(a.id)));
  // sem os dados do exame anterior, não gera
  assert.equal(pedido('colonoscopia', { cid: 'K63.5', criterios: ['col_vig_12'] }).pronto, false);
});

test('teste ergométrico: contraindicação absoluta bloqueia o texto', () => {
  const r = pedido('ergometrico', { cid: 'R07.4', criterios: ['te_prob_inter', 'te_c_angina'], campos: { ecg: 'Normal' } });
  assert.equal(r.bloqueado, true);
  assert.equal(r.pronto, false);
  assert.equal(r.texto, '');
  assert.ok(r.avisos.some((a) => a.nivel === 'alto'));
});

test('teste ergométrico: ECG limitante bloqueia o diagnóstico de DAC, mas não a investigação de arritmia', () => {
  const dac = pedido('ergometrico', { cid: 'R07.4', criterios: ['te_prob_inter', 'te_c_ecg'], campos: { ecg: 'BRE' } });
  assert.equal(dac.bloqueado, true);
  assert.ok(dac.avisos.some((a) => a.id === 'te-ecg-diag'));
  const arr = pedido('ergometrico', { cid: 'R00.2', criterios: ['te_arritmia_esf', 'te_c_ecg'] });
  assert.equal(arr.bloqueado, false);
  assert.ok(arr.avisos.some((a) => a.id === 'te-ecg-outras'));
});

test('teste ergométrico: ECG de repouso é exigido nos critérios de DAC; confirmação de contraindicações entra no texto', () => {
  const sem = pedido('ergometrico', { cid: 'I25.9', criterios: ['te_prognostico'] });
  assert.ok(sem.faltas.some((f) => /ECG/.test(f)));
  const com = pedido('ergometrico', { cid: 'I25.9', criterios: ['te_prognostico'], campos: { ecg: 'Ritmo sinusal, sem alterações' }, contraRevisadas: true });
  assert.equal(com.pronto, true);
  assert.match(com.texto, /Contraindicações absolutas e relativas ao teste ergométrico revisadas: nenhuma presente\./);
  assert.match(com.texto, /\(Classe I, nível B\)/);
  // contraindicação relativa avisa, mas não bloqueia
  const rel = pedido('ergometrico', { cid: 'I25.9', criterios: ['te_prognostico', 'te_r_dialise'], campos: { ecg: 'Normal' } });
  assert.equal(rel.bloqueado, false);
  assert.ok(rel.avisos.some((a) => a.id === 'te-relativa'));
});

test('Holter: sintomas menos frequentes que diários avisam sobre o aparelho; frequência fica como contexto', () => {
  const rara = pedido('holter', { cid: 'R55', criterios: ['h_sintoma_diario', 'h_freq_rara'], campos: { sintoma: 'Síncope duas vezes em 6 meses' } });
  assert.ok(rara.avisos.some((a) => a.id === 'h-pouco-freq'));
  assert.match(rara.texto, /Contexto e cuidados:\n- Sintomas raros/);
  const sem = pedido('holter', { cid: 'R00.2', criterios: ['h_sintoma_diario'], campos: { sintoma: 'Palpitações diárias' } });
  assert.ok(sem.avisos.some((a) => a.id === 'h-sem-freq' && a.nivel === 'info'));
  // só frequência, sem indicação: não gera
  assert.equal(pedido('holter', { cid: 'R00.2', criterios: ['h_freq_dia'] }).pronto, false);
  assert.ok(pedido('holter', { cid: 'I63.9', criterios: ['h_avc_cripto'] }).avisos.some((a) => a.id === 'h-avc-cripto'));
});

test('MAPA: exige PA de consultório; indicação comum a MRPA avisa; indicação de sono não', () => {
  assert.ok(pedido('mapa', { cid: 'I10', criterios: ['m_est1'] }).faltas.some((f) => /PA de consultório/.test(f)));
  const est1 = pedido('mapa', { cid: 'I10', criterios: ['m_est1'], campos: { pa: '152/96 e 148/94 em 2 consultas' } });
  assert.equal(est1.pronto, true);
  assert.ok(est1.avisos.some((a) => a.id === 'm-mrpa'));
  const sono = pedido('mapa', { cid: 'I10', criterios: ['m_sono'], campos: { pa: '150/90' } });
  assert.ok(!sono.avisos.some((a) => a.id === 'm-mrpa'));
  const res = pedido('mapa', { cid: 'I10', criterios: ['m_resistente'], campos: { pa: '160/100 com 3 fármacos' } });
  assert.ok(!res.avisos.some((a) => a.id === 'm-mrpa'));
});

test('ressonância lombar: dor inespecífica após 6 semanas avisa; déficit neurológico exige o exame neurológico', () => {
  const insp = pedido('rm_lombar', { cid: 'M54.5', criterios: ['rl_6sem'], campos: { tratamento: 'AINE e fisioterapia por 6 semanas' } });
  assert.ok(insp.avisos.some((a) => a.id === 'rl-inespecifica'));
  const def = pedido('rm_lombar', { cid: 'M54.1', criterios: ['rl_deficit'] });
  assert.ok(def.faltas.some((f) => /neurológico/.test(f)));
  const ok = pedido('rm_lombar', { cid: 'M54.1', criterios: ['rl_deficit'], campos: { neuro: 'Força 3/5 em dorsiflexão do pé direito' } });
  assert.equal(ok.pronto, true);
  assert.ok(!ok.avisos.some((a) => a.id === 'rl-inespecifica'));
});

test('ressonância de joelho: radiografia prévia é obrigatória', () => {
  const sem = pedido('rm_joelho', { cid: 'M25.5', criterios: ['rj_atipico'] });
  assert.ok(sem.faltas.some((f) => /radiografia/i.test(f)));
  const ok = pedido('rm_joelho', { cid: 'M25.5', criterios: ['rj_atipico'], campos: { radiografia: 'Ortostatismo, 02/11/2026: sem alterações' } });
  assert.equal(ok.pronto, true);
  assert.match(ok.texto, /Radiografia do joelho: Ortostatismo, 02\/11\/2026: sem alterações\./);
});

test('polissonografia: exige avaliação do sono; sem motivo de laboratório avisa; STOP-Bang sozinho não basta', () => {
  assert.ok(pedido('psg', { cid: 'G47.3', criterios: ['ps_suspeita'] }).faltas.some((f) => /avaliação/i.test(f)));
  const semLab = pedido('psg', { cid: 'G47.3', criterios: ['ps_suspeita'], campos: { avaliacao: 'Ronco, sonolência, Epworth 14' } });
  assert.equal(semLab.pronto, true);
  assert.ok(semLab.avisos.some((a) => a.id === 'ps-sem-lab'));
  const comLab = pedido('psg', { cid: 'G47.3', criterios: ['ps_suspeita', 'ps_opioide'], campos: { avaliacao: 'Ronco, sonolência' } });
  assert.ok(!comLab.avisos.some((a) => a.id === 'ps-sem-lab'));
  const stop = pedido('psg', { cid: 'G47.3', criterios: ['ps_stopbang'], campos: { avaliacao: 'x' } });
  assert.equal(stop.pronto, false);
  assert.ok(stop.avisos.some((a) => a.id === 'ps-stopbang-sozinho'));
});

test('criterios fora do exame escolhido são ignorados; texto nunca cita critério de outro exame', () => {
  const r = pedido('eda', { cid: 'R13', criterios: ['eda_disfagia', 'col_hematoquezia', 'te_c_angina'] });
  assert.equal(r.pronto, true);
  assert.ok(!/hematoquezia|angina/i.test(r.texto));
});

test('anticoagulante entra no texto e mostra o aviso da ACG-CAG 2022', () => {
  const r = pedido('eda', { cid: 'R13', criterios: ['eda_disfagia', 'eda_anticoag'] });
  assert.match(r.texto, /Contexto e cuidados:\n- Em uso de anticoagulante ou antiagregante\./);
  assert.ok(r.avisos.some((a) => a.id === 'eda-anticoag' && /ACG-CAG 2022/.test(a.texto)));
});
