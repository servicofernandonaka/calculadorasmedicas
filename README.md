# MedCalc — Calculadoras médicas e educação em saúde

Site estático (HTML, CSS e JavaScript puro, sem etapa de build) com:

- **Calculadoras por especialidade**, separadas em abas:
  - **Clínica**: PREVENT (escore recomendado pela SBC 2025), Framingham e ASCVD (versões anteriores, para comparação),
    classificação da PA (Diretriz 2025), CHA₂DS₂-VA, HAS-BLED, LDL (Sampson e Friedewald), IMC/cintura, FINDRISC, HOMA-IR,
    TFG CKD-EPI 2021, Cockcroft-Gault, OST, ORAI, checklist dos fatores do FRAX,
    CURB-65, qSOFA, Wells TEP/TVP, Pádua, Child-Pugh, MELD-Na, DPOC (GOLD 2025: grau e grupo ABE), asma (GINA: tratamento inicial e controle).
  - **Cirúrgica**: Índice de Lee (RCRI), ASA, Caprini, STOP-BANG, Apfel, Alvarado, Glasgow, reposição em queimados (ATLS/Parkland), índice de choque (+ TFG, Wells, Child/MELD).
  - **Ginecologia e obstetrícia**: IG/DPP pela DUM e pela USG, ganho de peso gestacional (curvas brasileiras, MS 2022), risco de pré-eclâmpsia (AAS),
    diabetes gestacional, Bishop, Apgar, peso fetal (Hadlock), período fértil (+ osteoporose, Caprini, Wells).
  - **Geriatria**: IVCF-20, Escala Clínica de Fragilidade (CFS), FRAIL, SARC-F, velocidade de marcha, Timed Up and Go,
    Morse, Braden, Katz (ABVD), Lawton-Brody (AIVD), MEEM, Mini-Cog, GDS-15, 4AT (delirium) e MNA-SF
    (+ PA, CHA₂DS₂-VASc, HAS-BLED, TFG, Cockcroft-Gault, osteoporose/FRAX, Pádua, STOP-BANG, IMC).
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

## Como usar

Abra `index.html` no navegador, ou sirva a pasta localmente:

```bash
python3 -m http.server 8000
# http://localhost:8000
```

Para publicar no **GitHub Pages**: Settings → Pages → *Deploy from a branch* → selecione a branch e a pasta `/ (root)`.

Links diretos: `#clinica`, `#cirurgia`, `#gineco`, `#geriatria`, `#paliativos`, `#educacao/has-nutricao`, `#educacao/dm` (abre o primeiro tópico do guia), `#calc/framingham`.

## Estrutura

```
index.html          página e componentes (abas, diálogo, painel da IA)
css/styles.css      estilos (tema claro/escuro, responsivo, impressão)
js/calculators.js   definição de cada calculadora (campos, fórmula, interpretação, referência)
js/education.js     conteúdo educativo para pacientes (guias por tema)
js/app.js           interface, busca, roteamento por hash
js/ai.js            assistente (modo guia + integração com Claude)
```

Para adicionar uma calculadora, inclua um objeto em `js/calculators.js` com `id`, `name`, `tabs`, `category`, `fields`
e `compute(v)` — o formulário é gerado automaticamente.

O PREVENT usa os coeficientes do modelo base de 10 anos de Khan et al. (Circulation 2024), extraídos do pacote R
[`preventr`](https://github.com/martingmayer/preventr) (MIT), e reproduz os valores de referência dos testes desse pacote.

## Aviso

Ferramenta de apoio à decisão e educação em saúde. Não substitui a avaliação clínica individual nem as diretrizes vigentes.
Não insira dados que identifiquem pacientes no assistente de IA.
