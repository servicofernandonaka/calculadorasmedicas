// Pedidos de exames especiais: integridade do catálogo (fontes, ids) e comportamento do motor de texto.
// Valores de referência: intervalos da Tabela 4 de Gupta 2020 (US Multi-Society Task Force), Baveno VII e as listas
// de contraindicação da Diretriz Brasileira de Ergometria 2024, conforme lidos nas fontes.
const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../js/pedidos-dados.js');
const E = require('../js/pedidos-engine.js');

const ex = (id) => D.exames.find((x) => x.id === id);
const crit = (e) => E.todosCriterios(e);
const base = { idade: 58, sexo: 'M', prioridade: 'P2', solicitante: 'outro', quadro: 'Quadro clínico de teste.' };
// Campos que o protocolo de Barueri torna obrigatórios: os testes os preenchem, exceto quando é isso que se testa
const GERAIS = { exame_fisico: 'Sem alterações relevantes.', historico: 'Sem tratamento prévio.', dados_prioridade: 'Sintomas progressivos.' };
const FICHA = { ambiente: 'amb', asa: 'II', peso: '80 kg, 1,70 m, IMC 27,7', antitromb: 'não usa', alergias: 'nega' };
const POR_EXAME = {
  eda: FICHA, colonoscopia: Object.assign({ antecedentes: 'Sem antecedentes relevantes.' }, FICHA), eco: { ecg: 'Ritmo sinusal' }, ergometrico: { tempo_conduta: 'Dor há 3 meses, em investigação.' },
  holter: { ecg: 'Normal' }, mapa: { ecg: 'Normal' }, tc_cranio: { rx: 'Sem alterações' }, tc_abdome: { rx_abdome: 'Sem alterações' },
};
const pedido = (exame, extra) => {
  const x = extra || {};
  return E.montar(D, Object.assign({ exame, cid: ex(exame).cids[0][0] }, base, x, { campos: Object.assign({}, GERAIS, POR_EXAME[exame] || {}, x.campos || {}) }));
};

/* ---------- integridade do catálogo ---------- */
test('exames do catálogo, cada um com sistema, nome, CIDs, fontes e conferência', () => {
  assert.equal(D.exames.length, 11);
  assert.ok(!D.exames.some((e) => /^rm_/.test(e.id)), 'ressonâncias são restritas a especialistas e não entram');
  assert.deepEqual(D.exames.filter((e) => e.sistema === 'Tomografia').map((e) => e.id), ['tc_cranio', 'tc_torax', 'tc_abdome', 'tc_pelve']);
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

test('toda fonte tem nome, nota e referência curta; link https (ou fonte local sem link)', () => {
  for (const e of D.exames) for (const [k, f] of Object.entries(e.fontes)) {
    assert.ok(f.nome && f.nota && f.curta, `${e.id}/${k}`);
    if (f.tipo === 'local') assert.equal(f.link, null, `${e.id}/${k}`); else assert.match(f.link, /^https:\/\//, `${e.id}/${k}`);
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
  assert.match(r.texto, /Prioridade: P2 \(amarelo\)/);
  assert.match(r.texto, /sexo masculino, 58 anos/);
  assert.match(r.texto, /R13 - Disfagia/);
  assert.match(r.texto, /Justificativa clínica: Disfagia progressiva há 2 meses\./);
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

/* ---------- tomografias ---------- */
const avisoId = (r, id) => r.avisos.find((a) => a.id === id);

test('contraste: exige creatinina/eGFR; sem contraste os avisos de contraste não aparecem', () => {
  const sem = pedido('tc_abdome', { cid: 'R10.4', criterios: ['tc_a_massa', 'tca_c_cont'] });
  assert.ok(sem.faltas.some((f) => /creatinina|eGFR/i.test(f)));
  assert.match(sem.faltas.join(' '), /7 dias/);
  const com = pedido('tc_abdome', { cid: 'R19.0', criterios: ['tc_a_massa', 'tca_c_cont'], campos: { creatinina: '0,9 mg/dL em 02/11/2026' } });
  assert.equal(com.pronto, true);
  assert.match(com.texto, /Função renal: 0,9 mg\/dL em 02\/11\/2026\./);
  assert.match(com.texto, /Exame solicitado com contraste iodado\./);
  // renal sem contraste: nada a avisar
  assert.ok(!avisoId(pedido('tc_abdome', { cid: 'R19.0', criterios: ['tc_a_massa', 'tca_c_renal'] }), 'tca-renal'));
});

test('contraste: doença renal, metformina, reação prévia e gestação geram os avisos das fontes', () => {
  const r = pedido('tc_abdome', { cid: 'R19.0', criterios: ['tc_a_massa', 'tca_c_cont', 'tca_c_renal', 'tca_c_met', 'tca_c_reac', 'tca_c_gest'], campos: { creatinina: '2,4 em 10/11' } });
  assert.match(avisoId(r, 'tca-renal').texto, /ACR-NKF 2020/);
  assert.match(avisoId(r, 'tca-metformina').texto, /ESUR 2018/);
  assert.match(avisoId(r, 'tca-reacao').texto, /ESUR 2025/);
  assert.match(avisoId(r, 'tca-gestacao').texto, /ACOG 2017/);
  assert.equal(avisoId(r, 'tca-reacao').nivel, 'atencao');
  assert.equal(r.pronto, true, 'avisos de contraste não bloqueiam');
});

test('crânio: traumatismo craniano agudo avisa que é pronto-socorro e exige o relato do trauma', () => {
  const sem = pedido('tc_cranio', { cid: 'S06.9', criterios: ['tc_tce_alto'] });
  assert.ok(sem.faltas.some((f) => /traumatismo/i.test(f)));
  const ok = pedido('tc_cranio', { cid: 'S06.9', criterios: ['tc_tce_alto'], campos: { trauma: 'Queda de 2 m há 40 min, Glasgow 14, 2 vômitos' } });
  assert.equal(ok.pronto, true);
  assert.match(avisoId(ok, 'tcc-tce-urgencia').texto, /1\.3\.19/);
  assert.match(ok.texto, /Referência: NICE NG232 \(traumatismo craniano\)\./);
});

test('crânio: cefaleia com alarme informa que a NICE manda avaliar, não pedir; cefaleia súbita é urgência', () => {
  const r = pedido('tc_cranio', { cid: 'R51', criterios: ['tc_cef_deficit'], campos: { neuro: 'Hemiparesia direita há 2 semanas' } });
  assert.equal(r.pronto, true);
  assert.match(avisoId(r, 'tcc-cefaleia-nice').texto, /CG150/);
  assert.ok(avisoId(pedido('tc_cranio', { cid: 'R51', criterios: ['tc_cef_subita'] }), 'tcc-urgencia'));
});

test('crânio: suspeita de tumor lembra que a NICE prefere ressonância; demência exige avaliação cognitiva', () => {
  const t = pedido('tc_cranio', { cid: 'R29.8', criterios: ['tc_tumor'], campos: { neuro: 'Disartria e hemiparesia progressivas há 6 semanas' } });
  assert.ok(avisoId(t, 'tcc-tumor-rm'));
  const d = pedido('tc_cranio', { cid: 'F03', criterios: ['tc_cogn'] });
  assert.ok(d.faltas.some((f) => /cognitiva/i.test(f)));
});

test('tórax: rastreamento de câncer de pulmão (50 anos ou mais, > 20 maços-ano, parou há até 15 anos; até 80 anos)', () => {
  const c = crit(ex('tc_torax')).find((x) => x.id === 'tc_t_rastreio');
  for (const t of [/50 anos/, /20 maços-ano/, /15 anos/]) assert.match(c.rotulo, t);
  assert.equal(c.intervaloMin, 1, 'rastreamento anual');
  const tab = { tabagismo: '30 maços-ano, parou há 5 anos' };
  assert.ok(pedido('tc_torax', { idade: 49, cid: 'Z12.2', criterios: ['tc_t_rastreio'], campos: tab }).avisos.some((a) => a.id === 'tct-rast-idade-menor'));
  assert.ok(pedido('tc_torax', { idade: 81, cid: 'Z12.2', criterios: ['tc_t_rastreio'], campos: tab }).avisos.some((a) => a.id === 'tct-rast-idade-maior'));
  const ok = pedido('tc_torax', { idade: 62, cid: 'Z12.2', criterios: ['tc_t_rastreio'], campos: tab });
  assert.equal(ok.pronto, true);
  assert.ok(!ok.avisos.some((a) => /idade/.test(a.id)));
  assert.match(ok.texto, /Tabagismo: 30 maços-ano, parou há 5 anos\./);
  assert.equal(pedido('tc_torax', { idade: 62, cid: 'Z12.2', criterios: ['tc_t_rastreio'] }).pronto, false, 'exige o tabagismo');
});

test('tórax: sintoma muito sugestivo ou câncer de pulmão prévio impede o rastreamento (bloqueia)', () => {
  for (const ex_ of ['tc_t_ex_sint', 'tc_t_ex_ca', 'tc_t_ex_cond']) {
    const r = pedido('tc_torax', { idade: 62, cid: 'Z12.2', criterios: ['tc_t_rastreio', ex_], campos: { tabagismo: '30 maços-ano' } });
    assert.equal(r.bloqueado, true, ex_);
    assert.equal(r.texto, '');
  }
});

test('tórax: intervalo anual do rastreamento avisa se a última tomografia de baixa dose foi há menos de 1 ano', () => {
  const r = (anos) => pedido('tc_torax', { idade: 62, cid: 'Z12.2', criterios: ['tc_t_rastreio'], campos: { tabagismo: '30 maços-ano', anosDesde: anos } });
  assert.ok(r('0,5').avisos.some((a) => /^intervalo-/.test(a.id)));
  assert.ok(!r('1').avisos.some((a) => /^intervalo-/.test(a.id)));
});

test('tórax: embolia pulmonar exige Wells e radiografia, é urgência, e sugere V/Q se renal ou reação ao contraste', () => {
  const sem = pedido('tc_torax', { cid: 'I26.9', criterios: ['tc_t_ep'] });
  assert.ok(sem.faltas.some((f) => /Wells/.test(f)) && sem.faltas.some((f) => /radiografia/i.test(f)));
  const r = pedido('tc_torax', { cid: 'I26.9', criterios: ['tc_t_ep', 'tct_c_cont', 'tct_c_renal'], campos: { wells: '6 pontos', rx: 'Sem alterações', creatinina: '2,1' } });
  assert.equal(r.pronto, true);
  assert.ok(avisoId(r, 'tct-ep-urgencia'));
  assert.match(avisoId(r, 'tct-ep-vq').texto, /V\/Q/);
});

test('tórax: nódulo incidental não calcula intervalo (tabela de Fleischner não foi lida) e é marcado como não conferido', () => {
  const c = crit(ex('tc_torax')).find((x) => x.id === 'tc_t_nodulo');
  assert.equal(c.v, false);
  assert.equal(c.intervaloMin, undefined);
});

test('abdome: cólica renal pede tomografia sem contraste; gestante e criança, ultrassom', () => {
  const base_ = { cid: 'N23', criterios: ['tc_a_colica'] };
  assert.ok(!avisoId(pedido('tc_abdome', base_), 'tca-colica-sem'));
  assert.ok(avisoId(pedido('tc_abdome', { cid: 'N23', criterios: ['tc_a_colica', 'tca_c_cont'], campos: { creatinina: '1,0' } }), 'tca-colica-sem'));
  assert.ok(avisoId(pedido('tc_abdome', { cid: 'N23', criterios: ['tc_a_colica', 'tca_c_gest'] }), 'tca-colica-gest'));
  assert.ok(avisoId(pedido('tc_abdome', Object.assign({ idade: 12 }, base_)), 'tca-colica-crianca'));
  assert.ok(!avisoId(pedido('tc_abdome', base_), 'tca-colica-crianca'), 'adulto de 58 anos não recebe o aviso da criança');
});

test('abdome: apendicite lembra o ultrassom; pancreatite exige a evolução; câncer de pâncreas exige o peso', () => {
  assert.match(avisoId(pedido('tc_abdome', { cid: 'K35.8', criterios: ['tc_a_apend'] }), 'tca-apend-us').texto, /WSES 2020/);
  assert.ok(pedido('tc_abdome', { cid: 'K85.9', criterios: ['tc_a_pancreatite'] }).faltas.some((f) => /48 a 72/.test(f)));
  assert.ok(pedido('tc_abdome', { idade: 66, cid: 'R63.4', criterios: ['tc_a_pancreas'] }).faltas.some((f) => /perda de peso/i.test(f)));
  assert.ok(avisoId(pedido('tc_abdome', { cid: 'K57.3', criterios: ['tc_a_div'] }), 'tca-urgencia'));
});

test('pelve: dor aguda em mulher exige ultrassom e β-hCG; homem recebe aviso; sempre sugere abdome e pelve juntos', () => {
  const sem = pedido('tc_pelve', { sexo: 'F', idade: 30, cid: 'R10.2', criterios: ['tc_p_dor_aguda'] });
  assert.ok(sem.faltas.some((f) => /ultrassom/i.test(f)) && sem.faltas.some((f) => /β-hCG/.test(f)));
  const ok = pedido('tc_pelve', { sexo: 'F', idade: 30, cid: 'R10.2', criterios: ['tc_p_dor_aguda'], campos: { us: 'Sem alterações em 01/11', bhcg: 'Negativo em 01/11' } });
  assert.equal(ok.pronto, true);
  assert.ok(avisoId(ok, 'tcp-abdome-pelve'));
  assert.ok(avisoId(pedido('tc_pelve', { sexo: 'M', cid: 'R10.2', criterios: ['tc_p_dor_aguda'] }), 'tcp-sexo'));
});

test('toda tomografia tem o grupo de contraste e a exigência de creatinina', () => {
  for (const id of ['tc_cranio', 'tc_torax', 'tc_abdome', 'tc_pelve']) {
    const e = ex(id);
    assert.ok(e.grupos.some((g) => g.id === 'contraste' && g.soContexto), id);
    assert.ok(e.campos.some((c) => c.id === 'creatinina' && c.exigidoQuando), id);
    for (const f of ['acrnkf', 'esur', 'esur_hs', 'acog']) assert.ok(e.fontes[f], `${id}: fonte ${f}`);
  }
});

/* ---------- regulação de Barueri (protocolos, diretrizes e ficha enviados pelo usuário) ---------- */
test('protocolo de Barueri 2024: número de indicações de cada exame, conforme o PDF', () => {
  const esperado = { eda: 15, colonoscopia: 16, eco: 18, ergometrico: 14, holter: 11, mapa: 7, tc_cranio: 13, tc_torax: 15, tc_abdome: 10, tc_pelve: 4, psg: 10 };
  for (const [id, n] of Object.entries(esperado)) {
    const doProtocolo = crit(ex(id)).filter((c) => c.fonte === 'barueri' && /^p_/.test(c.grupo));
    assert.equal(doProtocolo.length, n, id);
    assert.ok(doProtocolo.every((c) => c.v === true));
  }
});

test('protocolo de Barueri 2024: profissionais solicitantes de cada exame, conforme o PDF', () => {
  const esperado = {
    eda: ['GASTRO', 'MAP', 'ORL', 'REUMA', 'SAD', 'VASCULAR'], // o protocolo de 2024 não lista o MAP; a regulação informou que o MAP pode pedir EDA
    colonoscopia: ['GASTRO', 'GERIATRA', 'MAP', 'PROCTO'],
    eco: ['CARDIO', 'HEMATO', 'MAP', 'NEURO', 'PNEUMO', 'REUMA', 'VASCULAR'],
    ergometrico: ['CARDIO', 'MAP'],
    holter: ['CARDIO', 'NEURO', 'SAD'],
    mapa: ['CARDIO', 'MAP', 'NEFRO', 'NEURO', 'VASCULAR'],
    tc_cranio: ['ENDOCRINO', 'GERIATRA', 'INFECTO', 'MAP_GIN', 'NEURO', 'ORTO'],
    tc_torax: ['CARDIO', 'DERMA', 'MAP', 'NEURO', 'ORTO', 'PNEUMO', 'REUMA'],
    tc_abdome: ['DERMA', 'ENDOCRINO', 'GASTRO', 'HEMATO', 'MAP', 'NEFRO', 'PROCTO', 'REUMA', 'URO'],
    tc_pelve: ['FISIATRA', 'GINECO', 'HEMATO', 'MAP', 'URO'],
    psg: ['CARDIO', 'DENTISTA', 'NEURO', 'ORL', 'PNEUMO', 'SAD'],
  };
  for (const [id, lista] of Object.entries(esperado)) assert.deepEqual([...ex(id).solicitantes].sort(), lista, id);
  for (const e of D.exames) for (const k of e.solicitantes) assert.ok(D.chavesRotulos[k], `${e.id}: ${k}`);
  for (const s of D.solicitantes) for (const k of s.chaves) assert.ok(D.chavesRotulos[k], s.v);
});

test('cada exame cita o protocolo de Barueri como fonte local, sem link', () => {
  for (const e of D.exames) {
    assert.equal(e.fontes.barueri.tipo, 'local', e.id);
    assert.equal(e.fontes.barueri.link, null, e.id);
  }
  assert.ok(ex('eda').fontes.ficha && ex('colonoscopia').fontes.ficha);
});

test('o MAP não consta como solicitante de Holter e polissonografia; consta em EDA (por informação da regulação), colonoscopia, eco, MAPA e tomografias', () => {
  const aviso = (exame, quem) => pedido(exame, { solicitante: quem, criterios: [crit(ex(exame)).find((c) => /^p_/.test(c.grupo)).id] }).avisos.find((a) => a.id === 'solicitante');
  for (const id of ['holter', 'psg']) {
    const a = aviso(id, 'map');
    assert.ok(a, id);
    assert.match(a.texto, /Barueri/);
    assert.match(a.texto, /não consta/);
    assert.match(a.texto, /\(2024\)/);
    assert.match(a.texto, /pode ter sido atualizado/);
  }
  assert.match(aviso('holter', 'map').texto, /Cardiologista/);
  for (const id of ['eda', 'colonoscopia', 'eco', 'mapa', 'ergometrico', 'tc_torax', 'tc_abdome', 'tc_pelve']) assert.ok(!aviso(id, 'map'), id);
  assert.ok(!aviso('eda', 'gastro'));
  assert.ok(ex('eda').solicitantesNota && /MAP pode solicitar/.test(ex('eda').solicitantesNota));
  assert.ok(!aviso('holter', 'cardio'));
  assert.ok(!aviso('eda', 'outro'), 'outro profissional não recebe aviso');
});

test('tomografia de crânio (sela túrcica): MAP clínico não consta; MAP ginecologista consta', () => {
  const crit1 = ['tcc_p_trauma'];
  assert.ok(pedido('tc_cranio', { solicitante: 'map', criterios: crit1 }).avisos.some((a) => a.id === 'solicitante'));
  assert.ok(!pedido('tc_cranio', { solicitante: 'map_gin', criterios: crit1 }).avisos.some((a) => a.id === 'solicitante'));
  assert.ok(!pedido('tc_cranio', { solicitante: 'neuro', criterios: crit1 }).avisos.some((a) => a.id === 'solicitante'));
  assert.match(ex('tc_cranio').notaProtocolo, /sela túrcica/);
});

test('profissional solicitante, prioridade, justificativa e campos gerais são obrigatórios', () => {
  const r = E.montar(D, { exame: 'eco', idade: 50, sexo: 'F', cid: 'R06.0', criterios: ['eco_p_dispneia'] });
  for (const t of [/solicitante/i, /prioridade/i, /justificativa clínica/i, /exame físico/i, /histórico terapêutico/i, /dados objetivos/i, /ECG/]) assert.ok(r.faltas.some((f) => t.test(f)), String(t));
  assert.equal(pedido('eco', { solicitante: '' , criterios: ['eco_p_dispneia'] }).pronto, false);
  assert.equal(pedido('eco', { quadro: '', criterios: ['eco_p_dispneia'] }).pronto, false);
  assert.equal(pedido('eco', { prioridade: 'P9', criterios: ['eco_p_dispneia'] }).pronto, false);
  assert.equal(pedido('eco', { criterios: ['eco_p_dispneia'] }).pronto, true);
});

test('prioridades de Barueri: P1, P2, P3 e PE; P1 e PE trazem lembrete; o texto traz a prioridade e o solicitante', () => {
  assert.deepEqual(Object.keys(D.prioridades), ['P1', 'P2', 'P3', 'PE']);
  assert.match(D.prioridades.P1, /vermelho/); assert.match(D.prioridades.P2, /amarelo/); assert.match(D.prioridades.P3, /verde/);
  const p1 = pedido('eco', { prioridade: 'P1', criterios: ['eco_p_sopro'] });
  assert.ok(p1.avisos.some((a) => a.id === 'prioridade' && /reclassificar/.test(a.texto)));
  assert.ok(pedido('eco', { prioridade: 'PE', criterios: ['eco_p_sopro'] }).avisos.some((a) => a.id === 'prioridade' && /CROSS/.test(a.texto)));
  assert.ok(!pedido('eco', { prioridade: 'P3', criterios: ['eco_p_sopro'] }).avisos.some((a) => a.id === 'prioridade'));
  const r = pedido('eco', { prioridade: 'P2', solicitante: 'cardio', criterios: ['eco_p_sopro'] });
  assert.match(r.texto, /Prioridade: P2 \(amarelo\)/);
  assert.match(r.texto, /Profissional solicitante: Cardiologista\./);
  assert.match(r.texto, /Exame físico: Sem alterações relevantes\./);
  assert.match(r.texto, /Dados objetivos que fundamentam a prioridade: Sintomas progressivos\./);
  assert.match(r.texto, /Referência: Protocolo de Barueri 2024\./);
});

test('indicação só de diretriz, sem nenhuma do protocolo, avisa risco de devolução; com a do protocolo, não', () => {
  const so = pedido('eco', { criterios: ['eco_fa'] });
  assert.ok(so.avisos.some((a) => a.id === 'eco-sem-protocolo' && /cancelado/.test(a.texto)));
  assert.ok(!pedido('eco', { criterios: ['eco_fa', 'eco_p_sopro'] }).avisos.some((a) => a.id === 'eco-sem-protocolo'));
  // sem critério nenhum, só a pendência de marcar
  assert.ok(!pedido('eco', { criterios: [] }).avisos.some((a) => a.id === 'eco-sem-protocolo'));
});

test('tomografia de pelve: dor pélvica não é indicação do protocolo; ultrassom de pelve é obrigatório', () => {
  const dor = pedido('tc_pelve', { sexo: 'F', idade: 30, cid: 'R10.2', criterios: ['tc_p_dor_aguda'], campos: { us: 'Sem alterações', bhcg: 'Negativo' } });
  assert.ok(dor.avisos.some((a) => a.id === 'tcp-sem-protocolo' && /não lista dor pélvica/.test(a.texto)));
  const tumor = pedido('tc_pelve', { cid: 'R19.0', criterios: ['tcp_p_tumor'] });
  assert.ok(tumor.faltas.some((f) => /ultrassom de pelve/i.test(f)));
  assert.equal(pedido('tc_pelve', { cid: 'R19.0', criterios: ['tcp_p_tumor'], campos: { us: 'Massa anexial de 6 cm' } }).pronto, true);
});

test('radiografia: tórax (PA e perfil) e abdome exigidas; o rastreamento de pulmão não exige radiografia', () => {
  assert.ok(pedido('tc_torax', { cid: 'R91', criterios: ['tct_p_nodulo'] }).faltas.some((f) => /radiografia de tórax PA e perfil/.test(f)));
  assert.equal(pedido('tc_torax', { cid: 'R91', criterios: ['tct_p_nodulo'], campos: { rx: 'Nódulo de 8 mm em LSD, 10/11/2026' } }).pronto, true);
  assert.equal(pedido('tc_torax', { idade: 62, cid: 'Z12.2', criterios: ['tc_t_rastreio'], campos: { tabagismo: '30 maços-ano, parou há 5 anos' } }).pronto, true);
  assert.ok(pedido('tc_torax', { idade: 62, cid: 'Z12.2', criterios: ['tc_t_rastreio'], campos: { tabagismo: '30 maços-ano' } }).avisos.some((a) => a.id === 'tct-rast-sus' && /não consta no protocolo de Barueri/.test(a.texto)));
  const sem = E.montar(D, Object.assign({ exame: 'tc_abdome', cid: 'R19.0', criterios: ['tca_p_tumor'], campos: GERAIS }, base));
  assert.ok(sem.faltas.some((f) => /radiografia simples de abdome/.test(f)));
  assert.equal(pedido('tc_cranio', { cid: 'R51', criterios: ['tcc_p_cefaleia'], campos: { rx: '' } }).pronto, false, 'crânio exige radiografia simples com laudo');
});

test('MAPA: situações em que o protocolo não recomenda bloqueiam o texto', () => {
  for (const c of ['m_c_fa', 'm_c_mov', 'm_c_manguito']) {
    const r = pedido('mapa', { cid: 'I10', criterios: ['m_p_limitrofe', c], campos: { pa: '138/88 em 2 consultas' } });
    assert.equal(r.bloqueado, true, c);
    assert.match(r.avisos.find((a) => a.nivel === 'alto').texto, /MRPA/);
  }
  assert.equal(pedido('mapa', { cid: 'I10', criterios: ['m_p_limitrofe'], campos: { pa: '138/88 em 2 consultas' } }).pronto, true);
  // as indicações só de MAPA (hipotensão, disautonomia) não recebem o lembrete de que a MRPA serve
  assert.ok(!pedido('mapa', { cid: 'I10', criterios: ['m_p_hipotensao'], campos: { pa: '90/60' } }).avisos.some((a) => a.id === 'm-mrpa'));
});

test('ergométrico: o protocolo exige anamnese, tempo de evolução e conduta; SVE conta como ECG limitante', () => {
  assert.ok(pedido('ergometrico', { cid: 'I25.9', criterios: ['te_p_dac'], campos: { ecg: 'Normal', tempo_conduta: '' } }).faltas.some((f) => /tempo de evolução/.test(f)));
  const r = pedido('ergometrico', { cid: 'I25.9', criterios: ['te_p_dac', 'te_c_ecg'], campos: { ecg: 'SVE com sobrecarga' } });
  assert.equal(r.bloqueado, true, 'DAC + ECG limitante bloqueia');
  assert.match(crit(ex('ergometrico')).find((c) => c.id === 'te_c_ecg').rotulo, /SVE/);
});

test('Holter: o ECG é pré-requisito do protocolo', () => {
  assert.ok(pedido('holter', { solicitante: 'cardio', cid: 'R00.2', criterios: ['h_p_ritmo'], campos: { ecg: '' } }).faltas.some((f) => /ECG/.test(f)));
  assert.equal(pedido('holter', { solicitante: 'cardio', cid: 'R00.2', criterios: ['h_p_ritmo'] }).pronto, true);
});

/* ---------- ficha de endoscopia e colonoscopia (ASA, medicação e preparo) ---------- */
test('EDA e colonoscopia exigem ambiente, ASA, peso, anticoagulantes e alergias; o texto traz o ASA', () => {
  for (const id of ['eda', 'colonoscopia']) {
    const crit_ = id === 'eda' ? ['eda_p_disp60'] : ['col_p_hdb'];
    const sem = pedido(id, { solicitante: 'gastro', criterios: crit_, campos: { asa: '', ambiente: '', peso: '', antitromb: '', alergias: '' } });
    for (const t of [/ambulatorial ou em ambiente hospitalar/, /ASA/, /peso, altura e IMC/, /anticoagulante ou antiagregante/, /alergias/]) assert.ok(sem.faltas.some((f) => t.test(f)), `${id}: ${t}`);
    const ok = pedido(id, { idade: 62, solicitante: 'gastro', criterios: crit_ });
    assert.equal(ok.pronto, true, id);
    assert.match(ok.texto, /Ambiente do exame: Ambulatorial\./);
    assert.match(ok.texto, /Classificação ASA estimada \(estratificação, sem finalidade anestésica\): ASA II: doença sistêmica leve e controlada\./);
    assert.match(ok.texto, /Anticoagulantes ou antiagregantes: não usa\./);
  }
});

test('ficha: ASA III pede avaliação pré-anestésica, ASA IV vai ao hospital, e hospitalar com ASA I ou II pede justificativa', () => {
  const r = (campos) => pedido('eda', { solicitante: 'gastro', criterios: ['eda_p_disp60'], campos }).avisos;
  assert.ok(r({ asa: 'III' }).some((a) => a.id === 'eda-asa3' && a.nivel === 'info' && /pré-anestésica/.test(a.texto)));
  assert.ok(r({ asa: 'IV' }).some((a) => a.id === 'eda-asa4' && a.nivel === 'atencao' && /hospitalar/.test(a.texto)));
  assert.ok(r({ asa: 'II', ambiente: 'hosp' }).some((a) => a.id === 'eda-asa-amb'));
  assert.ok(!r({ asa: 'II', ambiente: 'amb' }).some((a) => /^eda-asa/.test(a.id)));
  assert.ok(!r({ asa: 'IV', ambiente: 'hosp' }).some((a) => a.id === 'eda-asa-amb'));
});

test('ficha: avaliação funcional e orientação do paciente entram no texto; orientações de preparo aparecem', () => {
  const r = pedido('colonoscopia', { solicitante: 'map', criterios: ['col_p_hdb', 'col_ff_apneia', 'col_ff_claustro', 'col_orientado'] });
  assert.match(r.texto, /Contexto e cuidados:/);
  assert.match(r.texto, /- Apneia do sono, refluxo ou obesidade grave\./);
  assert.match(r.texto, /- Paciente orientado quanto ao preparo, ao risco-benefício e às orientações gerais do exame\./);
  assert.ok(ex('eda').orientacoes.some((t) => /8 horas/.test(t)) && ex('eda').orientacoes.some((t) => /21 dias/.test(t)));
  assert.ok(ex('colonoscopia').orientacoes.some((t) => /preparo intestinal/.test(t)) && ex('colonoscopia').orientacoes.some((t) => /ferro/.test(t)));
  assert.equal(ex('mapa').orientacoes, undefined);
});

test('EDA: exames da anemia exigidos na investigação de anemia; IBP no refluxo (2 meses) e na dispepsia (8 semanas)', () => {
  const an = pedido('eda', { solicitante: 'gastro', cid: 'D50.9', criterios: ['eda_p_anemia'] });
  assert.ok(an.faltas.some((f) => /hemoglobina, VCM, ferro e ferritina e PSO/.test(f)));
  assert.equal(pedido('eda', { solicitante: 'gastro', cid: 'D50.9', criterios: ['eda_p_anemia'], campos: { anemia: 'Hb 9,1; VCM 74; ferritina 8 (10/11/2026)' } }).pronto, true);
  assert.ok(pedido('eda', { solicitante: 'gastro', cid: 'K21.9', criterios: ['eda_p_drge'] }).faltas.some((f) => /2 meses em dose plena/.test(f)));
  assert.ok(pedido('eda', { solicitante: 'gastro', cid: 'K30', criterios: ['eda_p_disp_refrat'], campos: { ibp: 'Omeprazol 40 mg por 8 semanas' } }).faltas.some((f) => /H\. pylori/.test(f)));
});

test('colonoscopia: o protocolo aceita rastreio acima de 50 anos a cada 5 anos; o FIT vira lembrete, não bloqueio', () => {
  const r = pedido('colonoscopia', { idade: 62, solicitante: 'map', cid: 'Z12.1', criterios: ['col_p_semqueixa'], campos: { anosDesde: '3' } });
  assert.ok(r.avisos.some((a) => /^intervalo-col_p_semqueixa/.test(a.id)), 'exame há 3 anos, intervalo de 5 do protocolo');
  assert.ok(!pedido('colonoscopia', { idade: 62, solicitante: 'map', cid: 'Z12.1', criterios: ['col_p_semqueixa'], campos: { anosDesde: '6' } }).avisos.some((a) => /^intervalo-/.test(a.id)));
  assert.ok(pedido('colonoscopia', { idade: 45, solicitante: 'map', cid: 'Z12.1', criterios: ['col_p_prev_50'] }).avisos.some((a) => a.id === 'col-prev50-idade'));
  assert.ok(pedido('colonoscopia', { idade: 38, solicitante: 'map', cid: 'Z12.1', criterios: ['col_p_prev_fam'] }).avisos.some((a) => a.id === 'col-prevfam-idade'));
  const fit = pedido('colonoscopia', { idade: 62, solicitante: 'map', cid: 'Z12.1', criterios: ['col_rastreio_direto'] }).avisos.find((a) => a.id === 'col-sus-fit');
  assert.equal(fit.nivel, 'info');
  assert.match(fit.texto, /Barueri/);
});
