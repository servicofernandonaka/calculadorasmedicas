# LabCore APS: auditoria dos parâmetros `a_verificar`

Status em 2026-10-15. Nenhum status foi alterado: promover um corte para `diretriz` exige abrir o texto original e citar versão e página. Abaixo, o que conferir em cada um dos 12 itens (`js/labcore-registry.js`).

| # | Chave | Valor atual | Fonte a abrir | O que conferir |
|---|---|---|---|---|
| 1 | `tg.pancreatitis` | TG > 800 mg/dL | Diretriz Brasileira de Dislipidemias (SBC); Endocrine Society, hipertrigliceridemia | Qual valor a diretriz usa para risco de pancreatite (valores citados na literatura variam, p. ex. 500, 880 mg/dL ou 1000) |
| 2 | `micro.vcm` | VCM < 80 fL | Valor de referência do laboratório ou BSH/ABHH | Se o corte é do laboratório (então `lab_local`) ou de diretriz |
| 3 | `tsat.low` | TSAT < 20 % | KDIGO Anemia 2012; AGA/BSH sobre deficiência de ferro | Contexto: DRC, doença inflamatória ou população geral |
| 4 | `cicatriz.maxTiter` | VDRL ≤ 1:4 | PCDT IST, MS 2022 | Definição exata de cicatriz sorológica e da faixa de título |
| 5 | `antiHbs.protecao` | ≥ 10 mUI/mL | CDC (Interpretation of HBV Serologic Results); PCDT Hepatite B, MS | Corte de proteção e conduta abaixo dele |
| 6 | `gilbert.indiretaPct` | indireta ≥ 70 % da total | Material clínico de origem não identificado | Achar fonte primária; se não houver, manter `a_verificar` |
| 7 | `gilbert.btUln` | BT < 3 × LSN | Idem | Idem |
| 8 | `titer.cut` | FAN ≥ 1:80 | ICAP (anapatterns.org); Consenso Brasileiro de FAN, SBR | Título de positividade recomendado (1:80 vs 1:160) |
| 9 | `mgus.mMax` | componente M < 3 g/dL | IMWG, Lancet Oncol 2014;15:e538-48 | Limite de MGUS (texto original) |
| 10 | `mgus.riskM` | M ≥ 1,5 g/dL | IMWG 2014 / Mayo, estratificação de risco de MGUS | Limite de maior risco |
| 11 | `cyst.cfu` | ≥ 1.000 UFC/mL | IDSA 2019 (ITU não complicada); Febrasgo/SBU | Corte por cenário (cistite, mulher sintomática) |
| 12 | `contam.species` | ≥ 3 espécies | Manual de microbiologia clínica (ASM Clinical Microbiology Procedures Handbook) | Critério de contaminação da cultura |

## Como fechar cada item
1. Abrir o texto original (PDF ou site oficial) e anotar versão, ano e página/seção.
2. Se o valor bater, trocar o status para `diretriz` e atualizar a `ref` do grupo; se diferir, corrigir o valor e o teste que o cobre.
3. Rodar `node --test tests/*.test.js`.

Posso fazer isso item a item se você colar o trecho da diretriz ou autorizar a busca na web. Resumos de terceiros não bastam para promover o status.
