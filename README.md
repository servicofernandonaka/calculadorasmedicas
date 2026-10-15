# CalcMed — Calculadoras médicas e educação em saúde

Site estático (HTML, CSS e JavaScript puro, sem etapa de build) com:

- **Calculadoras por especialidade**, separadas em abas:
  - **Clínica**: PREVENT (escore recomendado pela SBC 2025), Framingham e ASCVD (versões anteriores, para comparação),
    classificação da PA (Diretriz 2025), CHA₂DS₂-VA, HAS-BLED, LDL (Sampson e Friedewald), IMC/cintura, FINDRISC, HOMA-IR,
    TFG CKD-EPI 2021, Cockcroft-Gault, OST, ORAI, checklist dos fatores do FRAX,
    CURB-65, qSOFA, Wells TEP/TVP, Pádua, Child-Pugh, MELD-Na, DPOC (GOLD 2025: grau e grupo ABE), asma (GINA: tratamento inicial e controle), PHQ-9 e GAD-7.
  - **Cirúrgica**: Índice de Lee (RCRI), ASA, Caprini, STOP-BANG, Apfel, Alvarado, Glasgow, reposição em queimados (ATLS/Parkland), índice de choque (+ TFG, Wells, Child/MELD).
  - **Ginecologia e obstetrícia**: IG/DPP pela DUM e pela USG, ganho de peso gestacional (curvas brasileiras, MS 2022), risco de pré-eclâmpsia (AAS),
    diabetes gestacional, Bishop, Apgar, peso fetal (Hadlock), período fértil (+ osteoporose, Caprini, Wells).
  - **Geriatria**: IVCF-20, Escala Clínica de Fragilidade (CFS), FRAIL, SARC-F, velocidade de marcha, Timed Up and Go,
    Morse, Braden, Katz (ABVD), Lawton-Brody (AIVD), MEEM, Mini-Cog, GDS-15, 4AT (delirium) e MNA-SF
    (+ PA, CHA₂DS₂-VASc, HAS-BLED, TFG, Cockcroft-Gault, osteoporose/FRAX, Pádua, STOP-BANG, IMC).
- **Rastreio (MedScreening)**: rastreamentos e vacinas indicados por idade, sexo e fatores de risco, com fonte e data de
  conferência em cada regra (INCA/MS, SBD, SBC, SBIm, PNI, USPSTF). Roda inteiramente no navegador.
- **LabCore APS** (aba `#labcore`): interpretação de exames laboratoriais na APS. *Bancada Rápida* com TFGe CKD-EPI 2021 sem raça e matriz KDIGO,
  FIB-4 por faixa etária e De Ritis, LDL por Friedewald/Sampson, Mentzer, saturação de transferrina, Na e Ca corrigidos, HOMA-IR e ânion gap, filtros
  pré-analíticos (hemólise, lipemia, icterícia, biotina) e texto SOAP/e-SUS; *Colar do Prontuário* (parser local por regex); *Governança* com o
  `GUIDELINES_REGISTRY` (`js/labcore-registry.js`), 12 sociedades monitoradas, relógio de 30 dias, sincronização por OpenRouter com busca na web ou por prompt
  externo (sempre com diff e aprovação humana), editor de cutoffs locais e changelog. *Fluxogramas* (`js/labcore-fluxos.js`): 8 árvores de decisão interativas, com cortes lidos do Registry: eixo tireoidiano (adulto, subclínico, gestação, biotina),
  sífilis (matriz treponêmico × VDRL, prozona, resposta ao tratamento), toxoplasmose gestacional (avidez), hepatite B, hipertransaminasemia/colestase (fator R, Gilbert),
  FAN/ICAP (AC-2 × padrões de LES, esclerodermia e Sjögren), gamopatias monoclonais (IMWG: CRAB e SLiM) e urinálise/urocultura (IDSA 2019). *Enciclopédia*
  (`js/labcore-enciclopedia.js`): meia-vida, interferentes e critérios de encaminhamento; a lista de exames obrigatórios de cada central (CROSS/SISREG) é colada pelo usuário e fica só no navegador.
  Adendo de hematologia e proteínas: globulinas e A/G, checklist CRAB, IPR, Green & King, cinética do ferro, ANC, coagulograma (INR e razão do TTPa), alerta de pseudotrombocitopenia por EDTA,
  simulador de EPS com curva SVG e interpretador de eletroforese de hemoglobina/HPLC (`js/labcore-hemato.js`). **Criador de exames**: botão "+ Adicionar Novo Exame / Índice" (salva no navegador, exporta/importa `.json`)
  ou, por código, os arrays `CUSTOM_EXAMS_PLUGINS` e `CUSTOM_FLOWS_PLUGINS` em `js/labcore-plugins.js`; as fórmulas passam por um avaliador próprio (sem `eval`).
  Painéis estratégicos da APS: próstata (PSA corrigido por 5-ARI, relação livre/total, densidade, interferentes), metabolismo ósseo e paratireoide, vitamina B12 com homocisteína/AMM,
  doença celíaca (regra da IgA e do glúten prévio), calprotectina e elastase fecais, e o analisador de líquidos cavitários (`js/labcore-liquidos.js`): ascite (GASA, PBE, peritonite secundária)
  e derrame pleural (critérios de Light, pseudoexsudato por diurético e indicação de drenagem). O botão "+ Novo Exame / Adendo" fica no topo do site; a Governança exporta e importa os exames cadastrados.
  Cada parâmetro do Registry tem status: diretriz, fonte secundária, a verificar ou referência do laboratório; nenhum dos novos cortes foi conferido no texto original da diretriz.
- **Leitura crítica de artigos**: risco de viés de ensaios randomizados de grupos paralelos pelo **RoB 2** (algoritmo oficial,
  5 domínios, efeito da designação ou de aderir), com perguntas em português e o original em inglês, e calculadora de efeito
  (RAR, RRR, RR, OR, NNT/NNH com IC 95%, NNT para o risco basal do paciente, diferença de médias) e de acurácia diagnóstica (sensibilidade, especificidade, razões de verossimilhança, valores preditivos e probabilidade pós-teste a partir da tabela 2x2). Conferido no guia oficial
  de 22/08/2019; os testes reproduzem as tabelas 4, 6, 8, 10, 12 e 14 do guia. Também cobre coortes e outros estudos não randomizados (**ROBINS-I**, guia de 20/10/2016: caminho
  de perguntas oficial, critérios por domínio e julgamento global pela Tabela 2) e revisões sistemáticas (**AMSTAR 2**, 16 itens
  derivados dos critérios marcados, sem pontuação, mais a classificação consultiva de confiança da Caixa 2 do artigo). Estudos de acurácia diagnóstica: **QUADAS-2** (4 domínios, 11 perguntas de sinalização; sugestões e julgamento global conforme o artigo original de 2011, julgamento de domínio do avaliador). Opcional: **pré-preenchimento por IA** (RoB 2 e AMSTAR 2; textos longos têm referências e apêndices cortados automaticamente) (cole o texto do artigo ou envie o PDF/TXT; usa a
  chave configurada no Assistente IA): a IA sugere cada resposta com a citação do trecho, o site verifica que a citação existe no
  texto e o médico aceita ou corrige; o julgamento continua sendo do algoritmo determinístico.
- **Cuidados paliativos**: SPICT-BR, PPS, Índice Prognóstico Paliativo (PPI), ECOG/Karnofsky, ESAS-r (+ CFS).
- **Material para o paciente** (aba Paciente), em guias por tema, cada um impresso ou salvo em PDF separadamente:
  - **Hipertensão**: o que é, importância do tratamento, alimentação, atividade física, como medir a pressão em casa, hábitos e sinais de alerta.
  - **Diabetes**: o que é, tratamento e metas, alimentação e atividade física, hipoglicemia e dias de doença, cuidados com os pés.
  - **Colesterol e triglicerídeos**: exames e metas de LDL, remédios (estatinas), alimentação e hábitos.
  - **Insuficiência cardíaca**: o que é, remédios, autocuidado (peso, sal, líquidos) e sinais de alerta.
  - **Prevenção de quedas no idoso**: causas, casa segura, exercícios de força e equilíbrio, remédios, calçados e o que fazer após cair.
  - **Asma**: o que é, remédios, como usar a bombinha, crise e plano de ação.
  - **DPOC**: o que é, cigarro, remédios e vacinas, exercício e respiração, crise e sinais de alerta.
  - **Fibromialgia**: o que é, tratamento, sono e dia a dia.
  - **Depressão e ansiedade**: sintomas, tratamento, autocuidado e onde buscar ajuda em crise (CVV 188).
- **Assistente IA** (botão ✨), que guia o usuário até as ferramentas certas:
  - **Modo guia (offline)**: funciona sem configuração, por palavras-chave, sem enviar dados a terceiros.
  - **Modo Claude**: com uma chave da API da Anthropic (⚙️ no painel), usa o SDK oficial `@anthropic-ai/sdk` direto no navegador.
    A chave fica salva apenas no `localStorage` do navegador. Modelo padrão: Claude Opus 5.5; com fallback automático no servidor
    (`fallbacks: "default"`) caso um classificador de segurança recuse a resposta.
  - **Modo Gemini, ChatGPT ou OpenRouter**: escolha a plataforma em ⚙️ e informe a chave do Google AI Studio, da OpenAI ou do OpenRouter. As chamadas vão
    direto do navegador à API REST de cada plataforma, com streaming. Cada plataforma guarda sua própria chave; dá para digitar
    o ID de outro modelo em "Outro modelo".

## Como usar

Abra `index.html` no navegador, ou sirva a pasta localmente:

```bash
python3 -m http.server 8000
# http://localhost:8000
```

Testes dos motores da Leitura crítica e do LabCore (sem dependências): `node --test tests/*.test.js`.

Para publicar no **GitHub Pages**: Settings → Pages → *Deploy from a branch* → selecione a branch e a pasta `/ (root)`.

Links diretos: `#clinica`, `#cirurgia`, `#gineco`, `#geriatria`, `#paliativos`, `#rastreio`, `#mental`, `#leitura`, `#labcore`, `#educacao/has-nutricao`, `#educacao/dm` (abre o primeiro tópico do guia), `#calc/framingham`.

## Estrutura

```
index.html          página e componentes (abas, diálogo, painel da IA)
css/styles.css      estilos (tema claro/escuro, cor por especialidade, responsivo, impressão)
js/calculators.js   definição de cada calculadora (campos, fórmula, interpretação, referência)
js/education.js     conteúdo educativo para pacientes (guias por tema)
js/app.js           interface, busca, roteamento por hash
js/art.js           ilustrações SVG coloridas do cabeçalho de cada aba
js/ai.js            assistente (modo guia + Claude, Gemini, ChatGPT e OpenRouter)
```

Para adicionar uma calculadora, inclua um objeto em `js/calculators.js` com `id`, `name`, `tabs`, `category`, `fields`
e `compute(v)` — o formulário é gerado automaticamente.

O PREVENT usa os coeficientes do modelo base de 10 anos de Khan et al. (Circulation 2024), extraídos do pacote R
[`preventr`](https://github.com/martingmayer/preventr) (MIT), e reproduz os valores de referência dos testes desse pacote.

## Aviso

Ferramenta de apoio à decisão e educação em saúde. Não substitui a avaliação clínica individual nem as diretrizes vigentes.
Não insira dados que identifiquem pacientes no assistente de IA.
