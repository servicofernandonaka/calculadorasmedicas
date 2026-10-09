/* MedScreening: rastreamentos e vacinas por perfil (motor determinístico; nenhum dado sai do navegador) */
(function(){
'use strict';
const REGRAS={
  "versao": "0.6.0",
  "atualizado_em": "2026-10-09",
  "aviso": "Regras conferidas em 09/10/2026 contra as fontes listadas em cada regra. Nivel 'primaria' = pagina ou documento da propria instituicao foi aberto; 'secundaria' = so resumo de noticia ou portal; 'nao_conferida' = sem fonte aberta. Apoio a decisao: nao substitui o julgamento clinico nem o protocolo local.",
  "regras": [
    {
      "id": "colo_utero",
      "categoria": "rastreamento",
      "nome": "Câncer do colo do útero",
      "teste": "Teste de DNA-HPV oncogênico (padrão INCA 2025). Onde ainda não implantado: citologia trienal após dois exames anuais normais.",
      "intervalo_anos": 5,
      "exclui_se": [
        "histerectomia_total_benigna",
        "sem_atividade_sexual"
      ],
      "revisar_a_cada_dias": 180,
      "elegibilidade": [
        {
          "sexo": "F",
          "idade_min": 25,
          "idade_max": 64,
          "categoria": "indicado",
          "fatores_nenhum": [
            "dna_hpv_negativo_apos_60"
          ]
        },
        {
          "sexo": "F",
          "idade_min": 25,
          "categoria": "indicado",
          "fatores_todos": [
            "imunossupressao"
          ],
          "intervalo_anos": 3
        }
      ],
      "fontes": [
        {
          "nome": "Ministério da Saúde. Portaria Conjunta SAES/SECTICS nº 13, de 29/07/2025: Diretrizes Brasileiras para o Rastreamento do Câncer de Colo do Útero, Parte I (DNA-HPV)",
          "tipo": "primaria",
          "ano": 2025,
          "link": "https://www.gov.br/saude/pt-br/assuntos/pcdt/r/rastreamento-cancer-do-colo-do-utero",
          "nota": "Vigente desde a publicação; revoga a Portaria SAS/MS nº 497/2016. DNA-HPV oncogênico como teste primário; início aos 25 anos (condicional de 25 a 29, forte a partir de 30); intervalo de 5 anos; encerra após teste negativo acima de 60 anos. A Parte II (condutas após o resultado) é documento separado."
        },
        {
          "nome": "INCA/MS. Diretrizes Brasileiras para o Rastreamento do Câncer do Colo do Útero, 3ª ed.",
          "tipo": "primaria",
          "ano": 2025,
          "link": "https://ninho.inca.gov.br/jspui/bitstream/123456789/17858/3/Diretrizes%20para%20o%20Rastreamento%20do%20c%c3%a2ncer%20do%20colo%20do%20%c3%batero_2025_completo.pdf",
          "nota": "Mesmo conteúdo, com detalhes: HIV e imunossupressão com intervalo de 3 anos e sem encerrar; histerectomia total por lesão benigna sai do rastreamento; onde o DNA-HPV não está implantado, citologia trienal após dois exames anuais normais."
        },
        {
          "nome": "OMS. Novas recomendações para rastreamento e tratamento do câncer do colo do útero",
          "tipo": "primaria",
          "ano": 2021,
          "link": "https://www.who.int/news/item/06-07-2021-new-recommendations-for-screening-and-treatment-to-prevent-cervical-cancer",
          "nota": "DNA-HPV preferido; início aos 30 anos (25 se HIV); intervalo de 5 a 10 anos (3 a 5 se HIV); autocoleta aceita."
        },
        {
          "nome": "USPSTF. Cervical Cancer: Screening",
          "tipo": "primaria",
          "ano": 2018,
          "link": "https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/cervical-cancer-screening",
          "nota": "Grau A, 21 a 65 anos: citologia a cada 3 anos (21 a 29); de 30 a 65, citologia a cada 3, hrHPV a cada 5 ou cotestagem a cada 5. Página indica atualização em andamento."
        },
        {
          "nome": "OMS. Guideline for screening and treatment of cervical pre-cancer lesions: use of HPV DNA genotyping (2026)",
          "tipo": "primaria",
          "ano": 2026,
          "link": "https://www.who.int/publications/i/item/9789240121744",
          "nota": "Lido o PDF completo (69 p.). Trata de genotipagem para triagem e tratamento de mulheres HPV positivas (recomendações condicionais, baixa certeza), conforme a capacidade de seguimento (60% ou mais, ou menos). Não altera a idade de início nem o intervalo: o quadro-resumo da própria diretriz mantém início aos 30 anos e intervalo de 5 a 10 anos com DNA-HPV (5 anos com mRNA). Sem recomendação de genotipagem estendida para mulheres vivendo com HIV."
        }
      ],
      "conferencia": {
        "nivel": "primaria",
        "data": "2026-10-09",
        "pendencias": [
          "A Parte II da diretriz brasileira (condutas após o resultado do teste) e a triagem por genotipagem da OMS 2026 não estão modeladas no app.",
          "USPSTF tem recomendação de 2018 em atualização (rascunho com autocoleta); verificar versão final."
        ]
      },
      "divergencias": [
        "INCA 2025 inicia aos 25 anos; OMS inicia aos 30 (25 se HIV) e USPSTF aos 21 com citologia.",
        "Intervalo: INCA 5 anos; OMS 5 a 10 anos; USPSTF 3 anos (citologia) ou 5 (HPV)."
      ],
      "observacoes": [
        "Interromper após DNA-HPV negativo acima de 60 anos (marcar o fator dna_hpv_negativo_apos_60).",
        "Mulheres de 25 a 29 anos: recomendação condicional no INCA 2025."
      ]
    },
    {
      "id": "mama",
      "categoria": "rastreamento",
      "nome": "Câncer de mama (mamografia)",
      "teste": "Mamografia",
      "intervalo_anos": 2,
      "exclui_se": [
        "ca_mama_previo",
        "alto_risco_mama"
      ],
      "revisar_a_cada_dias": 180,
      "elegibilidade": [
        {
          "sexo": "F",
          "idade_min": 50,
          "idade_max": 74,
          "categoria": "indicado"
        },
        {
          "sexo": "F",
          "idade_min": 40,
          "idade_max": 49,
          "categoria": "discutir"
        }
      ],
      "fontes": [
        {
          "nome": "Ministério da Saúde. Nota Técnica nº 626/2025-CGCAN/DECAN/SAES/MS (acesso à mamografia no SUS)",
          "tipo": "primaria",
          "ano": 2025,
          "link": "https://www.gov.br/saude/pt-br/centrais-de-conteudo/publicacoes/notas-tecnicas/2025/nota-tecnica-no-626-2025-cgcan-decan-saes-ms.pdf",
          "nota": "Item 2.2: rastreamento populacional de 50 a 74 anos, periodicidade bienal. Item 2.4: o SUS não restringe o acesso por demanda de 40 a 49 anos nem acima de 74, desde que orientadas sobre riscos e benefícios. Não trata de alto risco. Documento orientativo até novas diretrizes nacionais (assinada em 24/09/2025)."
        },
        {
          "nome": "INCA/MS. Informe: acesso à mamografia no SUS é objeto de nota técnica",
          "tipo": "primaria",
          "ano": 2025,
          "link": "https://ninho.inca.gov.br/jspui/bitstream/123456789/17839/1/Informa%c3%a7%c3%b5es%20para%20acesso%20%c3%a0%20mamografia%20no%20SUS%20s%c3%a3o%20objeto%20de%20nota%20t%c3%a9cnica.pdf",
          "nota": "Rastreamento no SUS passa a ser de 50 a 74 anos (antes até 69). De 40 a 49 anos, o SUS não restringe a mamografia por demanda, com orientação sobre riscos e benefícios. O texto não define o intervalo."
        },
        {
          "nome": "USPSTF. Breast Cancer: Screening",
          "tipo": "primaria",
          "ano": 2024,
          "link": "https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/breast-cancer-screening",
          "nota": "Grau B: mamografia bienal de 40 a 74 anos. Grau I: 75 anos ou mais e exames complementares em mamas densas."
        },
        {
          "nome": "Comissão Nacional de Mamografia (CBR, SBM, Febrasgo). Nota técnica sobre o rastreamento do câncer de mama no Brasil",
          "tipo": "primaria",
          "ano": 2025,
          "link": "https://cbr.org.br/wp-content/uploads/2025/01/Nota-tecnica-da-Comissao-Nacional-de-Mamografia-sobre-o-rastreamento-do-Cancer-de-Mama-no-Brasil.pdf",
          "nota": "Mamografia anual, de preferência digital, dos 40 aos 74 anos; a partir dos 75, avaliação individualizada. Documento de 27/01/2025."
        }
      ],
      "conferencia": {
        "nivel": "primaria",
        "data": "2026-10-09",
        "pendencias": [
          "Intervalo bienal no SUS confirmado na Nota Técnica 626/2025; falta apenas nova diretriz nacional, que a própria nota diz ser a base de revisão futura."
        ]
      },
      "divergencias": [
        "SUS (NT 626/2025): bienal de 50 a 74 anos; 40 a 49 e acima de 74 por demanda, com orientação sobre riscos e benefícios. Comissão Nacional de Mamografia (CBR, SBM, Febrasgo): anual dos 40 aos 74 anos. USPSTF: bienal dos 40 aos 74 anos."
      ],
      "observacoes": [
        "Alto risco (variante BRCA, radioterapia torácica prévia, lesão de alto risco) segue protocolo próprio; não use esta regra."
      ]
    },
    {
      "id": "colorretal",
      "categoria": "rastreamento",
      "nome": "Câncer colorretal",
      "teste": "FIT (quantitativo ou qualitativo; corte de 50 ng/mL); colonoscopia se positivo",
      "intervalo_anos": 2,
      "exclui_se": [
        "ca_colorretal_previo",
        "polipo_adenomatoso",
        "doenca_inflamatoria_intestinal",
        "sindrome_hereditaria_colorretal"
      ],
      "revisar_a_cada_dias": 90,
      "elegibilidade": [
        {
          "idade_min": 50,
          "idade_max": 75,
          "categoria": "indicado",
          "fatores_todos": [
            "ultima_colonoscopia_completa"
          ],
          "intervalo_anos": 10
        },
        {
          "idade_min": 50,
          "idade_max": 75,
          "categoria": "indicado"
        },
        {
          "idade_min": 45,
          "idade_max": 49,
          "categoria": "discutir"
        },
        {
          "idade_min": 76,
          "idade_max": 85,
          "categoria": "discutir"
        }
      ],
      "fontes": [
        {
          "nome": "Ministério da Saúde. Portaria SAES/MS nº 4.642, de 06/08/2026 (inclui o FIT na tabela SIGTAP) — via CONASS",
          "tipo": "secundaria",
          "ano": 2026,
          "link": "https://www.conass.org.br/conass-informa-n-158-2026-publicada-portaria-saes-ms-n-4-642-que-inclui-procedimento-e-altera-atributos-de-procedimento-da-tabela-de-procedimentos-medicamentos-orteses-proteses-e-m/",
          "nota": "Procedimento 02.02.04.020-8 (FIT) para rastreamento bienal de homens e mulheres assintomáticos de 50 a 75 anos, 1 procedimento por 2 anos, na atenção básica. Texto lido na reprodução do CONASS, não no Diário Oficial. Não traz ponto de corte."
        },
        {
          "nome": "Conitec/MS. Diretrizes Brasileiras do Rastreamento do Câncer de Cólon e Reto: relatório de recomendação (versão preliminar, Consulta Pública nº 20)",
          "tipo": "primaria",
          "ano": 2026,
          "link": "https://www.gov.br/conitec/pt-br/midias/consultas/relatorios/2026/relatorio-preliminar-diretrizes-brasileiras-do-rastreamento-do-cancer-de-colon-e-reto-cp-20/@@display-file/file",
          "nota": "Março de 2026. De 50 a 75 anos, risco padrão, assintomáticos; FIT com corte de 50 ng/mL; intervalo bienal; colonoscopia se positivo; após colonoscopia completa, repetir em 10 anos sem FIT no intervalo. Extensão até 85 anos só em casos individualizados. Risco aumentado fica fora da diretriz."
        },
        {
          "nome": "INCA/MS. SUS adota novo exame para detectar câncer de intestino antes dos sintomas (notícia de 21/05/2026)",
          "tipo": "primaria",
          "ano": 2026,
          "link": "https://www.gov.br/inca/pt-br/assuntos/noticias/2026/sus-adota-novo-exame-para-detectar-cancer-de-intestino-antes-dos-sintomas",
          "nota": "Anuncia o FIT como exame de referência no SUS para pessoas de 50 a 75 anos sem sintomas. Não cita portaria nem data de vigência."
        },
        {
          "nome": "USPSTF. Colorectal Cancer: Screening",
          "tipo": "primaria",
          "ano": 2021,
          "link": "https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/colorectal-cancer-screening",
          "nota": "45 a 49 anos: grau B; 50 a 75: grau A; 76 a 85: grau C (seletivo). FIT anual; colonoscopia a cada 10 anos; sigmoidoscopia a cada 5; colonografia por TC a cada 5."
        }
      ],
      "conferencia": {
        "nivel": "primaria",
        "data": "2026-10-09",
        "pendencias": [
          "Portaria SAES/MS 4.642/2026 confirma FIT bienal de 50 a 75 anos no SUS (lida via CONASS); abrir o texto no DOU ou no site do Ministério.",
          "Ponto de corte (50 ng/mL), colonoscopia de seguimento e demais faixas (45 a 49, 76 a 85, intervalo de 10 anos após colonoscopia) vêm do relatório preliminar da Conitec; a Conitec concluiu a avaliação em junho de 2026 (noticiário), mas o relatório final não foi aberto."
        ]
      },
      "divergencias": [
        "SUS: 50 a 75 anos, FIT bienal (Portaria SAES/MS 4.642/2026). USPSTF: 45 a 75 anos, FIT anual ou colonoscopia a cada 10 anos."
      ],
      "observacoes": [
        "Marque ultima_colonoscopia_completa se o último exame foi uma colonoscopia completa e de qualidade (repetir em 10 anos).",
        "Risco aumentado (câncer ou pólipo adenomatoso prévio, doença inflamatória intestinal, história familiar, Lynch, polipose) fica fora desta regra."
      ]
    },
    {
      "id": "prostata",
      "categoria": "rastreamento",
      "nome": "Câncer de próstata (decisão compartilhada)",
      "teste": "PSA, somente após conversa sobre benefícios e danos",
      "intervalo_anos": null,
      "exclui_se": [
        "ca_prostata"
      ],
      "revisar_a_cada_dias": 180,
      "elegibilidade": [
        {
          "sexo": "M",
          "idade_min": 45,
          "idade_max": 69,
          "categoria": "discutir",
          "fatores_algum": [
            "hist_fam_prostata",
            "raca_negra"
          ]
        },
        {
          "sexo": "M",
          "idade_min": 50,
          "idade_max": 69,
          "categoria": "discutir"
        }
      ],
      "fontes": [
        {
          "nome": "Ministério da Saúde e INCA. Nota técnica: não rastreamento populacional do câncer de próstata",
          "tipo": "primaria",
          "ano": 2023,
          "link": "https://www.gov.br/inca/pt-br/assuntos/noticias/2023/ministerio-da-saude-recomenda-o-nao-rastreamento-populacional-do-cancer-de-proposta",
          "nota": "Não recomenda rastreamento populacional; para homens que solicitarem, discutir riscos e benefícios e decidir em conjunto. Reafirma a Nota Técnica Conjunta SAS/MS e INCA nº 001/2015. Não cita faixa etária."
        },
        {
          "nome": "USPSTF. Prostate Cancer: Screening (declaração final)",
          "tipo": "primaria",
          "ano": 2018,
          "link": "https://www.uspreventiveservicestaskforce.org/uspstf/announcements/final-recommendation-statement-screening-prostate-cancer",
          "nota": "55 a 69 anos: decisão individual após conversa com o clínico. 70 anos ou mais: não rastrear de rotina."
        },
        {
          "nome": "SBU (Portal da Urologia). Aconselhamento para o diagnóstico precoce do câncer de próstata",
          "tipo": "primaria",
          "ano": 2020,
          "link": "https://portaldaurologia.org.br/novidades/noticias/aconselhamento-para-o-diagnostico-precoce-do-cancer-de-prostata",
          "nota": "A partir de 50 anos, com avaliação individualizada com especialista; a partir de 45 anos se negro ou com parente de primeiro grau com câncer de próstata; acima de 75 anos só com expectativa de vida acima de 10 anos; decisão compartilhada. Notícia de 20/10/2020."
        },
        {
          "nome": "SBU/SBPC-ML. Esclarecimento ao público sobre o PSA (13/11/2018)",
          "tipo": "primaria",
          "ano": 2018,
          "link": "https://portaldaurologia.org.br/novidades/noticias/esclarecimento-ao-publico-sobre-a-importancia-do-psa-na-deteccao-precoce-do-cancer-de-prostata",
          "nota": "Não recomenda rastreamento universal; consulta com urologista a partir de 50 anos (expectativa de vida >10 anos); 45 anos para homens negros ou com história familiar; periodicidade definida pelo urologista."
        }
      ],
      "conferencia": {
        "nivel": "primaria",
        "data": "2026-10-09",
        "pendencias": [
          "Não localizei posicionamento da SBU posterior a 2020 (busca em 09/10/2026); a SBU mantém 50 anos (45 com risco).",
          "USPSTF informou atualização do tema; verificar se há rascunho novo."
        ]
      },
      "divergencias": [
        "MS/INCA: sem rastreamento populacional. SBU: oferecer a partir de 50 anos (45 se risco). USPSTF: individual de 55 a 69 anos."
      ],
      "observacoes": [
        "O app só sinaliza 'discutir'; nunca como indicado."
      ]
    },
    {
      "id": "diabetes",
      "categoria": "rastreamento",
      "nome": "Diabetes mellitus tipo 2",
      "teste": "Glicemia de jejum e HbA1c na mesma amostra; se normais com 3 ou mais fatores de risco ou FINDRISC alto, ou se pré-diabetes, TOTG (a SBD prefere o de 1 hora)",
      "intervalo_anos": 3,
      "exclui_se": [
        "dm"
      ],
      "revisar_a_cada_dias": 180,
      "elegibilidade": [
        {
          "idade_min": 18,
          "categoria": "indicado",
          "fatores_todos": [
            "um_exame_alterado"
          ],
          "intervalo_anos": 0.5
        },
        {
          "idade_min": 18,
          "categoria": "indicado",
          "fatores_algum": [
            "prediabetes",
            "findrisc_alto",
            "tres_ou_mais_fatores_risco"
          ],
          "intervalo_anos": 1
        },
        {
          "idade_min": 35,
          "categoria": "indicado"
        },
        {
          "idade_min": 18,
          "idade_max": 34,
          "categoria": "indicado",
          "fatores_todos": [
            "sobrepeso_obesidade"
          ],
          "fatores_algum": [
            "dm_familiar_1grau",
            "dcv",
            "has",
            "hdl_baixo",
            "tg_alto",
            "sop",
            "acantose",
            "sedentarismo"
          ]
        },
        {
          "idade_min": 18,
          "idade_max": 34,
          "categoria": "indicado",
          "fatores_algum": [
            "dm_gestacional_previo",
            "medicamento_hiperglicemiante"
          ]
        }
      ],
      "fontes": [
        {
          "nome": "SBD. Rodacki M et al. Diabetol Metab Syndr 2025;17:78 (posicionamento da SBD sobre rastreamento e diagnóstico)",
          "tipo": "primaria",
          "ano": 2025,
          "link": "https://doi.org/10.1186/s13098-024-01572-w",
          "nota": "R1 (Classe I, nível B): rastrear todos a partir de 35 anos; de 18 a 34 anos com IMC ≥25 (≥23 em ascendência asiática) e um fator da Tabela 1 (diabetes em parente de 1º grau, DCV, hipertensão, HDL <35, TG >250, SOP, acantose, sedentarismo). Rastrear também com FINDRISC alto/muito alto, pré-diabetes prévio, diabetes gestacional prévio ou medicamento hiperglicemiante. R12 a R15 (Tabela 7): normal e <3 fatores ou FINDRISC baixo/moderado, a cada 3 anos; pré-diabetes, normal com ≥3 fatores ou FINDRISC alto, a cada 12 meses; apenas um critério alterado, a cada 6 meses. Exame inicial: glicemia de jejum e HbA1c juntas (R5)."
        },
        {
          "nome": "USPSTF. Prediabetes and Type 2 Diabetes: Screening",
          "tipo": "primaria",
          "ano": 2021,
          "link": "https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/screening-for-prediabetes-and-type-2-diabetes",
          "nota": "Grau B: 35 a 70 anos com sobrepeso ou obesidade; a cada 3 anos é razoável se normal."
        }
      ],
      "conferencia": {
        "nivel": "primaria",
        "data": "2026-10-09",
        "pendencias": [
          "O app não calcula o FINDRISC nem conta os fatores de risco: 'findrisc_alto' e 'tres_ou_mais_fatores_risco' são informados por quem usa.",
          "Fatores 'um_exame_alterado' (um único critério de diabetes, intervalo de 6 meses) pressupõem que o exame inicial já foi feito."
        ]
      },
      "divergencias": [
        "SBD: a partir de 35 anos para todos, sem limite superior. USPSTF: 35 a 70 anos apenas com sobrepeso ou obesidade."
      ],
      "observacoes": [
        "Os intervalos da SBD são mínimos ('pelo menos'); a SBD não recomenda alongar o intervalo."
      ]
    },
    {
      "id": "hipertensao",
      "categoria": "rastreamento",
      "nome": "Hipertensão arterial (medida da pressão)",
      "teste": "Aferição da PA no consultório com aparelho validado; confirmar o diagnóstico com MAPA ou MRPA antes de tratar",
      "intervalo_anos": 1,
      "exclui_se": [
        "has"
      ],
      "revisar_a_cada_dias": 180,
      "elegibilidade": [
        {
          "idade_min": 18,
          "categoria": "indicado"
        }
      ],
      "fontes": [
        {
          "nome": "SBC/SBN/SBH. Diretriz Brasileira de Hipertensão Arterial 2025. Arq Bras Cardiol 2025;122(9):e20250624",
          "tipo": "primaria",
          "ano": 2025,
          "link": "https://abccardiol.org/wp-content/uploads/articles_xml/0066-782X-abc-122-09-e20250624/0066-782X-abc-122-09-e20250624-en.x74770.pdf",
          "nota": "Seção 14.2: medir a PA de todo adulto ≥18 anos a cada acesso ao serviço de saúde, idealmente ao menos uma vez por ano (com atenção a história familiar, idosos, diabetes, obesidade, doença cardiovascular ou renal); três medidas por consulta. Diagnóstico: PA de consultório ≥140/90 em duas ocasiões, confirmada por MAPA ou MRPA (seção 14.4); pré-hipertensão 120-139/80-89."
        },
        {
          "nome": "USPSTF. Hypertension in Adults: Screening",
          "tipo": "primaria",
          "ano": 2021,
          "link": "https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/hypertension-in-adults-screening",
          "nota": "Grau A, 18 anos ou mais. Anual a partir de 40 anos ou com risco aumentado; de 18 a 39 anos sem risco, a cada 3 a 5 anos."
        }
      ],
      "conferencia": {
        "nivel": "primaria",
        "data": "2026-10-09",
        "pendencias": []
      },
      "divergencias": [
        "Diretriz brasileira: ao menos anual, em todo acesso. USPSTF: de 18 a 39 anos sem risco, a cada 3 a 5 anos. O app segue a diretriz brasileira."
      ],
      "observacoes": [
        "Confirmar o diagnóstico com MAPA ou MRPA antes de tratar."
      ]
    },
    {
      "id": "dislipidemia",
      "categoria": "rastreamento",
      "nome": "Dislipidemia (perfil lipídico)",
      "teste": "Perfil lipídico (jejum não obrigatório; repetir em jejum se triglicerídeos acima de 440 mg/dL)",
      "intervalo_anos": 5,
      "exclui_se": [],
      "revisar_a_cada_dias": 180,
      "elegibilidade": [
        {
          "idade_min": 19,
          "categoria": "indicado"
        },
        {
          "idade_min": 9,
          "idade_max": 11,
          "categoria": "indicado",
          "intervalo_anos": null
        },
        {
          "idade_min": 17,
          "idade_max": 21,
          "categoria": "indicado",
          "intervalo_anos": null
        },
        {
          "idade_min": 2,
          "idade_max": 8,
          "categoria": "indicado",
          "intervalo_anos": null,
          "fatores_algum": [
            "hist_fam_hipercolesterolemia_ou_dcv_precoce",
            "sobrepeso_obesidade",
            "dm",
            "has",
            "tabagismo"
          ]
        },
        {
          "idade_min": 12,
          "idade_max": 16,
          "categoria": "indicado",
          "intervalo_anos": null,
          "fatores_algum": [
            "hist_fam_hipercolesterolemia_ou_dcv_precoce",
            "sobrepeso_obesidade",
            "dm",
            "has",
            "tabagismo"
          ]
        }
      ],
      "fontes": [
        {
          "nome": "SBC. Diretriz Brasileira de Dislipidemias e Prevenção da Aterosclerose 2025. Arq Bras Cardiol 2025;122(9):e20250640",
          "tipo": "primaria",
          "ano": 2025,
          "link": "https://abccardiol.org/wp-content/uploads/articles_xml/0066-782X-abc-122-09-e20250640/0066-782X-abc-122-09-e20250640-en.x74770.pdf",
          "nota": "Texto completo lido (104 p.). Crianças e adolescentes: perfil lipídico universal entre 9 e 11 anos (forte, certeza moderada) e entre 17 e 21 anos (seção 9.10.2); seletivo de 2 a 8 e de 12 a 16 anos com fator de risco (história familiar de hipercolesterolemia ou DCV precoce, sobrepeso/obesidade, diabetes, hipertensão ou tabagismo). Adultos: a diretriz da SBC NÃO define idade de início nem intervalo do rastreamento; só apresenta valores de referência para adultos acima de 20 anos. Coleta sem jejum aceitável na avaliação inicial (forte, moderada); repetir em jejum se TG >440 mg/dL. Lp(a) uma vez na vida. PREVENT para 30 a 79 anos."
        },
        {
          "nome": "ACC/AHA et al. 2026 Guideline on the Management of Dyslipidemia. Circulation 2026;153:e1154-e1276 (doi 10.1161/CIR.0000000000001423)",
          "tipo": "primaria",
          "ano": 2026,
          "link": "https://www.ahajournals.org/doi/10.1161/CIR.0000000000001423",
          "nota": "Texto completo lido. Seção 3.1, recomendação 1 (COR 1, LOE B-NR): em adultos, perfil lipídico a partir dos 19 anos e ao menos a cada 5 anos, com mais frequência se houver outros fatores de risco. Recomendação 2 (COR 1, B-NR): crianças de 9 a 11 anos. Recomendação 3 (COR 2a): rastreio em cascata a partir de 2 anos se parente com DCV precoce, hipercolesterolemia grave ou HF. Lp(a): mensurar em todos os adultos (COR 1)."
        }
      ],
      "conferencia": {
        "nivel": "primaria",
        "data": "2026-10-09",
        "pendencias": [
          "A SBC 2025 não define idade de início nem intervalo para adultos; a regra adulta (19 anos, a cada 5 anos) vem da ACC/AHA 2026. A prática brasileira costuma citar 20 anos.",
          "Frequência maior com outros fatores de risco não está modelada; estratificação de risco pelo PREVENT (30 a 79 anos) ainda não está modelada."
        ]
      },
      "divergencias": [
        "ACC/AHA 2026: adultos a partir de 19 anos, ao menos a cada 5 anos. SBC 2025: sem idade ou intervalo definidos para adultos."
      ],
      "observacoes": []
    },
    {
      "id": "lipoproteina_a",
      "categoria": "rastreamento",
      "nome": "Lipoproteína(a), dosagem única",
      "teste": "Dosar Lp(a) uma vez na vida; com valor ≥50 mg/dL (≥125 nmol/L), considerar rastreamento em cascata dos familiares",
      "intervalo_anos": null,
      "exclui_se": [],
      "revisar_a_cada_dias": 180,
      "elegibilidade": [
        {
          "idade_min": 18,
          "categoria": "indicado"
        }
      ],
      "fontes": [
        {
          "nome": "SBC. Diretriz Brasileira de Dislipidemias e Prevenção da Aterosclerose 2025. Arq Bras Cardiol 2025;122(9):e20250640",
          "tipo": "primaria",
          "ano": 2025,
          "link": "https://abccardiol.org/wp-content/uploads/articles_xml/0066-782X-abc-122-09-e20250640/0066-782X-abc-122-09-e20250640-en.x74770.pdf",
          "nota": "Lp(a) uma vez na vida na população geral, quando disponível (forte, certeza moderada); coleta sem jejum aceitável na avaliação inicial; PREVENT para 30 a 79 anos sem doença cardiovascular; metas de LDL por categoria de risco. Os trechos lidos não definem idade de início nem intervalo do perfil lipídico em adultos assintomáticos."
        }
      ],
      "conferencia": {
        "nivel": "primaria",
        "data": "2026-10-09",
        "pendencias": [
          "A recomendação vale 'quando disponível'; verificar o acesso ao exame no SUS."
        ]
      },
      "divergencias": [],
      "observacoes": []
    },
    {
      "id": "osteoporose",
      "categoria": "rastreamento",
      "nome": "Osteoporose (densitometria óssea)",
      "teste": "Densitometria óssea (DXA)",
      "intervalo_anos": null,
      "exclui_se": [
        "osteoporose"
      ],
      "revisar_a_cada_dias": 180,
      "elegibilidade": [
        {
          "sexo": "F",
          "idade_min": 65,
          "categoria": "indicado"
        },
        {
          "sexo": "M",
          "idade_min": 70,
          "categoria": "indicado"
        },
        {
          "idade_min": 18,
          "categoria": "indicado",
          "fatores_algum": [
            "baixo_peso",
            "fratura_previa",
            "corticoide",
            "doenca_ossea_secundaria",
            "frax_elevado"
          ]
        }
      ],
      "fontes": [
        {
          "nome": "Ministério da Saúde. PCDT da Osteoporose (Portaria Conjunta SAES/SECTICS nº 22, de 22/10/2025)",
          "tipo": "primaria",
          "ano": 2025,
          "link": "https://www.gov.br/saude/pt-br/assuntos/pcdt/o/osteoporose",
          "nota": "Sem rastreamento populacional amplo. Densitometria indicada para mulheres de 65 anos ou mais e homens de 70 anos ou mais, e para qualquer idade com fatores de risco (baixo peso, fratura prévia, medicamentos ou doenças que afetam o osso)."
        },
        {
          "nome": "USPSTF. Osteoporosis to Prevent Fractures: Screening",
          "tipo": "primaria",
          "ano": 2025,
          "link": "https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/osteoporosis-screening",
          "nota": "Grau B: mulheres de 65 anos ou mais e pós-menopáusicas mais jovens com fator de risco. Homens: evidência insuficiente (grau I). Intervalo não definido."
        }
      ],
      "conferencia": {
        "nivel": "primaria",
        "data": "2026-10-09",
        "pendencias": [
          "Intervalo de repetição sem tratamento não está definido nas fontes abertas (o PCDT cita 1 a 2 anos após iniciar tratamento)."
        ]
      },
      "divergencias": [
        "MS: homens a partir de 70 anos ou com fator de risco. USPSTF: evidência insuficiente para homens."
      ],
      "observacoes": []
    },
    {
      "id": "vac_influenza",
      "categoria": "vacina",
      "nome": "Vacina influenza",
      "teste": "Dose anual (idosos: preferência pela trivalente de alta concentração)",
      "intervalo_anos": 1,
      "exclui_se": [],
      "revisar_a_cada_dias": 90,
      "elegibilidade": [
        {
          "idade_min": 18,
          "categoria": "indicado"
        }
      ],
      "fontes": [
        {
          "nome": "SBIm. Calendário de Vacinação do Adulto 2026/2027 (versão de 22/04/2026)",
          "tipo": "primaria",
          "ano": 2026,
          "link": "https://sbim.org.br/images/adulto-Calend-SBIm-2026-27-260422.pdf_2026-04-22.pdf",
          "nota": "Dose anual. Na UBS, gratuita só para grupos de risco."
        },
        {
          "nome": "SBIm. Calendário de Vacinação do Idoso 2026/2027 (versão de 04/02/2026, revisão de 22/04/2026)",
          "tipo": "primaria",
          "ano": 2026,
          "link": "https://sbim.org.br/images/idoso-Calend-SBIm-2026-27-260204-260422.pdf_2026-04-22.pdf",
          "nota": "Preferência pela trivalente de alta concentração (HD3V)."
        },
        {
          "nome": "Ministério da Saúde/PNI. Calendário Nacional de Vacinação 2026, vacinas do idoso (60 anos ou mais)",
          "tipo": "primaria",
          "ano": 2026,
          "link": "https://www.gov.br/saude/pt-br/vacinacao/arquivos/calendario-nacional-de-vacinacao-idoso",
          "nota": "Lista: hepatite B, dT, febre amarela (excepcional), tríplice viral (profissionais de saúde), pneumocócica 20-valente (acamados, institucionalizados e indígenas), influenza trivalente anual, varicela (profissionais de saúde e indígenas), covid-19 semestral. Não lista VSR nem herpes-zóster."
        },
        {
          "nome": "Ministério da Saúde/PNI. Calendário Nacional de Vacinação 2026, ciclo de vida adulto (25 a 59 anos)",
          "tipo": "primaria",
          "ano": 2026,
          "link": "https://www.gov.br/saude/pt-br/vacinacao/calendario-tecnico/calendario-tecnico-nacional-de-vacinacao-adulto",
          "nota": "Atualizado em 30/01/2026. Lista hepatite B, dT/dTpa (reforço a cada 10 anos; 5 anos se exposição de risco), SCR, febre amarela, VPP23 e varicela para grupos específicos e HPV4 para grupos prioritários. Influenza, herpes-zóster, VSR e VPC20 não constam nesta página."
        }
      ],
      "conferencia": {
        "nivel": "primaria",
        "data": "2026-10-09",
        "pendencias": [
          "Disponibilidade no SUS conferida nos calendários do PNI de 2026 do idoso e do adulto (25 a 59 anos, atualizado em 30/01/2026); ofertas de campanha ou de grupos de risco podem estar em instruções normativas não lidas."
        ]
      },
      "divergencias": [],
      "observacoes": [],
      "disponibilidade_sus": [
        "PNI 2026 (idosos): influenza trivalente, 1 dose por temporada.",
        "Adultos: SBIm informa que na UBS a vacina é gratuita só para grupos de risco."
      ]
    },
    {
      "id": "vac_pneumococica",
      "categoria": "vacina",
      "nome": "Vacina pneumocócica conjugada (VPC20)",
      "teste": "VPC20 em dose única a partir dos 50 anos",
      "intervalo_anos": null,
      "exclui_se": [],
      "revisar_a_cada_dias": 90,
      "elegibilidade": [
        {
          "idade_min": 50,
          "categoria": "indicado"
        }
      ],
      "fontes": [
        {
          "nome": "SBIm. Calendário de Vacinação do Adulto 2026/2027",
          "tipo": "primaria",
          "ano": 2026,
          "link": "https://sbim.org.br/images/adulto-Calend-SBIm-2026-27-260422.pdf_2026-04-22.pdf",
          "nota": "VPC20 dose única a partir dos 50 anos. Na UBS: VPC13 nos CRIE e VPP23 para grupos de risco e institucionalizados; VPC20 na rede privada."
        },
        {
          "nome": "SBIm. Calendário de Vacinação do Idoso 2026/2027",
          "tipo": "primaria",
          "ano": 2026,
          "link": "https://sbim.org.br/images/idoso-Calend-SBIm-2026-27-260204-260422.pdf_2026-04-22.pdf",
          "nota": "Sem indicação de VPP23 depois da VPC20. Quem recebeu VPP23 aguarda 1 ano para a VPC20."
        },
        {
          "nome": "Ministério da Saúde. Nova vacina: Ministério da Saúde vai ofertar pneumo20 para quem tem mais de 85 anos (14/09/2026)",
          "tipo": "primaria",
          "ano": 2026,
          "link": "https://www.gov.br/saude/pt-br/assuntos/noticias-ms/2026/setembro/nova-vacina-ministerio-da-saude-vai-ofertar-pneumo20-para-quem-tem-mais-de-85-anos",
          "nota": "VPC20 no SUS para 85 anos ou mais, sem prescrição; 60 a 84 anos acamados, institucionalizados ou com condições especiais seguem na estratégia especial; ampliação gradual para outras faixas."
        },
        {
          "nome": "Ministério da Saúde/PNI. Calendário Nacional de Vacinação 2026, ciclo de vida adulto (25 a 59 anos)",
          "tipo": "primaria",
          "ano": 2026,
          "link": "https://www.gov.br/saude/pt-br/vacinacao/calendario-tecnico/calendario-tecnico-nacional-de-vacinacao-adulto",
          "nota": "Atualizado em 30/01/2026. Lista hepatite B, dT/dTpa (reforço a cada 10 anos; 5 anos se exposição de risco), SCR, febre amarela, VPP23 e varicela para grupos específicos e HPV4 para grupos prioritários. Influenza, herpes-zóster, VSR e VPC20 não constam nesta página."
        }
      ],
      "conferencia": {
        "nivel": "primaria",
        "data": "2026-10-09",
        "pendencias": [
          "Esquemas prévios (VPC13, VPP23) e indicações para comorbidades (Calendário SBIm de Pacientes Especiais) não estão modelados.",
          "Disponibilidade no SUS conferida nos calendários do PNI de 2026 do idoso e do adulto (25 a 59 anos, atualizado em 30/01/2026); ofertas de campanha ou de grupos de risco podem estar em instruções normativas não lidas."
        ]
      },
      "divergencias": [
        "SBIm recomenda a partir de 50 anos; o SUS oferece por grupo de risco."
      ],
      "observacoes": [],
      "disponibilidade_sus": [
        "PNI 2026: VPC20 para quem tem 85 anos ou mais (a partir de setembro de 2026) e, de 60 a 84 anos, para acamados, institucionalizados ou com condições clínicas especiais.",
        "Demais pessoas de 50 anos ou mais: rede privada.",
        "Calendário do adulto 2026: pneumocócica 23-valente só para população indígena sem vacina conjugada."
      ]
    },
    {
      "id": "vac_zoster",
      "categoria": "vacina",
      "nome": "Vacina herpes-zóster (inativada, VZR)",
      "teste": "2 doses, 0 e 2 meses, a partir dos 50 anos",
      "intervalo_anos": null,
      "exclui_se": [],
      "revisar_a_cada_dias": 90,
      "elegibilidade": [
        {
          "idade_min": 50,
          "categoria": "indicado"
        }
      ],
      "fontes": [
        {
          "nome": "SBIm. Calendário de Vacinação do Adulto 2026/2027",
          "tipo": "primaria",
          "ano": 2026,
          "link": "https://sbim.org.br/images/adulto-Calend-SBIm-2026-27-260422.pdf_2026-04-22.pdf",
          "nota": "A partir dos 50 anos, 2 doses (0-2 meses), inclusive para quem já teve zóster (aguardar 6 meses). Não é oferecida na UBS."
        },
        {
          "nome": "Ministério da Saúde/PNI. Calendário Nacional de Vacinação 2026, vacinas do idoso (60 anos ou mais)",
          "tipo": "primaria",
          "ano": 2026,
          "link": "https://www.gov.br/saude/pt-br/vacinacao/arquivos/calendario-nacional-de-vacinacao-idoso",
          "nota": "Lista: hepatite B, dT, febre amarela (excepcional), tríplice viral (profissionais de saúde), pneumocócica 20-valente (acamados, institucionalizados e indígenas), influenza trivalente anual, varicela (profissionais de saúde e indígenas), covid-19 semestral. Não lista VSR nem herpes-zóster."
        },
        {
          "nome": "Ministério da Saúde/PNI. Calendário Nacional de Vacinação 2026, ciclo de vida adulto (25 a 59 anos)",
          "tipo": "primaria",
          "ano": 2026,
          "link": "https://www.gov.br/saude/pt-br/vacinacao/calendario-tecnico/calendario-tecnico-nacional-de-vacinacao-adulto",
          "nota": "Atualizado em 30/01/2026. Lista hepatite B, dT/dTpa (reforço a cada 10 anos; 5 anos se exposição de risco), SCR, febre amarela, VPP23 e varicela para grupos específicos e HPV4 para grupos prioritários. Influenza, herpes-zóster, VSR e VPC20 não constam nesta página."
        }
      ],
      "conferencia": {
        "nivel": "primaria",
        "data": "2026-10-09",
        "pendencias": [
          "O app não conta doses; só sabe se houve alguma aplicação.",
          "Disponibilidade no SUS conferida nos calendários do PNI de 2026 do idoso e do adulto (25 a 59 anos, atualizado em 30/01/2026); ofertas de campanha ou de grupos de risco podem estar em instruções normativas não lidas."
        ]
      },
      "divergencias": [],
      "observacoes": [],
      "disponibilidade_sus": [
        "Não consta no calendário nacional do idoso 2026 do PNI; disponível na rede privada.",
        "Também não consta no calendário nacional do adulto (25 a 59 anos) de 2026."
      ]
    },
    {
      "id": "vac_dtpa",
      "categoria": "vacina",
      "nome": "Vacina dTpa (difteria, tétano e coqueluche)",
      "teste": "Reforço com dTpa a cada 10 anos (esquema básico completo)",
      "intervalo_anos": 10,
      "exclui_se": [],
      "revisar_a_cada_dias": 90,
      "elegibilidade": [
        {
          "idade_min": 18,
          "categoria": "indicado"
        }
      ],
      "fontes": [
        {
          "nome": "SBIm. Calendário de Vacinação do Adulto 2026/2027",
          "tipo": "primaria",
          "ano": 2026,
          "link": "https://sbim.org.br/images/adulto-Calend-SBIm-2026-27-260422.pdf_2026-04-22.pdf",
          "nota": "dTpa a cada 10 anos; esquema incompleto ou desconhecido: dTpa mais dT (0-2-4 a 8 meses). Na UBS, dTpa gratuita para gestantes, puérperas e profissionais de saúde."
        },
        {
          "nome": "Ministério da Saúde/PNI. Calendário Nacional de Vacinação 2026, vacinas do idoso (60 anos ou mais)",
          "tipo": "primaria",
          "ano": 2026,
          "link": "https://www.gov.br/saude/pt-br/vacinacao/arquivos/calendario-nacional-de-vacinacao-idoso",
          "nota": "Lista: hepatite B, dT, febre amarela (excepcional), tríplice viral (profissionais de saúde), pneumocócica 20-valente (acamados, institucionalizados e indígenas), influenza trivalente anual, varicela (profissionais de saúde e indígenas), covid-19 semestral. Não lista VSR nem herpes-zóster."
        },
        {
          "nome": "Ministério da Saúde/PNI. Calendário Nacional de Vacinação 2026, ciclo de vida adulto (25 a 59 anos)",
          "tipo": "primaria",
          "ano": 2026,
          "link": "https://www.gov.br/saude/pt-br/vacinacao/calendario-tecnico/calendario-tecnico-nacional-de-vacinacao-adulto",
          "nota": "Atualizado em 30/01/2026. Lista hepatite B, dT/dTpa (reforço a cada 10 anos; 5 anos se exposição de risco), SCR, febre amarela, VPP23 e varicela para grupos específicos e HPV4 para grupos prioritários. Influenza, herpes-zóster, VSR e VPC20 não constam nesta página."
        }
      ],
      "conferencia": {
        "nivel": "primaria",
        "data": "2026-10-09",
        "pendencias": [
          "Esquemas básicos incompletos não estão modelados.",
          "Disponibilidade no SUS conferida nos calendários do PNI de 2026 do idoso e do adulto (25 a 59 anos, atualizado em 30/01/2026); ofertas de campanha ou de grupos de risco podem estar em instruções normativas não lidas."
        ]
      },
      "divergencias": [],
      "observacoes": [],
      "disponibilidade_sus": [
        "PNI 2026 (idosos): dT em 3 doses e reforço a cada 10 anos.",
        "SBIm: na UBS, dTpa gratuita para gestantes, puérperas e profissionais de saúde.",
        "PNI adulto 2026: dT/dTpa com reforço a cada 10 anos (5 anos em caso de exposição a risco de tétano ou difteria)."
      ]
    },
    {
      "id": "vac_vsr",
      "categoria": "vacina",
      "nome": "Vacina VSR (vírus sincicial respiratório)",
      "teste": "Dose única (Arexvy ou Abrysvo)",
      "intervalo_anos": null,
      "exclui_se": [],
      "revisar_a_cada_dias": 90,
      "elegibilidade": [
        {
          "idade_min": 70,
          "categoria": "indicado"
        },
        {
          "idade_min": 60,
          "idade_max": 69,
          "categoria": "indicado",
          "fatores_algum": [
            "cardiopatia",
            "pneumopatia",
            "dm",
            "obesidade",
            "nefropatia",
            "hepatopatia",
            "imunossupressao",
            "fragilidade"
          ]
        },
        {
          "idade_min": 18,
          "idade_max": 59,
          "categoria": "indicado",
          "fatores_algum": [
            "cardiopatia",
            "pneumopatia",
            "imunossupressao"
          ]
        }
      ],
      "fontes": [
        {
          "nome": "SBIm. Calendário de Vacinação do Idoso 2026/2027",
          "tipo": "primaria",
          "ano": 2026,
          "link": "https://sbim.org.br/images/idoso-Calend-SBIm-2026-27-260204-260422.pdf_2026-04-22.pdf",
          "nota": "Rotina a partir dos 70 anos; de 60 a 69 anos para quem tem maior risco (cardiopatia, pneumopatia, diabetes, obesidade, nefropatia, hepatopatia, imunossupressão, fragilidade)."
        },
        {
          "nome": "SBIm. Calendário de Vacinação do Adulto 2026/2027",
          "tipo": "primaria",
          "ano": 2026,
          "link": "https://sbim.org.br/images/adulto-Calend-SBIm-2026-27-260422.pdf_2026-04-22.pdf",
          "nota": "Não é rotina de adulto. A partir de 18 anos com doença cardiovascular ou respiratória crônica relevante ou imunodeficiência. Na UBS, só para gestantes."
        },
        {
          "nome": "Ministério da Saúde/PNI. Calendário Nacional de Vacinação 2026, vacinas do idoso (60 anos ou mais)",
          "tipo": "primaria",
          "ano": 2026,
          "link": "https://www.gov.br/saude/pt-br/vacinacao/arquivos/calendario-nacional-de-vacinacao-idoso",
          "nota": "Lista: hepatite B, dT, febre amarela (excepcional), tríplice viral (profissionais de saúde), pneumocócica 20-valente (acamados, institucionalizados e indígenas), influenza trivalente anual, varicela (profissionais de saúde e indígenas), covid-19 semestral. Não lista VSR nem herpes-zóster."
        },
        {
          "nome": "Ministério da Saúde/PNI. Calendário Nacional de Vacinação 2026, ciclo de vida adulto (25 a 59 anos)",
          "tipo": "primaria",
          "ano": 2026,
          "link": "https://www.gov.br/saude/pt-br/vacinacao/calendario-tecnico/calendario-tecnico-nacional-de-vacinacao-adulto",
          "nota": "Atualizado em 30/01/2026. Lista hepatite B, dT/dTpa (reforço a cada 10 anos; 5 anos se exposição de risco), SCR, febre amarela, VPP23 e varicela para grupos específicos e HPV4 para grupos prioritários. Influenza, herpes-zóster, VSR e VPC20 não constam nesta página."
        }
      ],
      "conferencia": {
        "nivel": "primaria",
        "data": "2026-10-09",
        "pendencias": [
          "Disponibilidade no SUS conferida nos calendários do PNI de 2026 do idoso e do adulto (25 a 59 anos, atualizado em 30/01/2026); ofertas de campanha ou de grupos de risco podem estar em instruções normativas não lidas."
        ]
      },
      "divergencias": [],
      "observacoes": [],
      "disponibilidade_sus": [
        "Não consta no calendário nacional do idoso 2026 do PNI.",
        "SBIm: na UBS, apenas para gestantes.",
        "Também não consta no calendário nacional do adulto (25 a 59 anos) de 2026."
      ]
    }
  ]
};
/* Motor de regras (porte fiel de motor.py). Determinístico, sem rede e sem armazenamento. */
const STATUS_ORDEM = ["indicado_agora", "discutir", "em_dia", "nao_aplicavel"];
const CATEGORIA_ORDEM = { indicado: 0, discutir: 1 };

function casa(e, idade, sexo, fatores) {
  if ("sexo" in e && e.sexo !== sexo) return false;
  if (idade < (e.idade_min ?? 0)) return false;
  if (idade > (e.idade_max ?? 200)) return false;
  if (!(e.fatores_todos || []).every((f) => fatores.has(f))) return false;
  const algum = e.fatores_algum;
  if (algum && algum.length && !algum.some((f) => fatores.has(f))) return false;
  if ((e.fatores_nenhum || []).some((f) => fatores.has(f))) return false;
  return true;
}
function especificidade(e) {
  return (e.fatores_todos || []).length + (e.fatores_algum && e.fatores_algum.length ? 1 : 0);
}
function statusDe(categoria, intervalo, anos) {
  const pendente = categoria === "indicado" ? "indicado_agora" : "discutir";
  if (anos === null || anos === undefined) return pendente;
  if (intervalo === null || intervalo === undefined) return "em_dia";
  return anos >= intervalo ? pendente : "em_dia";
}
function diasEntre(hoje, isoData) {
  const [y, m, d] = isoData.split("-").map(Number);
  const a = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.round((a - Date.UTC(y, m - 1, d)) / 86400000);
}
function avaliar(paciente, regras, hoje) {
  hoje = hoje || new Date();
  const { idade, sexo } = paciente;
  if (!(idade >= 0) || (sexo !== "F" && sexo !== "M")) throw new Error("idade >= 0 e sexo 'F' ou 'M' sao obrigatorios");
  const fatores = new Set(paciente.fatores || []);
  const ultimos = paciente.anos_desde_ultimo || {};
  const itens = [];
  for (const r of regras.regras) {
    const conf = r.conferencia;
    const dias = diasEntre(hoje, conf.data);
    const base = {
      id: r.id, categoria: r.categoria, nome: r.nome, teste: r.teste ?? null,
      fontes: r.fontes.map((f) => ({ nome: f.nome, tipo: f.tipo, ano: f.ano, link: f.link, nota: f.nota })),
      conferencia: conf.nivel, data_conferencia: conf.data, pendencias: conf.pendencias,
      divergencias: r.divergencias || [], observacoes: r.observacoes || [],
      disponibilidade_sus: r.disponibilidade_sus || [],
      revisao_vencida: dias > (r.revisar_a_cada_dias ?? 180),
    };
    const excluidos = (r.exclui_se || []).filter((f) => fatores.has(f)).sort();
    if (excluidos.length) { itens.push({ ...base, status: "nao_aplicavel", motivo: "fator de exclusao: " + excluidos.join(", "), fatores_exclusao: excluidos }); continue; }
    const casadas = r.elegibilidade.filter((e) => casa(e, idade, sexo, fatores));
    if (!casadas.length) { itens.push({ ...base, status: "nao_aplicavel", motivo: "fora da populacao-alvo" }); continue; }
    casadas.sort((a, b) => CATEGORIA_ORDEM[a.categoria] - CATEGORIA_ORDEM[b.categoria] || especificidade(b) - especificidade(a));
    const e = casadas[0];
    const intervalo = "intervalo_anos" in e ? e.intervalo_anos : r.intervalo_anos;
    const u = ultimos[r.id];
    itens.push({ ...base, status: statusDe(e.categoria, intervalo, u === undefined ? null : u), intervalo_anos: intervalo, categoria_item: e.categoria });
  }
  itens.sort((a, b) => STATUS_ORDEM.indexOf(a.status) - STATUS_ORDEM.indexOf(b.status));
  const ativos = itens.filter((i) => i.status !== "nao_aplicavel");
  return {
    itens,
    avisos_de_fonte: ativos.filter((i) => i.conferencia !== "primaria" || i.revisao_vencida)
      .map((i) => ({ id: i.id, nome: i.nome, conferencia: i.conferencia, revisao_vencida: i.revisao_vencida, pendencias: i.pendencias })),
  };
}
if (false && typeof module !== "undefined") module.exports = { avaliar };

window.MedScreening={show(){}};
(function(){
const $=(s,r=document)=>r.querySelector(s);
const esc=(s)=>String(s??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=(u)=>/^https:\/\//.test(u)?u:'#';

/* Fatores de risco, agrupados. sexo: só aparece para esse sexo. */
const GRUPOS=[
 {t:'Doenças e condições',f:[
  ['dm','Diabetes mellitus'],['has','Hipertensão arterial'],['dcv','Doença cardiovascular (infarto, AVC, DAP)'],
  ['sobrepeso_obesidade','Sobrepeso ou obesidade','IMC ≥25 kg/m²'],['obesidade','Obesidade','IMC ≥30 kg/m²; marca também sobrepeso'],
  ['cardiopatia','Cardiopatia crônica'],['pneumopatia','Pneumopatia crônica'],['nefropatia','Nefropatia crônica'],['hepatopatia','Hepatopatia crônica'],
  ['imunossupressao','Imunossupressão ou HIV'],['fragilidade','Fragilidade'],['tabagismo','Tabagismo']]},
 {t:'Risco metabólico (diabetes e lípides)',f:[
  ['prediabetes','Pré-diabetes'],['um_exame_alterado','Apenas um exame com critério de diabetes','aguardando confirmação'],
  ['findrisc_alto','FINDRISC alto ou muito alto'],['tres_ou_mais_fatores_risco','Três ou mais fatores de risco para diabetes'],
  ['dm_familiar_1grau','Diabetes em parente de 1º grau'],['hdl_baixo','HDL <35 mg/dL'],['tg_alto','Triglicerídeos >250 mg/dL'],
  ['sedentarismo','Sedentarismo'],['acantose','Acantose nigricans'],['medicamento_hiperglicemiante','Medicamento hiperglicemiante','ex.: corticoide'],
  ['sop','Síndrome dos ovários policísticos','F'],['dm_gestacional_previo','Diabetes gestacional prévio','F'],
  ['hist_fam_hipercolesterolemia_ou_dcv_precoce','Familiar com hipercolesterolemia ou DCV precoce']]},
 {t:'Câncer: história e exclusões',f:[
  ['ca_mama_previo','Câncer de mama prévio','F'],['alto_risco_mama','Alto risco para câncer de mama','F','BRCA, radioterapia torácica, lesão de alto risco'],
  ['histerectomia_total_benigna','Histerectomia total por doença benigna','F'],['sem_atividade_sexual','Nunca teve atividade sexual','F'],
  ['dna_hpv_negativo_apos_60','DNA-HPV negativo após os 60 anos','F'],
  ['ca_colorretal_previo','Câncer colorretal prévio'],['polipo_adenomatoso','Pólipo adenomatoso prévio'],['doenca_inflamatoria_intestinal','Doença inflamatória intestinal'],
  ['sindrome_hereditaria_colorretal','Síndrome hereditária colorretal','Lynch, polipose'],['ultima_colonoscopia_completa','Último exame foi colonoscopia completa'],
  ['ca_prostata','Câncer de próstata','M'],['hist_fam_prostata','Familiar com câncer de próstata','M'],['raca_negra','Raça negra']]},
 {t:'Saúde óssea',f:[
  ['osteoporose','Osteoporose já diagnosticada'],['baixo_peso','Baixo peso'],['fratura_previa','Fratura por fragilidade prévia'],['corticoide','Uso prolongado de corticoide'],
  ['doenca_ossea_secundaria','Doença que causa perda óssea'],['frax_elevado','FRAX elevado']]}
];
const SEXO_F={};GRUPOS.forEach(g=>g.f.forEach(x=>{if(x[2]==='F'||x[2]==='M')SEXO_F[x[0]]=x[2];}));
const ST={indicado_agora:['Indicado agora','now'],discutir:['Discutir com o paciente','talk'],em_dia:['Em dia','ok']};

const estado={idade:'',sexo:'',fatores:new Set(),ultimos:{},exemplo:false}; // abre vazio, sem paciente de exemplo
const regras=REGRAS;

function intervaloTxt(i){
  const n=i.intervalo_anos;
  if(n===null||n===undefined) return i.categoria==='vacina'?'Dose única ou esquema conforme a vacina':'Sem intervalo fixo; depende do método ou da decisão compartilhada';
  if(n===0.5) return 'Repetir a cada 6 meses';
  if(n===1) return 'Repetir anualmente';
  return 'Repetir a cada '+String(n).replace('.',',')+' anos';
}
const fmtData=(iso)=>iso.split('-').reverse().join('/');

function montarForm(){
  const el=$('#ms-grupos');
  el.innerHTML=GRUPOS.map((g,gi)=>`<details class="ms-grp" data-g="${gi}"${gi===0?' open':''}><summary><span>${esc(g.t)}</span><span class="ms-cnt" data-cnt="${gi}"></span></summary><div class="ms-checks">`+
   g.f.map(([id,rot,a,b])=>{const sx=(a==='F'||a==='M')?a:null;const dica=sx?b:a;
    return `<label class="ms-check" data-sx="${sx||''}"><input type="checkbox" value="${id}"><span>${esc(rot)}${dica?`<small>${esc(dica)}</small>`:''}</span></label>`;}).join('')+
   `</div></details>`).join('');
  el.addEventListener('change',(ev)=>{
    const c=ev.target.closest('input[type=checkbox]');if(!c)return;
    c.checked?estado.fatores.add(c.value):estado.fatores.delete(c.value);
    if(c.value==='obesidade'&&c.checked){estado.fatores.add('sobrepeso_obesidade');}
    estado.exemplo=false;sync();render();});
}
function sync(){
  document.querySelectorAll('#ms-grupos .ms-check').forEach(l=>{
    const sx=l.dataset.sx;const vis=!sx||sx===estado.sexo;l.hidden=!vis;
    const inp=l.firstElementChild;
    if(!vis&&estado.fatores.has(inp.value))estado.fatores.delete(inp.value);
    inp.checked=estado.fatores.has(inp.value);
  });
  document.querySelectorAll('#ms-grupos .ms-grp').forEach(f=>{
    f.hidden=![...f.querySelectorAll('.ms-check')].some(l=>!l.hidden);
    const n=[...f.querySelectorAll('input:checked')].length;
    f.querySelector('.ms-cnt').textContent=n?n+(n===1?' marcado':' marcados'):'';});
  $('#ms-idade').value=estado.idade;$('#ms-sexo').value=estado.sexo;
}
function idadeValida(){const n=Number(estado.idade);return estado.idade!==''&&Number.isInteger(n)&&n>=0&&n<=120;}

function cardHtml(i){
  const [rot,cls]=ST[i.status];
  const ult=estado.ultimos[i.id];
  const fontes=i.fontes.map(f=>`<li><a href="${esc(safeUrl(f.link))}" target="_blank" rel="noopener noreferrer">${esc(f.nome)}</a> <span class="ms-tag">${f.tipo==='primaria'?'fonte primária':'fonte secundária'} · ${esc(f.ano)}</span>${f.nota?`<p class="ms-nota">${esc(f.nota)}</p>`:''}</li>`).join('');
  const div=i.divergencias.length?`<div class="ms-note"><strong>As fontes divergem</strong>${i.divergencias.map(esc).join('<br>')}</div>`:'';
  const sus=i.disponibilidade_sus.length?`<div class="ms-note ms-sus"><strong>Disponibilidade no SUS</strong><ul>${i.disponibilidade_sus.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></div>`:'';
  const aviso=(i.conferencia!=='primaria'||i.revisao_vencida)?`<div class="ms-note ms-warn"><strong>Atenção à fonte</strong>${i.conferencia!=='primaria'?'Fonte '+esc(i.conferencia.replace('_',' '))+'. ':''}${i.revisao_vencida?'Conferência vencida; confirme na diretriz atual.':''}</div>`:'';
  const obs=i.observacoes.length?`<p class="ms-meta" style="margin-top:10px"><b>Observações</b></p><ul class="ms-bullets">${i.observacoes.map(o=>`<li>${esc(o)}</li>`).join('')}</ul>`:'';
  const pend=i.pendencias.length?`<p class="ms-meta" style="margin-top:10px"><b>O que ainda falta conferir</b></p><ul class="ms-bullets">${i.pendencias.map(o=>`<li>${esc(o)}</li>`).join('')}</ul>`:'';
  return `<article class="ms-item ms-${cls}"><div class="ms-item-head"><h4>${esc(i.nome)}</h4><span class="ms-pill ms-${cls}">${rot}</span><span class="ms-tag">${i.categoria==='vacina'?'Vacina':'Rastreamento'}</span></div>`+
   (i.teste?`<p class="ms-test">${esc(i.teste)}</p>`:'')+
   `<p class="ms-meta">${esc(intervaloTxt(i))} · conferido em ${fmtData(i.data_conferencia)}</p>`+
   `<label class="ms-last">Último feito há <input type="number" inputmode="decimal" min="0" max="120" step="0.5" data-last="${i.id}" value="${ult===undefined||ult===null?'':ult}" aria-label="Anos desde o último, ${esc(i.nome)}"> anos <span class="muted">(vazio = nunca ou não sei)</span></label>`+
   div+sus+aviso+
   `<details><summary>Fontes, observações e pendências</summary><ul class="ms-src">${fontes}</ul>${obs}${pend}</details></article>`;
}

function textoResumo(r){
  const L=[`Rastreamento e vacinas, ${estado.sexo==='F'?'mulher':'homem'}, ${estado.idade} anos (apoio à decisão; confirme na diretriz local)`];
  [['indicado_agora','Indicado agora'],['discutir','Discutir com o paciente'],['em_dia','Em dia']].forEach(([k,t])=>{
    const it=r.itens.filter(i=>i.status===k);if(!it.length)return;L.push('',t+':');it.forEach(i=>L.push('- '+i.nome+' ('+intervaloTxt(i).toLowerCase()+')'));});
  L.push('','Regras v'+regras.versao+', conferidas em '+fmtData(regras.atualizado_em)+'.');return L.join('\n');
}

let ultimoResumo='';
function render(){
  const box=$('#ms-resultado');
  const idadeOk=idadeValida();
  const ok=idadeOk&&(estado.sexo==='F'||estado.sexo==='M');
  $('#ms-f-idade').classList.toggle('ms-invalid',!idadeOk&&estado.idade!=='');
  $('#ms-idade').setAttribute('aria-invalid',String(!idadeOk&&estado.idade!==''));
  $('#ms-idade-hint').hidden=idadeOk||estado.idade==='';
  if(!ok){box.innerHTML=`<div class="ms-empty"><p><b>Informe a idade e o sexo</b> para ver o que está indicado, o que está em dia e o que vale conversar com o paciente.</p></div>`;ultimoResumo='';$('#ms-copiar').disabled=true;return;}
  const r=avaliar({idade:Number(estado.idade),sexo:estado.sexo,fatores:[...estado.fatores],anos_desde_ultimo:Object.fromEntries(Object.entries(estado.ultimos).filter(([,v])=>v!==null&&v!==undefined))},regras,new Date());
  const por=(k)=>r.itens.filter(i=>i.status===k);
  const n={a:por('indicado_agora').length,d:por('discutir').length,e:por('em_dia').length};
  let h=`<div class="ms-summary"><h2>Resultado</h2><span class="ms-chip ms-now">${n.a} indicado${n.a===1?'':'s'} agora</span><span class="ms-chip ms-talk">${n.d} a discutir</span><span class="ms-chip ms-ok">${n.e} em dia</span></div>`;
  if(estado.exemplo)h+=`<div class="ms-notice"><strong>Exemplo carregado</strong> (mulher de 58 anos com hipertensão). Altere os dados ao lado ou toque em Limpar.</div>`;
  if(r.avisos_de_fonte.length)h+=`<div class="ms-note ms-warn" style="margin:0 0 12px"><strong>Regras com fonte não primária ou conferência vencida</strong>${r.avisos_de_fonte.map(a=>esc(a.nome)).join('; ')}.</div>`;
  [['indicado_agora','Indicado agora'],['discutir','Discutir com o paciente (decisão compartilhada)'],['em_dia','Em dia, dentro do intervalo']].forEach(([k,t])=>{
    const it=por(k);if(it.length)h+=`<section class="ms-group"><h3>${t}</h3>${it.map(cardHtml).join('')}</section>`;});
  if(!n.a&&!n.d&&!n.e)h+=`<div class="ms-empty"><p>Nenhum item se aplica a este perfil.</p></div>`;
  const na=por('nao_aplicavel');
  if(na.length)h+=`<section class="ms-group"><details><summary>Não se aplicam a este perfil (${na.length})</summary><ul class="ms-na">${na.map(i=>`<li><b>${esc(i.nome)}</b>: ${i.fatores_exclusao?'excluído por '+esc(i.fatores_exclusao.join(', ').replace(/_/g,' ')):'fora da faixa etária ou do sexo da população-alvo'}</li>`).join('')}</ul></details></section>`;
  box.innerHTML=h;ultimoResumo=textoResumo(r);$('#ms-copiar').disabled=false;
}

function copiar(){
  const t=ultimoResumo;if(!t)return;const b=$('#ms-copiar');
  const ok=()=>{b.textContent='Copiado';setTimeout(()=>b.textContent='Copiar resumo',1800);};
  const fb=()=>{const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');ok();}catch(e){b.textContent='Selecione e copie manualmente';}ta.remove();};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(ok,fb);else fb();
}

function init(){
  montarForm();sync();render();
  $('#ms-idade').addEventListener('input',(e)=>{estado.idade=e.target.value.trim();estado.exemplo=false;render();});
  $('#ms-sexo').addEventListener('change',(e)=>{estado.sexo=e.target.value;estado.exemplo=false;sync();render();});
  $('#ms-resultado').addEventListener('change',(e)=>{const i=e.target.closest('[data-last]');if(!i)return;
    const v=i.value.trim();if(v==='')delete estado.ultimos[i.dataset.last];else{const n=Number(v.replace(',','.'));if(n>=0)estado.ultimos[i.dataset.last]=n;}
    estado.exemplo=false;render();});
  $('#ms-limpar').addEventListener('click',()=>{estado.idade='';estado.sexo='';estado.fatores=new Set();estado.ultimos={};estado.exemplo=false;sync();render();$('#ms-idade').focus();});
  $('#ms-copiar').addEventListener('click',copiar);
}
init();
$('#ms-rodape').textContent='Regras v'+REGRAS.versao+', conferidas em '+REGRAS.atualizado_em.split('-').reverse().join('/')+'. Limites: o rastreio não substitui a avaliação de risco individual (alto risco, história familiar e condutas após exames alterados seguem protocolos próprios).';
})();

})();
