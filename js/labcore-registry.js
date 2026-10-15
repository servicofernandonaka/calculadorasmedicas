/* LabCore APS — GUIDELINES_REGISTRY: único lugar com pontos de corte, constantes de fórmulas, versão da diretriz e data de auditoria.
   Nada clínico fica fora deste arquivo (o motor e a interface só leem daqui, já com os ajustes locais aplicados).
   status de cada parâmetro:
     'diretriz'   = valor da diretriz/publicação citada em `ref` (carga inicial, vinda da especificação do Fernando; ainda não revalidada online).
     'a_verificar'= valor usado na prática, mas sem fonte primária conferida: confirmar antes de confiar.
     'lab_local'  = referência que depende do kit do laboratório: ajuste no editor de cutoffs.
   lastAuditedISO = última conferência (carga inicial = 2026-10-15; a primeira varredura online ainda não foi feita). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LabCoreRegistry = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const P = (label, value, unit, min, max, status) => ({ label, value, unit, min, max, status: status || 'diretriz' });
  const BASE = '2026-10-15';

  const SOURCES = [
    { id: 'sbpc', sigla: 'SBPC/ML', nome: 'Sociedade Brasileira de Patologia Clínica e Medicina Laboratorial', escopo: 'Medicina laboratorial no Brasil' },
    { id: 'clsi', sigla: 'CLSI', nome: 'Clinical and Laboratory Standards Institute', escopo: 'Padrões pré-analíticos e limites críticos' },
    { id: 'ifcc', sigla: 'IFCC & EFLM', nome: 'International / European Federation of Clinical Chemistry and Laboratory Medicine', escopo: 'Química clínica e medicina laboratorial' },
    { id: 'adlm', sigla: 'ADLM (ex-AACC)', nome: 'Association for Diagnostics & Laboratory Medicine', escopo: 'Diagnósticos e medicina laboratorial' },
    { id: 'kdigo', sigla: 'KDIGO', nome: 'Kidney Disease: Improving Global Outcomes', escopo: 'Doença renal crônica e glomerulopatias' },
    { id: 'sbd', sigla: 'SBD / ADA', nome: 'Sociedade Brasileira de Diabetes / American Diabetes Association', escopo: 'Diabetes' },
    { id: 'sbc', sigla: 'SBC / ESC', nome: 'Sociedade Brasileira de Cardiologia / European Society of Cardiology', escopo: 'Dislipidemias e prevenção cardiovascular' },
    { id: 'easl', sigla: 'EASL / AASLD / SBH', nome: 'European and American Associations for the Study of the Liver / Sociedade Brasileira de Hepatologia', escopo: 'Doenças hepáticas, MASLD e MASH' },
    { id: 'sbem', sigla: 'SBEM / ATA', nome: 'Sociedade Brasileira de Endocrinologia e Metabologia / American Thyroid Association', escopo: 'Endocrinologia e tireoide' },
    { id: 'icap', sigla: 'ICAP / SBR', nome: 'International Consensus on ANA Patterns / Sociedade Brasileira de Reumatologia', escopo: 'Autoanticorpos em células HEp-2 (FAN) e reumatologia' },
    { id: 'hemato', sigla: 'BSH / ASH / ABHH', nome: 'British / American Society of Haematology / Associação Brasileira de Hematologia', escopo: 'Hematologia e anemias' },
    { id: 'pcdt', sigla: 'PCDT-MS / CONITEC', nome: 'Protocolos Clínicos do Ministério da Saúde e CONITEC', escopo: 'ISTs, pré-natal e atenção básica' },
  ];

  const GUIDELINES = {
    ckdepi: {
      selo: 'CKD-EPI 2021', society: 'NKF-ASN / KDIGO', title: 'CKD-EPI 2021 sem raça (creatinina)', version: '2021', year: 2021, sources: ['kdigo'], lastAuditedISO: BASE,
      ref: 'Inker LA et al. N Engl J Med 2021;385:1737-49 (equação CKD-EPI 2021 de creatinina, sem raça).',
      params: {
        'const': P('Constante da equação', 142, '', 100, 200),
        'age': P('Base do fator idade (por ano)', 0.9938, '', 0.9, 1, 'diretriz'),
        'fem.factor': P('Fator mulher', 1.012, '', 1, 1.1),
        'fem.kappa': P('Mulher: κ (mg/dL)', 0.7, 'mg/dL', 0.5, 1),
        'fem.alpha': P('Mulher: expoente abaixo de κ', -0.241, '', -1, 0),
        'male.kappa': P('Homem: κ (mg/dL)', 0.9, 'mg/dL', 0.5, 1.2),
        'male.alpha': P('Homem: expoente abaixo de κ', -0.302, '', -1, 0),
        'exp.high': P('Expoente acima de κ (ambos os sexos)', -1.2, '', -2, 0),
      },
    },
    kdigo: {
      selo: 'KDIGO 2024', society: 'KDIGO', title: 'KDIGO 2024 Clinical Practice Guideline for CKD', version: '2024', year: 2024, sources: ['kdigo'], lastAuditedISO: BASE,
      ref: 'KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of CKD. Kidney Int 2024;105(4S):S117-S314.',
      params: {
        'gfr.g1': P('G1: TFGe ≥', 90, 'mL/min/1,73 m²', 60, 120),
        'gfr.g2': P('G2: TFGe ≥', 60, 'mL/min/1,73 m²', 45, 90),
        'gfr.g3a': P('G3a: TFGe ≥', 45, 'mL/min/1,73 m²', 30, 60),
        'gfr.g3b': P('G3b: TFGe ≥', 30, 'mL/min/1,73 m²', 15, 45),
        'gfr.g4': P('G4: TFGe ≥ (abaixo disso, G5)', 15, 'mL/min/1,73 m²', 5, 30),
        'alb.a2': P('A2: RAC ≥', 30, 'mg/g', 10, 60),
        'alb.a3': P('A3: RAC >', 300, 'mg/g', 100, 600),
        'sglt2.egfrMin': P('iSGLT2: TFGe mínima para iniciar', 20, 'mL/min/1,73 m²', 10, 45),
        'sglt2.racMin': P('iSGLT2 sem diabetes: RAC ≥', 200, 'mg/g', 100, 400),
        'neph.egfr': P('Nefrologia: TFGe <', 30, 'mL/min/1,73 m²', 15, 45),
        'neph.rac': P('Nefrologia: RAC ≥', 300, 'mg/g', 100, 600),
      },
    },
    fib4: {
      selo: 'EASL/AASLD/SBH MASLD', society: 'EASL / AASLD / SBH', title: 'FIB-4 em MASLD', version: 'MASLD 2023-2024', year: 2024, sources: ['easl'], lastAuditedISO: BASE,
      ref: 'AASLD Practice Guidance on MASLD (Rinella ME et al., Hepatology 2023) e EASL-EASD-EASO CPG MASLD (J Hepatol 2024). Pontos de corte por faixa etária conforme a especificação; revalidar na primeira varredura.',
      params: {
        'young.maxAge': P('Inconclusivo se idade <', 35, 'anos', 18, 50),
        'old.minAge': P('Faixa idosa a partir de', 65, 'anos', 50, 80),
        'mid.low': P('35-64 anos: baixo risco se <', 1.3, '', 0.5, 2),
        'mid.high': P('35-64 anos: alto risco se >', 2.67, '', 2, 4),
        'old.low': P('≥65 anos: baixo risco se <', 2.0, '', 1, 3),
        'old.high': P('≥65 anos: alto risco se >', 2.67, '', 2, 4),
      },
    },
    lipid: {
      selo: 'SBC / EFLM / Sampson', society: 'SBC / EFLM', title: 'Painel lipídico: Friedewald e Sampson (NIH)', version: 'Sampson 2020', year: 2020, sources: ['sbc', 'ifcc'], lastAuditedISO: BASE,
      ref: 'Friedewald WT et al. Clin Chem 1972;18:499-502. Sampson M et al. JAMA Cardiol 2020;5(5):540-8 (equação NIH, validada até TG 800 mg/dL).',
      params: {
        'fw.divisor': P('Friedewald: divisor do TG', 5, '', 4, 6),
        'fw.maxTg': P('Friedewald válido até TG (mg/dL)', 400, 'mg/dL', 200, 500),
        'sampson.maxTg': P('Sampson válido até TG (mg/dL)', 800, 'mg/dL', 400, 1000),
        'sampson.a': P('Sampson: divisor do CT', 0.948, '', 0.9, 1),
        'sampson.b': P('Sampson: divisor do HDL', 0.971, '', 0.9, 1),
        'sampson.c': P('Sampson: divisor do TG (1º termo)', 8.56, '', 5, 12),
        'sampson.d': P('Sampson: divisor de TG×não-HDL', 2140, '', 1500, 3000),
        'sampson.e': P('Sampson: divisor de TG²', 16100, '', 10000, 25000),
        'sampson.f': P('Sampson: constante subtraída', 9.44, '', 5, 15),
        'tg.pancreatitis': P('Alerta de pancreatite se TG >', 800, 'mg/dL', 400, 1500, 'a_verificar'),
      },
    },
    hemato: {
      selo: 'Mentzer / hematimetria', society: 'BSH / ASH / ABHH', title: 'Índice de Mentzer e saturação de transferrina', version: 'Mentzer 1973', year: 1973, sources: ['hemato'], lastAuditedISO: BASE,
      ref: 'Mentzer WC. Lancet 1973;1:882 (VCM/eritrócitos). Pontos de corte de microcitose e de saturação de transferrina baixos ainda sem fonte primária conferida.',
      params: {
        'mentzer.cut': P('Mentzer: acima = ferropriva; abaixo = traço talassêmico', 13, '', 8, 20),
        'micro.vcm': P('Microcitose se VCM <', 80, 'fL', 70, 90, 'a_verificar'),
        'tsat.low': P('Saturação de transferrina baixa se <', 20, '%', 10, 30, 'a_verificar'),
      },
    },
    eletrolitos: {
      selo: 'SBPC/ML / IFCC', society: 'SBPC/ML / IFCC', title: 'Fórmulas de correção e índices metabólicos', version: '2026-10', year: 2026, sources: ['sbpc', 'ifcc'], lastAuditedISO: BASE,
      ref: 'Na corrigido (Katz, N Engl J Med 1973), Ca corrigido pela albumina (Payne, BMJ 1973), HOMA-IR (Matthews, Diabetologia 1985), ânion gap sérico. Constantes conforme a especificação.',
      params: {
        'katz.factor': P('Na corrigido: mEq/L por mg/dL de glicose', 0.016, '', 0.005, 0.03),
        'katz.glucoseRef': P('Na corrigido: glicemia de referência', 100, 'mg/dL', 80, 120),
        'ca.factor': P('Ca corrigido: fator', 0.8, '', 0.5, 1.2),
        'ca.albRef': P('Ca corrigido: albumina de referência', 4.0, 'g/dL', 3.5, 4.5),
        'homa.divisor': P('HOMA-IR: divisor (glicemia em mg/dL)', 405, '', 300, 500),
      },
    },
    prean: {
      selo: 'CLSI / SBPC/ML pré-analítico', society: 'CLSI / SBPC/ML', title: 'Interferentes pré-analíticos (hemólise)', version: '2026-10', year: 2026, sources: ['clsi', 'sbpc'], lastAuditedISO: BASE,
      ref: 'Os limites superiores abaixo dependem do kit do laboratório: use o editor de cutoffs. K+ >6,0 mEq/L como gatilho de ECG conforme a especificação.',
      params: {
        'k.ecg': P('K+ que exige ECG/recoleta urgente >', 6.0, 'mEq/L', 5, 8),
        'k.uln': P('K+: limite superior de referência', 5.0, 'mEq/L', 4.5, 6, 'lab_local'),
        'ast.uln': P('AST (TGO): limite superior de referência', 40, 'U/L', 20, 60, 'lab_local'),
        'ldh.uln': P('LDH: limite superior de referência', 250, 'U/L', 150, 400, 'lab_local'),
        'folato.uln': P('Folato sérico: limite superior de referência', 20, 'ng/mL', 10, 40, 'lab_local'),
      },
    },
  };

  const GUIDELINES_REGISTRY = {
    schema: 'labcore-registry/1',
    version: '1.0.0',
    lastAuditedISO: BASE,
    ttlDays: 30,
    sources: SOURCES.map((s) => Object.assign({ lastAuditedISO: BASE }, s)),
    guidelines: GUIDELINES,
  };
  return { GUIDELINES_REGISTRY };
});
