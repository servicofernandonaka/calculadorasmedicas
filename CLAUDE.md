# CalcMed

Site estático em HTML, CSS e JavaScript puro. Sem build, sem framework, sem npm. Português do Brasil em toda a interface.

## Comandos
- Servir local: `python3 -m http.server 8000`
- Testes: `node --test tests/*.test.js` (um arquivo: `node --test tests/rob2.test.js`)

## Estrutura (não ler arquivos inteiros sem necessidade; use grep)
- `index.html`: abas (`data-tab`) e ordem dos `<script>` (a ordem importa)
- `js/app.js`: registro das abas (`TABS`), categorias (`CAT_STYLE`), roteamento por hash
- `js/calculators.js` (~137 KB): calculadoras das abas Clínica, Cirúrgica, Gineco, Geriatria, Paliativos
- `js/medscreening.js`: Rastreio (regras em JSON dentro do arquivo, com fonte e data)
- `js/mentalhealth.js`: Saúde mental
- `js/leituracritica*.js` e `js/lc-*.js`: Leitura crítica (motores em `lc-*.js`, interface em `leituracritica*.js`)
- `js/education.js`: guias do Paciente
- `js/ai.js`, `js/lc-ia.js`: Assistente IA e pré-preenchimento por IA
- `js/icons.js`, `js/art.js`: ícones e ilustrações SVG
- `css/styles.css` (~66 KB): estilos; reutilizar classes e variáveis existentes
- `tests/`: testes dos motores `lc-*` (node:test, sem dependências)

## Formato de uma calculadora (`js/calculators.js`)
`{ id, name, short, tabs, category, keywords, fields, compute, ref }`
- Campos: `number`, `select`, `check` (pontos), `date`
- `compute(v)` retorna `{ main, sub, level: 'low'|'mod'|'high'|'info', details? }`
- Formatar números com `fmt`/`pct` (pt-BR, vírgula decimal)

## Regras
- Rigor clínico: toda fórmula ou escore cita a fonte e a versão (diretriz, ano) em `ref`. Nunca inventar coeficiente ou ponto de corte; se não houver fonte verificada, perguntar.
- Motores de cálculo são determinísticos e testáveis (sem DOM dentro do motor). Todo motor novo ganha teste em `tests/` com valores de referência da publicação original.
- Padrão de módulo dos motores: UMD (`module.exports` no Node, global no navegador), como em `js/lc-amstar.js`.
- Nenhum dado de paciente sai do navegador, exceto chamada de IA que o usuário configurou. Chaves de API só em `localStorage`.
- Nova ferramenta = nova aba/seção no CalcMed, com perguntas em português (e o original em inglês quando for instrumento traduzido).
- Evitar dependências externas e etapa de build. Manter o site abrindo direto por `index.html`.
- Rodar `node --test tests/*.test.js` antes de dar uma tarefa por concluída.

## Fluxo de trabalho
- Uma ferramenta ou correção por sessão; `/clear` ao trocar de assunto.
- Mudança que toca `index.html` e `app.js`: conferir a ordem dos scripts e o hash de navegação (`#leitura`, `#calc/<id>`).
