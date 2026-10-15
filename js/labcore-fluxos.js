/* LabCore APS — Módulo 2: fluxogramas sindrômicos como dados (sem DOM).
   Cada fluxo é um grafo de nós: 'choice' (pergunta com opções), 'form' (campos + route() que decide o próximo nó) e 'result'.
   Todos os pontos de corte vêm do GUIDELINES_REGISTRY (já com ajustes locais aplicados); aqui só há lógica.
   Apoio à decisão: nenhum resultado é diagnóstico. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./labcore-engine.js'));
  else root.LabCoreFluxos = factory(root.LabCore);
})(typeof self !== 'undefined' ? self : this, function (LC) {
  'use strict';
  const fmt = LC.fmt;
  const pv = (reg, g, k) => reg.guidelines[g].params[k].value;
  const num = (id, label, unit, req, hint) => ({ id, label, unit, type: 'number', req: req !== false, hint });
  const sel = (id, label, options, req) => ({ id, label, type: 'select', options, req: req !== false });
  const chk = (id, label) => ({ id, label, type: 'check' });
  const RNR = [['R', 'Reagente'], ['NR', 'Não reagente']];
  const RNRND = [['R', 'Reagente'], ['NR', 'Não reagente'], ['ND', 'Não feito / não disponível']];
  const R = (level, title, texts, recs, extra) => ({ t: 'result', level, title, texts: texts || [], recs: recs || [], extra });
  const BIOTINA = (v) => (v.biotina ? ['Uso de biotina informado: TSH e T4L por imunoensaio podem estar falseados (TSH falsamente baixo e T4L falsamente alto são o padrão clássico). Se o resultado destoa da clínica, repetir após suspender a biotina pelo prazo orientado pelo laboratório.'] : []);
  const tshTxt = (reg) => `${fmt(pv(reg, 'tireoide', 'sch.tshTreat'), 0)} mUI/L`;

  /* ---------- 1) Eixo tireoidiano ---------- */
  const tireoide = {
    id: 'tireoide', titulo: 'Eixo tireoidiano', resumo: 'TSH e T4L (adulto), subclínico, gestação, interferência por biotina.', guideline: ['tireoide'], start: 'n0',
    nodes: {
      n0: { t: 'choice', q: 'A paciente está gestante?', opts: [{ v: 'nao', label: 'Não (adulto)', next: 'adulto' }, { v: 'sim', label: 'Sim', next: 'gest' }] },
      adulto: {
        t: 'form', q: 'Resultados e faixas de referência do laudo', fields: [
          num('tsh', 'TSH', 'mUI/L'), num('tshLo', 'TSH: limite inferior do laudo', 'mUI/L'), num('tshHi', 'TSH: limite superior do laudo', 'mUI/L'),
          num('t4l', 'T4 livre', 'ng/dL'), num('t4lLo', 'T4L: limite inferior do laudo', 'ng/dL'), num('t4lHi', 'T4L: limite superior do laudo', 'ng/dL'),
          num('idade', 'Idade', 'anos'), chk('sintomas', 'Sintomas sugestivos de hipotireoidismo'), chk('biotina', 'Uso de biotina / polivitamínico'),
        ],
        route(v, reg) {
          if (!(v.tshLo < v.tshHi) || !(v.t4lLo < v.t4lHi)) return { error: 'Informe os limites de referência do laudo (inferior menor que superior).' };
          const hiT = v.tsh > v.tshHi, loT = v.tsh < v.tshLo, hiF = v.t4l > v.t4lHi, loF = v.t4l < v.t4lLo;
          if (hiT) return { next: loF ? 'r_hipo' : hiF ? 'r_discord' : v.tsh >= pv(reg, 'tireoide', 'sch.tshTreat') ? 'r_sch_alto' : 'r_sch_leve' };
          if (loT) return { next: hiF ? 'r_hiper' : loF ? 'r_baixos' : 'r_hiper_sub' };
          return { next: loF ? 'r_central' : hiF ? 'r_t4_alto' : 'r_normal' };
        },
      },
      r_hipo: R('high', 'Padrão de hipotireoidismo primário', ['TSH acima e T4 livre abaixo da faixa do laudo.'], ['Confirmar se a coleta não foi feita em fase de doença aguda ou uso de medicamentos que alterem o eixo.', 'Dosar anti-TPO para etiologia (tireoidite de Hashimoto).', 'Iniciar levotiroxina conforme o quadro clínico e acompanhar TSH em 6-8 semanas após ajuste.'], (v) => BIOTINA(v)),
      r_sch_alto: R('mod', 'Hipotireoidismo subclínico com TSH alto', (reg, v) => [`TSH ≥ ${tshTxt(reg)} com T4L normal.`, v.idade < pv(reg, 'tireoide', 'sch.ageSoft') ? `Abaixo de ~${pv(reg, 'tireoide', 'sch.ageSoft')} anos, a ETA 2013 recomenda tratar mesmo sem sintomas, depois de confirmar o resultado.` : `Com ${pv(reg, 'tireoide', 'sch.ageSoft')} anos ou mais o limite etário é flexível: individualizar, considerando tratar se houver sintomas claros ou risco vascular alto.`], ['Confirmar com nova dosagem de TSH, T4L e anti-TPO em 2 a 3 meses (a menos que haja indicação clínica de tratar antes).', 'Excluir causas transitórias: recuperação de tireoidite, doença não tireoidiana, contraste iodado, medicamentos.'], (v) => BIOTINA(v)),
      r_sch_leve: R('mod', 'Hipotireoidismo subclínico leve', (reg, v) => [`TSH elevado, mas abaixo de ${tshTxt(reg)}, com T4L normal.`, v.idade >= pv(reg, 'tireoide', 'sch.veryOld') ? 'Em idosos muito idosos com TSH ≤10, a ETA 2013 sugere conduta expectante, em geral sem hormônio.' : v.sintomas && v.idade < pv(reg, 'tireoide', 'sch.ageSoft') ? 'Há sintomas e a idade é menor que a de referência: considerar uma prova terapêutica de levotiroxina.' : 'Sem sintomas: em geral observar e repetir.'], ['Repetir TSH, T4L e anti-TPO em 2 a 3 meses.', 'Se fizer prova terapêutica: reavaliar 3 a 4 meses depois de TSH normalizado e suspender se não houver melhora dos sintomas.'], (v) => BIOTINA(v)),
      r_discord: R('mod', 'TSH e T4L ambos altos: padrão discordante', ['Esse padrão é incomum.'], ['Excluir interferência (biotina, anticorpos heterófilos), levotiroxina tomada pouco antes da coleta e fase de recuperação de doença.', 'Se persistir, avaliar com endocrinologia (resistência ao hormônio tireoidiano, TSH-oma).'], (v) => BIOTINA(v)),
      r_hiper: R('high', 'Padrão de hipertireoidismo', ['TSH abaixo e T4 livre acima da faixa do laudo.'], ['Dosar T3 livre e TRAb; considerar ultrassonografia e cintilografia para a etiologia (Graves, nódulo tóxico, tireoidite).', 'Avaliar sintomas e risco cardiovascular e encaminhar à Endocrinologia.'], (v) => BIOTINA(v)),
      r_hiper_sub: R('mod', 'TSH suprimido com T4L normal', ['Hipertireoidismo subclínico possível.'], ['Repetir TSH, T4L e T3L em algumas semanas e investigar causas (nódulo, Graves, excesso de levotiroxina, doença não tireoidiana, glicocorticoide).', 'Avaliar risco cardiovascular e ósseo conforme idade e valor do TSH.'], (v) => BIOTINA(v)),
      r_baixos: R('mod', 'TSH e T4L ambos baixos', ['Sugere hipotireoidismo central ou doença não tireoidiana.'], ['Avaliar doença aguda, medicamentos (glicocorticoides, opioides) e eixo hipotálamo-hipófise (outros hormônios hipofisários, RM de sela se indicado).'], (v) => BIOTINA(v)),
      r_central: R('mod', 'TSH normal com T4L baixo', ['TSH inadequadamente normal para um T4L baixo.'], ['Considerar hipotireoidismo central, doença não tireoidiana ou interferência analítica; repetir e avaliar o eixo hipofisário.'], (v) => BIOTINA(v)),
      r_t4_alto: R('mod', 'T4L alto isolado com TSH normal', [], ['Perguntar sobre levotiroxina tomada antes da coleta, biotina e amiodarona.', 'Repetir com outro método se destoar da clínica.'], (v) => BIOTINA(v)),
      r_normal: R('low', 'TSH e T4L dentro da faixa do laudo', ['Sem alteração no eixo nesta coleta.'], ['Anti-TPO só se houver suspeita clínica, gestação planejada ou nódulo/bócio.'], (v) => BIOTINA(v)),

      gest: {
        t: 'form', q: 'Gestação: resultados e faixas', fields: [
          sel('tri', 'Trimestre', [['1', '1º'], ['2', '2º'], ['3', '3º']]), num('tsh', 'TSH', 'mUI/L'), num('tshUrl', 'TSH: limite superior do laudo para este trimestre (opcional)', 'mUI/L', false), num('tshLo', 'TSH: limite inferior do laudo (opcional)', 'mUI/L', false),
          num('t4l', 'T4 livre', 'ng/dL'), num('t4lLo', 'T4L: limite inferior do laudo', 'ng/dL'), num('t4lHi', 'T4L: limite superior do laudo', 'ng/dL'),
          sel('tpo', 'Anti-TPO', [['pos', 'Positivo'], ['neg', 'Negativo'], ['nd', 'Não feito']]), chk('biotina', 'Uso de biotina / polivitamínico'),
        ],
        route(v, reg) {
          if (!(v.t4lLo < v.t4lHi)) return { error: 'Informe os limites de T4L do laudo (inferior menor que superior).' };
          const url = v.tshUrl != null ? v.tshUrl : pv(reg, 'tireoide', 'preg.urlFallback');
          const loF = v.t4l < v.t4lLo, hiF = v.t4l > v.t4lHi;
          if (v.tsh > url) {
            if (loF || v.tsh >= pv(reg, 'tireoide', 'preg.treatTsh')) return { next: 'g_tratar' };
            return { next: v.tpo === 'pos' ? 'g_tratar_tpo' : 'g_considerar' };
          }
          if (v.tshLo != null && v.tsh < v.tshLo) return { next: hiF ? 'g_hiper' : v.tri === '1' ? 'g_supr' : 'g_hiper_sub' };
          if (v.tpo === 'pos' && v.tsh > pv(reg, 'tireoide', 'preg.tpoTsh')) return { next: 'g_tpo_limite' };
          return { next: 'g_ok' };
        },
      },
      g_tratar: R('high', 'Hipotireoidismo na gestação: tratar', (reg) => [`TSH acima do limite do trimestre com T4L baixo, ou TSH ≥ ${fmt(pv(reg, 'tireoide', 'preg.treatTsh'), 0)} mUI/L (ATA 2017).`], ['Iniciar levotiroxina e encaminhar ao pré-natal de alto risco / Endocrinologia.', 'Repetir TSH em cerca de 4 semanas e ajustar para a faixa do trimestre.'], (v) => BIOTINA(v)),
      g_tratar_tpo: R('high', 'TSH acima do limite com anti-TPO positivo', ['A ATA 2017 recomenda tratar com levotiroxina.'], ['Iniciar levotiroxina, encaminhar e repetir TSH em cerca de 4 semanas.'], (v) => BIOTINA(v)),
      g_considerar: R('mod', 'TSH acima do limite do trimestre, sem T4L baixo', (reg) => [`Anti-TPO negativo ou não feito e TSH abaixo de ${fmt(pv(reg, 'tireoide', 'preg.treatTsh'), 0)} mUI/L: a ATA 2017 permite considerar levotiroxina, sem recomendar de rotina.`], ['Dosar anti-TPO se não foi feito, repetir TSH e T4L e discutir com o pré-natal de alto risco / Endocrinologia.'], (v) => BIOTINA(v)),
      g_tpo_limite: R('mod', 'Anti-TPO positivo com TSH dentro do limite, acima do ponto de atenção', (reg) => [`TSH acima de ${fmt(pv(reg, 'tireoide', 'preg.tpoTsh'), 1)} mUI/L e dentro da faixa: a ATA 2017 diz que se pode considerar levotiroxina, mas o ensaio TABLET (Dhillon-Smith, NEJM 2019) não mostrou benefício obstétrico em eutireoidea com anticorpos.`], ['Em geral, vigiar com TSH periódico durante a gestação e decidir junto ao pré-natal de alto risco / Endocrinologia.'], (v) => BIOTINA(v)),
      g_supr: R('low', 'TSH baixo no 1º trimestre com T4L normal', ['O hCG estimula a tireoide e reduz o TSH no início da gestação; costuma ser fisiológico.'], ['Não tratar; repetir TSH e T4L adiante e observar sintomas.'], (v) => BIOTINA(v)),
      g_hiper_sub: R('mod', 'TSH baixo com T4L normal fora do 1º trimestre', [], ['Repetir TSH, T4L e T3L e avaliar com o pré-natal de alto risco / Endocrinologia.'], (v) => BIOTINA(v)),
      g_hiper: R('high', 'TSH baixo com T4L alto na gestação', ['Distinguir doença de Graves de tireotoxicose gestacional transitória.'], ['Dosar TRAb e T3L e encaminhar com urgência ao pré-natal de alto risco / Endocrinologia.'], (v) => BIOTINA(v)),
      g_ok: R('low', 'TSH e T4L adequados para a gestação', ['Sem alteração que mude a conduta nesta coleta.'], ['Se já usa levotiroxina, manter a meta de TSH do trimestre e seguir o protocolo do pré-natal.'], (v) => BIOTINA(v)),
    },
  };

  /* ---------- 2a) Sífilis ---------- */
  const sifilis = {
    id: 'sifilis', titulo: 'Sífilis', resumo: 'Teste treponêmico + VDRL/RPR, cicatriz sorológica, prozona e resposta ao tratamento.', guideline: ['sifilis'], start: 'n0',
    nodes: {
      n0: { t: 'choice', q: 'O que você precisa interpretar?', opts: [{ v: 'diag', label: 'Sorologia atual (diagnóstico)', next: 'diag' }, { v: 'seg', label: 'Resposta ao tratamento (seguimento)', next: 'seg' }] },
      diag: {
        t: 'form', q: 'Resultados', fields: [sel('tt', 'Teste treponêmico (TR, FTA-Abs, TPHA, ELISA, CMIA)', RNRND), sel('nt', 'Teste não treponêmico (VDRL/RPR)', RNRND), sel('trat', 'Tratamento prévio para sífilis', [['nao', 'Nunca tratou'], ['sim', 'Já tratou'], ['ns', 'Não sabe']]), chk('lesao', 'Lesão ou sintoma sugestivo de sífilis')],
        route(v) {
          if (v.tt === 'ND' && v.nt === 'ND') return { next: 'r_pedir' };
          if (v.tt === 'ND') return { next: 'r_pedir' };
          if (v.tt === 'R' && v.nt === 'R') return { next: v.trat === 'sim' ? 'seg' : v.trat === 'ns' ? 'r_conf_ns' : 'r_conf' };
          if (v.tt === 'R' && v.nt === 'NR') return { next: 'r_tt2' };
          if (v.tt === 'NR' && v.nt === 'R') return { next: 'r_nt_isol' };
          if (v.nt === 'ND') return { next: v.tt === 'R' ? 'r_pedir_nt' : 'r_neg' };
          return { next: 'r_neg' };
        },
      },
      r_pedir: R('info', 'Falta o teste treponêmico', ['Um teste não treponêmico isolado não confirma sífilis.'], ['Solicitar teste treponêmico (teste rápido ou laboratorial) antes de concluir.']),
      r_pedir_nt: R('info', 'Teste treponêmico reagente sem VDRL', ['O treponêmico confirma exposição, mas não diz se a infecção está ativa.'], ['Solicitar VDRL/RPR quantitativo para decidir tratamento e permitir o seguimento.']),
      r_conf: R('high', 'Sífilis: treponêmico e VDRL reagentes, sem tratamento prévio', ['Sorologia compatível com infecção por sífilis; o estágio (primária, secundária, latente recente ou tardia) é definido pela história e pelo exame físico.'], ['Tratar conforme o estágio no PCDT IST 2022 (penicilina benzatina).', 'Notificar, testar HIV e outras IST, tratar e testar parcerias sexuais.', 'Em gestante, tratar de imediato e seguir o protocolo de pré-natal.', 'Guardar o título do VDRL como referência para o seguimento.']),
      r_conf_ns: R('high', 'Treponêmico e VDRL reagentes, tratamento prévio incerto', ['Sem registro de tratamento, tratar como infecção não tratada é a conduta segura.'], ['Buscar o histórico de tratamentos no prontuário/SINAN; se não houver, tratar conforme o estágio e notificar.', 'Comparar o título com resultados anteriores se existirem.']),
      r_tt2: R('mod', 'Treponêmico reagente com VDRL não reagente', (reg, v) => ['Possíveis explicações: sífilis muito recente ou muito antiga/tratada, falso reagente do treponêmico, ou fenômeno de prozona (VDRL falsamente negativo por excesso de anticorpos).', v.lesao ? 'Há sintoma sugestivo: pedir ao laboratório que repita o VDRL com a amostra diluída para afastar prozona.' : v.trat === 'sim' ? 'Já tratou: compatível com cicatriz sorológica do treponêmico, que costuma ficar reagente por toda a vida.' : 'Sem história de tratamento.'], ['Fazer um segundo teste treponêmico de metodologia diferente. Se também reagente e sem tratamento prévio, tratar como sífilis; se não reagente, considerar falso reagente.', 'Pedir diluição da amostra para VDRL se houver suspeita de prozona.']),
      r_nt_isol: R('mod', 'VDRL reagente com treponêmico não reagente', ['Mais provável falso reagente do teste não treponêmico (gestação, doenças autoimunes, infecções, vacinas, idade).'], ['Se houver lesão ou exposição recente (janela imunológica da sífilis primária), repetir os testes em algumas semanas.', 'Considerar um segundo treponêmico de outro método antes de descartar.']),
      r_neg: R('low', 'Sorologia não reagente', ['Afasta sífilis na ausência de exposição ou lesão recentes.'], ['Se houve exposição ou lesão há poucas semanas, repetir em seguida por causa da janela imunológica.']),
      seg: {
        t: 'form', q: 'Títulos do VDRL/RPR (informe só o denominador: 1:32 → 32; não reagente → 0)', fields: [num('pre', 'Título antes do tratamento', '1:n'), num('pos', 'Título atual', '1:n'), num('meses', 'Meses desde o tratamento', 'meses'), sel('est', 'Estágio tratado', [['rec', 'Recente (primária, secundária, latente recente)'], ['tar', 'Tardia ou latente de duração ignorada']]), chk('gest', 'Gestante')],
        route(v, reg) {
          if (v.pre < 1 || v.pos < 0) return { error: 'O título antes do tratamento deve ser ≥1; use 0 para não reagente.' };
          const dil = v.pos === 0 ? Infinity : Math.log2(v.pre / v.pos);
          const rise = pv(reg, 'sifilis', 'rise.dilutions'), fall = pv(reg, 'sifilis', 'resp.dilutions');
          const win = v.est === 'rec' ? pv(reg, 'sifilis', 'resp.recentMonths') : pv(reg, 'sifilis', 'resp.lateMonths');
          if (v.pos > 0 && -dil >= rise) return { next: 'r_falha' };
          if (dil >= fall) return { next: 'r_resp' };
          if (v.meses < win) return { next: 'r_aguarda' };
          if (v.pos > 0 && v.pos <= pv(reg, 'sifilis', 'cicatriz.maxTiter')) return { next: 'r_cicatriz' };
          return { next: 'r_inadequada' };
        },
      },
      r_resp: R('low', 'Resposta imunológica adequada', (reg) => [`VDRL não reagente ou queda de pelo menos ${fmt(pv(reg, 'sifilis', 'resp.dilutions'), 0)} diluições dentro do prazo do estágio.`], ['Manter o seguimento clínico e sorológico conforme o PCDT para detectar reativação ou reinfecção.']),
      r_aguarda: R('info', 'Ainda dentro do prazo de resposta', (reg, v) => [`O prazo para avaliar a queda é de ${fmt(v.est === 'rec' ? pv(reg, 'sifilis', 'resp.recentMonths') : pv(reg, 'sifilis', 'resp.lateMonths'), 0)} meses após o tratamento; a queda ainda não atingiu o esperado.`], ['Repetir o VDRL no intervalo do protocolo e reavaliar. Em gestante, o seguimento é mais frequente.']),
      r_falha: R('high', 'Aumento do título: reinfecção ou reativação', (reg) => [`Aumento de pelo menos ${fmt(pv(reg, 'sifilis', 'rise.dilutions'), 0)} diluições.`], ['Reavaliar exposição e sintomas, testar HIV e outras IST, tratar parcerias e retratar conforme o PCDT IST 2022.', 'Notificar como novo episódio se for reinfecção.']),
      r_cicatriz: R('mod', 'Título baixo e estável: compatível com cicatriz sorológica', (reg) => [`Título ≤ 1:${fmt(pv(reg, 'sifilis', 'cicatriz.maxTiter'), 0)} sem queda adequada após o prazo. O ponto de corte para cicatriz está marcado "a verificar" no Registry.`], ['Confirmar que não houve nova exposição nem sintomas e manter o seguimento segundo o PCDT; conferir a definição de cicatriz no texto do PCDT antes de dar alta.']),
      r_inadequada: R('high', 'Resposta inadequada ao tratamento', ['A queda do título não atingiu o esperado no prazo e o título não é baixo.'], ['Investigar reinfecção, imunossupressão (HIV) e neurossífilis conforme sintomas, e retratar segundo o PCDT IST 2022.', 'Considerar encaminhamento à Infectologia.']),
    },
  };

  /* ---------- 2b) Toxoplasmose gestacional ---------- */
  const toxo = {
    id: 'toxo', titulo: 'Toxoplasmose gestacional', resumo: 'IgG, IgM e teste de avidez (até 16 semanas).', guideline: ['toxo'], start: 'f',
    nodes: {
      f: {
        t: 'form', q: 'Resultados', fields: [sel('igg', 'IgG', RNR), sel('igm', 'IgM', RNR), num('ga', 'Idade gestacional na coleta', 'semanas'), sel('av', 'Avidez de IgG', [['alta', 'Alta'], ['inter', 'Intermediária'], ['baixa', 'Baixa'], ['nd', 'Não feita']], false)],
        route(v, reg) {
          if (v.igg === 'NR' && v.igm === 'NR') return { next: 'r_susc' };
          if (v.igg === 'R' && v.igm === 'NR') return { next: 'r_imune' };
          if (v.igg === 'NR' && v.igm === 'R') return { next: 'r_igm' };
          if (!v.av || v.av === 'nd') return { next: 'r_avidez' };
          if (v.av === 'inter') return { next: 'r_inter' };
          if (v.av === 'alta' && v.ga <= pv(reg, 'toxo', 'avidez.maxGa')) return { next: 'r_afasta' };
          return { next: 'r_agudo' };
        },
      },
      r_susc: R('info', 'Gestante suscetível', ['Sem anticorpos: não teve contato prévio.'], ['Orientar prevenção (carne bem cozida, lavar frutas e verduras, evitar contato com fezes de gato e terra) e repetir a sorologia conforme o protocolo de pré-natal.']),
      r_imune: R('low', 'IgG reagente com IgM não reagente', ['Infecção passada; imunidade estabelecida.'], ['Sem conduta específica na gestação; considerar a idade gestacional e a data da primeira sorologia só se houver dúvida de infecção recente.']),
      r_igm: R('mod', 'IgM reagente com IgG não reagente', ['Pode ser infecção muito recente (IgG ainda ausente) ou IgM falso-reagente.'], ['Repetir IgG e IgM em 2 a 3 semanas: se o IgG passar a reagente, trata-se de soroconversão.', 'Na dúvida, discutir com o pré-natal de alto risco.']),
      r_avidez: R('mod', 'IgG e IgM reagentes: falta o teste de avidez', ['Não dá para datar a infecção só com IgG e IgM.'], ['Solicitar avidez de IgG, de preferência até 16 semanas de gestação.', 'Enquanto isso, discutir início de espiramicina com o pré-natal de alto risco e encaminhar.']),
      r_afasta: R('low', 'Avidez alta até a idade gestacional limite: infecção aguda na gestação afastada', (reg) => [`Avidez alta numa amostra de até ${fmt(pv(reg, 'toxo', 'avidez.maxGa'), 0)} semanas indica anticorpos antigos (mais de 12 a 16 semanas), anteriores à gestação atual.`], ['Sem tratamento para toxoplasmose; se a espiramicina foi iniciada, pode ser suspensa (Febrasgo).', 'O ponto de corte percentual de "alta avidez" é do kit e deve constar no laudo.']),
      r_inter: R('mod', 'Avidez intermediária', (reg) => [`Resultado intermediário não permite afastar infecção recente.`, `Repetir a avidez em ${fmt(pv(reg, 'toxo', 'avidez.repeatWeeks'), 0)} semanas (protocolo HC-FMUSP baseado na Res. SS-SP 200/2010).`], ['Encaminhar ao pré-natal de alto risco e discutir espiramicina até a definição.']),
      r_agudo: R('high', 'Infecção aguda na gestação não pode ser afastada', (reg, v) => [v.av === 'baixa' ? 'Avidez baixa sugere infecção recente.' : `Com avidez alta, mas coleta após ${fmt(pv(reg, 'toxo', 'avidez.maxGa'), 0)} semanas, a avidez não data a infecção.`], ['Iniciar espiramicina conforme o protocolo e encaminhar ao pré-natal de alto risco / Infectologia para investigar infecção fetal (ultrassom, PCR no líquido amniótico quando indicada).']),
    },
  };

  /* ---------- 2c) Hepatite B ---------- */
  const hbv = {
    id: 'hbv', titulo: 'Hepatite B', resumo: 'HBsAg, anti-HBc total/IgM, anti-HBs, HBeAg e anti-HBe.', guideline: ['hbv'], start: 'f',
    nodes: {
      f: {
        t: 'form', q: 'Marcadores', fields: [sel('hbsag', 'HBsAg', RNR), sel('hbc', 'Anti-HBc total', RNR), sel('igm', 'Anti-HBc IgM', RNRND, false), sel('hbs', 'Anti-HBs', RNR), sel('hbe', 'HBeAg', RNRND, false), sel('ahbe', 'Anti-HBe', RNRND, false)],
        route(v) {
          if (v.hbsag === 'R') {
            if (v.hbc === 'NR') return { next: 'r_hbsag_iso' };
            if (v.igm === 'R') return { next: 'r_agudo' };
            if (v.igm === 'NR') return { next: 'r_cronico' };
            return { next: 'r_agudo_ou_cronico' };
          }
          if (v.hbs === 'R') return { next: v.hbc === 'R' ? 'r_imune_nat' : 'r_imune_vac' };
          return { next: v.hbc === 'R' ? 'r_hbc_iso' : 'r_susc' };
        },
      },
      r_susc: R('info', 'Suscetível à hepatite B', ['Nenhum marcador reagente.'], ['Vacinar (esquema de 3 doses) e conferir a resposta quando houver indicação.']),
      r_imune_vac: R('low', 'Imunidade vacinal', (reg) => [`Anti-HBs isolado, compatível com vacinação; protetor se ≥ ${fmt(pv(reg, 'hbv', 'antiHbs.protecao'), 0)} mUI/mL (valor "a verificar" no Registry).`], ['Sem conduta adicional.']),
      r_imune_nat: R('low', 'Imunidade natural: infecção resolvida', ['HBsAg não reagente com anti-HBc e anti-HBs reagentes.'], ['Se for receber imunossupressor, quimioterapia ou anti-CD20, avaliar o risco de reativação e a profilaxia antes de iniciar (discutir com a Hepatologia/Infectologia).']),
      r_hbc_iso: R('mod', 'Anti-HBc isolado', ['Pode ser infecção antiga com anti-HBs que caiu, falso-reagente, hepatite B oculta ou janela imunológica.'], ['Repetir o painel e considerar HBV-DNA, sobretudo se imunossuprimido, doador ou com hepatopatia sem causa.', 'Se tudo negativo, seguir o PCDT quanto à vacinação e à resposta do anti-HBs.']),
      r_hbsag_iso: R('mod', 'HBsAg reagente sem anti-HBc', ['Possível infecção aguda muito inicial, HBsAg falso-reagente ou HBsAg transitório após vacina recente.'], ['Repetir HBsAg e solicitar anti-HBc IgM e HBV-DNA para confirmar.']),
      r_agudo: R('high', 'Hepatite B aguda', ['HBsAg e anti-HBc IgM reagentes.'], ['Notificar, avaliar gravidade (TAP/INR, bilirrubinas, encefalopatia) e encaminhar à Infectologia/Hepatologia; repetir HBsAg após 6 meses para ver se houve cura.', 'Vacinar e, se indicado, oferecer profilaxia a contatos.']),
      r_agudo_ou_cronico: R('high', 'HBsAg e anti-HBc total reagentes sem IgM', ['Falta o anti-HBc IgM para separar aguda de crônica.'], ['Solicitar anti-HBc IgM e HBV-DNA; repetir HBsAg em 6 meses. Notificar conforme o PCDT.']),
      r_cronico: R('high', 'Infecção crônica pelo vírus B (HBsAg reagente por mais de 6 meses a confirmar)', (reg, v) => [v.hbe === 'R' ? 'HBeAg reagente: replicação viral ativa.' : v.ahbe === 'R' ? 'HBeAg não reagente com anti-HBe reagente: fase inativa ou hepatite B HBeAg-negativa; só o HBV-DNA e a ALT distinguem.' : 'HBeAg/anti-HBe não informados.'], ['Solicitar HBV-DNA quantitativo, ALT/AST, estadiamento de fibrose (FIB-4, elastografia), anti-HDV, anti-HCV e anti-HIV.', 'Encaminhar à Hepatologia/Infectologia e rastrear contatos domiciliares; vacinar suscetíveis.']),
    },
  };

  /* ---------- 3) Hipertransaminasemia e colestase ---------- */
  const hepato = {
    id: 'hepato', titulo: 'Hipertransaminasemia e colestase', resumo: 'Fator R, padrão hepatocelular × colestático × misto, Síndrome de Gilbert.', guideline: ['hepato'], start: 'n0',
    nodes: {
      n0: { t: 'choice', q: 'Qual é o achado?', opts: [{ v: 'enz', label: 'ALT e/ou fosfatase alcalina aumentadas', next: 'enz' }, { v: 'bil', label: 'Bilirrubina elevada com enzimas normais', next: 'bil' }] },
      enz: {
        t: 'form', q: 'Enzimas e limites superiores do laudo (LSN)', fields: [num('alt', 'ALT (TGP)', 'U/L'), num('altLsn', 'ALT: LSN do laudo', 'U/L'), num('fa', 'Fosfatase alcalina', 'U/L'), num('faLsn', 'FA: LSN do laudo', 'U/L')],
        route(v, reg) {
          if (v.altLsn <= 0 || v.faLsn <= 0) return { error: 'Os limites superiores do laudo devem ser maiores que zero.' };
          if (v.alt <= v.altLsn && v.fa <= v.faLsn) return { next: 'r_normal' };
          const r = (v.alt / v.altLsn) / (v.fa / v.faLsn);
          v.R = r; v.altX = v.alt / v.altLsn; v.faX = v.fa / v.faLsn;
          return { next: r >= pv(reg, 'hepato', 'r.hepatocelular') ? 'r_hepatocelular' : r <= pv(reg, 'hepato', 'r.colestatico') ? 'r_colestatico' : 'r_misto' };
        },
      },
      r_normal: R('low', 'ALT e FA dentro do limite do laudo', ['O fator R só se aplica quando há alteração.'], []),
      r_hepatocelular: R('mod', 'Padrão hepatocelular', (reg, v) => [`Fator R = ${fmt(v.R, 1)} (hepatocelular se ≥ ${fmt(pv(reg, 'hepato', 'r.hepatocelular'), 0)}). ALT ${fmt(v.altX, 1)}× e FA ${fmt(v.faX, 1)}× o LSN.`, v.altX >= pv(reg, 'hepato', 'dili.altUln') ? `ALT ≥ ${fmt(pv(reg, 'hepato', 'dili.altUln'), 0)}× o LSN atinge o limiar usado para definir lesão hepática relevante (inclusive por fármacos).` : ''].filter(Boolean),
        ['Revisar fármacos, fitoterápicos, suplementos e álcool; avaliar fatores metabólicos (FIB-4 na Bancada Rápida).', 'Painel inicial: HBsAg, anti-HBc total, anti-HCV, anti-HAV IgM conforme o contexto, ferritina e saturação de transferrina, glicemia e lipídios, TSH, anti-transglutaminase, CK (origem muscular).', 'Se persistir sem causa: FAN, anti-músculo liso, IgG (hepatite autoimune) e, em jovens, ceruloplasmina; ultrassom de abdome.']),
      r_colestatico: R('mod', 'Padrão colestático', (reg, v) => [`Fator R = ${fmt(v.R, 1)} (colestático se ≤ ${fmt(pv(reg, 'hepato', 'r.colestatico'), 0)}). FA ${fmt(v.faX, 1)}× o LSN.`], ['Confirmar origem hepática com GGT (FA também vem do osso e da placenta).', 'Ultrassom de abdome para excluir obstrução biliar; revisar fármacos.', 'Anticorpo antimitocondrial (colangite biliar primária) se não houver obstrução; encaminhar à Hepatologia se persistir ou houver icterícia.']),
      r_misto: R('mod', 'Padrão misto', (reg, v) => [`Fator R = ${fmt(v.R, 1)} (entre ${fmt(pv(reg, 'hepato', 'r.colestatico'), 0)} e ${fmt(pv(reg, 'hepato', 'r.hepatocelular'), 0)}).`], ['Revisar fármacos (lesão hepática por medicamentos pode ter padrão misto), ultrassom e painel viral; encaminhar se persistir.']),
      bil: {
        t: 'form', q: 'Bilirrubinas e contexto', fields: [num('bt', 'Bilirrubina total', 'mg/dL'), num('btLsn', 'Bilirrubina total: LSN do laudo', 'mg/dL'), num('bd', 'Bilirrubina direta', 'mg/dL'), chk('enzOk', 'ALT, AST, FA e GGT normais'), chk('hemolise', 'Suspeita de hemólise (anemia, reticulócitos altos, LDH alto ou haptoglobina baixa)')],
        route(v, reg) {
          if (v.bt <= 0 || v.bd < 0 || v.bd > v.bt) return { error: 'Confira as bilirrubinas (direta não pode superar a total).' };
          v.indPct = ((v.bt - v.bd) / v.bt) * 100;
          if (v.hemolise) return { next: 'r_hemolise' };
          if (v.enzOk && v.indPct >= pv(reg, 'hepato', 'gilbert.indiretaPct') && v.bt < pv(reg, 'hepato', 'gilbert.btUln') * v.btLsn) return { next: 'r_gilbert' };
          if (v.indPct >= pv(reg, 'hepato', 'gilbert.indiretaPct')) return { next: 'r_indireta' };
          return { next: 'r_direta' };
        },
      },
      r_gilbert: R('low', 'Compatível com Síndrome de Gilbert', (reg, v) => [`Hiperbilirrubinemia indireta (${fmt(v.indPct, 0)}% da total) com enzimas normais e sem hemólise. É um diagnóstico de exclusão e é benigno; os limiares numéricos estão "a verificar".`], ['Confirmar sem hemólise (hemograma, reticulócitos, LDH, haptoglobina) e repetir a bilirrubina; jejum e infecção elevam o valor.', 'Tranquilizar e não tratar; teste genético só em caso de dúvida.']),
      r_hemolise: R('mod', 'Hiperbilirrubinemia indireta com suspeita de hemólise', [], ['Investigar anemia hemolítica (reticulócitos, LDH, haptoglobina, Coombs, esfregaço) e encaminhar à Hematologia se confirmada.']),
      r_indireta: R('mod', 'Hiperbilirrubinemia indireta que não preenche o perfil de Gilbert', [], ['Repetir com enzimas hepáticas e hemograma; considerar fármacos, hemólise e doenças hepáticas; encaminhar se persistir ou se a bilirrubina for muito alta.']),
      r_direta: R('high', 'Hiperbilirrubinemia com componente direto importante', ['Sugere colestase ou doença hepatobiliar.'], ['Pedir enzimas hepáticas completas e GGT, ultrassom de vias biliares e seguir o padrão colestático; encaminhar com urgência se houver icterícia progressiva, febre ou dor.']),
    },
  };

  /* ---------- 4) FAN (HEp-2) ---------- */
  const TITULOS = [['0', 'Não reagente'], ['40', '1:40'], ['80', '1:80'], ['160', '1:160'], ['320', '1:320'], ['640', '1:640'], ['1280', '≥ 1:1280']];
  const PADROES = [
    ['ac1', 'AC-1 nuclear homogêneo'], ['ac2', 'AC-2 nuclear pontilhado fino denso'], ['ac3', 'AC-3 centromérico'], ['ac4', 'AC-4 nuclear pontilhado fino'], ['ac5', 'AC-5 nuclear pontilhado grosso'],
    ['ac67', 'AC-6/7 pontos nucleares (múltiplos ou poucos)'], ['ac8', 'AC-8 nucleolar homogêneo'], ['ac9', 'AC-9 nucleolar grumoso'], ['ac10', 'AC-10 nucleolar pontilhado'], ['ac1112', 'AC-11/12 membrana nuclear'], ['ac21', 'AC-21 citoplasmático reticular (mitocondrial)'], ['out', 'Outro padrão'],
  ];
  const fanR = (level, title, texts, recs) => R(level, title, (reg, v) => [`Título 1:${v.titulo}.`].concat(typeof texts === 'function' ? texts(reg, v) : texts), recs);
  const fan = {
    id: 'fan', titulo: 'Autoimunidade: FAN (HEp-2)', resumo: 'Padrões ICAP: AC-2 (anti-DFS70) × padrões de LES, esclerodermia e Sjögren.', guideline: ['fan'], start: 'f',
    nodes: {
      f: {
        t: 'form', q: 'Resultado do FAN', fields: [sel('titulo', 'Título', TITULOS), sel('padrao', 'Padrão (ICAP)', PADROES, false), chk('clinica', 'Clínica sugestiva de doença reumática autoimune (artrite, rash, fotossensibilidade, sicca, Raynaud, serosite, citopenias, proteinúria)')],
        route(v, reg) {
          v.titulo = Number(v.titulo);
          if (v.titulo === 0 || v.titulo < pv(reg, 'fan', 'titer.cut')) return { next: 'r_neg' };
          return { next: ({ ac1: 'p1', ac2: 'p2', ac3: 'p3', ac4: 'p4', ac5: 'p5', ac67: 'p67', ac8: 'pnuc', ac9: 'pnuc', ac10: 'pnuc', ac1112: 'penv', ac21: 'p21' })[v.padrao] || 'pout' };
        },
      },
      r_neg: R('low', 'FAN negativo ou abaixo do ponto de corte', (reg) => [`Abaixo de 1:${fmt(pv(reg, 'fan', 'titer.cut'), 0)} (ponto de corte "a verificar"; use o do seu laboratório).`, 'Um FAN negativo torna o lúpus eritematoso sistêmico pouco provável; não afasta outras doenças com anticorpos que a HEp-2 não detecta bem.'], ['Se a suspeita clínica for alta, discutir com a Reumatologia e pedir autoanticorpos específicos (ex.: anti-Ro/SSA).']),
      p1: fanR('mod', 'AC-1: nuclear homogêneo', ['Associado a anti-dsDNA, anti-nucleossomo e anti-histona (lúpus, também lúpus induzido por fármacos e hepatite autoimune). Associação conferida em conhecimento prévio, "a verificar" no ICAP.'], ['Pedir anti-dsDNA, anti-Sm/ENA, C3/C4, hemograma, creatinina e urina I com RAC; encaminhar à Reumatologia se clínica compatível.']),
      p2: fanR('info', 'AC-2: pontilhado fino denso (anti-DFS70)', ['Padrão tipicamente associado a anticorpos anti-DFS70, que também ocorrem em indivíduos saudáveis; é pouco provável que reflita doença autoimune sistêmica, mesmo em título alto, quando é o único achado (artigos que citam o ICAP).'], ['Sem clínica e sem outros autoanticorpos (ENA, dsDNA negativos), a probabilidade de doença reumática autoimune é baixa; confirmar anti-DFS70 específico se disponível.', 'Se houver clínica sugestiva, não se tranquilize só pelo padrão: pedir ENA e anti-dsDNA e encaminhar.']),
      p3: fanR('mod', 'AC-3: centromérico', ['Associado a anti-CENP-B: esclerose sistêmica cutânea limitada (CREST) e colangite biliar primária. Pertence ao grupo de padrões ligados à esclerose sistêmica.'], ['Avaliar Raynaud, telangiectasias, esclerodactilia, refluxo; considerar capilaroscopia, ecocardiograma e prova de função pulmonar; encaminhar à Reumatologia.']),
      p4: fanR('mod', 'AC-4: nuclear pontilhado fino', ['Costuma associar-se a anti-SSA/Ro e anti-SSB/La (síndrome de Sjögren, lúpus) e a outros antígenos; pertence ao grupo de padrões ligados à esclerose sistêmica em alguns subgrupos.'], ['Pedir ENA (SSA/Ro, SSB/La); avaliar sicca, parotidomegalia e fotossensibilidade.', 'Em gestante ou mulher que planeja engravidar, anti-Ro/SSA positivo exige seguimento fetal por risco de bloqueio cardíaco congênito.']),
      p5: fanR('mod', 'AC-5: nuclear pontilhado grosso', ['Associado a anti-Sm e anti-RNP (lúpus, doença mista do tecido conjuntivo).'], ['Pedir ENA (Sm, RNP) e anti-dsDNA; encaminhar à Reumatologia se clínica compatível.']),
      p67: fanR('mod', 'AC-6/7: pontos nucleares', ['Associados a anti-Sp100 e anti-PML, vistos na colangite biliar primária.'], ['Pedir anticorpo antimitocondrial e fosfatase alcalina/GGT; encaminhar à Hepatologia se houver colestase.']),
      pnuc: fanR('mod', 'AC-8/9/10: padrões nucleolares', ['Associados à esclerose sistêmica (anti-PM/Scl e Th/To, fibrilarina, RNA polimerase).'], ['Pedir painel de esclerose sistêmica e encaminhar à Reumatologia; atenção a anti-RNA polimerase III pelo risco de crise renal esclerodérmica.']),
      penv: fanR('mod', 'AC-11/12: membrana nuclear', ['O padrão pontilhado de membrana nuclear associa-se a anti-gp210, visto na colangite biliar primária.'], ['Avaliar enzimas colestáticas e anticorpo antimitocondrial; encaminhar conforme os resultados.']),
      p21: fanR('mod', 'AC-21: citoplasmático reticular', ['Associado a anticorpos antimitocondriais (colangite biliar primária).'], ['Dosar fosfatase alcalina/GGT e anticorpo antimitocondrial; encaminhar à Hepatologia se positivo.']),
      pout: fanR('info', 'Padrão fora desta lista', ['A lista do ICAP tem 29 padrões positivos (AC-1 a AC-29). Este módulo cobre os mais relevantes para a APS.'], ['Consulte o laudo e o consenso ICAP (anapatterns.org) e discuta com a Reumatologia se houver clínica.']),
    },
  };

  /* ---------- 5) Eletroforese de proteínas e gamopatias monoclonais ---------- */
  const imwg = {
    id: 'imwg', titulo: 'Gamopatias monoclonais', resumo: 'Pico monoclonal × policlonal, MGUS, mieloma indolente e mieloma (CRAB, SLiM).', guideline: ['imwg'], start: 'n0',
    nodes: {
      n0: { t: 'choice', q: 'A eletroforese mostra pico monoclonal (componente M)?', opts: [{ v: 'sim', label: 'Sim', next: 'f' }, { v: 'nao', label: 'Não (aumento policlonal ou normal)', next: 'r_poli' }] },
      r_poli: R('info', 'Sem componente M: padrão policlonal ou normal', ['Aumento policlonal de gamaglobulinas reflete estímulo imune: infecções crônicas, doenças autoimunes, hepatopatia crônica, doenças inflamatórias.'], ['Investigar a causa clínica.', 'Eletroforese normal não exclui mieloma de cadeias leves: se houver suspeita (anemia inexplicada, dor óssea, hipercalcemia, insuficiência renal, proteinúria, neuropatia), pedir cadeias leves livres séricas e imunofixação sérica e urinária.']),
      f: {
        t: 'form', q: 'Dados do componente M e dos critérios', fields: [
          num('m', 'Componente M sérico', 'g/dL'), sel('ig', 'Tipo', [['IgG', 'IgG'], ['IgA', 'IgA'], ['IgM', 'IgM'], ['LC', 'Só cadeia leve'], ['ns', 'Não sei']]),
          num('pc', 'Plasmócitos clonais na medula (se já fez)', '%', false), chk('plasmocitoma', 'Plasmocitoma ósseo ou extramedular comprovado'),
          num('ratio', 'Razão cadeias leves livres envolvida/não envolvida', '', false), num('flcInv', 'Cadeia leve envolvida', 'mg/L', false),
          num('ca', 'Cálcio total', 'mg/dL', false), num('caLsn', 'Cálcio: LSN do laudo (opcional)', 'mg/dL', false), num('cr', 'Creatinina', 'mg/dL', false), num('crcl', 'Depuração de creatinina (opcional)', 'mL/min', false),
          num('hb', 'Hemoglobina', 'g/dL', false), num('hbLln', 'Hemoglobina: LIN do laudo (opcional)', 'g/dL', false), chk('osso', 'Lesão óssea lítica em imagem'), chk('rm', 'Mais de uma lesão focal na RM (≥5 mm)'),
        ],
        route(v, reg) {
          const g = (k) => pv(reg, 'imwg', k);
          const c = [];
          if (v.ca != null && (v.ca > g('crab.ca') || (v.caLsn != null && v.ca > v.caLsn + g('crab.caAboveUln')))) c.push('hipercalcemia');
          if ((v.cr != null && v.cr > g('crab.cr')) || (v.crcl != null && v.crcl < g('crab.crcl'))) c.push('insuficiência renal');
          if (v.hb != null && (v.hb < g('crab.hb') || (v.hbLln != null && v.hb < v.hbLln - g('crab.hbBelowLln')))) c.push('anemia');
          if (v.osso) c.push('lesão óssea');
          const s = [];
          if (v.pc != null && v.pc >= g('slim.pc')) s.push(`plasmócitos ≥ ${g('slim.pc')}%`);
          if (v.ratio != null && v.ratio >= g('slim.flc') && (v.flcInv == null || v.flcInv >= g('slim.flcInvolved'))) s.push(`razão de cadeias leves ≥ ${g('slim.flc')}`);
          if (v.rm) s.push('lesões focais na RM');
          v.crab = c; v.slim = s;
          const pcAlto = (v.pc != null && v.pc >= g('mm.pcMin')) || v.plasmocitoma;
          if (pcAlto && (c.length || s.length)) return { next: 'r_mm' };
          if (!pcAlto && v.pc == null && (c.length || s.length)) return { next: 'r_suspeita' };
          if (pcAlto || v.m >= g('mgus.mMax')) return { next: 'r_smm' };
          return { next: 'r_mgus' };
        },
      },
      r_mm: R('high', 'Critérios de mieloma múltiplo', (reg, v) => ['Plasmócitos clonais (ou plasmocitoma) com evento definidor de mieloma.', v.crab.length ? `CRAB: ${v.crab.join(', ')}.` : '', v.slim.length ? `Biomarcadores SLiM: ${v.slim.join('; ')}.` : ''].filter(Boolean), ['Encaminhar com urgência à Hematologia.', 'Completar: imunofixação sérica e urinária, B2-microglobulina, albumina, LDH e imagem esquelética.']),
      r_suspeita: R('high', 'Componente M com evento CRAB/SLiM: mieloma até prova em contrário', (reg, v) => [`Achados: ${v.crab.concat(v.slim).join(', ')}.`, 'Sem a contagem de plasmócitos na medula não dá para classificar.'], ['Encaminhar com urgência à Hematologia para mielograma/biópsia de medula e imagem.', 'Afastar outras causas de cada alteração (hipercalcemia de outra origem, doença renal, anemia carencial).']),
      r_smm: R('mod', 'Mieloma múltiplo indolente (smoldering)', (reg, v) => [`Componente M ≥ ${fmt(pv(reg, 'imwg', 'mgus.mMax'), 0)} g/dL ou plasmócitos entre ${fmt(pv(reg, 'imwg', 'mm.pcMin'), 0)}% e ${fmt(pv(reg, 'imwg', 'slim.pc'), 0)}%, sem evento definidor de mieloma.`, v.pc == null ? 'Plasmócitos não informados: classificação provisória.' : ''].filter(Boolean), ['Encaminhar à Hematologia: risco de progressão e seguimento (em geral a cada poucos meses).', 'Manter vigilância de cálcio, creatinina e hemoglobina.']),
      r_mgus: R('low', 'Compatível com MGUS', (reg, v) => [`Componente M < ${fmt(pv(reg, 'imwg', 'mgus.mMax'), 0)} g/dL, sem evento CRAB/SLiM e sem critérios de plasmócitos elevados.`, v.m >= pv(reg, 'imwg', 'mgus.riskM') || v.ig === 'IgA' || v.ig === 'IgM' ? 'Fatores de maior risco de progressão: componente M ≥ ' + fmt(pv(reg, 'imwg', 'mgus.riskM'), 1) + ' g/dL, tipo não-IgG ou razão de cadeias leves anormal.' : 'Sem fator de maior risco nos dados informados.', v.ig === 'IgM' ? 'IgM: distinguir de macroglobulinemia de Waldenström e outros linfomas.' : ''].filter(Boolean), ['Confirmar com imunofixação e cadeias leves livres séricas, acompanhar e encaminhar à Hematologia se houver fatores de risco ou dúvida.', 'Repetir o componente M, cálcio, creatinina e hemoglobina em intervalos regulares (frequência a definir com a Hematologia).']),
    },
  };

  /* ---------- 6) Urinálise e urocultura ---------- */
  const urina = {
    id: 'urina', titulo: 'Urinálise e urocultura', resumo: 'Bacteriúria assintomática (quando tratar), contaminação, dismorfismo e cilindros.', guideline: ['urina'], start: 'n0',
    nodes: {
      n0: { t: 'choice', q: 'O que você precisa interpretar?', opts: [{ v: 'cult', label: 'Urocultura / bacteriúria', next: 'cult' }, { v: 'sed', label: 'Sedimento: hematúria, dismorfismo e cilindros', next: 'sed' }] },
      cult: {
        t: 'form', q: 'Urocultura e contexto', fields: [
          num('ufc', 'Crescimento', 'UFC/mL'), num('esp', 'Número de espécies isoladas', ''), chk('escamosas', 'Muitas células epiteliais escamosas na urina I (contaminação)'),
          sel('mat', 'Material', [['jm', 'Jato médio'], ['cn', 'Cateterismo de alívio ou sonda recém-colocada'], ['cl', 'Sonda vesical de longa permanência']]), sel('sexo', 'Sexo biológico', [['F', 'Feminino'], ['M', 'Masculino']]),
          chk('sint', 'Sintomas urinários (disúria, urgência, febre, dor lombar)'), chk('gest', 'Gestante'), chk('proc', 'Procedimento urológico invasivo com sangramento de mucosa planejado'),
          sel('pop', 'Perfil', [['nenhum', 'Nenhum dos abaixo'], ['dm', 'Diabetes'], ['idoso', 'Idoso ou residente de ILPI'], ['tx', 'Transplantado renal (>1 mês)'], ['crianca', 'Criança']]),
        ],
        route(v, reg) {
          if (v.ufc < 0 || v.esp < 1) return { error: 'Informe o crescimento (≥0) e o número de espécies (≥1).' };
          if (v.esp >= pv(reg, 'urina', 'contam.species') || v.escamosas) return { next: 'r_contam' };
          const lim = v.mat === 'cn' ? pv(reg, 'urina', 'asb.cfuCath') : pv(reg, 'urina', 'asb.cfu');
          if (v.sint) return { next: v.ufc >= pv(reg, 'urina', 'cyst.cfu') ? 'r_itu' : 'r_sint_neg' };
          if (v.ufc < lim) return { next: 'r_sem' };
          if (v.mat === 'cl') return { next: 'r_nao_cat' };
          if (v.gest) return { next: 'r_gest' };
          if (v.proc) return { next: 'r_proc' };
          return { next: 'r_nao' };
        },
      },
      r_contam: R('mod', 'Amostra provavelmente contaminada', (reg) => [`Várias espécies (≥ ${fmt(pv(reg, 'urina', 'contam.species'), 0)}) ou muitas células escamosas indicam contaminação por flora periuretral/vaginal; o crescimento não é confiável.`], ['Recoletar em jato médio com higiene adequada ou, se necessário, por cateterismo de alívio, antes de decidir tratamento.']),
      r_itu: R('high', 'Infecção urinária sintomática provável', (reg) => [`Sintomas com crescimento ≥ ${fmt(pv(reg, 'urina', 'cyst.cfu'), 0)} UFC/mL (limiar de cistite "a verificar"; em pielonefrite o crescimento costuma ser maior).`], ['Tratar conforme o quadro (cistite ou pielonefrite), o antibiograma e o perfil local de resistência; fora do escopo desta ferramenta.', 'Febre, dor lombar, gestação, homem ou falha terapêutica: considerar urocultura prévia ao antibiótico e avaliação ampliada.']),
      r_sint_neg: R('mod', 'Sintomas com urocultura abaixo do limiar', [], ['Considerar uretrite (clamídia, gonococo), vaginite, litíase, tuberculose renal e outras causas de piúria estéril; repetir a urocultura se a suspeita persistir.']),
      r_sem: R('low', 'Sem bacteriúria pelos critérios usados', (reg, v) => [`Abaixo de ${fmt(v.mat === 'cn' ? pv(reg, 'urina', 'asb.cfuCath') : pv(reg, 'urina', 'asb.cfu'), 0)} UFC/mL para o material, sem sintomas.`], ['Sem tratamento.']),
      r_nao_cat: R('low', 'Bacteriúria assintomática em sonda de longa permanência: não tratar', ['A IDSA 2019 não recomenda rastrear nem tratar bacteriúria assintomática em pacientes com sonda vesical, de curta ou longa duração.'], ['Tratar apenas se surgirem sintomas ou sinais de infecção sistêmica; trocar a sonda se estiver há mais de poucas semanas e for tratar.']),
      r_gest: R('high', 'Bacteriúria assintomática na gestação: tratar', (reg) => [`A IDSA 2019 recomenda rastrear e tratar na gestação, por ${fmt(pv(reg, 'urina', 'asb.pregDaysMin'), 0)} a ${fmt(pv(reg, 'urina', 'asb.pregDaysMax'), 0)} dias.`], ['Escolher o antibiótico pelo antibiograma e compatível com a gestação; repetir a urocultura após o tratamento conforme o protocolo do pré-natal.']),
      r_proc: R('mod', 'Bacteriúria assintomática antes de procedimento urológico invasivo: tratar', ['A IDSA 2019 recomenda rastrear e tratar antes de procedimentos urológicos com sangramento de mucosa.'], ['Combinar com a equipe de urologia o momento e o antibiótico, guiados pela cultura.']),
      r_nao: R('low', 'Bacteriúria assintomática: não tratar', (reg, v) => ['A IDSA 2019 recomenda não rastrear nem tratar bacteriúria assintomática em mulheres e homens saudáveis, diabéticos, idosos (inclusive ILPI), transplantados renais com mais de 1 mês e crianças.', v.pop === 'idoso' ? 'Em idoso com delirium e bacteriúria, buscar outras causas e observar, em vez de tratar.' : ''].filter(Boolean), ['Tratar só se surgirem sintomas urinários ou sinais de infecção sistêmica.', 'Evitar repetir urocultura de controle em quem não tem sintomas.']),
      sed: {
        t: 'form', q: 'Sedimento urinário (microscopia)', fields: [chk('hemacias', 'Hematúria (hemácias aumentadas)'), num('acant', 'Acantócitos (G1)', '% das hemácias', false), chk('cHemat', 'Cilindros hemáticos'), chk('cLeuc', 'Cilindros leucocitários'), chk('cGran', 'Cilindros granulosos (marrom-lamacentos)'), chk('prot', 'Proteinúria associada'), chk('mens', 'Possível contaminação menstrual')],
        route(v, reg) {
          if (v.cHemat || (v.acant != null && v.acant >= pv(reg, 'urina', 'acantocitos.pct'))) return { next: 'r_glom' };
          if (v.cLeuc) return { next: 'r_leuc' };
          if (v.cGran) return { next: 'r_gran' };
          if (v.hemacias) return { next: 'r_iso' };
          return { next: 'r_sed_ok' };
        },
      },
      r_glom: R('high', 'Hematúria de origem glomerular provável', (reg, v) => [v.cHemat ? 'Cilindros hemáticos são muito específicos de lesão glomerular.' : `Acantócitos ≥ ${fmt(pv(reg, 'urina', 'acantocitos.pct'), 0)}% sugerem origem glomerular. Não existe ponto de corte único validado para o dismorfismo, e ele depende do microscópio.`, v.prot ? 'Proteinúria associada reforça a hipótese.' : ''].filter(Boolean), ['Medir creatinina, RAC/proteinúria e pressão arterial; investigar glomerulopatia (complemento, FAN, sorologias virais) e encaminhar à Nefrologia.']),
      r_leuc: R('mod', 'Cilindros leucocitários', ['Sugerem inflamação renal: pielonefrite, nefrite intersticial ou glomerulonefrite proliferativa.'], ['Correlacionar com sintomas, urocultura e fármacos (AINEs, antibióticos); creatinina e encaminhar se houver queda da função.']),
      r_gran: R('mod', 'Cilindros granulosos', ['Podem refletir lesão tubular (necrose tubular aguda) ou doença renal crônica.'], ['Avaliar creatinina em série, volemia, nefrotóxicos e hipotensão recente.']),
      r_iso: R('mod', 'Hematúria sem sinais glomerulares', (reg, v) => [v.mens ? 'Pode haver contaminação menstrual: repetir após o período.' : 'Hematúria isomórfica sugere origem urológica (cálculo, tumor, infecção, hiperplasia prostática).'], ['Repetir o exame para confirmar hematúria persistente, urocultura, ultrassom de vias urinárias e encaminhar à Urologia (investigação ampliada se fatores de risco para neoplasia urológica).']),
      r_sed_ok: R('low', 'Sem hematúria, dismorfismo ou cilindros patológicos nesta amostra', ['Cilindros hialinos ocasionais são normais.'], []),
    },
  };

  const FLUXOS = [tireoide, sifilis, toxo, hbv, hepato, fan, imwg, urina];
  const byId = (id) => FLUXOS.find((f) => f.id === id);

  /* ---------- motor do grafo ---------- */
  const resolve = (x, reg, ctx) => (typeof x === 'function' ? x(reg, ctx) : x);

  /* Converte e valida as respostas de um nó 'form'; devolve { vals } ou { error }. */
  function readForm(node, raw) {
    const vals = {};
    for (const f of node.fields) {
      const r = raw[f.id];
      if (f.type === 'check') { vals[f.id] = !!r; continue; }
      if (f.type === 'select') {
        if (r === undefined || r === '' || r === null) { if (f.req) return { error: `Escolha: ${f.label}.` }; continue; }
        if (!f.options.some((o) => o[0] === String(r))) return { error: `Valor inválido em ${f.label}.` };
        vals[f.id] = String(r); continue;
      }
      const x = LC.parseNum(r);
      if (x == null) { if (f.req) return { error: `Informe um número em ${f.label}.` }; continue; }
      vals[f.id] = x;
    }
    return { vals };
  }

  /* Avança um passo: devolve { ctx, next } ou { error }. */
  function step(flow, ctx, nodeId, answer, reg) {
    const node = flow.nodes[nodeId];
    if (node.t === 'choice') {
      const o = node.opts.find((x) => x.v === answer);
      return o ? { ctx: Object.assign({}, ctx, { ['q_' + nodeId]: answer }), next: o.next } : { error: 'Escolha uma das opções.' };
    }
    if (node.t === 'form') {
      const r = readForm(node, answer || {});
      if (r.error) return r;
      const merged = Object.assign({}, ctx, r.vals);
      const route = node.route(merged, reg);
      return route.error ? { error: route.error } : { ctx: merged, next: route.next };
    }
    return { error: 'Este nó já é o resultado.' };
  }

  /* Resolve o texto de um nó de resultado. */
  function result(flow, nodeId, ctx, reg) {
    const n = flow.nodes[nodeId];
    const extra = n.extra ? n.extra(ctx, reg) : [];
    return { id: nodeId, level: n.level, title: n.title, texts: resolve(n.texts, reg, ctx).concat(extra), recs: n.recs, selos: flow.guideline.map((g) => LC.selo(reg, g)) };
  }

  /* Percorre o fluxo com uma lista de respostas (strings para 'choice', objetos para 'form'); usado nos testes. */
  function play(flowId, answers, reg) {
    const flow = byId(flowId);
    let node = flow.start, ctx = {};
    const path = [node];
    for (const a of answers) {
      const s = step(flow, ctx, node, a, reg);
      if (s.error) return { error: s.error, path };
      ctx = s.ctx; node = s.next; path.push(node);
    }
    return flow.nodes[node].t === 'result' ? { path, ctx, result: result(flow, node, ctx, reg) } : { path, ctx, pending: node };
  }

  /* Texto para o prontuário a partir de um resultado de fluxo. */
  function nota(flow, res, nowISO) {
    const L = [`${flow.titulo} (LabCore APS) — ${String(nowISO).split('-').reverse().join('/')}`, `Resultado: ${res.title}`];
    res.texts.forEach((t) => L.push(t));
    if (res.recs.length) { L.push('Sugestões (revisar antes de adotar):'); res.recs.forEach((r) => L.push(`- ${r}`)); }
    L.push(`Fonte: ${res.selos.join(' ')}`, 'Apoio à decisão; não substitui o julgamento clínico.');
    return L.join('\n');
  }

  /* Registra um fluxograma vindo de CUSTOM_FLOWS_PLUGINS (ou de outro adendo). Valida a estrutura antes de aceitar. */
  function registrar(flow) {
    const erros = [];
    if (!flow || typeof flow.id !== 'string' || !/^[a-z][a-z0-9_]*$/.test(flow.id)) erros.push('id inválido');
    else if (byId(flow.id)) erros.push(`id já existe: ${flow.id}`);
    if (!flow || !flow.titulo) erros.push('falta o título');
    if (!flow || !flow.nodes || !flow.nodes[flow.start]) erros.push('nó inicial inexistente');
    else Object.entries(flow.nodes).forEach(([id, n]) => {
      if (n.t === 'choice') (n.opts || []).forEach((o) => { if (!flow.nodes[o.next]) erros.push(`${id} aponta para "${o.next}", que não existe`); });
      else if (n.t === 'form') { if (typeof n.route !== 'function' || !Array.isArray(n.fields)) erros.push(`${id}: formulário sem route() ou fields`); }
      else if (n.t === 'result') { if (!n.title) erros.push(`${id}: resultado sem título`); }
      else erros.push(`${id}: tipo de nó desconhecido`);
    });
    if (erros.length) return { ok: false, erros };
    flow.guideline = Array.isArray(flow.guideline) ? flow.guideline : [];
    flow.resumo = flow.resumo || '';
    FLUXOS.push(flow);
    return { ok: true, erros: [] };
  }

  return { FLUXOS, byId, step, result, play, nota, readForm, registrar };
});
