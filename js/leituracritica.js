/* Leitura crítica de artigos: RoB 2 (ensaios randomizados) e calculadora de efeito. Nenhum dado sai do navegador. */
(function () {
'use strict';
const REGRAS = {
 "versao": "0.1.0",
 "atualizado_em": "2026-10-13",
 "instrumento": "RoB 2 (ensaios clínicos randomizados de grupos paralelos)",
 "fonte": {
  "nome": "Sterne JAC et al. RoB 2: a revised tool for assessing risk of bias in randomised trials. BMJ 2019;366:l4898",
  "doi": "10.1136/bmj.l4898",
  "documento_conferido": "Cochrane RoB 2 full guidance, parallel-group trials, versão de 22 de agosto de 2019 (PDF oficial, 72 p.)",
  "paginas_conferidas": "Tabela 1 (p. 4); Caixas 4, 6, 7, 8, 10, 11; Tabelas 3 a 14; Figuras 1 a 5 e 7",
  "conferencia": "primaria",
  "traducao": "Texto das perguntas em português é tradução própria, não oficial; o original em inglês acompanha cada pergunta.",
  "excluido": "Variantes para ensaios por conglomerados e cruzados não incluídas (têm documento próprio)."
 },
 "opcoes": {
  "Y": "Sim",
  "PY": "Provavelmente sim",
  "PN": "Provavelmente não",
  "N": "Não",
  "NI": "Sem informação",
  "NA": "Não se aplica"
 },
 "julgamentos": {
  "baixo": "Baixo risco",
  "algumas": "Algumas preocupações",
  "alto": "Alto risco"
 },
 "dominios": [
  {
   "id": "D1",
   "titulo": "Processo de randomização",
   "perguntas": [
    {
     "id": "1.1",
     "pt": "A sequência de alocação foi aleatória?",
     "en": "Was the allocation sequence random?",
     "dica": "Sim se houve componente aleatório (números aleatórios gerados por computador, tabela, moeda, dado). Não se alternância, data de nascimento, prontuário ou decisão do clínico. Sem informação se só diz 'randomizado'."
    },
    {
     "id": "1.2",
     "pt": "A sequência de alocação foi mantida oculta até os participantes serem incluídos e designados às intervenções?",
     "en": "Was the allocation sequence concealed until participants were enrolled and assigned to interventions?",
     "dica": "Sim com alocação central (telefone, internet, farmácia independente) ou envelopes opacos, numerados, lacrados. Não se quem incluía podia saber a próxima alocação."
    },
    {
     "id": "1.3",
     "pt": "Diferenças basais entre os grupos sugerem problema no processo de randomização?",
     "en": "Did baseline differences between intervention groups suggest a problem with the randomization process?",
     "dica": "Diferenças compatíveis com o acaso não contam. Sim se grupos de tamanho muito diferente do planejado ou excesso de diferenças significativas."
    }
   ]
  },
  {
   "id": "D2",
   "titulo": "Desvios das intervenções pretendidas",
   "variantes": {
    "assignment": {
     "rotulo": "Efeito da designação à intervenção (análise por intenção de tratar)",
     "perguntas": [
      {
       "id": "2.1",
       "pt": "Os participantes sabiam a qual intervenção foram designados durante o estudo?",
       "en": "Were participants aware of their assigned intervention during the trial?",
       "dica": "Cegamento do participante (placebo, sham). Efeitos adversos específicos de uma intervenção que revelam o grupo contam como Sim."
      },
      {
       "id": "2.2",
       "pt": "Os cuidadores e quem aplicou as intervenções sabiam a intervenção designada a cada participante durante o estudo?",
       "en": "Were carers and people delivering the interventions aware of participants' assigned intervention during the trial?",
       "dica": "Se a alocação não foi oculta, provavelmente sabiam."
      },
      {
       "id": "2.3",
       "pt": "Houve desvios da intervenção pretendida que surgiram por causa do contexto do ensaio?",
       "en": "If Y/PY/NI to 2.1 or 2.2: Were there deviations from the intended intervention that arose because of the trial context?",
       "condicao": "Responda se 2.1 ou 2.2 foi Sim, Provavelmente sim ou Sem informação.",
       "dica": "Só Sim se há evidência de que o contexto do ensaio levou a não seguir o protocolo. Não adesão que também ocorreria fora do ensaio é Não."
      },
      {
       "id": "2.4",
       "pt": "Esses desvios provavelmente afetaram o desfecho?",
       "en": "If Y/PY to 2.3: Were these deviations likely to have affected the outcome?",
       "condicao": "Responda se 2.3 foi Sim ou Provavelmente sim."
      },
      {
       "id": "2.5",
       "pt": "Esses desvios da intervenção pretendida foram equilibrados entre os grupos?",
       "en": "If Y/PY/NI to 2.4: Were these deviations from intended intervention balanced between groups?",
       "condicao": "Responda se 2.4 foi Sim, Provavelmente sim ou Sem informação."
      },
      {
       "id": "2.6",
       "pt": "Foi usada análise apropriada para estimar o efeito da designação à intervenção?",
       "en": "Was an appropriate analysis used to estimate the effect of assignment to intervention?",
       "dica": "ITT e ITT modificada (excluindo quem não tem desfecho) são apropriadas. 'Por protocolo' ingênua e 'como tratado' são inadequadas."
      },
      {
       "id": "2.7",
       "pt": "Houve potencial de impacto substancial no resultado por não analisar os participantes no grupo em que foram randomizados?",
       "en": "If N/PN/NI to 2.6: Was there potential for a substantial impact (on the result) of the failure to analyse participants in the group to which they were randomized?",
       "condicao": "Responda se 2.6 foi Não, Provavelmente não ou Sem informação.",
       "dica": "Não há regra exata; pode haver impacto mesmo com menos de 5% se o desfecho é raro."
      }
     ]
    },
    "adhering": {
     "rotulo": "Efeito de aderir à intervenção (análise por protocolo)",
     "perguntas": [
      {
       "id": "2.1",
       "pt": "Os participantes sabiam a qual intervenção foram designados durante o estudo?",
       "en": "Were participants aware of their assigned intervention during the trial?"
      },
      {
       "id": "2.2",
       "pt": "Os cuidadores e quem aplicou as intervenções sabiam a intervenção designada a cada participante durante o estudo?",
       "en": "Were carers and people delivering the interventions aware of participants' assigned intervention during the trial?"
      },
      {
       "id": "2.3",
       "pt": "As intervenções não previstas no protocolo e importantes foram equilibradas entre os grupos?",
       "en": "If applicable: If Y/PY/NI to 2.1 or 2.2: Were important non-protocol interventions balanced across intervention groups?",
       "condicao": "Responda se 2.1 ou 2.2 foi Sim, Provavelmente sim ou Sem informação. Use Não se aplica quando as considerações preliminares não incluírem esse aspecto.",
       "na": true
      },
      {
       "id": "2.4",
       "pt": "Houve falhas na implementação da intervenção que poderiam ter afetado o desfecho?",
       "en": "If applicable: Were there failures in implementing the intervention that could have affected the outcome?",
       "condicao": "Use Não se aplica quando as considerações preliminares não incluírem esse aspecto.",
       "na": true
      },
      {
       "id": "2.5",
       "pt": "Houve não adesão ao regime da intervenção designada que poderia ter afetado os desfechos dos participantes?",
       "en": "If applicable: Was there non-adherence to the assigned intervention regimen that could have affected participants' outcomes?",
       "condicao": "Use Não se aplica quando as considerações preliminares não incluírem esse aspecto.",
       "na": true
      },
      {
       "id": "2.6",
       "pt": "Foi usada análise apropriada para estimar o efeito de aderir à intervenção?",
       "en": "If N/PN/NI to 2.3, or Y/PY/NI to 2.4 or 2.5: Was an appropriate analysis used to estimate the effect of adhering to intervention?",
       "condicao": "Responda se 2.3 foi Não, Provavelmente não ou Sem informação, ou se 2.4 ou 2.5 foi Sim, Provavelmente sim ou Sem informação.",
       "dica": "ITT, 'por protocolo' ingênua e 'como tratado' em geral são inadequadas para este efeito; métodos como variável instrumental ou ponderação pelo inverso da probabilidade podem ser apropriados."
      }
     ]
    }
   }
  },
  {
   "id": "D3",
   "titulo": "Dados de desfecho ausentes",
   "perguntas": [
    {
     "id": "3.1",
     "pt": "Havia dados do desfecho para todos, ou quase todos, os participantes randomizados?",
     "en": "Were data for this outcome available for all, or nearly all, participants randomized?",
     "dica": "'Quase todos' = perda pequena a ponto de não mudar o efeito estimado. Dados imputados contam como ausentes."
    },
    {
     "id": "3.2",
     "pt": "Há evidência de que o resultado não foi enviesado pela ausência de dados?",
     "en": "If N/PN/NI to 3.1: Is there evidence that the result was not biased by missing outcome data?",
     "condicao": "Responda se 3.1 foi Não, Provavelmente não ou Sem informação.",
     "semNI": true,
     "dica": "Análises que corrigem o viés ou análises de sensibilidade com resultado pouco alterado. Imputação simples (LOCF) não basta."
    },
    {
     "id": "3.3",
     "pt": "A ausência de dados do desfecho poderia depender do seu valor verdadeiro?",
     "en": "If N/PN to 3.2: Could missingness in the outcome depend on its true value?",
     "condicao": "Responda se 3.2 foi Não ou Provavelmente não."
    },
    {
     "id": "3.4",
     "pt": "É provável que a ausência de dados do desfecho tenha dependido do seu valor verdadeiro?",
     "en": "If Y/PY/NI to 3.3: Is it likely that missingness in the outcome depended on its true value?",
     "condicao": "Responda se 3.3 foi Sim, Provavelmente sim ou Sem informação.",
     "dica": "Sim se as proporções ou os motivos de perda diferem entre grupos, ou se o contexto torna a perda dependente do desfecho."
    }
   ]
  },
  {
   "id": "D4",
   "titulo": "Aferição do desfecho",
   "perguntas": [
    {
     "id": "4.1",
     "pt": "O método de aferição do desfecho foi inadequado?",
     "en": "Was the method of measuring the outcome inappropriate?",
     "dica": "Sim se pouco sensível a efeitos plausíveis ou instrumento com validade ruim. Não avalia se o desfecho escolhido é substituto."
    },
    {
     "id": "4.2",
     "pt": "A aferição ou verificação do desfecho poderia ter diferido entre os grupos de intervenção?",
     "en": "Could measurement or ascertainment of the outcome have differed between intervention groups?",
     "dica": "Métodos, limiares e momentos comparáveis. Mais consultas em um grupo podem gerar viés de detecção."
    },
    {
     "id": "4.3",
     "pt": "Os avaliadores do desfecho sabiam a intervenção recebida pelos participantes?",
     "en": "If N/PN/NI to 4.1 and 4.2: Were outcome assessors aware of the intervention received by study participants?",
     "condicao": "Responda se 4.1 e 4.2 foram Não, Provavelmente não ou Sem informação.",
     "dica": "Em desfechos relatados pelo participante, o avaliador é o próprio participante."
    },
    {
     "id": "4.4",
     "pt": "A avaliação do desfecho poderia ter sido influenciada pelo conhecimento da intervenção recebida?",
     "en": "If Y/PY/NI to 4.3: Could assessment of the outcome have been influenced by knowledge of intervention received?",
     "condicao": "Responda se 4.3 foi Sim, Provavelmente sim ou Sem informação.",
     "dica": "Pouco provável em desfechos objetivos (ex.: mortalidade por todas as causas)."
    },
    {
     "id": "4.5",
     "pt": "É provável que a avaliação do desfecho tenha sido influenciada pelo conhecimento da intervenção recebida?",
     "en": "If Y/PY/NI to 4.4: Is it likely that assessment of the outcome was influenced by knowledge of intervention received?",
     "condicao": "Responda se 4.4 foi Sim, Provavelmente sim ou Sem informação."
    }
   ]
  },
  {
   "id": "D5",
   "titulo": "Seleção do resultado relatado",
   "perguntas": [
    {
     "id": "5.1",
     "pt": "Os dados que geraram este resultado foram analisados de acordo com um plano de análise pré-especificado, finalizado antes de os dados do desfecho sem cegamento estarem disponíveis?",
     "en": "Were the data that produced this result analysed in accordance with a pre-specified analysis plan that was finalized before unblinded outcome data were available for analysis?",
     "dica": "Compare protocolo ou plano estatístico com o artigo. Mudanças antes do desbloqueio, ou claramente alheias aos resultados, não geram preocupação."
    },
    {
     "id": "5.2",
     "pt": "É provável que o resultado avaliado tenha sido selecionado, com base nos resultados, entre várias medidas elegíveis do desfecho (escalas, definições, momentos) dentro do mesmo domínio?",
     "en": "Is the numerical result being assessed likely to have been selected, on the basis of the results, from multiple eligible outcome measurements within the outcome domain?"
    },
    {
     "id": "5.3",
     "pt": "É provável que o resultado avaliado tenha sido selecionado, com base nos resultados, entre várias análises elegíveis dos dados?",
     "en": "Is the numerical result being assessed likely to have been selected, on the basis of the results, from multiple eligible analyses of the data?",
     "dica": "Ex.: ajustado e não ajustado, valor final x variação da linha de base, diferentes pontos de corte ou covariáveis."
    }
   ]
  }
 ],
 "pendencias": [
  "Texto em português das perguntas é tradução própria, sem versão oficial conferida.",
  "Variantes de ensaio por conglomerados e cruzado (documentos separados) não implementadas.",
  "O guia remete as 'considerações preliminares' (desfecho, resultado, efeito de interesse) a cada avaliação; a ferramenta pede só o efeito de interesse e o desfecho."
 ]
};
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf = (x, d) => Number(x).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const pct = (x, d) => nf(x * 100, d == null ? 1 : d) + '%';
const num = (v) => { if (v == null) return NaN; const t = String(v).trim().replace(',', '.'); return t === '' ? NaN : Number(t); };

const JUL = REGRAS.julgamentos;
const ICON = { baixo: '✔', algumas: '!', alto: '✖' };
const OPT_ORDER = ['Y', 'PY', 'PN', 'N', 'NI', 'NA'];
const OPT_CURTO = { Y: 'Sim', PY: 'Prov. sim', PN: 'Prov. não', N: 'Não', NI: 'Sem info.', NA: 'Não se aplica' };

const st = { sub: 'rob', rob: { efeito: 'assignment', estudo: '', desfecho: '', resp: { D1: {}, D2: {}, D2b: {}, D3: {}, D4: {}, D5: {} } },
  ef: { tipo: 'dic', favoravel: false, ev1: '', n1: '', ev0: '', n0: '', m1: '', sd1: '', n1c: '', m0: '', sd0: '', n0c: '', basal: '' } };
let ultimo = '';

/* ---------- RoB 2 ---------- */
function perguntasDe(dom, efeito) {
  const d = REGRAS.dominios.find((x) => x.id === dom);
  return d.variantes ? d.variantes[efeito].perguntas : d.perguntas;
}
function opcoesQ(chave, id) { return RoB2._opcoes(chave)[id]; }
function respKey(dom, efeito) { return dom === 'D2' && efeito === 'adhering' ? 'D2b' : dom; }
function chaveEngine(dom, efeito) { return dom === 'D2' ? (efeito === 'adhering' ? 'D2b' : 'D2a') : dom; }

function qHtml(dom, efeito, q) {
  const chave = chaveEngine(dom, efeito), rk = respKey(dom, efeito);
  const ops = opcoesQ(chave, q.id);
  const nome = `lc-${rk}-${q.id}`;
  const cur = st.rob.resp[rk][q.id];
  const radios = OPT_ORDER.filter((o) => ops.includes(o)).map((o) =>
    `<label class="lc-opt"><input type="radio" name="${nome}" data-d="${dom}" data-q="${q.id}" value="${o}"${cur === o ? ' checked' : ''}><span>${esc(OPT_CURTO[o])}</span></label>`).join('');
  return `<fieldset class="lc-q" data-fq="${rk}|${q.id}"><legend><span class="lc-n">${q.id}</span> ${esc(q.pt)}</legend>`
    + (q.condicao ? `<p class="lc-cond">${esc(q.condicao)}</p>` : '')
    + `<div class="lc-opts" role="radiogroup">${radios}</div>`
    + (q.dica ? `<details class="lc-dica"><summary>Como responder</summary><p>${esc(q.dica)}</p></details>` : '')
    + `<details class="lc-dica"><summary>Pergunta original (inglês)</summary><p lang="en">${esc(q.en)}</p></details></fieldset>`;
}
function buildRob() {
  const ef = st.rob.efeito;
  const doms = REGRAS.dominios.map((d, i) => {
    let corpo;
    if (d.variantes) {
      corpo = ['assignment', 'adhering'].map((v) =>
        `<div class="lc-var" data-var="${v}"><p class="lc-sub">${esc(d.variantes[v].rotulo)}</p>${d.variantes[v].perguntas.map((q) => qHtml('D2', v, q)).join('')}</div>`).join('');
    } else corpo = d.perguntas.map((q) => qHtml(d.id, ef, q)).join('');
    return `<details class="lc-grp" data-dom="${d.id}"${i === 0 ? ' open' : ''}><summary><span>${i + 1}. ${esc(d.titulo)}</span><span class="lc-bd" data-bd="${d.id}"></span></summary>${corpo}</details>`;
  }).join('');
  $('#lc-rob-form').innerHTML =
    `<label class="lc-field"><span>Estudo (opcional)</span><input id="lc-estudo" type="text" autocomplete="off" placeholder="ex.: autor, ano, nome do ensaio" value="${esc(st.rob.estudo)}"></label>
     <label class="lc-field"><span>Desfecho avaliado (opcional)</span><input id="lc-desfecho" type="text" autocomplete="off" placeholder="ex.: mortalidade cardiovascular em 12 meses" value="${esc(st.rob.desfecho)}"></label>
     <fieldset class="lc-q lc-efeito"><legend>Efeito de interesse</legend>
      <label class="lc-opt lc-wide"><input type="radio" name="lc-efeito" value="assignment"${ef === 'assignment' ? ' checked' : ''}><span>Efeito da designação (intenção de tratar). Padrão para decidir se vale oferecer a intervenção.</span></label>
      <label class="lc-opt lc-wide"><input type="radio" name="lc-efeito" value="adhering"${ef === 'adhering' ? ' checked' : ''}><span>Efeito de aderir à intervenção (por protocolo).</span></label></fieldset>
     <p class="lc-intro">Responda apenas as perguntas que aparecem: o caminho do algoritmo oficial define quais são necessárias.</p>${doms}
     <div class="lc-actions"><button id="lc-rob-limpar" class="btn btn-ghost" type="button">Limpar</button><button id="lc-rob-copiar" class="btn" type="button">Copiar resumo</button></div>`;
}
function engineInput() {
  const r = st.rob.resp;
  return { D1: r.D1, D2: st.rob.efeito === 'adhering' ? r.D2b : r.D2, D3: r.D3, D4: r.D4, D5: r.D5 };
}
function renderRob() {
  const ef = st.rob.efeito;
  const out = RoB2.avaliarRob2(engineInput(), ef);
  // visibilidade das variantes e das perguntas no caminho
  document.querySelectorAll('#lc-rob-form .lc-var').forEach((v) => { v.hidden = v.dataset.var !== ef; });
  document.querySelectorAll('#lc-rob-form [data-fq]').forEach((f) => { f.hidden = true; });
  out.dominios.forEach((d) => {
    const rk = respKey(d.id, ef);
    d.visitadas.forEach((q) => { const f = document.querySelector(`#lc-rob-form [data-fq="${rk}|${q}"]`); if (f) f.hidden = false; });
    const b = document.querySelector(`#lc-rob-form [data-bd="${d.id}"]`);
    b.textContent = d.julgamento ? ICON[d.julgamento] + ' ' + JUL[d.julgamento] : (d.visitadas.length && Object.keys(st.rob.resp[rk]).length ? 'em andamento' : '');
    b.className = 'lc-bd' + (d.julgamento ? ' lc-' + d.julgamento : '');
  });
  const totalResp = out.dominios.reduce((n, d) => n + d.visitadas.filter((q) => st.rob.resp[respKey(d.id, ef)][q]).length, 0);
  const el = $('#lc-rob-res');
  if (!totalResp) {
    el.innerHTML = '<div class="lc-card lc-empty">Responda as perguntas à esquerda. O julgamento de cada domínio aparece conforme o algoritmo oficial do RoB 2.</div>';
    ultimo = ''; return;
  }
  const linhas = out.dominios.map((d, i) => `<li class="lc-dom ${d.julgamento ? 'lc-' + d.julgamento : 'lc-pend'}"><span class="lc-di">${d.julgamento ? ICON[d.julgamento] : '…'}</span><span><b>${i + 1}. ${esc(d.titulo)}</b><br>${d.julgamento ? esc(JUL[d.julgamento]) : 'Faltam respostas (próxima pergunta: ' + esc(d.pendente || '') + ')'}</span></li>`).join('');
  let glob;
  if (out.global) {
    const txt = { baixo: 'Baixo risco de viés em todos os domínios para este resultado.', algumas: 'Algumas preocupações em pelo menos um domínio, sem alto risco em nenhum.', alto: 'Alto risco de viés em pelo menos um domínio: o resultado deve ser lido com muita cautela.' }[out.global];
    glob = `<div class="lc-card lc-glob lc-${out.global}"><p class="lc-gl">Julgamento global sugerido</p><h3><span class="lc-di">${ICON[out.global]}</span> ${esc(JUL[out.global])}</h3><p>${esc(txt)}</p>${out.alertas.map((a) => `<p class="lc-warn"><b>Atenção</b> ${esc(a)}</p>`).join('')}</div>`;
  } else {
    const falta = out.dominios.filter((d) => !d.julgamento).length;
    glob = `<div class="lc-card lc-glob"><p class="lc-gl">Julgamento global sugerido</p><h3>Incompleto</h3><p>${falta} domínio(s) ainda sem julgamento. ${out.dominios.some((d) => d.julgamento === 'alto') ? 'Já há pelo menos um domínio de alto risco, o que implica alto risco global, mas conclua o preenchimento para documentar.' : ''}</p></div>`;
  }
  el.innerHTML = glob + `<div class="lc-card"><h3 class="lc-h">Por domínio</h3><ul class="lc-doms">${linhas}</ul>
    <p class="lc-note">Julgamentos sugeridos pelo algoritmo oficial; o avaliador pode alterá-los e deve justificar quando divergir. Efeito de interesse: ${esc(REGRAS.dominios[1].variantes[ef].rotulo)}.</p></div>`;
  const L = ['Risco de viés (RoB 2, ensaio randomizado): apoio à decisão; confirme na leitura do artigo'];
  if (st.rob.estudo) L.push('Estudo: ' + st.rob.estudo);
  if (st.rob.desfecho) L.push('Desfecho: ' + st.rob.desfecho);
  L.push('Efeito de interesse: ' + REGRAS.dominios[1].variantes[ef].rotulo);
  out.dominios.forEach((d, i) => L.push(`${i + 1}. ${d.titulo}: ${d.julgamento ? JUL[d.julgamento] : 'incompleto'}`));
  L.push('Global: ' + (out.global ? JUL[out.global] : 'incompleto'));
  out.alertas.forEach((a) => L.push('Atenção: ' + a));
  L.push('Fonte: ' + REGRAS.fonte.nome);
  ultimo = L.join('\n');
}

/* ---------- Efeito ---------- */
function buildEfeito() {
  const e = st.ef;
  const f = (id, rot, v, extra) => `<label class="lc-field"><span>${rot}</span><input id="${id}" type="text" inputmode="decimal" autocomplete="off" value="${esc(v)}" ${extra || ''}></label>`;
  $('#lc-ef-form').innerHTML =
    `<label class="lc-field"><span>Tipo de desfecho</span><select id="lc-ef-tipo"><option value="dic"${e.tipo === 'dic' ? ' selected' : ''}>Dicotômico (evento sim ou não)</option><option value="con"${e.tipo === 'con' ? ' selected' : ''}>Contínuo (média e desvio padrão)</option></select></label>
     <div id="lc-ef-dic"${e.tipo === 'dic' ? '' : ' hidden'}>
      <p class="lc-intro">Informe os números do artigo. O padrão considera evento desfavorável (morte, infarto, internação).</p>
      <label class="lc-check"><input type="checkbox" id="lc-fav"${e.favoravel ? ' checked' : ''}><span>O evento é favorável (ex.: cura)<small>Os cálculos passam a ser feitos sobre quem não teve o evento, para manter a leitura de risco.</small></span></label>
      <p class="lc-sub">Grupo intervenção</p><div class="lc-row2">${f('lc-ev1', 'Com evento', e.ev1)}${f('lc-n1', 'Total', e.n1)}</div>
      <p class="lc-sub">Grupo controle</p><div class="lc-row2">${f('lc-ev0', 'Com evento', e.ev0)}${f('lc-n0', 'Total', e.n0)}</div>
      <p class="lc-sub">Seu paciente (opcional)</p>${f('lc-basal', 'Risco basal do desfecho no seu paciente, em %', e.basal)}
     </div>
     <div id="lc-ef-con"${e.tipo === 'con' ? '' : ' hidden'}>
      <p class="lc-sub">Grupo intervenção</p><div class="lc-row3">${f('lc-m1', 'Média', e.m1)}${f('lc-sd1', 'Desvio padrão', e.sd1)}${f('lc-n1c', 'n', e.n1c)}</div>
      <p class="lc-sub">Grupo controle</p><div class="lc-row3">${f('lc-m0', 'Média', e.m0)}${f('lc-sd0', 'Desvio padrão', e.sd0)}${f('lc-n0c', 'n', e.n0c)}</div>
     </div>
     <div class="lc-actions"><button id="lc-ef-limpar" class="btn btn-ghost" type="button">Limpar</button><button id="lc-ef-copiar" class="btn" type="button">Copiar resumo</button></div>`;
}
const ic = (a, d, fmt) => '(' + (fmt || nf)(a[0], d) + ' a ' + (fmt || nf)(a[1], d) + ')';
function tile(n, v, sub) { return `<div class="lc-tile"><span class="lc-t-n">${n}</span><b>${v}</b><span class="lc-t-s">${sub || ''}</span></div>`; }
function renderEfeito() {
  const e = st.ef, el = $('#lc-ef-res');
  const L = ['Cálculo de efeito (apoio à decisão; confira com o artigo)'];
  if (e.tipo === 'dic') {
    const v = [e.ev1, e.n1, e.ev0, e.n0].map(num);
    if (v.some((x) => isNaN(x))) { el.innerHTML = '<div class="lc-card lc-empty">Informe eventos e totais dos dois grupos.</div>'; ultimo = ''; return; }
    let [ev1, n1, ev0, n0] = v;
    const inv = e.favoravel;
    const r = Efeito.dicotomico(inv ? { ev1: n1 - ev1, n1, ev0: n0 - ev0, n0 } : { ev1, n1, ev0, n0 });
    if (r.erro) { el.innerHTML = `<div class="lc-card lc-warn"><b>Entrada inválida</b> ${esc(r.erro)}</div>`; ultimo = ''; return; }
    const tipo = r.nnt.tipo;
    const t = [tile('Risco no grupo intervenção', pct(r.r1), inv ? 'sem o evento favorável' : ''), tile('Risco no grupo controle', pct(r.r0), inv ? 'sem o evento favorável' : '')];
    t.push(tile('Redução absoluta do risco (RAR)', pct(r.rar), 'IC 95% ' + ic(r.rar_ic.map((x) => x * 100), 1, (x, d) => nf(x, d) + '%') + ' · Newcombe-Wilson'));
    if (r.rr != null) t.push(tile('Risco relativo (RR)', nf(r.rr, 2), 'IC 95% ' + ic(r.rr_ic, 2)), tile('Redução relativa do risco (RRR)', pct(r.rrr, 0), 'IC 95% ' + ic(r.rrr_ic.map((x) => x * 100), 0, (x, d) => nf(x, d) + '%')), tile('Odds ratio (OR)', nf(r.or, 2), 'IC 95% ' + ic(r.or_ic, 2)));
    t.push(tile(tipo, r.nnt.valor == null ? '—' : nf(r.nnt.valor, 1), r.nnt.ic_texto));
    let ind = '';
    const basal = num(e.basal);
    if (e.basal !== '' && r.rr != null) {
      const b = basal / 100;
      const x = Efeito.nntIndividual(r.rr, b, r.rr_ic);
      if (x.erro) ind = `<p class="lc-warn"><b>Risco basal</b> ${esc(x.erro.replace('entre 0 e 1', 'entre 0% e 100%'))}</p>`;
      else {
        const ni = x.nnt_info;
        ind = `<div class="lc-card"><h3 class="lc-h">Para o seu paciente (risco basal ${nf(basal, 1)}%)</h3><p>Aplicando o RR do estudo ao risco basal: RAR de ${pct(x.rar, 2)} e ${ni ? ni.tipo : 'NNT'} de <b>${x.nnt == null ? '—' : nf(x.nnt, 0)}</b>. ${ni ? esc(ni.ic_texto) : ''}</p><p class="lc-note">Pressupõe que o risco relativo seja constante entre níveis de risco, o que nem sempre vale.</p></div>`;
        L.push(`Para o paciente (risco basal ${nf(basal, 1)}%): RAR ${pct(x.rar, 2)}, ${ni ? ni.tipo : 'NNT'} ${x.nnt == null ? '—' : nf(x.nnt, 0)}`);
      }
    }
    el.innerHTML = `<div class="lc-tiles">${t.join('')}</div>${r.avisos.map((a) => `<p class="lc-warn"><b>Atenção</b> ${esc(a)}</p>`).join('')}${ind}
      <p class="lc-note">${inv ? 'Evento favorável: cálculos sobre quem não teve o evento. ' : ''}Eventos desfavoráveis: RAR positiva e NNT indicam benefício da intervenção; valores negativos indicam dano (NNH). O NNT é sempre relativo ao tempo de seguimento do estudo.</p>`;
    L.push(`Intervenção ${ev1}/${n1} (${pct(ev1 / n1)}); controle ${ev0}/${n0} (${pct(ev0 / n0)})${inv ? ' [evento favorável; cálculo sobre quem não teve o evento]' : ''}`);
    L.push(`RAR ${pct(r.rar)} IC95% ${ic(r.rar_ic.map((x) => x * 100), 1, (x, d) => nf(x, d) + '%')}`);
    if (r.rr != null) L.push(`RR ${nf(r.rr, 2)} IC95% ${ic(r.rr_ic, 2)}; RRR ${pct(r.rrr, 0)}; OR ${nf(r.or, 2)} IC95% ${ic(r.or_ic, 2)}`);
    L.push(`${tipo}: ${r.nnt.valor == null ? '—' : nf(r.nnt.valor, 1)}. ${r.nnt.ic_texto}`);
    r.avisos.forEach((a) => L.push('Atenção: ' + a));
  } else {
    const v = [e.m1, e.sd1, e.n1c, e.m0, e.sd0, e.n0c].map(num);
    if (v.some((x) => isNaN(x))) { el.innerHTML = '<div class="lc-card lc-empty">Informe média, desvio padrão e n dos dois grupos.</div>'; ultimo = ''; return; }
    const r = Efeito.continuo({ m1: v[0], sd1: v[1], n1: v[2], m0: v[3], sd0: v[4], n0: v[5] });
    if (r.erro) { el.innerHTML = `<div class="lc-card lc-warn"><b>Entrada inválida</b> ${esc(r.erro)}</div>`; ultimo = ''; return; }
    const t = [tile('Diferença de médias (intervenção − controle)', nf(r.dm, 2), 'IC 95% ' + ic(r.dm_ic, 2))];
    if (r.d != null) t.push(tile('d de Cohen', nf(r.d, 2), 'g de Hedges: ' + nf(r.g, 2)));
    el.innerHTML = `<div class="lc-tiles">${t.join('')}</div>${r.avisos.map((a) => `<p class="lc-note">${esc(a)}</p>`).join('')}<p class="lc-note">A importância clínica depende do limiar mínimo clinicamente relevante da escala, que a ferramenta não conhece. Compare a diferença e seu IC com esse limiar.</p>`;
    L.push(`Intervenção: ${nf(v[0], 2)} (DP ${nf(v[1], 2)}, n=${v[2]}); controle: ${nf(v[3], 2)} (DP ${nf(v[4], 2)}, n=${v[5]})`);
    L.push(`Diferença de médias ${nf(r.dm, 2)} IC95% ${ic(r.dm_ic, 2)}` + (r.d != null ? `; d ${nf(r.d, 2)}; g ${nf(r.g, 2)}` : ''));
  }
  ultimo = L.join('\n');
}

/* ---------- montagem e eventos ---------- */
function copiar(btn) {
  const ok = () => { const t = btn.textContent; btn.textContent = 'Copiado'; setTimeout(() => { btn.textContent = t; }, 1800); };
  const fb = () => { const ta = document.createElement('textarea'); ta.value = ultimo; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); ok(); } catch (e) { btn.textContent = 'Copie manualmente'; } ta.remove(); };
  if (!ultimo) return;
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ultimo).then(ok, fb); else fb();
}
function mostrarSub() {
  $('#lc-pane-rob').hidden = st.sub !== 'rob';
  $('#lc-pane-ef').hidden = st.sub !== 'ef';
  document.querySelectorAll('#view-leitura .lc-seg button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.sub === st.sub)));
  if (st.sub === 'rob') renderRob(); else renderEfeito();
}
function init() {
  if (!$('#view-leitura')) return;
  buildRob(); buildEfeito();
  $('#lc-rodape').textContent = 'RoB 2 v' + REGRAS.versao + ' (' + REGRAS.fonte.documento_conferido + '), conferido em ' + REGRAS.atualizado_em.split('-').reverse().join('/') + '. ' + REGRAS.fonte.traducao;
  $('#lc-fonte').innerHTML = `<a href="https://doi.org/${esc(REGRAS.fonte.doi)}" target="_blank" rel="noopener noreferrer">${esc(REGRAS.fonte.nome)}</a>`;
  $('#lc-pend').innerHTML = REGRAS.pendencias.map((p) => `<li>${esc(p)}</li>`).join('');
  const root = $('#view-leitura');
  root.addEventListener('click', (e) => {
    const b = e.target.closest('.lc-seg button');
    if (b) { st.sub = b.dataset.sub; mostrarSub(); return; }
    if (e.target.closest('#lc-rob-limpar')) { st.rob.resp = { D1: {}, D2: {}, D2b: {}, D3: {}, D4: {}, D5: {} }; st.rob.estudo = ''; st.rob.desfecho = ''; buildRob(); renderRob(); return; }
    if (e.target.closest('#lc-ef-limpar')) { Object.assign(st.ef, { ev1: '', n1: '', ev0: '', n0: '', m1: '', sd1: '', n1c: '', m0: '', sd0: '', n0c: '', basal: '' }); buildEfeito(); renderEfeito(); return; }
    const c = e.target.closest('#lc-rob-copiar, #lc-ef-copiar'); if (c) copiar(c);
  });
  root.addEventListener('change', (e) => {
    const t = e.target;
    if (t.name === 'lc-efeito') { st.rob.efeito = t.value; renderRob(); return; }
    if (t.matches('input[type=radio][data-q]')) {
      const dom = t.dataset.d, rk = respKey(dom, st.rob.efeito), q = t.dataset.q;
      st.rob.resp[rk][q] = t.value;
      if (dom === 'D2' && (q === '2.1' || q === '2.2')) { // as duas primeiras perguntas são as mesmas nas duas variantes
        const outro = rk === 'D2' ? 'D2b' : 'D2'; st.rob.resp[outro][q] = t.value;
        const irm = document.querySelector(`#lc-rob-form input[name="lc-${outro}-${q}"][value="${t.value}"]`); if (irm) irm.checked = true;
      }
      renderRob(); return;
    }
    if (t.id === 'lc-ef-tipo') { st.ef.tipo = t.value; $('#lc-ef-dic').hidden = t.value !== 'dic'; $('#lc-ef-con').hidden = t.value !== 'con'; renderEfeito(); }
    else if (t.id === 'lc-fav') { st.ef.favoravel = t.checked; renderEfeito(); }
  });
  const mapa = { 'lc-ev1': 'ev1', 'lc-n1': 'n1', 'lc-ev0': 'ev0', 'lc-n0': 'n0', 'lc-basal': 'basal', 'lc-m1': 'm1', 'lc-sd1': 'sd1', 'lc-n1c': 'n1c', 'lc-m0': 'm0', 'lc-sd0': 'sd0', 'lc-n0c': 'n0c' };
  root.addEventListener('input', (e) => {
    const t = e.target;
    if (mapa[t.id]) { st.ef[mapa[t.id]] = t.value; renderEfeito(); }
    else if (t.id === 'lc-estudo') { st.rob.estudo = t.value; renderRob(); }
    else if (t.id === 'lc-desfecho') { st.rob.desfecho = t.value; renderRob(); }
  });
  mostrarSub();
}
init();
})();
