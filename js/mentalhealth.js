/* Saúde mental: segurança, PHQ-9, GAD-7, idosos, EPDS, AUDIT, MDQ, PC-PTSD-5 (motor determinístico; nenhum dado sai do navegador) */
(function(){
'use strict';
const REGRAS={
 "versao": "0.2.0",
 "atualizado_em": "2026-10-09",
 "escopo": "Adultos (18 anos ou mais). Depressão, ansiedade generalizada, segurança (risco suicida e emergências), idosos, pós-parto (EPDS), álcool (AUDIT), rastreio de bipolaridade (MDQ) e estresse pós-traumático (PC-PTSD-5). Apoio à decisão; não é diagnóstico.",
 "fontes": {
  "santos2013": {
   "nome": "Santos IS et al. Cad Saúde Pública 2013;29(8):1533-43 — validação do PHQ-9 no Brasil (Pelotas, n=447, padrão-ouro MINI)",
   "tipo": "primaria",
   "ano": 2013,
   "link": "https://scielosp.org/pdf/csp/2013.v29n8/1533-1543/pt",
   "nota": "Corte ótimo ≥9 (sensibilidade 77,5%, especificidade 86,7%); amostra populacional, não de UBS."
  },
  "spitzer2006": {
   "nome": "Spitzer RL et al. Arch Intern Med 2006;166:1092-7 — GAD-7",
   "tipo": "secundaria",
   "ano": 2006,
   "link": "https://depts.washington.edu/psychres/wordpress/wp-content/uploads/2017/09/gad7_ref.pdf",
   "nota": "Lido numa ficha de referência que cita o artigo (corte ≥10: sensibilidade 89%, especificidade 82%, n=965 em atenção primária). O artigo original não foi aberto."
  },
  "gad7_br": {
   "nome": "GAD-7 em português do Brasil (Psico, PUCRS) — itens, faixas e corte citado",
   "tipo": "primaria",
   "ano": 2016,
   "link": "https://revistaseletronicas.pucrs.br/revistapsico/article/download/39902/28152/203437",
   "nota": "Itens e faixas (0-4, 5-9, 10-14, 15-21). Cita 10 como corte geral e, nos métodos, escreve “acima de 10”: a redação é ambígua entre ≥10 e >10."
  },
  "moreno2016": {
   "nome": "Moreno AL et al. 2016 — estrutura fatorial do GAD-7 em adultos brasileiros (n=206, comunitária)",
   "tipo": "primaria",
   "ano": 2016,
   "link": "https://repositorio.usp.br/item/002852644",
   "nota": "Não recomenda ponto de corte; amostra jovem e universitária."
  },
  "nice_ng222": {
   "nome": "NICE NG222 — Depression in adults: treatment and management (2022)",
   "tipo": "primaria",
   "ano": 2022,
   "link": "https://www.nice.org.uk/guidance/NG222/chapter/recommendations",
   "nota": "Divide em menos grave (PHQ-9 <16) e mais grave (≥16). Recomendações 1.2.8–1.2.12 (risco), 1.4.x (antidepressivos), 1.5–1.6 (opções)."
  },
  "nice_cg113": {
   "nome": "NICE CG113 — Generalised anxiety disorder and panic disorder in adults (2011; atualizada 2020)",
   "tipo": "primaria",
   "ano": 2020,
   "link": "https://rightdecisions.scot.nhs.uk/media/1836/nice-generalised-anxiety-disorder-and-panic-disorder-in-adults-management-pdf-35109387756997.pdf",
   "nota": "Cuidado escalonado em 4 passos. A própria página do NICE registra a última checagem em março de 2020; verificar se houve atualização."
  },
  "mhgap2023": {
   "nome": "OMS — mhGAP guideline for mental, neurological and substance use disorders (2023)",
   "tipo": "primaria",
   "ano": 2023,
   "link": "https://iris.who.int/server/api/core/bitstreams/93e56376-0e64-4a08-bdd0-703313be5354/content",
   "nota": "Lido pela tabela-resumo (DEP1–DEP4, SUI1–SUI3), via cópia hospedada fora da OMS. O texto completo da seção de autoagressão/suicídio não foi lido."
  },
  "lei13819": {
   "nome": "Lei 13.819/2019 — Política Nacional de Prevenção da Automutilação e do Suicídio",
   "tipo": "primaria",
   "ano": 2019,
   "link": "https://www2.camara.leg.br/legin/fed/lei/2019/lei-13819-26-abril-2019-788025-normaatualizada-pl.pdf",
   "nota": "Art. 6º: notificação compulsória, sigilosa, de tentativa de suicídio e de autolesão (com ou sem ideação) pelos estabelecimentos de saúde. O texto não fixa prazo."
  },
  "raps_ms": {
   "nome": "Ministério da Saúde — Dados da Rede de Atenção Psicossocial (RAPS)",
   "tipo": "primaria",
   "ano": 2022,
   "link": "https://www.gov.br/saude/pt-br/acesso-a-informacao/acoes-e-programas/caps/raps/arquivos/dados-da-rede-de-atencao-psicossocial-raps.pdf/",
   "nota": "CAPS I/II/III (III é 24 h), CAPS AD, equipes multiprofissionais de atenção especializada em saúde mental (transtornos de gravidade moderada, referenciados da APS ou do CAPS), leitos em hospital geral."
  },
  "conass_cvv": {
   "nome": "Conass/Agência Saúde (jul/2018) — ligações ao CVV 188 gratuitas em todo o país",
   "tipo": "secundaria",
   "ano": 2018,
   "link": "https://www.conass.org.br/?p=14185",
   "nota": "Confirma 188 e a gratuidade; a matéria não confirma o horário de 24 h da linha telefônica."
  },
  "cssrs_triagem": {
   "nome": "C-SSRS (versão de triagem): lógica de triagem por itens, como descrita por uma plataforma clínica",
   "tipo": "secundaria",
   "ano": 2021,
   "link": "https://help.blueprint.ai/en/articles/5208202-columbia-suicide-severity-rating-scale-screen-c-ssrs-screen",
   "nota": "Itens 1-2 = risco baixo; 3 e 6 = médio; 4, 5 e 7 = alto. As perguntas deste app são adaptações em português e NÃO são a escala validada."
  },
  "figueira2009": {
   "nome": "Figueira P et al. Rev Saúde Pública 2009;43(Supl 1):79-84 — validação da EPDS no Brasil (n=245, Belo Horizonte, padrão-ouro Mini-Plus/DSM-IV)",
   "tipo": "primaria",
   "ano": 2009,
   "link": "https://scielosp.org/pdf/rsp/2009.v43suppl1/79-84/en",
   "nota": "Corte ótimo ≥10 (sensibilidade 86,4%, especificidade 91,1%); ≥12 daria sensibilidade 68,2%. Puérperas entre 40 e 90 dias, maternidade privada."
  },
  "epds_itens_br": {
   "nome": "EPDS em português do Brasil (tradução e validação de Santos, Martins e Pasquali), itens e pontuação",
   "tipo": "secundaria",
   "ano": 2007,
   "link": "https://periodicos.ufpel.edu.br/index.php/enfermagem/article/download/5525/17206",
   "nota": "Fonte dos 10 itens e da pontuação (itens 1, 2 e 4 de 0 a 3; demais de 3 a 0). A página não traz corte; conferir o artigo de validação original."
  },
  "epds_pt": {
   "nome": "EPDS, versão em português de Portugal (Fiocruz/ICICT) — corte ≥12",
   "tipo": "secundaria",
   "ano": 0,
   "link": "https://www.icict.fiocruz.br/sites/www.icict.fiocruz.br/files/Escala%20de%20Depressao%20Pos-parto%20de%20Edimburgo%20(EPDS).pdf",
   "nota": "Citado só para mostrar a divergência de corte (≥12 em material português; ≥10 na validação brasileira). Ano da edição não informado na página."
  },
  "audit_uw": {
   "nome": "AUDIT (OMS) — itens e zonas de risco, reproduzidos pela Univ. de Washington (PCL)",
   "tipo": "secundaria",
   "ano": 2024,
   "link": "https://pcl.psychiatry.uw.edu/wp-content/uploads/2024/12/AUDIT.pdf",
   "nota": "Itens em inglês, zonas I a IV (0-7, 8-15, 16-19, 20-40; este material usa 7 como limite inferior da zona II para mulheres). Texto original: OMS, Babor et al., 2ª ed., 2001, não aberto aqui. Pontos dos itens 9 e 10 (0, 2, 4) não constavam no texto extraído e seguem o AUDIT padrão."
  },
  "mdq_uw": {
   "nome": "MDQ (Hirschfeld 2000) — itens e critério de positividade, reproduzidos pela Univ. de Washington (PCL)",
   "tipo": "secundaria",
   "ano": 2021,
   "link": "https://pcl.psychiatry.uw.edu/wp-content/uploads/2021/12/MDQ.pdf",
   "nota": "Positivo: 7 ou mais dos 13 itens, vários ao mesmo tempo, e problema moderado ou sério. Artigo original (Hirschfeld 2000) não aberto."
  },
  "castelo2010": {
   "nome": "Castelo MS et al. Rev Bras Psiquiatr 2010 — validade do MDQ em população psiquiátrica brasileira (n=114, Fortaleza)",
   "tipo": "primaria",
   "ano": 2010,
   "link": "https://www.scielo.br/j/rbp/a/JBbkjB85qbQ9HpwwwT7kfYz/?lang=en",
   "nota": "Corte de 8 itens: sensibilidade 0,91, especificidade 0,70. Ambulatório especializado; os autores pedem validação na atenção primária."
  },
  "pcptsd5": {
   "nome": "PC-PTSD-5 (Prins et al. 2016) — National Center for PTSD, via ISTSS",
   "tipo": "secundaria",
   "ano": 2016,
   "link": "https://istss.org/clinical-resources/adult-trauma-assessments/primary-care-ptsd-screen-for-dsm-5/",
   "nota": "Corte ≥3 é o mais sensível; ≥4 é o mais eficiente. Valores de sensibilidade e especificidade não constavam na página. Não há validação brasileira aberta neste projeto."
  }
 },
 "seguranca": {
  "niveis": {
   "alto": {
    "rotulo": "Risco alto: interromper e agir agora",
    "bloqueia_manejo": true,
    "condutas": [
     "Não deixar o paciente sozinho e manter vigilância contínua até a transferência.",
     "Remover ou restringir acesso a meios letais (medicamentos, armas, pesticidas, cordas) com a família ou acompanhante.",
     "Acionar o SAMU (192) ou encaminhar por transporte seguro à UPA/pronto-socorro; se houver CAPS III (24 h) na região, acionar por telefone.",
     "Em psicose, agitação grave, risco para terceiros ou intoxicação/abstinência grave: tratar como urgência psiquiátrica.",
     "Registrar a avaliação e notificar tentativa de suicídio ou autolesão (Lei 13.819/2019, art. 6º).",
     "O risco suicida não é motivo para negar tratamento da depressão: depois de estabilizar, considerar a toxicidade em overdose, limitar a quantidade dispensada, ampliar o contato e discutir com o especialista (NICE NG222 1.2.9 e 1.2.12)."
    ],
    "fontes": [
     "nice_ng222",
     "lei13819",
     "raps_ms",
     "cssrs_triagem"
    ]
   },
   "medio": {
    "rotulo": "Alerta: avaliar o risco diretamente hoje",
    "bloqueia_manejo": false,
    "condutas": [
     "Perguntar de forma direta sobre ideação, método, intenção, plano e tentativas anteriores, e registrar (NICE NG222 1.2.8).",
     "Checar rede de apoio e acesso a meios letais; orientar a família a restringir esse acesso.",
     "Construir um plano de segurança com o paciente (contatos, sinais de alerta, estratégias, números de ajuda). A OMS considera essa intervenção opcional, com evidência de certeza muito baixa (mhGAP SUI1, condicional).",
     "Combinar retorno precoce e discutir o caso com o CAPS ou a equipe de matriciamento; ampliar o contato nos primeiros dias.",
     "Orientar o paciente e a família a procurar ajuda se piorar: SAMU 192, UPA, CVV 188 (ligação gratuita).",
     "Se houve tentativa de suicídio ou autolesão, notificar (Lei 13.819/2019, art. 6º).",
     "Ao prescrever antidepressivo, limitar a quantidade dispensada se necessário e evitar tricíclicos (toxicidade em overdose) (NICE NG222 1.2.12 e 1.4.25)."
    ],
    "fontes": [
     "nice_ng222",
     "mhgap2023",
     "lei13819",
     "conass_cvv",
     "cssrs_triagem"
    ]
   },
   "baixo": {
    "rotulo": "Sem sinal de risco imediato nas respostas",
    "bloqueia_manejo": false,
    "condutas": [
     "Reavaliar a segurança a cada consulta e sempre que o quadro piorar ou o tratamento mudar (NICE NG222 1.2.10–1.2.11)."
    ],
    "fontes": [
     "nice_ng222"
    ]
   }
  },
  "regras": {
   "alto_se_qualquer": [
    "intencao",
    "plano",
    "tentativa_3m",
    "psicose",
    "risco_terceiros",
    "intox_abst_grave"
   ],
   "medio_se_qualquer": [
    "ideacao",
    "metodo",
    "tentativa_vida",
    "autolesao_recente"
   ],
   "medio_se_phq9_item9_maior_ou_igual": 1,
   "medio_se_epds_item10_maior_ou_igual": 1
  },
  "aviso_triagem_nao_confirmada": "A triagem direta de segurança não foi confirmada. Pergunte sobre ideação suicida antes de interpretar as escalas (NICE NG222 1.2.8)."
 },
 "escalas": {
  "phq9": {
   "nome": "PHQ-9",
   "intro": "Nas últimas duas semanas, quantos dias o(a) sr.(a)...",
   "opcoes": [
    "Nenhum dia",
    "Menos de uma semana",
    "Uma semana ou mais",
    "Quase todos os dias"
   ],
   "itens": [
    "teve pouco interesse ou pouco prazer em fazer as coisas?",
    "se sentiu para baixo, deprimido(a) ou sem perspectiva?",
    "teve dificuldade para pegar no sono ou permanecer dormindo, ou dormiu mais do que de costume?",
    "se sentiu cansado(a) ou com pouca energia?",
    "teve falta de apetite ou comeu demais?",
    "se sentiu mal consigo mesmo(a) ou achou que é um fracasso, ou que decepcionou sua família ou a você mesmo(a)?",
    "teve dificuldade para se concentrar nas coisas (como ler o jornal ou ver televisão)?",
    "teve lentidão para se movimentar ou falar (a ponto das outras pessoas perceberem), ou ao contrário, esteve tão agitado(a) que ficava andando de um lado para o outro mais do que de costume?",
    "pensou em se ferir de alguma maneira ou que seria melhor estar morto(a)?"
   ],
   "funcional_pergunta": "Considerando as últimas duas semanas, os sintomas anteriores lhe causaram algum tipo de dificuldade para trabalhar ou estudar ou tomar conta das coisas em casa ou para se relacionar com as pessoas?",
   "funcional_opcoes": [
    "Nenhuma dificuldade",
    "Pouca dificuldade",
    "Muita dificuldade",
    "Extrema dificuldade"
   ],
   "faixas": [
    {
     "min": 0,
     "max": 4,
     "rotulo": "Sintomas mínimos ou ausentes"
    },
    {
     "min": 5,
     "max": 9,
     "rotulo": "Sintomas depressivos leves"
    },
    {
     "min": 10,
     "max": 14,
     "rotulo": "Sintomas depressivos moderados"
    },
    {
     "min": 15,
     "max": 19,
     "rotulo": "Sintomas depressivos moderadamente graves"
    },
    {
     "min": 20,
     "max": 27,
     "rotulo": "Sintomas depressivos graves"
    }
   ],
   "faixas_conferencia": "pendente",
   "faixas_nota": "As faixas 5/10/15/20 são as usuais da escala original (Kroenke 2001) e ainda não foram conferidas na fonte primária neste projeto.",
   "corte_brasil": 9,
   "corte_internacional": 10,
   "corte_nice_mais_grave": 16,
   "fontes": [
    "santos2013",
    "nice_ng222"
   ]
  },
  "gad7": {
   "nome": "GAD-7",
   "intro": "Nas últimas duas semanas, com que frequência o(a) sr.(a) foi incomodado(a) pelos problemas abaixo?",
   "opcoes": [
    "Nenhuma vez",
    "Vários dias",
    "Mais da metade dos dias",
    "Quase todos os dias"
   ],
   "opcoes_nota": "Só os extremos (nenhuma vez, quase todos os dias) vieram da fonte brasileira lida; os rótulos intermediários seguem a versão padrão e precisam de conferência.",
   "itens": [
    "Sentir-se nervoso/a, ansioso/a ou muito tenso/a.",
    "Não ser capaz de impedir ou de controlar as preocupações.",
    "Preocupar-se muito com diversas coisas.",
    "Dificuldade para relaxar.",
    "Ficar tão agitado/a que se torna difícil permanecer sentado/a.",
    "Ficar facilmente aborrecido/a ou irritado/a.",
    "Sentir medo como se algo horrível fosse acontecer."
   ],
   "faixas": [
    {
     "min": 0,
     "max": 4,
     "rotulo": "Sintomas mínimos"
    },
    {
     "min": 5,
     "max": 9,
     "rotulo": "Sintomas de ansiedade leves"
    },
    {
     "min": 10,
     "max": 14,
     "rotulo": "Sintomas de ansiedade moderados"
    },
    {
     "min": 15,
     "max": 21,
     "rotulo": "Sintomas de ansiedade graves"
    }
   ],
   "corte": 10,
   "fontes": [
    "spitzer2006",
    "gad7_br",
    "moreno2016"
   ]
  },
  "gds15": {
   "nome": "GDS-15 (idosos, 60 anos ou mais)",
   "intro": "Responda sobre a última semana.",
   "itens": [
    {
     "t": "Está satisfeito(a) com sua vida?",
     "pontua_se_sim": false
    },
    {
     "t": "Interrompeu muitas de suas atividades?",
     "pontua_se_sim": true
    },
    {
     "t": "Acha sua vida vazia?",
     "pontua_se_sim": true
    },
    {
     "t": "Aborrece-se com frequência?",
     "pontua_se_sim": true
    },
    {
     "t": "Sente-se de bem com a vida na maior parte do tempo?",
     "pontua_se_sim": false
    },
    {
     "t": "Teme que algo ruim lhe aconteça?",
     "pontua_se_sim": true
    },
    {
     "t": "Sente-se alegre a maior parte do tempo?",
     "pontua_se_sim": false
    },
    {
     "t": "Sente-se desamparado(a) com frequência?",
     "pontua_se_sim": true
    },
    {
     "t": "Prefere ficar em casa a sair e fazer coisas novas?",
     "pontua_se_sim": true
    },
    {
     "t": "Acha que tem mais problemas de memória que a maioria?",
     "pontua_se_sim": true
    },
    {
     "t": "Acha que é maravilhoso estar vivo(a) agora?",
     "pontua_se_sim": false
    },
    {
     "t": "Vale a pena viver como vive agora?",
     "pontua_se_sim": false
    },
    {
     "t": "Sente-se cheio(a) de energia?",
     "pontua_se_sim": false
    },
    {
     "t": "Acha que sua situação não tem saída?",
     "pontua_se_sim": true
    },
    {
     "t": "Acha que a maioria das pessoas está melhor que você?",
     "pontua_se_sim": true
    }
   ],
   "corte": 5,
   "faixas": [
    {
     "min": 0,
     "max": 4,
     "rotulo": "Sem sintomas depressivos significativos"
    },
    {
     "min": 5,
     "max": 10,
     "rotulo": "Sugestivo de depressão leve a moderada"
    },
    {
     "min": 11,
     "max": 15,
     "rotulo": "Sugestivo de depressão grave"
    }
   ],
   "conferencia": "pendente",
   "nota": "Itens, corte ≥5 e faixas vêm da versão brasileira (Almeida e Almeida, 1999) já usada na aba de calculadoras; a fonte primária ainda não foi reaberta neste projeto. Menos confiável em demência moderada a grave."
  },
  "minicog": {
   "nome": "Mini-Cog",
   "corte_positivo_menor_que": 3,
   "conferencia": "pendente",
   "nota": "Escore = palavras lembradas (0 a 3) + relógio normal (2) ou alterado (0). Menor que 3 sugere avaliação cognitiva detalhada (Borson 2000, citado na aba de calculadoras; fonte primária não reaberta)."
  },
  "epds": {
   "nome": "EPDS",
   "intro": "Nos últimos 7 dias, como a paciente se sentiu. Marque a resposta mais próxima.",
   "corte_brasil": 10,
   "corte_portugal": 12,
   "item_seguranca": 10,
   "itens": [
    {
     "t": "Eu tenho sido capaz de rir e achar graça das coisas",
     "o": [
      "Como eu sempre fiz.",
      "Não tanto quanto antes.",
      "Sem dúvida, menos que antes.",
      "De jeito nenhum."
     ],
     "p": [
      0,
      1,
      2,
      3
     ]
    },
    {
     "t": "Eu sinto prazer quando penso no que está por acontecer em meu dia-a-dia",
     "o": [
      "Como sempre senti.",
      "Talvez, menos que antes.",
      "Com certeza menos.",
      "De jeito nenhum."
     ],
     "p": [
      0,
      1,
      2,
      3
     ]
    },
    {
     "t": "Eu tenho me culpado sem necessidade quando as coisas saem erradas",
     "o": [
      "Sim, na maioria das vezes.",
      "Sim, algumas vezes.",
      "Não muitas vezes.",
      "Não, nenhuma vez."
     ],
     "p": [
      3,
      2,
      1,
      0
     ]
    },
    {
     "t": "Eu tenho me sentido ansiosa ou preocupada sem uma boa razão",
     "o": [
      "Não, de maneira alguma.",
      "Pouquíssimas vezes.",
      "Sim, algumas vezes.",
      "Sim, muitas vezes."
     ],
     "p": [
      0,
      1,
      2,
      3
     ]
    },
    {
     "t": "Eu tenho me sentido assustada ou em pânico sem um bom motivo",
     "o": [
      "Sim, muitas vezes.",
      "Sim, algumas vezes.",
      "Não muitas vezes.",
      "Não, nenhuma vez."
     ],
     "p": [
      3,
      2,
      1,
      0
     ]
    },
    {
     "t": "Eu tenho me sentido esmagada pelas tarefas e acontecimentos do meu dia-a-dia",
     "o": [
      "Sim. Na maioria das vezes eu não consigo lidar bem com eles.",
      "Sim. Algumas vezes não consigo lidar bem como antes.",
      "Não. Na maioria das vezes consigo lidar bem com eles.",
      "Não. Eu consigo lidar com eles tão bem quanto antes."
     ],
     "p": [
      3,
      2,
      1,
      0
     ]
    },
    {
     "t": "Eu tenho me sentido tão infeliz que eu tenho tido dificuldade de dormir",
     "o": [
      "Sim, na maioria das vezes.",
      "Sim, algumas vezes.",
      "Não muitas vezes.",
      "Não, nenhuma vez."
     ],
     "p": [
      3,
      2,
      1,
      0
     ]
    },
    {
     "t": "Eu tenho me sentido triste ou arrasada",
     "o": [
      "Sim, na maioria das vezes.",
      "Sim, muitas vezes.",
      "Não muitas vezes.",
      "Não, de jeito nenhum."
     ],
     "p": [
      3,
      2,
      1,
      0
     ]
    },
    {
     "t": "Eu tenho me sentido tão infeliz que eu tenho chorado",
     "o": [
      "Sim, quase todo o tempo.",
      "Sim, muitas vezes.",
      "De vez em quando.",
      "Não, nenhuma vez."
     ],
     "p": [
      3,
      2,
      1,
      0
     ]
    },
    {
     "t": "A idéia de fazer mal a mim mesma passou por minha cabeça",
     "o": [
      "Sim, muitas vezes, ultimamente.",
      "Algumas vezes nos últimos dias.",
      "Pouquíssimas vezes, ultimamente.",
      "Nenhuma vez."
     ],
     "p": [
      3,
      2,
      1,
      0
     ]
    }
   ],
   "fontes": [
    "figueira2009",
    "epds_itens_br",
    "epds_pt"
   ]
  },
  "audit": {
   "nome": "AUDIT",
   "intro": "Perguntas sobre o consumo de álcool no último ano.",
   "nota_traducao": "Redação em português é tradução própria do texto em inglês; conferir com a versão brasileira validada antes de uso amplo.",
   "itens": [
    {
     "t": "Com que frequência você consome bebidas que contêm álcool?",
     "o": [
      "Nunca",
      "Uma vez por mês ou menos",
      "2 a 4 vezes por mês",
      "2 a 3 vezes por semana",
      "4 ou mais vezes por semana"
     ],
     "p": [
      0,
      1,
      2,
      3,
      4
     ]
    },
    {
     "t": "Quantas doses contendo álcool você consome em um dia típico em que bebe?",
     "o": [
      "1 ou 2",
      "3 ou 4",
      "5 ou 6",
      "7 a 9",
      "10 ou mais"
     ],
     "p": [
      0,
      1,
      2,
      3,
      4
     ]
    },
    {
     "t": "Com que frequência você consome 5 ou mais doses em uma única ocasião?",
     "o": [
      "Nunca",
      "Menos de uma vez por mês",
      "Mensalmente",
      "Semanalmente",
      "Todo dia ou quase"
     ],
     "p": [
      0,
      1,
      2,
      3,
      4
     ]
    },
    {
     "t": "No último ano, com que frequência não conseguiu parar de beber depois de começar?",
     "o": [
      "Nunca",
      "Menos de uma vez por mês",
      "Mensalmente",
      "Semanalmente",
      "Todo dia ou quase"
     ],
     "p": [
      0,
      1,
      2,
      3,
      4
     ]
    },
    {
     "t": "No último ano, com que frequência deixou de fazer o que era esperado de você por causa da bebida?",
     "o": [
      "Nunca",
      "Menos de uma vez por mês",
      "Mensalmente",
      "Semanalmente",
      "Todo dia ou quase"
     ],
     "p": [
      0,
      1,
      2,
      3,
      4
     ]
    },
    {
     "t": "No último ano, com que frequência precisou beber pela manhã para se recuperar depois de uma bebedeira?",
     "o": [
      "Nunca",
      "Menos de uma vez por mês",
      "Mensalmente",
      "Semanalmente",
      "Todo dia ou quase"
     ],
     "p": [
      0,
      1,
      2,
      3,
      4
     ]
    },
    {
     "t": "No último ano, com que frequência sentiu culpa ou remorso depois de beber?",
     "o": [
      "Nunca",
      "Menos de uma vez por mês",
      "Mensalmente",
      "Semanalmente",
      "Todo dia ou quase"
     ],
     "p": [
      0,
      1,
      2,
      3,
      4
     ]
    },
    {
     "t": "No último ano, com que frequência não conseguiu lembrar o que aconteceu na noite anterior por causa da bebida?",
     "o": [
      "Nunca",
      "Menos de uma vez por mês",
      "Mensalmente",
      "Semanalmente",
      "Todo dia ou quase"
     ],
     "p": [
      0,
      1,
      2,
      3,
      4
     ]
    },
    {
     "t": "Você ou outra pessoa já se feriu por causa da sua bebida?",
     "o": [
      "Não",
      "Sim, mas não no último ano",
      "Sim, no último ano"
     ],
     "p": [
      0,
      2,
      4
     ]
    },
    {
     "t": "Algum parente, amigo, médico ou outro profissional de saúde já se preocupou com a sua bebida ou sugeriu que você diminuísse?",
     "o": [
      "Não",
      "Sim, mas não no último ano",
      "Sim, no último ano"
     ],
     "p": [
      0,
      2,
      4
     ]
    }
   ],
   "zonas": [
    {
     "min": 0,
     "max": 7,
     "rotulo": "Zona I: consumo de baixo risco",
     "conduta": "Feedback e educação sobre álcool."
    },
    {
     "min": 8,
     "max": 15,
     "rotulo": "Zona II: uso de risco",
     "conduta": "Intervenção breve (aconselhamento)."
    },
    {
     "min": 16,
     "max": 19,
     "rotulo": "Zona III: uso nocivo",
     "conduta": "Intervenção breve e acompanhamento/terapia breve."
    },
    {
     "min": 20,
     "max": 40,
     "rotulo": "Zona IV: provável dependência",
     "conduta": "Intervenção breve e encaminhamento para avaliação e tratamento de dependência (CAPS AD)."
    }
   ],
   "corte_rastreio": 8,
   "nota_corte": "Algumas versões usam 7 como início da zona II para mulheres. Esta versão usa as zonas da OMS (8 a 15).",
   "fontes": [
    "audit_uw"
   ]
  },
  "mdq": {
   "nome": "MDQ",
   "intro": "Alguma vez houve um período em que você não era o(a) de sempre e...",
   "nota_traducao": "Redação em português é tradução própria do texto em inglês; conferir com a versão brasileira validada.",
   "itens": [
    "se sentiu tão bem ou tão \"ligado(a)\" que outras pessoas acharam que você não era o(a) de sempre, ou estava tão agitado(a) que se meteu em problemas",
    "esteve tão irritável que gritou com as pessoas ou começou brigas ou discussões",
    "se sentiu muito mais autoconfiante do que o habitual",
    "dormiu muito menos do que o habitual e não sentiu falta",
    "ficou mais falante ou falou muito mais rápido do que o habitual",
    "pensamentos corriam na cabeça ou não conseguia desacelerar a mente",
    "se distraiu com tanta facilidade com o que havia em volta que teve dificuldade de se concentrar",
    "teve muito mais energia do que o habitual",
    "esteve muito mais ativo(a) ou fez muito mais coisas do que o habitual",
    "esteve muito mais sociável ou expansivo(a) do que o habitual, por exemplo, telefonou para amigos de madrugada",
    "esteve muito mais interessado(a) em sexo do que o habitual",
    "fez coisas incomuns para você, ou que outras pessoas poderiam achar excessivas, tolas ou arriscadas",
    "gastar dinheiro causou problemas para você ou sua família"
   ],
   "pergunta_junto": "Se respondeu SIM a mais de um item, vários deles aconteceram ao mesmo tempo?",
   "pergunta_problema": "Quanto esses episódios causaram problemas (trabalho, família, dinheiro, questões legais, brigas)?",
   "opcoes_problema": [
    "Nenhum problema",
    "Problema leve",
    "Problema moderado",
    "Problema sério"
   ],
   "corte_original": 7,
   "corte_brasil": 8,
   "fontes": [
    "mdq_uw",
    "castelo2010"
   ]
  },
  "pcptsd5": {
   "nome": "PC-PTSD-5",
   "intro": "Rastreio de estresse pós-traumático para o último mês.",
   "nota_traducao": "Redação em português é tradução própria do texto em inglês (a pergunta de exposição não foi lida na fonte); conferir antes de uso amplo.",
   "exposicao": "Na vida, você viveu ou presenciou um evento muito perturbador, como acidente grave, violência, abuso, morte violenta ou ameaça à vida?",
   "itens": [
    "Teve pesadelos com o evento ou pensou nele quando não queria?",
    "Tentou muito não pensar no evento ou evitou situações que o lembrassem?",
    "Ficou constantemente em guarda, vigilante ou facilmente assustado(a)?",
    "Sentiu-se entorpecido(a) ou distante de pessoas, atividades ou do que está ao redor?",
    "Sentiu-se culpado(a) ou incapaz de parar de culpar a si mesmo(a) ou outros pelo evento ou por problemas causados por ele?"
   ],
   "corte_sensivel": 3,
   "corte_eficiente": 4,
   "fontes": [
    "pcptsd5"
   ]
  }
 },
 "manejo": {
  "depressao": {
   "menos_grave": {
    "rotulo": "Depressão menos grave (PHQ-9 até 15)",
    "opcoes": [
     "Autoajuda guiada (opção menos intrusiva; NICE sugere começar por ela, respeitando a preferência)",
     "Terapia cognitivo-comportamental individual ou em grupo",
     "Ativação comportamental individual ou em grupo",
     "Exercício físico em grupo",
     "Mindfulness ou meditação em grupo",
     "Psicoterapia interpessoal",
     "Aconselhamento (counselling)",
     "Psicoterapia psicodinâmica breve"
    ],
    "opcoes_medicamento": "ISRS é uma das opções, mas o NICE não recomenda antidepressivo como primeira linha de rotina, a menos que o paciente prefira (NG222 1.5.3).",
    "seguimento": "Reavaliar em 2 a 4 semanas se o paciente recusar tratamento ou estiver melhorando (NG222 1.5.1).",
    "fontes": [
     "nice_ng222",
     "mhgap2023"
    ]
   },
   "mais_grave": {
    "rotulo": "Depressão mais grave (PHQ-9 16 ou mais)",
    "opcoes": [
     "TCC individual combinada com antidepressivo",
     "TCC individual",
     "Ativação comportamental individual",
     "Resolução de problemas individual",
     "Psicoterapia interpessoal",
     "Aconselhamento ou psicoterapia psicodinâmica breve",
     "Autoajuda guiada e exercício em grupo (como complemento)"
    ],
    "opcoes_medicamento": "Antidepressivo é opção de primeira linha, em decisão compartilhada (NG222 1.6.1). A OMS recomenda com força as intervenções psicológicas estruturadas e, de forma condicional, ISRS ou amitriptilina; propõe antidepressivo isolado só quando a psicoterapia não está disponível (mhGAP DEP1, DEP3, DEP4).",
    "seguimento": "Revisar a resposta em 2 a 4 semanas (primeira revisão em até 2 semanas é habitual) e continuar o antidepressivo por pelo menos 6 meses após a remissão (NG222 1.4.3; mhGAP DEP2).",
    "fontes": [
     "nice_ng222",
     "mhgap2023"
    ]
   },
   "cautelas_antidepressivo": [
    "Revisar entre 2 e 4 semanas e monitorar efeitos adversos e pensamentos suicidas; em adultos jovens ou com risco maior, reavaliar em cerca de 1 semana (NG222 1.4.3, 1.4.24).",
    "Alertar o paciente e a família de que agitação, ansiedade e ideação suicida podem aumentar no início do tratamento (NG222 1.2.10–1.2.11).",
    "Evitar tricíclicos de rotina em quem tem risco suicida importante (toxicidade em overdose) (NG222 1.4.25).",
    "Retirar de forma gradual, combinada com o paciente; paroxetina e venlafaxina têm maior risco de abstinência. Sintoma de retirada não é necessariamente recaída (NG222 1.4.13–1.4.22).",
    "Uso prolongado pode aumentar risco de sangramento e afetar a função sexual (NG222 1.8.3)."
   ],
   "cautelas_idoso": [
    "Checar saúde física e interações, monitorar de perto efeitos adversos, quedas e fraturas, e hiponatremia, sobretudo com diuréticos (NG222 1.4.26).",
    "Os Critérios de Beers 2023 ainda não foram incorporados (pendente)."
   ]
  },
  "ansiedade": {
   "passos": {
    "1": {
     "rotulo": "Passo 1: educação e monitorização ativa",
     "itens": [
      "Identificar e explicar o diagnóstico cedo e avaliar sofrimento e prejuízo funcional, não só a contagem de sintomas (CG113 1.2.2–1.2.9).",
      "Discutir produtos de venda livre e possíveis interações (CG113 1.2.10)."
     ]
    },
    "2": {
     "rotulo": "Passo 2: intervenções de baixa intensidade",
     "itens": [
      "Autoajuda baseada em TCC, sem facilitador, por pelo menos 6 semanas (CG113 1.2.12).",
      "Autoajuda guiada baseada em TCC, 5 a 7 sessões de 20 a 30 minutos (CG113 1.2.13).",
      "Grupos psicoeducativos baseados em TCC, cerca de 6 encontros semanais de 2 horas (CG113 1.2.14)."
     ]
    },
    "3": {
     "rotulo": "Passo 3: prejuízo marcante ou resposta inadequada ao passo 2",
     "itens": [
      "TCC ou relaxamento aplicado, geralmente 12 a 15 sessões semanais de 1 hora (CG113 1.2.17–1.2.19).",
      "A escolha entre psicoterapia e medicamento segue a preferência: nenhuma opção se mostrou melhor (CG113 1.2.16)."
     ]
    }
   },
   "medicamento": [
    "ISRS é a primeira opção; a sertralina é sugerida por custo-efetividade (CG113 1.2.22). Se falhar, outro ISRS ou um IRSN (CG113 1.2.23).",
    "Pregabalina só se ISRS/IRSN não forem tolerados, atento a abuso e ao status de substância controlada (CG113 1.2.24).",
    "Benzodiazepínicos apenas como medida de crise de curta duração (CG113 1.2.25). Não usar antipsicóticos na atenção primária (CG113 1.2.26).",
    "Explicar ativação inicial, início de efeito lento (uma semana ou mais) e a necessidade de manter o tratamento (CG113 1.2.27).",
    "Considerar gastroproteção quando o risco de sangramento é maior, sobretudo em idosos ou com AINE/AAS (CG113 1.2.28).",
    "Em menores de 30 anos: ver em até 1 semana e acompanhar o risco suicida semanalmente no primeiro mês (CG113 1.2.29).",
    "Revisar a cada 2 a 4 semanas nos 3 primeiros meses e depois a cada 3 meses; se eficaz, manter por pelo menos 1 ano (CG113 1.2.31–1.2.32)."
   ],
   "passo4": "Passo 4: encaminhar se houver ansiedade grave com prejuízo marcante associada a risco de autoagressão ou suicídio, comorbidade importante, autonegligência ou resposta inadequada ao passo 3 (CG113 1.2.36).",
   "fontes": [
    "nice_cg113"
   ]
  }
 },
 "diferencial": {
  "conferencia": "pendente",
  "nota": "Lista de consideração clínica; ainda não vinculada a uma diretriz específica neste projeto.",
  "itens": [
   "Hipotireoidismo e outras causas endócrinas (TSH)",
   "Anemia e deficiência de B12 (hemograma, B12)",
   "Medicamentos e substâncias que causam ou pioram sintomas (corticoide, benzodiazepínico, opioide, álcool e outras drogas)",
   "Uso nocivo de álcool ou outras substâncias (AUDIT e ASSIST entram na próxima fase)",
   "Apneia do sono e outras doenças crônicas ou dor",
   "Luto e eventos de vida recentes",
   "Em idosos: delirium e demência (a queixa pode ser cognitiva, não afetiva)",
   "Gestação e puerpério (usar a EPDS; fora do escopo desta versão)"
  ]
 },
 "bipolaridade": {
  "conferencia": "pendente",
  "aviso": "Há história de mania ou hipomania, ou o MDQ foi positivo: não iniciar antidepressivo isolado na atenção primária; discutir com psiquiatria. Regra de segurança padrão da prática clínica, ainda sem fonte vinculada neste projeto."
 },
 "encaminhamento": {
  "criterios": [
   "Risco considerável e imediato para si ou para outros: encaminhamento urgente (NICE NG222 1.2.9).",
   "Depressão psicótica: encaminhar para avaliação de risco e cuidado multiprofissional coordenado (NG222 1.12.1).",
   "Sintomas crônicos sem resposta: pedir orientação e tratamento especializado (NG222 1.10.8).",
   "Depressão grave ou complexa com prejuízo persistente depois de tratamentos prévios, ou comorbidade importante (NG222 1.16.9).",
   "Combinação ou potencialização de medicamentos: considerar avaliação especializada (NG222 1.9.9).",
   "Ansiedade em passo 4 (ver acima)."
  ],
  "rede": [
   "CAPS (I, II ou III; o CAPS III funciona 24 h) para transtornos graves e persistentes e para crise; CAPS AD para uso de álcool e outras drogas.",
   "Equipe multiprofissional de atenção especializada em saúde mental para quadros de gravidade moderada (ansiedade, transtornos de humor), referenciados da atenção primária ou do CAPS.",
   "Urgência: SAMU 192 e UPA/pronto-socorro; leitos de saúde mental em hospital geral para crise aguda."
  ],
  "fontes": [
   "nice_ng222",
   "raps_ms"
  ]
 },
 "ajuda_ao_paciente": "CVV 188 (ligação gratuita), SAMU 192.",
 "pendencias": [
  "Faixas de gravidade do PHQ-9 (Kroenke 2001): conferir no artigo original.",
  "GAD-7: abrir o artigo original (Spitzer 2006); conferir os rótulos intermediários das opções e se o corte é ≥10 ou >10 na validação brasileira.",
  "GDS-15 e Mini-Cog: reabrir as fontes primárias.",
  "mhGAP 2023: ler a seção completa de autoagressão e suicídio e a de depressão em idosos, na versão oficial da OMS.",
  "Critérios de Beers 2023 (antidepressivos e benzodiazepínicos em idosos): ainda não lidos.",
  "C-SSRS: obter a versão oficial em português e substituir as perguntas adaptadas deste app.",
  "Lista de diagnóstico diferencial e regra de bipolaridade: vincular a uma diretriz.",
  "NICE CG113: verificar se houve atualização depois de 2020.",
  "Caderno de Atenção Básica nº 34 (Saúde Mental) e protocolos locais de Itapevi: ainda não consultados.",
  "Normas da Anvisa sobre software como dispositivo médico: conferir antes de abrir para outros usuários.",
  "SRQ-20, ASRS-6 e ASSIST: ainda sem texto oficial dos itens e da pontuação em fonte aberta; não implementados nesta versão.",
  "EPDS: o corte ≥10 vem de um único estudo brasileiro (maternidade privada); abrir também o artigo de validação original (Santos 2007) e conferir o uso do item 10.",
  "AUDIT: abrir o manual original da OMS (2001) e a versão brasileira validada; confirmar pontos dos itens 9 e 10 e a redação em português.",
  "MDQ: abrir Hirschfeld 2000; o corte de 8 itens é de ambulatório psiquiátrico e não foi validado na atenção primária.",
  "PC-PTSD-5: abrir Prins 2016 (valores de sensibilidade e especificidade) e procurar versão brasileira; a pergunta de exposição foi escrita sem a fonte."
 ]
};
/* Motor determinístico de saúde mental (sem IA). Entrada -> segurança, escalas, manejo, encaminhamento. */
function avaliarMental(e, R) {
  const out = { avisos: [], seguranca: null, escalas: {}, manejo: null, diferencial: null, encaminhamento: null, ajuda: R.ajuda_ao_paciente };
  const idade = Number(e.idade);
  const usuarioMedico = e.usuario === 'medico';
  const seg = e.seg || {};
  const sexoM = e.sexo === 'M';
  const gest = !!e.gestacao_puerperio && !sexoM;
  const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v));
  const completo = (arr, n) => Array.isArray(arr) && arr.length === n && arr.every((v) => num(v) !== null && num(v) >= 0 && num(v) <= 3);

  /* ---- escalas ---- */
  const phqArr = e.phq9 || [];
  const phqOk = completo(phqArr, 9);
  const item9 = num(phqArr[8]);
  if (phqOk) {
    const tot = phqArr.reduce((a, v) => a + Number(v), 0);
    const f = R.escalas.phq9.faixas.find((x) => tot >= x.min && tot <= x.max);
    out.escalas.phq9 = {
      total: tot, faixa: f.rotulo, item9: Number(phqArr[8]),
      positivo_br: tot >= R.escalas.phq9.corte_brasil, positivo_int: tot >= R.escalas.phq9.corte_internacional,
      divergencia_corte: tot === R.escalas.phq9.corte_brasil,
      mais_grave: tot >= R.escalas.phq9.corte_nice_mais_grave,
      funcional: num(e.phq9_func),
    };
  }
  const gadArr = e.gad7 || [];
  if (completo(gadArr, 7)) {
    const tot = gadArr.reduce((a, v) => a + Number(v), 0);
    const f = R.escalas.gad7.faixas.find((x) => tot >= x.min && tot <= x.max);
    out.escalas.gad7 = { total: tot, faixa: f.rotulo, positivo: tot >= R.escalas.gad7.corte };
  }
  const gds = e.gds15 || [];
  if (idade >= 60 && Array.isArray(gds) && gds.length === 15 && gds.every((v) => v === 0 || v === 1 || v === true || v === false)) {
    const tot = gds.reduce((a, v, i) => a + ((v === 1 || v === true) === R.escalas.gds15.itens[i].pontua_se_sim ? 1 : 0), 0);
    const f = R.escalas.gds15.faixas.find((x) => tot >= x.min && tot <= x.max);
    out.escalas.gds15 = { total: tot, faixa: f.rotulo, positivo: tot >= R.escalas.gds15.corte };
  }
  const mc = e.minicog;
  if (idade >= 60 && mc && num(mc.palavras) !== null && (mc.relogio === 'normal' || mc.relogio === 'alterado')) {
    const tot = Number(mc.palavras) + (mc.relogio === 'normal' ? 2 : 0);
    out.escalas.minicog = { total: tot, positivo: tot < R.escalas.minicog.corte_positivo_menor_que };
  }

  /* ---- fase 2: EPDS, AUDIT, MDQ, PC-PTSD-5 (respostas = índice da opção) ---- */
  const idxOk = (arr, itens) => Array.isArray(arr) && arr.length === itens.length && arr.every((v, i) => Number.isInteger(num(v)) && num(v) >= 0 && num(v) < itens[i].p.length);
  const somaP = (arr, itens) => arr.reduce((a, v, i) => a + itens[i].p[Number(v)], 0);
  let epdsItem10 = null;
  const EP = R.escalas.epds;
  if (!sexoM && idxOk(e.epds, EP.itens)) {
    const tot = somaP(e.epds, EP.itens);
    epdsItem10 = EP.itens[EP.item_seguranca - 1].p[Number(e.epds[EP.item_seguranca - 1])];
    out.escalas.epds = { total: tot, positivo_br: tot >= EP.corte_brasil, positivo_pt: tot >= EP.corte_portugal, divergencia_corte: tot >= EP.corte_brasil && tot < EP.corte_portugal, item10: epdsItem10 };
  }
  const AU = R.escalas.audit;
  if (idxOk(e.audit, AU.itens)) {
    const tot = somaP(e.audit, AU.itens);
    const z = AU.zonas.find((x) => tot >= x.min && tot <= x.max);
    out.escalas.audit = { total: tot, zona: z.rotulo, conduta: z.conduta, positivo: tot >= AU.corte_rastreio, dependencia_provavel: tot >= 20, limite_mulheres: e.sexo === 'F' && tot === 7 };
  }
  const MQ = R.escalas.mdq;
  let mdqPos = false;
  if (e.mdq && Array.isArray(e.mdq.itens) && e.mdq.itens.length === MQ.itens.length && e.mdq.itens.every((v) => v === 0 || v === 1) && num(e.mdq.problema) !== null && e.mdq.problema >= 0 && e.mdq.problema <= 3) {
    const n = e.mdq.itens.reduce((a, v) => a + v, 0);
    const juntoOk = n < 2 ? true : (e.mdq.junto === 0 || e.mdq.junto === 1);
    if (juntoOk) {
      const junto = n >= 2 ? e.mdq.junto === 1 : n === 1;
      mdqPos = n >= MQ.corte_original && junto && e.mdq.problema >= 2;
      out.escalas.mdq = { itens_sim: n, positivo: mdqPos, criterio_br8: n >= MQ.corte_brasil, junto, problema: e.mdq.problema };
    }
  }
  const PT = R.escalas.pcptsd5;
  if (e.ptsd && (e.ptsd.exposicao === 0 || e.ptsd.exposicao === 1)) {
    if (e.ptsd.exposicao === 0) out.escalas.pcptsd5 = { total: 0, sem_exposicao: true, positivo: false, provavel: false };
    else if (Array.isArray(e.ptsd.itens) && e.ptsd.itens.length === PT.itens.length && e.ptsd.itens.every((v) => v === 0 || v === 1)) {
      const tot = e.ptsd.itens.reduce((a, v) => a + v, 0);
      out.escalas.pcptsd5 = { total: tot, sem_exposicao: false, positivo: tot >= PT.corte_sensivel, provavel: tot >= PT.corte_eficiente };
    }
  }

  /* ---- segurança (sempre primeiro) ---- */
  const rg = R.seguranca.regras;
  const motivos = [];
  const rot = { intencao: 'intenção de se matar', plano: 'plano suicida', tentativa_3m: 'tentativa de suicídio nos últimos 3 meses',
    psicose: 'sintomas psicóticos', risco_terceiros: 'risco para outras pessoas', intox_abst_grave: 'intoxicação ou abstinência grave',
    ideacao: 'pensamentos de morte ou de suicídio', metodo: 'pensou em como se matar', tentativa_vida: 'tentativa de suicídio na vida',
    autolesao_recente: 'autolesão recente' };
  let nivel = 'baixo';
  rg.alto_se_qualquer.forEach((k) => { if (seg[k]) { nivel = 'alto'; motivos.push(rot[k]); } });
  if (nivel !== 'alto') {
    rg.medio_se_qualquer.forEach((k) => { if (seg[k]) { nivel = 'medio'; motivos.push(rot[k]); } });
    if (item9 !== null && item9 >= rg.medio_se_phq9_item9_maior_ou_igual) {
      nivel = 'medio';
      motivos.push('PHQ-9, item 9 positivo (resposta ' + item9 + ')');
    }
    if (epdsItem10 !== null && epdsItem10 >= rg.medio_se_epds_item10_maior_ou_igual) {
      nivel = 'medio';
      motivos.push('EPDS, item 10 positivo (ideias de se machucar, pontuação ' + epdsItem10 + ')');
    }
  } else {
    if (item9 !== null && item9 >= 1) motivos.push('PHQ-9, item 9 positivo (resposta ' + item9 + ')');
    if (epdsItem10 !== null && epdsItem10 >= 1) motivos.push('EPDS, item 10 positivo (ideias de se machucar, pontuação ' + epdsItem10 + ')');
  }
  const niv = R.seguranca.niveis[nivel];
  const conds = niv.condutas.slice();
  if (seg.acesso_meios && nivel !== 'baixo') motivos.push('acesso a meios letais');
  out.seguranca = {
    nivel, rotulo: niv.rotulo, motivos, condutas: conds, bloqueia_manejo: !!niv.bloqueia_manejo, fontes: niv.fontes,
    notificar: !!(seg.tentativa_3m || seg.tentativa_vida || seg.autolesao_recente),
    triagem_confirmada: !!e.triagem_confirmada,
  };
  if (!e.triagem_confirmada && (phqOk || Object.keys(out.escalas).length)) out.avisos.push(R.seguranca.aviso_triagem_nao_confirmada);
  if (!Number.isFinite(idade)) { if (Object.keys(out.escalas).length) out.avisos.push('Informe a idade para liberar o manejo e o módulo de idosos.'); }
  else if (idade < 18) out.avisos.push('Esta versão é para adultos (18 anos ou mais). A triagem de segurança vale para qualquer idade; as escalas e o manejo abaixo não foram validados para menores.');
  if (gest) out.avisos.push('Gestação ou puerpério: usar a EPDS e a conduta específica; o manejo desta versão não cobre esse contexto.');

  /* ---- manejo ---- */
  const bloq = out.seguranca.bloqueia_manejo || !(idade >= 18) || gest;
  if (!bloq) {
    const m = { depressao: null, ansiedade: null, avisos: [] };
    const p = out.escalas.phq9, g = out.escalas.gad7, gd = out.escalas.gds15;
    const depPos = (p && p.positivo_br) || (gd && gd.positivo);
    if (p && depPos) {
      const bloco = R.manejo.depressao[p.mais_grave ? 'mais_grave' : 'menos_grave'];
      m.depressao = {
        rotulo: bloco.rotulo, opcoes: bloco.opcoes, seguimento: bloco.seguimento, fontes: bloco.fontes,
        medicamento: usuarioMedico ? bloco.opcoes_medicamento : null,
        cautelas: usuarioMedico ? R.manejo.depressao.cautelas_antidepressivo.concat(idade >= 60 ? R.manejo.depressao.cautelas_idoso : []) : [],
      };
      if (e.historia_mania || mdqPos) {
        m.avisos.push(R.bipolaridade.aviso);
        if (m.depressao.medicamento) { m.depressao.medicamento = null; m.depressao.cautelas = []; }
      }
    } else if (gd && gd.positivo && !p) {
      m.avisos.push('GDS-15 positivo sem PHQ-9: confirme com entrevista clínica e, se possível, complete o PHQ-9 para orientar o manejo.');
    }
    if (g && g.positivo) {
      const prej = !!e.prejuizo_marcante;
      const passos = R.manejo.ansiedade.passos;
      const lista = [passos['1']].concat(prej ? [passos['3']] : [passos['2']]);
      m.ansiedade = {
        passos: lista, passo4: R.manejo.ansiedade.passo4, fontes: R.manejo.ansiedade.fontes,
        medicamento: usuarioMedico && prej && !e.historia_mania ? R.manejo.ansiedade.medicamento : null,
      };
    } else if (g && g.total >= 5) {
      m.ansiedade = { passos: [R.manejo.ansiedade.passos['1']], passo4: null, fontes: R.manejo.ansiedade.fontes, medicamento: null };
    }
    if (idade >= 60 && out.escalas.minicog && out.escalas.minicog.positivo) {
      m.avisos.push('Mini-Cog positivo: avalie cognição, delirium e demência antes de atribuir os sintomas a depressão ou ansiedade.');
    }
    out.manejo = m;
  }

  /* ---- diferencial e encaminhamento ---- */
  const humor = ['phq9', 'gad7', 'gds15', 'minicog', 'epds'].some((k) => out.escalas[k]);
  out.diferencial = humor ? { itens: R.diferencial.itens.filter((t) => idade >= 60 || !t.startsWith('Em idosos')), conferencia: R.diferencial.conferencia, nota: R.diferencial.nota } : null;
  out.encaminhamento = Object.keys(out.escalas).length || nivel !== 'baixo' ? { criterios: R.encaminhamento.criterios, rede: R.encaminhamento.rede, fontes: R.encaminhamento.fontes } : null;
  out.entrada_resumo = { idade, sexo: e.sexo || null, usuario: usuarioMedico ? 'médico' : e.usuario === 'enfermagem' ? 'enfermagem/outros' : 'não informado' };
  return out;
}
if (false && typeof module !== 'undefined') module.exports = { avaliarMental };

(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const esc=(s)=>String(s==null?'':s).replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=(u)=>/^https:\/\//.test(u)?u:'#';
const ES=REGRAS.escalas;
const st={usuario:'',idade:'',sexo:'',gest:false,mania:false,prej:false,conf:false,seg:{},phq:Array(9).fill(null),func:null,gad:Array(7).fill(null),gds:Array(15).fill(null),mc:{palavras:'',relogio:''},epds:Array(10).fill(null),audit:Array(10).fill(null),mdq:{itens:Array(13).fill(null),junto:null,problema:null},ptsd:{exposicao:null,itens:Array(5).fill(null)}};
const novoEstado=()=>({epds:Array(10).fill(null),audit:Array(10).fill(null),mdq:{itens:Array(13).fill(null),junto:null,problema:null},ptsd:{exposicao:null,itens:Array(5).fill(null)}});

const SEG_A=[
 ['ideacao','Tem tido pensamentos de morte ou de se matar (último mês)'],
 ['metodo','Já pensou em como se mataria (método), sem intenção de fazer'],
 ['intencao','Tem intenção de se matar'],
 ['plano','Tem plano definido de como, quando ou onde'],
 ['tentativa_3m','Tentou se matar nos últimos 3 meses'],
 ['tentativa_vida','Já tentou se matar em algum momento da vida'],
 ['autolesao_recente','Autolesão recente, com ou sem ideação suicida'],
 ['acesso_meios','Tem acesso a meios letais','armas, grande quantidade de medicamentos, pesticidas']];
const SEG_B=[
 ['psicose','Sintomas psicóticos','alucinações, delírios, desorganização'],
 ['risco_terceiros','Risco de ferir outras pessoas'],
 ['intox_abst_grave','Intoxicação ou abstinência grave','álcool ou outras drogas']];

function chk(k,label,hint,attr){return `<label class="sm-check"><input type="checkbox" ${attr}="${k}"><span>${esc(label)}${hint?`<small>${esc(hint)}</small>`:''}</span></label>`;}
function scaleRows(key,items,opts,prefix){
 return items.map((t,i)=>`<fieldset class="sm-q"><legend><span class="sm-n">${i+1}</span> ${esc(prefix+t)}</legend><div class="sm-opts" role="radiogroup">`+
  opts.map((o,v)=>`<label class="sm-opt" title="${esc(o)}"><input type="radio" name="${key}-${i}" data-k="${key}" data-i="${i}" value="${v}"><span><b>${v}</b><i>${esc(o)}</i></span></label>`).join('')+`</div></fieldset>`).join('');
}
function itemRows(key,itens){
 return itens.map((it,i)=>`<fieldset class="sm-q"><legend><span class="sm-n">${i+1}</span> ${esc(it.t)}</legend><div class="sm-opts sm-list-opts" role="radiogroup">`+
  it.o.map((o,v)=>`<label class="sm-opt sm-opt-wide"><input type="radio" name="${key}-${i}" data-k="${key}" data-i="${i}" value="${v}"><span><i>${esc(o)}</i></span></label>`).join('')+`</div></fieldset>`).join('');
}
function ynRows(key,textos,extra){
 return textos.map((t,i)=>`<fieldset class="sm-q"><legend><span class="sm-n">${i+1}</span> ${esc(t)}</legend><div class="sm-opts sm-yn" role="radiogroup"><label class="sm-opt"><input type="radio" name="${key}-${i}" data-k="${key}" data-i="${i}" value="1"><span><b>Sim</b></span></label><label class="sm-opt"><input type="radio" name="${key}-${i}" data-k="${key}" data-i="${i}" value="0"><span><b>Não</b></span></label></div></fieldset>`).join('');
}
function build(){
 $('#sm-form').innerHTML=
 `<div class="sm-row2"><label class="sm-field"><span>Quem está usando</span><select id="sm-usuario"><option value="">Selecione…</option><option value="medico">Médico(a)</option><option value="enfermagem">Enfermagem e outros</option></select></label>
  <label class="sm-field" id="sm-f-idade"><span>Idade</span><input id="sm-idade" type="number" inputmode="numeric" min="0" max="120" step="1" autocomplete="off"></label></div>
  <div class="sm-row2" style="margin-top:10px"><label class="sm-field"><span>Sexo ao nascer</span><select id="sm-sexo"><option value="">Selecione…</option><option value="F">Feminino</option><option value="M">Masculino</option></select></label></div>
  <div class="sm-checks" style="margin-top:10px"><span id="sm-gest-wrap" hidden>${chk('gest','Gestação ou puerpério','','data-ctx')}</span>${chk('mania','História de mania ou hipomania','','data-ctx')}${chk('prej','Ansiedade com prejuízo funcional marcante','','data-ctx')}</div>
  <details class="sm-grp" open><summary><span>1. Segurança (pergunte antes de tudo)</span><span class="sm-cnt" id="sm-cnt-seg"></span></summary>
   <div class="sm-checks">${chk('conf','Perguntei diretamente ao paciente sobre ideação suicida','','data-ctx')}
   <p class="sm-sub">Marque o que o paciente relata</p>${SEG_A.map(([k,l,h])=>chk(k,l,h,'data-seg')).join('')}
   <p class="sm-sub">Situação clínica</p>${SEG_B.map(([k,l,h])=>chk(k,l,h,'data-seg')).join('')}</div></details>
  <details class="sm-grp"><summary><span>2. PHQ-9 (depressão)</span><span class="sm-cnt" id="sm-cnt-phq"></span></summary>
   <p class="sm-intro">${esc(ES.phq9.intro)}</p>${scaleRows('phq',ES.phq9.itens,ES.phq9.opcoes,'')}
   <fieldset class="sm-q"><legend>${esc(ES.phq9.funcional_pergunta)}</legend><div class="sm-opts" role="radiogroup">${ES.phq9.funcional_opcoes.map((o,v)=>`<label class="sm-opt" title="${esc(o)}"><input type="radio" name="func" data-k="func" value="${v}"><span><b>${v}</b><i>${esc(o)}</i></span></label>`).join('')}</div></fieldset></details>
  <details class="sm-grp"><summary><span>3. GAD-7 (ansiedade)</span><span class="sm-cnt" id="sm-cnt-gad"></span></summary>
   <p class="sm-intro">${esc(ES.gad7.intro)}</p>${scaleRows('gad',ES.gad7.itens,ES.gad7.opcoes,'')}</details>
  <details class="sm-grp" id="sm-idoso" hidden><summary><span>4. Idosos (60 anos ou mais)</span><span class="sm-cnt" id="sm-cnt-gds"></span></summary>
   <p class="sm-intro">GDS-15. ${esc(ES.gds15.intro)}</p>
   ${ES.gds15.itens.map((it,i)=>`<fieldset class="sm-q"><legend><span class="sm-n">${i+1}</span> ${esc(it.t)}</legend><div class="sm-opts sm-yn" role="radiogroup"><label class="sm-opt"><input type="radio" name="gds-${i}" data-k="gds" data-i="${i}" value="1"><span><b>Sim</b></span></label><label class="sm-opt"><input type="radio" name="gds-${i}" data-k="gds" data-i="${i}" value="0"><span><b>Não</b></span></label></div></fieldset>`).join('')}
   <fieldset class="sm-q"><legend>Mini-Cog: palavras lembradas (0 a 3) e relógio</legend><div class="sm-row2"><label class="sm-field"><span>Palavras</span><select id="sm-mc-p"><option value="">—</option><option>0</option><option>1</option><option>2</option><option>3</option></select></label>
   <label class="sm-field"><span>Relógio</span><select id="sm-mc-r"><option value="">—</option><option value="normal">Normal</option><option value="alterado">Alterado ou recusou</option></select></label></div></fieldset></details>
  <details class="sm-grp" id="sm-puerp" hidden><summary><span>5. Pós-parto: EPDS</span><span class="sm-cnt" id="sm-cnt-epds"></span></summary>
   <p class="sm-intro">${esc(ES.epds.intro)}</p>${itemRows('epds',ES.epds.itens)}</details>
  <details class="sm-grp"><summary><span>6. Álcool: AUDIT</span><span class="sm-cnt" id="sm-cnt-audit"></span></summary>
   <p class="sm-intro">${esc(ES.audit.intro)}</p><p class="sm-note">${esc(ES.audit.nota_traducao)}</p>${itemRows('audit',ES.audit.itens)}</details>
  <details class="sm-grp"><summary><span>7. Bipolaridade: MDQ</span><span class="sm-cnt" id="sm-cnt-mdq"></span></summary>
   <p class="sm-intro">${esc(ES.mdq.intro)}</p><p class="sm-note">${esc(ES.mdq.nota_traducao)}</p>${ynRows('mdq',ES.mdq.itens.map(t=>'... '+t+'?'))}
   <fieldset class="sm-q"><legend>${esc(ES.mdq.pergunta_junto)}</legend><div class="sm-opts sm-yn" role="radiogroup"><label class="sm-opt"><input type="radio" name="mdqj" data-k="mdqj" value="1"><span><b>Sim</b></span></label><label class="sm-opt"><input type="radio" name="mdqj" data-k="mdqj" value="0"><span><b>Não</b></span></label></div></fieldset>
   <fieldset class="sm-q"><legend>${esc(ES.mdq.pergunta_problema)}</legend><div class="sm-opts sm-list-opts" role="radiogroup">${ES.mdq.opcoes_problema.map((o,v)=>`<label class="sm-opt sm-opt-wide"><input type="radio" name="mdqp" data-k="mdqp" value="${v}"><span><i>${esc(o)}</i></span></label>`).join('')}</div></fieldset></details>
  <details class="sm-grp"><summary><span>8. Trauma: PC-PTSD-5</span><span class="sm-cnt" id="sm-cnt-ptsd"></span></summary>
   <p class="sm-intro">${esc(ES.pcptsd5.intro)}</p><p class="sm-note">${esc(ES.pcptsd5.nota_traducao)}</p>
   <fieldset class="sm-q"><legend>${esc(ES.pcptsd5.exposicao)}</legend><div class="sm-opts sm-yn" role="radiogroup"><label class="sm-opt"><input type="radio" name="ptx" data-k="ptx" value="1"><span><b>Sim</b></span></label><label class="sm-opt"><input type="radio" name="ptx" data-k="ptx" value="0"><span><b>Não</b></span></label></div></fieldset>
   <div id="sm-pt-itens" hidden><p class="sm-intro">No último mês, você...</p>${ynRows('pti',ES.pcptsd5.itens)}</div></details>
  <div class="sm-actions"><button id="sm-limpar" class="btn btn-ghost" type="button">Limpar</button><button id="sm-copiar" class="btn" type="button">Copiar resumo</button></div>`;
}
function entrada(){
 const seg={};Object.keys(st.seg).forEach(k=>{if(st.seg[k])seg[k]=true;});
 return {idade:st.idade===''?NaN:Number(st.idade),sexo:st.sexo,usuario:st.usuario,triagem_confirmada:st.conf,seg,phq9:st.phq,phq9_func:st.func,gad7:st.gad,gds15:st.gds,
  minicog:{palavras:st.mc.palavras===''?null:Number(st.mc.palavras),relogio:st.mc.relogio},historia_mania:st.mania,gestacao_puerperio:st.gest,prejuizo_marcante:st.prej,
  epds:st.epds,audit:st.audit,mdq:st.mdq,ptsd:st.ptsd};
}
const NIV={alto:['alto','Risco alto'],medio:['medio','Alerta'],baixo:['baixo','Sem risco imediato']};
function src(ids){return ids&&ids.length?`<p class="sm-src">Fontes: ${ids.map(i=>`<a href="${esc(safeUrl(REGRAS.fontes[i].link))}" target="_blank" rel="noopener noreferrer">${esc(REGRAS.fontes[i].nome.split(' — ')[0].split(' (')[0])}</a>`).join(' · ')}</p>`:'';}
const ul=(a,c)=>a&&a.length?`<ul class="${c||'sm-list'}">${a.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:'';

function seguranca(r){
 const s=r.seguranca;const [cls,nome]=NIV[s.nivel];
 const algo=st.conf||s.motivos.length||Object.keys(r.escalas).length;
 if(!algo)return `<section class="sm-card sm-empty"><p><b>Comece pela segurança.</b> Pergunte diretamente sobre ideação suicida, marque as respostas e preencha as escalas. O resultado aparece aqui.</p></section>`;
 const mot=s.motivos.length?`<p class="sm-why"><b>Motivo:</b> ${esc(s.motivos.join('; '))}.</p>`:'';
 const notif=s.notificar?`<p class="sm-notif"><b>Notificação compulsória:</b> tentativa de suicídio e autolesão devem ser notificadas (Lei 13.819/2019, art. 6º; sigilosa).</p>`:'';
 return `<section class="sm-card sm-seg sm-${cls}" role="${s.nivel==='alto'?'alert':'region'}"><div class="sm-seg-head"><span class="sm-badge sm-${cls}">${esc(nome)}</span><h3>${esc(s.rotulo)}</h3></div>${mot}${s.nivel==='baixo'?'':notif}${ul(s.condutas)}<p class="sm-help"><b>Para o paciente e a família:</b> ${esc(r.ajuda)}</p>${src(s.fontes)}</section>`;
}
function escalas(r){
 const e=r.escalas,t=[];
 if(e.phq9){const p=e.phq9;t.push(`<div class="sm-tile"><span class="sm-t-n">PHQ-9</span><b>${p.total}<small>/27</small></b><span>${esc(p.faixa)}</span><span class="sm-t-s ${p.positivo_br?'sm-pos':''}">${p.positivo_br?'Rastreio positivo (corte brasileiro ≥9)':'Abaixo do corte brasileiro (≥9)'}</span>${p.divergencia_corte?'<small class="sm-warnline">Pontuação 9: positivo pelo corte brasileiro (Santos 2013), negativo pelo internacional (≥10). Decida clinicamente.</small>':''}${p.funcional!==null?`<small>Dificuldade funcional: ${esc(ES.phq9.funcional_opcoes[p.funcional])}</small>`:''}</div>`);}
 if(e.gad7){const g=e.gad7;t.push(`<div class="sm-tile"><span class="sm-t-n">GAD-7</span><b>${g.total}<small>/21</small></b><span>${esc(g.faixa)}</span><span class="sm-t-s ${g.positivo?'sm-pos':''}">${g.positivo?'Rastreio positivo (≥10)':'Abaixo do corte (≥10)'}</span></div>`);}
 if(e.gds15){const g=e.gds15;t.push(`<div class="sm-tile"><span class="sm-t-n">GDS-15</span><b>${g.total}<small>/15</small></b><span>${esc(g.faixa)}</span><span class="sm-t-s ${g.positivo?'sm-pos':''}">${g.positivo?'Rastreio positivo (≥5)':'Abaixo do corte (≥5)'}</span></div>`);}
 if(e.minicog){const g=e.minicog;t.push(`<div class="sm-tile"><span class="sm-t-n">Mini-Cog</span><b>${g.total}<small>/5</small></b><span class="sm-t-s ${g.positivo?'sm-pos':''}">${g.positivo?'Positivo (menor que 3)':'Negativo'}</span></div>`);}
 if(e.epds){const g=e.epds;t.push(`<div class="sm-tile"><span class="sm-t-n">EPDS (pós-parto)</span><b>${g.total}<small>/30</small></b><span class="sm-t-s ${g.positivo_br?'sm-pos':''}">${g.positivo_br?'Rastreio positivo (corte brasileiro ≥10)':'Abaixo do corte brasileiro (≥10)'}</span>${g.divergencia_corte?'<small class="sm-warnline">Pontuação 10 ou 11: positivo no corte brasileiro (Figueira 2009), abaixo do corte ≥12 de material português. Decida clinicamente.</small>':''}${g.item10>0?'<small class="sm-warnline">Item 10 positivo: faça a avaliação de risco (veja Segurança).</small>':''}</div>`);}
 if(e.audit){const g=e.audit;t.push(`<div class="sm-tile"><span class="sm-t-n">AUDIT (álcool)</span><b>${g.total}<small>/40</small></b><span class="sm-t-s ${g.positivo?'sm-pos':''}">${esc(g.zona)}</span><small>${esc(g.conduta)}</small>${g.limite_mulheres?'<small class="sm-warnline">Pontuação 7 em mulher: algumas versões do AUDIT já classificam como zona II (uso de risco). Considere a intervenção breve.</small>':''}</div>`);}
 if(e.mdq){const g=e.mdq;t.push(`<div class="sm-tile"><span class="sm-t-n">MDQ (bipolaridade)</span><b>${g.itens_sim}<small>/13 itens</small></b><span class="sm-t-s ${g.positivo?'sm-pos':''}">${g.positivo?'Rastreio positivo (7+ itens, juntos, problema moderado ou sério)':'Rastreio negativo pelo critério original'}</span>${!g.positivo&&g.criterio_br8?'<small class="sm-warnline">8 ou mais itens: o corte da validação brasileira (Castelo 2010) usa só a contagem de itens. Considere investigar.</small>':''}</div>`);}
 if(e.pcptsd5){const g=e.pcptsd5;t.push(`<div class="sm-tile"><span class="sm-t-n">PC-PTSD-5</span><b>${g.total}<small>/5</small></b><span class="sm-t-s ${g.positivo?'sm-pos':''}">${g.sem_exposicao?'Sem exposição a evento traumático':(g.positivo?(g.provavel?'Positivo (≥4: TEPT provável)':'Positivo (≥3)'):'Negativo (<3)')}</span></div>`);}
 if(!t.length)return '';
 return `<section class="sm-group"><h3>Rastreio por escala</h3><div class="sm-tiles">${t.join('')}</div><p class="sm-note">Resultado de rastreio, não diagnóstico: confirme em entrevista clínica.</p>${(e.mdq&&e.mdq.positivo)?`<div class="sm-warn"><b>Atenção</b> ${esc(REGRAS.bipolaridade.aviso)}</div>`:''}${(e.audit&&e.audit.dependencia_provavel)?`<div class="sm-warn"><b>Atenção</b> AUDIT na zona IV: avalie risco de abstinência antes de qualquer pedido de interrupção abrupta do álcool.</div>`:''}</section>`;
}
function manejo(r){
 if(r.manejo===null){
  if(r.seguranca.bloqueia_manejo)return `<section class="sm-group"><h3>Manejo</h3><p class="sm-note"><b>Oculto de propósito:</b> com risco alto, primeiro a conduta de segurança acima. As opções de tratamento voltam quando a situação for estabilizada.</p></section>`;
  return '';
 }
 const m=r.manejo;let h='';
 if(m.depressao){const d=m.depressao;
  h+=`<div class="sm-block"><h4>${esc(d.rotulo)}</h4><p class="sm-lab">Opções (todas podem ser primeira linha, em decisão compartilhada)</p>${ul(d.opcoes)}${d.medicamento?`<p class="sm-lab">Medicamento</p><p>${esc(d.medicamento)}</p><p class="sm-note">Classes e decisões, sem doses: a posologia fica com a bula e o seu julgamento.</p>`:(st.usuario==='enfermagem'?'<p class="sm-note">A decisão sobre medicamentos é do(a) médico(a).</p>':(st.usuario===''?'<p class="sm-note">Selecione “Quem está usando” para ver as opções de medicamento.</p>':''))}<p><b>Seguimento:</b> ${esc(d.seguimento)}</p>${d.cautelas.length?`<details><summary>Cautelas com antidepressivos</summary>${ul(d.cautelas)}</details>`:''}${src(d.fontes)}</div>`;}
 if(m.ansiedade){const a=m.ansiedade;
  h+=`<div class="sm-block"><h4>Ansiedade</h4>${a.passos.map(p=>`<p class="sm-lab">${esc(p.rotulo)}</p>${ul(p.itens)}`).join('')}${a.medicamento?`<details><summary>Medicamento (CG113)</summary>${ul(a.medicamento)}<p class="sm-note">Sem doses, de propósito.</p></details>`:''}${a.passo4?`<p class="sm-note">${esc(a.passo4)}</p>`:''}${src(a.fontes)}</div>`;}
 m.avisos.forEach(t=>{h+=`<div class="sm-warn"><b>Atenção</b> ${esc(t)}</div>`;});
 if(!h){const e=r.escalas;if(!(e.phq9||e.gad7||e.gds15))return '';}
 if(!h)return `<section class="sm-group"><h3>Manejo</h3><p class="sm-note">Nenhuma escala de humor ou ansiedade acima do corte. Se a queixa persistir, reavalie clinicamente e repita o rastreio.</p></section>`;
 return `<section class="sm-group"><h3>Manejo por gravidade</h3>${h}</section>`;
}
function resto(r){
 let h='';
 if(r.diferencial)h+=`<section class="sm-group"><details><summary>Diagnóstico diferencial: o que considerar</summary>${ul(r.diferencial.itens)}<p class="sm-note">Fonte ainda não vinculada a uma diretriz específica (pendente).</p></details></section>`;
 if(r.encaminhamento)h+=`<section class="sm-group"><details><summary>Quando e para onde encaminhar</summary><p class="sm-lab">Critérios</p>${ul(r.encaminhamento.criterios)}<p class="sm-lab">Rede</p>${ul(r.encaminhamento.rede)}${src(r.encaminhamento.fontes)}</details></section>`;
 return h;
}
function fontesFim(){
 return `<section class="sm-group"><details><summary>Todas as fontes e o que ainda falta conferir</summary><ul class="sm-list">${Object.values(REGRAS.fontes).map(f=>`<li><a href="${esc(safeUrl(f.link))}" target="_blank" rel="noopener noreferrer">${esc(f.nome)}</a> <span class="sm-tag">${f.tipo==='primaria'?'fonte primária':'fonte secundária'} · ${f.ano}</span><p class="sm-note">${esc(f.nota)}</p></li>`).join('')}</ul><p class="sm-lab">Pendências</p>${ul(REGRAS.pendencias)}</details></section>`;
}
let ultimo='';
function resumo(r){
 const L=['Saúde mental: rastreio e segurança (apoio à decisão; confirme clinicamente)',`Idade: ${st.idade||'não informada'}`,`Sexo ao nascer: ${st.sexo==='F'?'feminino':st.sexo==='M'?'masculino':'não informado'}`,`Segurança: ${r.seguranca.rotulo}`];
 if(r.seguranca.motivos.length)L.push('Motivo: '+r.seguranca.motivos.join('; '));
 const e=r.escalas;
 if(e.phq9)L.push(`PHQ-9: ${e.phq9.total}/27 (${e.phq9.faixa})`);
 if(e.gad7)L.push(`GAD-7: ${e.gad7.total}/21 (${e.gad7.faixa})`);
 if(e.gds15)L.push(`GDS-15: ${e.gds15.total}/15 (${e.gds15.faixa})`);
 if(e.minicog)L.push(`Mini-Cog: ${e.minicog.total}/5`);
 if(e.epds)L.push(`EPDS: ${e.epds.total}/30${e.epds.positivo_br?' (positivo, corte ≥10)':''}`);
 if(e.audit)L.push(`AUDIT: ${e.audit.total}/40 (${e.audit.zona})`);
 if(e.mdq)L.push(`MDQ: ${e.mdq.itens_sim}/13 itens (${e.mdq.positivo?'positivo':'negativo'} pelo critério original)`);
 if(e.pcptsd5)L.push(`PC-PTSD-5: ${e.pcptsd5.total}/5${e.pcptsd5.positivo?' (positivo)':''}`);
 r.avisos.forEach(a=>L.push('Aviso: '+a));
 L.push('',`Regras v${REGRAS.versao}, conferidas em ${REGRAS.atualizado_em.split('-').reverse().join('/')}. Rastreio não é diagnóstico.`);
 return L.join('\n');
}
function render(){
 const r=avaliarMental(entrada(),REGRAS);
 let h='';
 if(r.avisos.length)h+=r.avisos.map(a=>`<div class="sm-warn"><b>Atenção</b> ${esc(a)}</div>`).join('');
 h+=seguranca(r)+escalas(r)+manejo(r)+resto(r)+fontesFim();
 $('#sm-resultado').innerHTML=h;
 ultimo=resumo(r);
 const n=(a)=>a.filter(v=>v!==null).length;
 $('#sm-cnt-seg').textContent=Object.values(st.seg).filter(Boolean).length?Object.values(st.seg).filter(Boolean).length+' marcado(s)':'';
 $('#sm-cnt-phq').textContent=n(st.phq)?n(st.phq)+'/9':'';
 $('#sm-cnt-gad').textContent=n(st.gad)?n(st.gad)+'/7':'';
 $('#sm-cnt-gds').textContent=n(st.gds)?n(st.gds)+'/15':'';
 $('#sm-cnt-epds').textContent=n(st.epds)?n(st.epds)+'/10':'';
 $('#sm-cnt-audit').textContent=n(st.audit)?n(st.audit)+'/10':'';
 const nm=n(st.mdq.itens)+(st.mdq.junto!==null?1:0)+(st.mdq.problema!==null?1:0);$('#sm-cnt-mdq').textContent=nm?nm+'/15':'';
 const np=(st.ptsd.exposicao!==null?1:0)+n(st.ptsd.itens);$('#sm-cnt-ptsd').textContent=np?(st.ptsd.exposicao===0?'sem exposição':np-1+'/5'):'';
 $('#sm-pt-itens').hidden=st.ptsd.exposicao!==1;
 $('#sm-copiar').disabled=false;
}
function syncIdoso(){const v=Number(st.idade);$('#sm-idoso').hidden=!(st.idade!==''&&v>=60);$('#sm-puerp').hidden=!(st.sexo==='F'&&st.gest);$('#sm-gest-wrap').hidden=st.sexo!=='F';}
function init(){
 build();
 const f=$('#sm-form');
 f.addEventListener('change',(e)=>{
  const t=e.target;
  if(t.matches('input[data-seg]')){st.seg[t.dataset.seg]=t.checked;}
  else if(t.matches('input[data-ctx]')){const k=t.dataset.ctx;st[k]=t.checked;if(k==='gest')syncIdoso();}
  else if(t.matches('input[type=radio]')){const k=t.dataset.k,v=Number(t.value);if(k==='func')st.func=v;else if(k==='mdq')st.mdq.itens[Number(t.dataset.i)]=v;else if(k==='mdqj')st.mdq.junto=v;else if(k==='mdqp')st.mdq.problema=v;else if(k==='ptx')st.ptsd.exposicao=v;else if(k==='pti')st.ptsd.itens[Number(t.dataset.i)]=v;else st[k][Number(t.dataset.i)]=v;}
  else if(t.id==='sm-usuario')st.usuario=t.value;
  else if(t.id==='sm-sexo'){st.sexo=t.value;if(st.sexo!=='F'){st.gest=false;const c=$('input[data-ctx=gest]');if(c)c.checked=false;}syncIdoso();}
  else if(t.id==='sm-mc-p')st.mc.palavras=t.value;
  else if(t.id==='sm-mc-r')st.mc.relogio=t.value;
  render();
 });
 f.addEventListener('input',(e)=>{if(e.target.id==='sm-idade'){st.idade=e.target.value.trim();syncIdoso();render();}});
 f.addEventListener('click',(e)=>{
  if(e.target.closest('#sm-limpar')){limpar();}
  else if(e.target.closest('#sm-copiar')){copiar();}
 });
 function limpar(){
  Object.assign(st,{usuario:st.usuario,idade:'',sexo:'',gest:false,mania:false,prej:false,conf:false,seg:{},phq:Array(9).fill(null),func:null,gad:Array(7).fill(null),gds:Array(15).fill(null),mc:{palavras:'',relogio:''}},novoEstado());
  const u=st.usuario;build();$('#sm-usuario').value=u;syncIdoso();render();$('#sm-idade').focus();
 }
 function copiar(){
  const b=$('#sm-copiar');const ok=()=>{b.textContent='Copiado';setTimeout(()=>b.textContent='Copiar resumo',1800);};
  const fb=()=>{const ta=document.createElement('textarea');ta.value=ultimo;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');ok();}catch(e){b.textContent='Copie manualmente';}ta.remove();};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(ultimo).then(ok,fb);else fb();
 }
 $('#sm-rodape').textContent='Regras v'+REGRAS.versao+', conferidas em '+REGRAS.atualizado_em.split('-').reverse().join('/')+'. Cobre segurança, depressão, ansiedade, idosos, pós-parto, álcool, bipolaridade e trauma. Algumas regras ainda têm conferência pendente (veja “Todas as fontes”).';
 syncIdoso();render();
}
init();
})();

})();
