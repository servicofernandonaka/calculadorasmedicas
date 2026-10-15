/* LabCore APS — Módulo 2 (adendo): analisador de líquidos cavitários (ascite: GASA e PBE; derrame pleural: critérios de Light e correção por diurético).
   Motor determinístico sem DOM; cortes lidos do Registry (guideline 'liquidos'). Apoio à decisão: não substitui o julgamento clínico. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./labcore-engine.js'));
  else root.LabCoreLiquidos = factory(root.LabCore);
})(typeof self !== 'undefined' ? self : this, function (LC) {
  'use strict';
  const fmt = LC.fmt;
  const gp = (reg) => { const o = {}; Object.entries(reg.guidelines.liquidos.params).forEach(([k, p]) => { o[k] = p.value; }); return o; };
  const r3 = (x) => Math.round(x * 1000) / 1000;
  const tem = (x) => x != null && Number.isFinite(x);

  /* v: { albS, albA, protA, pmn, glicA, ldhA, ldhLsn, ada, linfocitico, peso } (g/dL, células/mm³, mg/dL, U/L, kg) */
  function ascite(v, reg) {
    const p = gp(reg), padroes = [], alertas = [], avisos = [];
    const P = (id, level, title, text, recs) => padroes.push({ id, level, title, text, recs: recs || [] });
    let gasa = null, hp = null;
    if (tem(v.albS) && tem(v.albA)) {
      gasa = r3(v.albS - v.albA);
      hp = gasa >= p['gasa.cut'];
      if (hp) {
        if (tem(v.protA) && v.protA < p['asc.prot']) P('cirrose', 'mod', 'Transudato com hipertensão portal: cirrose hepática', `GASA ${fmt(gasa, 1)} g/dL (≥ ${fmt(p['gasa.cut'], 1)}) com proteína do líquido ${fmt(v.protA, 1)} g/dL (< ${fmt(p['asc.prot'], 1)}). A hipertensão portal é a causa em cerca de 97% dos casos com GASA alto.`, ['Restrição de sódio e diuréticos: espironolactona e furosemida na proporção de 100 mg para 40 mg por dia, com ajuste conforme resposta, sódio e função renal.', 'Avaliar a etiologia da cirrose e rastrear varizes e carcinoma hepatocelular; encaminhar à Hepatologia.']);
        else if (tem(v.protA)) P('cardiaca', 'mod', 'Transudato com hipertensão portal e proteína alta: causa pós-sinusoidal', `GASA ${fmt(gasa, 1)} g/dL com proteína do líquido ${fmt(v.protA, 1)} g/dL (≥ ${fmt(p['asc.prot'], 1)}): insuficiência cardíaca direita, congestão hepática ou síndrome de Budd-Chiari.`, ['Ecocardiograma, Doppler de veias hepáticas e porta e avaliação cardiológica; encaminhar conforme a causa.']);
        else P('portal', 'mod', 'Hipertensão portal (GASA alto)', `GASA ${fmt(gasa, 1)} g/dL. Informe a proteína total do líquido para separar cirrose de causa cardíaca ou Budd-Chiari.`);
      } else {
        P('exsudato', 'mod', 'Exsudato: ascite sem hipertensão portal', `GASA ${fmt(gasa, 1)} g/dL (< ${fmt(p['gasa.cut'], 1)}). Investigar carcinomatose peritoneal, tuberculose peritoneal, pancreatite e síndrome nefrótica.`, ['Citologia oncótica do líquido; considerar imagem e laparoscopia/biópsia peritoneal.']);
        if (v.linfocitico && tem(v.ada) && v.ada > p['ada.tb']) P('tb', 'high', 'Tuberculose peritoneal provável', `Predomínio linfocítico com ADA ${fmt(v.ada, 0)} U/L (> ${fmt(p['ada.tb'], 0)}).`, ['Encaminhar à Infectologia; confirmar com laparoscopia/biópsia peritoneal e cultura/PCR para micobactérias.']);
      }
    } else avisos.push('Informe a albumina sérica e a do líquido ascítico para calcular o GASA.');

    if (tem(v.pmn)) {
      if (v.pmn >= p['pmn.pbe']) {
        const dose = tem(v.peso) && v.peso > 0 ? ` (para ${fmt(v.peso, 0)} kg: ${fmt(p['alb.d1'] * v.peso, 0)} g no dia 1 e ${fmt(p['alb.d3'] * v.peso, 0)} g no dia 3)` : '';
        alertas.push({ level: 'high', title: 'EMERGÊNCIA: peritonite bacteriana espontânea (PBE) confirmada', text: `PMN ${fmt(v.pmn, 0)} células/mm³ (≥ ${fmt(p['pmn.pbe'], 0)}). Iniciar imediatamente cefotaxima ou ceftriaxona e albumina endovenosa ${fmt(p['alb.d1'], 1)} g/kg no dia 1 e ${fmt(p['alb.d3'], 1)} g/kg no dia 3${dose} para prevenir a síndrome hepatorrenal. Coletar hemoculturas e cultura do líquido em frascos de hemocultura antes do antibiótico, sem atrasar o tratamento; internar.` });
      } else padroes.push({ id: 'sem_pbe', level: 'low', title: 'PMN abaixo do critério de PBE', text: `PMN ${fmt(v.pmn, 0)} células/mm³ (< ${fmt(p['pmn.pbe'], 0)}). Se houver febre, dor abdominal ou piora clínica, repetir a paracentese.`, recs: [] });
    } else avisos.push('Sem a contagem de PMN não dá para afastar peritonite bacteriana espontânea.');

    // Peritonite secundária: proteína > 1, glicose < 50 e LDH acima do limite sérico (3 achados = alerta; 2 de 3 = possível)
    const achados = [];
    if (tem(v.protA)) achados.push(['proteína > ' + fmt(p['sec.prot'], 0) + ' g/dL', v.protA > p['sec.prot']]);
    if (tem(v.glicA)) achados.push(['glicose < ' + fmt(p['sec.glic'], 0) + ' mg/dL', v.glicA < p['sec.glic']]);
    if (tem(v.ldhA) && tem(v.ldhLsn)) achados.push(['LDH do líquido acima do limite sérico', v.ldhA > v.ldhLsn]);
    const n = achados.filter((a) => a[1]).length;
    if (achados.length === 3 && n === 3) alertas.push({ level: 'high', title: 'Suspeita de peritonite bacteriana secundária (perfuração de víscera oca)', text: 'Proteína > 1 g/dL, glicose < 50 mg/dL e LDH elevado no líquido ascítico: perfuração ou abscesso intra-abdominal até prova em contrário.', });
    else if (n >= 2) alertas.push({ level: 'high', title: 'Possível peritonite bacteriana secundária', text: `${achados.filter((a) => a[1]).map((a) => a[0]).join('; ')} (critério de Runyon: 2 de 3 achados). Pedir tomografia de abdome e avaliação cirúrgica; antibiótico de maior espectro e reavaliar o PMN em 48 horas.` });
    if (alertas.some((a) => /secundária/.test(a.title))) alertas[alertas.length - 1].text += ' Os cortes de glicose e proteína estão "a verificar" no Registry.';
    if (!padroes.length && !alertas.length) padroes.push({ id: 'vazio', level: 'info', title: 'Preencha os dados do líquido', text: 'Albumina sérica e do líquido (GASA), proteína e PMN são o mínimo.', recs: [] });
    return { gasa, hipertensaoPortal: hp, padroes, alertas, avisos, selos: [LC.selo(reg, 'liquidos')] };
  }

  /* v: { protP, protS, ldhP, ldhS, ldhLsn, albS, albP, ph, glicP, adaP, diuretico, linfocitico } */
  function pleural(v, reg) {
    const p = gp(reg), padroes = [], alertas = [], avisos = [];
    const P = (id, level, title, text, recs) => padroes.push({ id, level, title, text, recs: recs || [] });
    const crit = [];
    let rProt = null, rLdh = null;
    if (tem(v.protP) && tem(v.protS) && v.protS > 0) { rProt = v.protP / v.protS; crit.push({ n: `relação proteína pleural/sérica ${fmt(rProt, 2)} (> ${fmt(p['light.prot'], 1)})`, ok: rProt > p['light.prot'] }); }
    if (tem(v.ldhP) && tem(v.ldhS) && v.ldhS > 0) { rLdh = v.ldhP / v.ldhS; crit.push({ n: `relação LDH pleural/sérico ${fmt(rLdh, 2)} (> ${fmt(p['light.ldh'], 1)})`, ok: rLdh > p['light.ldh'] }); }
    if (tem(v.ldhP) && tem(v.ldhLsn)) crit.push({ n: `LDH pleural ${fmt(v.ldhP, 0)} U/L (> ${fmt(p['light.ldhUln'] * v.ldhLsn, 0)}, 2/3 do LSN do LDH sérico)`, ok: v.ldhP > p['light.ldhUln'] * v.ldhLsn });
    const positivos = crit.filter((c) => c.ok);
    let exsudato = positivos.length >= 1;
    const completo = crit.length === 3;
    if (!crit.length) avisos.push('Informe proteína e LDH pleurais e séricos (e o LSN do LDH sérico) para aplicar os critérios de Light.');
    else if (!completo) avisos.push(`Só ${crit.length} de 3 critérios de Light puderam ser avaliados: informe proteína, LDH pleural/sérico e o LSN do LDH sérico.`);
    let pseudo = false;
    if (crit.length) {
      if (exsudato) {
        P('exsudato', 'mod', `Exsudato (${positivos.length} de ${crit.length} critérios de Light)`, `Critérios positivos: ${positivos.map((c) => c.n).join('; ')}.`, ['Causas: pneumonia/derrame parapneumônico, neoplasia, tuberculose pleural, tromboembolismo pulmonar, doenças do tecido conjuntivo.', 'Complementar com citologia, citometria diferencial, ADA e cultura; avaliar imagem.']);
        if (v.diuretico) {
          const gAlb = tem(v.albS) && tem(v.albP) ? r3(v.albS - v.albP) : null, gProt = tem(v.protS) && tem(v.protP) ? r3(v.protS - v.protP) : null;
          const a = gAlb != null && gAlb > p['diur.alb'], b = gProt != null && gProt > p['diur.prot'];
          if (gAlb == null && gProt == null) avisos.push('Em uso de diurético: informe albumina sérica e pleural (ou proteínas) para calcular os gradientes e afastar pseudoexsudato.');
          else if (a || b) {
            pseudo = true; exsudato = false;
            P('pseudoexsudato', 'info', 'Pseudoexsudato induzido por diurético: transudato verdadeiro concentrado', `${gAlb != null ? `Gradiente de albumina soro-pleura ${fmt(gAlb, 1)} g/dL (> ${fmt(p['diur.alb'], 1)})` : ''}${gAlb != null && gProt != null ? '; ' : ''}${gProt != null ? `gradiente de proteína ${fmt(gProt, 1)} g/dL (> ${fmt(p['diur.prot'], 1)})` : ''}. Reclassificar como transudato (insuficiência cardíaca, hidrotórax hepático, síndrome nefrótica).`, ['Tratar a causa do transudato; evitar investigação invasiva desnecessária.']);
          } else P('diur_mantem', 'mod', 'Em uso de diurético: os gradientes não reclassificam', `Gradiente de albumina ${gAlb != null ? fmt(gAlb, 1) : '—'} g/dL e de proteína ${gProt != null ? fmt(gProt, 1) : '—'} g/dL abaixo dos cortes (${fmt(p['diur.alb'], 1)} e ${fmt(p['diur.prot'], 1)}): mantém-se como exsudato.`);
        }
        if (!pseudo && v.linfocitico && tem(v.adaP) && v.adaP > p['ada.tb']) P('tb', 'high', 'Tuberculose pleural provável', `Exsudato linfocítico com ADA ${fmt(v.adaP, 0)} U/L (> ${fmt(p['ada.tb'], 0)}).`, ['Confirmar com cultura/PCR do líquido ou biópsia pleural; encaminhar à Infectologia/Pneumologia.']);
      } else if (completo) P('transudato', 'low', 'Transudato (nenhum critério de Light)', 'Causas: insuficiência cardíaca, hidrotórax hepático (cirrose), síndrome nefrótica, hipoalbuminemia.', ['Tratar a causa de base; toracocentese terapêutica só se sintomático.']);
      else P('provavel_transudato', 'info', 'Nenhum critério avaliável positivo', 'Com critérios faltando, não dá para classificar como transudato.', []);
    }
    const emp = [];
    if (tem(v.ph) && v.ph < p['emp.ph']) emp.push(`pH ${fmt(v.ph, 2)} (< ${fmt(p['emp.ph'], 2)})`);
    if (tem(v.glicP) && v.glicP < p['emp.glic']) emp.push(`glicose ${fmt(v.glicP, 0)} mg/dL (< ${fmt(p['emp.glic'], 0)})`);
    if (tem(v.ldhP) && v.ldhP > p['emp.ldh']) emp.push(`LDH ${fmt(v.ldhP, 0)} U/L (> ${fmt(p['emp.ldh'], 0)})`);
    if (emp.length) alertas.push({ level: 'high', title: 'Derrame parapneumônico complicado / empiema: indicação de drenagem torácica', text: `${emp.join('; ')}. Indicação de drenagem torácica fechada imediata, com antibiótico e avaliação da Cirurgia Torácica/Pneumologia. O corte de glicose está "a verificar" no Registry.` });
    return { razaoProt: rProt, razaoLdh: rLdh, criterios: crit, exsudato: crit.length ? exsudato : null, pseudoexsudato: pseudo, padroes, alertas, avisos, selos: [LC.selo(reg, 'liquidos')] };
  }

  return { ascite, pleural };
});
