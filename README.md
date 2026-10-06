# MedCalc — Calculadoras médicas e educação em saúde

Site estático (HTML, CSS e JavaScript puro, sem etapa de build) com:

- **Calculadoras por especialidade**, separadas em abas:
  - **Clínica**: Escore de Risco Global (Framingham/SBC), ASCVD (Pooled Cohort), classificação da PA, CHA₂DS₂-VASc, HAS-BLED,
    LDL (Friedewald), IMC/cintura, FINDRISC, HOMA-IR, TFG CKD-EPI 2021, Cockcroft-Gault, OST, ORAI, fatores de risco de fratura (FRAX),
    CURB-65, qSOFA, Wells TEP/TVP, Pádua, Child-Pugh, MELD-Na.
  - **Cirúrgica**: Índice de Lee (RCRI), ASA, Caprini, STOP-BANG, Apfel, Alvarado, Glasgow, Parkland, índice de choque (+ TFG, Wells, Child/MELD).
  - **Ginecologia e obstetrícia**: IG/DPP pela DUM e pela USG, ganho de peso gestacional, risco de pré-eclâmpsia (AAS),
    diabetes gestacional, Bishop, Apgar, peso fetal (Hadlock), período fértil (+ osteoporose, Caprini, Wells).
- **Material para o paciente — Hipertensão**: o que é, importância do tratamento, alimentação, atividade física,
  como medir a pressão em casa, hábitos e sinais de alerta. Pode ser impresso ou salvo em PDF.
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

Links diretos: `#clinica`, `#cirurgia`, `#gineco`, `#educacao/has-nutricao`, `#calc/framingham`.

## Estrutura

```
index.html          página e componentes (abas, diálogo, painel da IA)
css/styles.css      estilos (tema claro/escuro, responsivo, impressão)
js/calculators.js   definição de cada calculadora (campos, fórmula, interpretação, referência)
js/education.js     conteúdo educativo sobre hipertensão
js/app.js           interface, busca, roteamento por hash
js/ai.js            assistente (modo guia + integração com Claude)
```

Para adicionar uma calculadora, inclua um objeto em `js/calculators.js` com `id`, `name`, `tabs`, `category`, `fields`
e `compute(v)` — o formulário é gerado automaticamente.

## Aviso

Ferramenta de apoio à decisão e educação em saúde. Não substitui a avaliação clínica individual nem as diretrizes vigentes.
Não insira dados que identifiquem pacientes no assistente de IA.
