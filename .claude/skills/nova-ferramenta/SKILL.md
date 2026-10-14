---
name: nova-ferramenta
description: Use ao criar ou alterar uma calculadora, escore ou ferramenta do CalcMed (campos, cálculo, referência, testes e registro na aba correta).
---

# Nova ferramenta no CalcMed

## 1. Antes de codar
- Confirmar com o Fernando: nome, aba de destino (clínica, cirurgia, gineco, geriatria, paliativos, rastreio, mental ou leitura), fonte primária (artigo/diretriz, ano) e a fórmula ou tabela exata.
- Se a fonte não foi fornecida, buscar a publicação original. Não usar coeficientes de memória. Se não achar, parar e perguntar.

## 2. Escolher o padrão
- **Calculadora simples (escore ou fórmula)**: adicionar objeto em `js/calculators.js` seguindo uma calculadora vizinha da mesma categoria (ler só o bloco dela com grep, não o arquivo todo). Campos: `number`, `select`, `check`, `date`. `compute(v)` retorna `{ main, sub, level, details? }`.
- **Instrumento com motor próprio (Leitura crítica ou algoritmo complexo)**: criar `js/lc-<nome>.js` no padrão UMD de `js/lc-amstar.js` (sem DOM no motor), e a interface no arquivo `leituracritica*.js` correspondente.
- **Regra de rastreio ou vacina**: adicionar em `js/medscreening.js` com `fonte`, `nivel` e data de conferência.

## 3. Implementar
- Texto em português do Brasil; números com `fmt`/`pct` (vírgula decimal).
- Preencher `ref` com fonte, ano e versão.
- Validar entradas: valores impossíveis ou fora da faixa de validação do escore devem gerar aviso, não resultado.
- Se for motor novo: incluir o `<script>` em `index.html` na ordem correta (antes de `app.js`).
- Se for categoria nova: registrar em `CAT_STYLE` (`js/app.js`) com ícone existente em `js/icons.js`.

## 4. Testar
- Criar `tests/<nome>.test.js` (node:test) com casos da publicação original: valores de referência, limites das faixas e entradas inválidas.
- Rodar `node --test tests/*.test.js` e só concluir com tudo passando.

## 5. Conferir e entregar
- Abrir via `python3 -m http.server 8000` e testar a ferramenta no navegador, incluindo o link direto (`#calc/<id>`).
- Atualizar a lista de ferramentas no `README.md`.
- Resumir em 2 linhas: o que foi criado, fonte usada e resultado dos testes.
