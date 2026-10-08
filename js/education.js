/* Material educativo para pacientes, organizado em guias por tema (cardiometabólicos, respiratórios, quedas, dor crônica e saúde mental) */
(function () {
  'use strict';

  window.EDU = [
    {
      id: 'has-oque',
      guide: 'has',
      sources: 'Diretriz Brasileira de Hipertensão Arterial — 2025 (SBC/SBH/SBN).',
      icon: 'heart',
      title: 'O que é pressão alta',
      keywords: 'o que é hipertensão pressão alta sintomas causas',
      html: `
        <p class="lead">Hipertensão arterial (pressão alta) é quando a força do sangue contra a parede das artérias fica
        <strong>elevada de forma persistente</strong> — em geral, medidas iguais ou acima de <strong>14 por 9 (140/90 mmHg)</strong> no consultório.</p>
        <h3>Por que ela é chamada de “doença silenciosa”?</h3>
        <p>Na maioria das pessoas, a pressão alta <strong>não causa nenhum sintoma</strong>. Dor de cabeça, tontura ou
        sangramento nasal não são sinais confiáveis. A única forma de saber é <strong>medindo</strong>.</p>
        <h3>Como entender os números</h3>
        <div class="table-wrap"><table>
          <thead><tr><th scope="col">Categoria</th><th scope="col">Sistólica (máxima)</th><th scope="col">Combinação</th><th scope="col">Diastólica (mínima)</th></tr></thead>
          <tbody>
            <tr><td>Normal</td><td>&lt; 120</td><td>e</td><td>&lt; 80</td></tr>
            <tr><td>Pré-hipertensão</td><td>120–139</td><td>e/ou</td><td>80–89</td></tr>
            <tr><td>Hipertensão estágio 1</td><td>140–159</td><td>e/ou</td><td>90–99</td></tr>
            <tr><td>Hipertensão estágio 2</td><td>160–179</td><td>e/ou</td><td>100–109</td></tr>
            <tr><td>Hipertensão estágio 3</td><td>≥ 180</td><td>e/ou</td><td>≥ 110</td></tr>
          </tbody>
        </table></div>
        <h3>O que aumenta o risco</h3>
        <ul>
          <li>Histórico familiar e envelhecimento</li>
          <li>Excesso de sal e de alimentos ultraprocessados</li>
          <li>Excesso de peso, principalmente gordura na barriga</li>
          <li>Sedentarismo, álcool em excesso e tabagismo</li>
          <li>Estresse crônico e sono ruim (incluindo apneia do sono)</li>
          <li>Diabetes e doença renal</li>
        </ul>`,
    },
    {
      id: 'has-tratamento',
      guide: 'has',
      sources: 'Ettehad D et al. Lancet 2016 (meta-análise de 48 ensaios); Diretriz Brasileira de Hipertensão Arterial — 2025.',
      icon: 'pill',
      title: 'Importância do tratamento',
      keywords: 'tratamento remédio medicamento adesão parar remédio importância complicações',
      html: `
        <p class="lead">Controlar a pressão é uma das medidas que <strong>mais salvam vidas</strong> na medicina. Cada
        redução de 10 mmHg na pressão sistólica diminui em cerca de <strong>20% os eventos cardiovasculares graves</strong>
        (infarto, AVC, insuficiência cardíaca) e em <strong>mais de 25% o risco de AVC (derrame)</strong>.</p>
        <h3>O que a pressão alta sem controle pode causar</h3>
        <div class="grid-cards">
          <div class="mini-card"><strong>Cérebro</strong><span>AVC (derrame) e demência</span></div>
          <div class="mini-card"><strong>Coração</strong><span>Infarto, insuficiência cardíaca e arritmias</span></div>
          <div class="mini-card"><strong>Rins</strong><span>Doença renal crônica e necessidade de diálise</span></div>
          <div class="mini-card"><strong>Olhos</strong><span>Lesões na retina e perda de visão</span></div>
          <div class="mini-card"><strong>Artérias</strong><span>Aneurismas e má circulação nas pernas</span></div>
        </div>
        <h3>Sobre os remédios</h3>
        <ul>
          <li><strong>Tome todos os dias</strong>, mesmo quando a pressão estiver boa — ela está boa <em>justamente</em> por causa do remédio.</li>
          <li><strong>Não pare nem mude a dose por conta própria.</strong> Se tiver efeitos colaterais, fale com seu médico: quase sempre há outra opção.</li>
          <li>Associe o horário do remédio a uma rotina (escovar os dentes, café da manhã) ou use alarme no celular.</li>
          <li>Leve sua lista de medicamentos a todas as consultas, inclusive vitaminas e chás.</li>
          <li>Evite anti-inflamatórios (como diclofenaco, ibuprofeno, nimesulida) e descongestionantes nasais sem orientação: eles aumentam a pressão.</li>
          <li>Hipertensão normalmente é uma condição para a vida toda — o tratamento é contínuo.</li>
        </ul>
        <h3>Meta de pressão</h3>
        <p>Para a maioria das pessoas, a meta é ficar <strong>abaixo de 130/80 mmHg</strong>. Seu médico pode definir
        uma meta individual, conforme idade e outras doenças.</p>`,
    },
    {
      id: 'has-nutricao',
      guide: 'has',
      sources: 'Diretriz Brasileira de Hipertensão Arterial — 2025 (sódio < 2 g/dia ≈ 5 g de sal); Organização Mundial da Saúde.',
      icon: 'leaf',
      title: 'Alimentação',
      keywords: 'alimentação nutrição dieta sal sódio dash comida potássio frutas',
      html: `
        <p class="lead">A alimentação pode reduzir a pressão tanto quanto um remédio. O modelo mais estudado é a
        <strong>dieta DASH</strong>, rica em frutas, verduras, legumes, grãos integrais e laticínios com pouca gordura.</p>
        <h3>Menos sal</h3>
        <ul>
          <li>Meta: no máximo <strong>5 g de sal por dia</strong> (≈ 1 colher de chá rasa), somando o sal de todos os alimentos.</li>
          <li>Tire o saleiro da mesa e cozinhe com <strong>temperos naturais</strong>: alho, cebola, limão, ervas, pimenta, cheiro-verde.</li>
          <li>Evite caldos e temperos prontos, embutidos (salsicha, presunto, linguiça), enlatados, salgadinhos e macarrão instantâneo.</li>
          <li>Leia os rótulos: a lupa “<strong>ALTO EM SÓDIO</strong>” indica produtos a evitar.</li>
          <li>O paladar se adapta em 2 a 4 semanas — no começo a comida parece sem graça, depois o excesso de sal passa a incomodar.</li>
        </ul>
        <h3>Inclua todos os dias</h3>
        <ul>
          <li>Frutas e verduras em todas as refeições (fontes de potássio: banana, laranja, feijão, abacate, folhas verdes)*</li>
          <li>Feijão, lentilha, grão-de-bico</li>
          <li>Arroz, pão e aveia integrais</li>
          <li>Leite e iogurte desnatados</li>
          <li>Castanhas, sementes e azeite com moderação</li>
          <li>Peixes 2 vezes por semana</li>
        </ul>
        <p class="note">* Quem tem doença renal ou usa certos remédios para pressão deve perguntar ao médico antes de aumentar o potássio ou usar “sal light”.</p>
        <h3>Reduza</h3>
        <ul>
          <li>Ultraprocessados, frituras e carnes gordurosas</li>
          <li>Açúcar e refrigerantes</li>
          <li>Bebidas alcoólicas — quanto menos, melhor; o ideal é evitar</li>
        </ul>
        <h3>Exemplo de prato</h3>
        <p>Metade do prato com verduras e legumes, ¼ com arroz integral ou outro cereal, ¼ com feijão e uma proteína
        magra (frango, peixe, ovo) — temperados com ervas e um fio de azeite.</p>`,
    },
    {
      id: 'has-atividade',
      guide: 'has',
      sources: 'Diretriz Brasileira de Hipertensão Arterial — 2025; OMS — Diretrizes de atividade física (2020).',
      icon: 'activity',
      title: 'Atividade física',
      keywords: 'atividade física exercício caminhada academia musculação esporte',
      html: `
        <p class="lead">Exercício regular <strong>ajuda a baixar a pressão</strong>, melhora o coração, o humor,
        o sono e ajuda a controlar o peso e a glicose.</p>
        <h3>Quanto fazer</h3>
        <ul>
          <li><strong>Aeróbico:</strong> pelo menos <strong>150 minutos por semana</strong> de intensidade moderada
          (ex.: 30 minutos, 5 dias por semana) — caminhada rápida, bicicleta, natação, dança, hidroginástica.</li>
          <li><strong>Fortalecimento muscular:</strong> 2 a 3 vezes por semana (musculação leve a moderada, elásticos, peso do corpo).</li>
          <li><strong>Menos tempo sentado:</strong> levante-se e movimente-se a cada 30–60 minutos.</li>
        </ul>
        <h3>Como saber se a intensidade está boa</h3>
        <p>No esforço moderado, você consegue <strong>falar, mas não cantar</strong>. A respiração fica mais rápida, mas sem falta de ar.</p>
        <h3>Dicas de segurança</h3>
        <ul>
          <li>Comece devagar (10 minutos por dia já ajudam) e aumente aos poucos.</li>
          <li>Faça aquecimento e desaquecimento de 5 minutos.</li>
          <li>Na musculação, não prenda a respiração durante o esforço.</li>
          <li>Se a pressão estiver muito alta (≥ 180/110), <strong>não treine</strong> naquele dia e procure orientação.</li>
          <li><strong>Pare e procure atendimento</strong> se sentir dor no peito, falta de ar desproporcional, tontura forte ou palpitações.</li>
          <li>Converse com seu médico antes de iniciar exercícios intensos, principalmente se tiver doença do coração.</li>
        </ul>`,
    },
    {
      id: 'has-medir',
      guide: 'has',
      sources: 'Diretriz Brasileira de Hipertensão Arterial — 2025 (MRPA).',
      icon: 'gauge',
      title: 'Como medir a pressão em casa',
      keywords: 'medir pressão em casa aparelho mrpa técnica medida residencial',
      html: `
        <p class="lead">Medir a pressão em casa (MRPA) ajuda a confirmar o diagnóstico e a acompanhar o tratamento.
        Prefira <strong>aparelhos automáticos de braço</strong> validados (o de pulso é menos confiável).</p>
        <h3>Antes de medir</h3>
        <ul>
          <li>Esvazie a bexiga e fique <strong>5 minutos sentado</strong> em repouso, em local calmo.</li>
          <li>Não fume, não tome café nem faça exercício nos 30 minutos anteriores.</li>
        </ul>
        <h3>Durante a medida</h3>
        <ol>
          <li>Sente-se com as <strong>costas apoiadas</strong>, pernas descruzadas e pés no chão.</li>
          <li>Apoie o braço numa mesa, na altura do coração, com a palma da mão para cima.</li>
          <li>Coloque o manguito no braço nu, 2–3 cm acima da dobra do cotovelo. O tamanho do manguito deve ser adequado ao braço.</li>
          <li><strong>Não fale e não se mexa</strong> durante a medida.</li>
          <li>Faça 3 medidas, com 1 minuto de intervalo entre elas, e anote todas.</li>
        </ol>
        <h3>Quando medir</h3>
        <p>Quando o médico pedir um protocolo: <strong>3 medidas pela manhã</strong> (antes do café e dos remédios) e
        <strong>3 à noite</strong> (antes do jantar), por 5 dias. Anote tudo, com data e hora, e leve na consulta.</p>
        <p>Em casa, valores médios <strong>≥ 130/80 mmHg</strong> são considerados elevados.</p>`,
    },
    {
      id: 'has-habitos',
      guide: 'has',
      sources: 'Neter JE et al. Hypertension 2003 (perda de peso e pressão); Diretriz Brasileira de Hipertensão Arterial — 2025.',
      icon: 'moon',
      title: 'Peso, sono, tabaco e estresse',
      keywords: 'peso emagrecer sono tabaco cigarro estresse ansiedade álcool hábitos',
      html: `
        <h3>Peso</h3>
        <p>Perder peso ajuda muito: cada quilo perdido reduz, em média, cerca de 1 mmHg na pressão. Mesmo perder
        5 a 10% do peso já traz benefício. Tente manter a cintura abaixo de 80 cm (mulheres) ou 94 cm (homens).</p>
        <h3>Cigarro</h3>
        <p>O cigarro aumenta a pressão e multiplica o risco de infarto e AVC. Parar de fumar é a medida isolada mais
        importante para o coração. O SUS oferece tratamento gratuito para parar de fumar — pergunte na sua unidade de saúde.</p>
        <h3>Álcool</h3>
        <p>O excesso de álcool aumenta a pressão e atrapalha o efeito dos remédios. Quanto menos, melhor.</p>
        <h3>Sono</h3>
        <ul>
          <li>Durma de 7 a 9 horas por noite, com horários regulares.</li>
          <li>Ronco alto, pausas na respiração e sonolência durante o dia podem indicar <strong>apneia do sono</strong>, que piora a pressão — conte ao seu médico.</li>
        </ul>
        <h3>Estresse</h3>
        <p>Técnicas de respiração, meditação, atividades de lazer, contato social e atividade física ajudam a controlar o estresse.</p>`,
    },
    {
      id: 'has-alerta',
      guide: 'has',
      sources: 'Diretriz Brasileira de Hipertensão Arterial — 2025; Rede Brasil AVC (teste SAMU).',
      icon: 'alert',
      title: 'Sinais de alerta',
      keywords: 'emergência urgência crise hipertensiva sinais alerta avc infarto samu',
      html: `
        <div class="alert-box">
          <strong>Ligue 192 (SAMU) ou procure um pronto-socorro imediatamente se tiver:</strong>
          <ul>
            <li>Dor ou aperto no peito</li>
            <li>Falta de ar intensa</li>
            <li>Fraqueza, formigamento ou dormência de um lado do corpo</li>
            <li>Boca torta, dificuldade para falar ou entender</li>
            <li>Perda súbita da visão, dor de cabeça muito forte e repentina</li>
            <li>Confusão mental ou desmaio</li>
          </ul>
        </div>
        <h3>Teste rápido para AVC — SAMU</h3>
        <ul>
          <li><strong>S</strong>orria — a boca fica torta?</li>
          <li><strong>A</strong>braço — consegue levantar os dois braços?</li>
          <li><strong>M</strong>úsica — consegue cantar/falar uma frase simples?</li>
          <li><strong>U</strong>rgente — se algum falhar, ligue 192 imediatamente.</li>
        </ul>
        <h3>Pressão muito alta, mas sem sintomas?</h3>
        <p>Se a pressão estiver <strong>≥ 180/110 mmHg sem sintomas</strong>: sente-se, descanse 15–30 minutos e meça
        novamente. Se continuar alta, entre em contato com sua equipe de saúde no mesmo dia. <strong>Não tome doses extras
        de remédio por conta própria</strong> — baixar a pressão rápido demais também pode fazer mal.</p>`,
    },

    /* ===================== Diabetes ===================== */
    {
      id: 'dm-oque',
      guide: 'dm',
      sources: 'Diretriz da Sociedade Brasileira de Diabetes (SBD), edição 2024–2025.',
      icon: 'drop',
      title: 'O que é diabetes',
      keywords: 'o que é diabetes açúcar no sangue glicose glicemia hemoglobina glicada pré-diabetes tipo 1 tipo 2 sintomas',
      html: `
        <p class="lead">Diabetes é quando o <strong>açúcar (glicose) no sangue fica alto</strong> de forma persistente,
        porque o corpo produz pouca insulina ou não consegue usá-la bem. A insulina é o hormônio que leva a glicose do sangue para dentro das células.</p>
        <h3>Tipos mais comuns</h3>
        <ul>
          <li><strong>Tipo 2</strong> (cerca de 9 em cada 10 casos): costuma aparecer em adultos, junto com excesso de peso, sedentarismo e histórico familiar.</li>
          <li><strong>Tipo 1</strong>: o corpo deixa de produzir insulina; é mais comum em crianças e jovens e sempre precisa de insulina.</li>
          <li><strong>Diabetes gestacional</strong>: aparece na gravidez e aumenta o risco de diabetes tipo 2 no futuro.</li>
        </ul>
        <h3>Muitas vezes não dá sintomas</h3>
        <p>O diabetes tipo 2 pode passar anos sem sintomas. Quando a glicose está muito alta, podem aparecer
        <strong>muita sede, urinar muito, fome excessiva, perda de peso sem motivo, cansaço, visão embaçada</strong> e feridas que demoram a cicatrizar.</p>
        <h3>Como entender os exames</h3>
        <div class="table-wrap"><table>
          <thead><tr><th scope="col">Exame</th><th scope="col">Normal</th><th scope="col">Pré-diabetes</th><th scope="col">Diabetes</th></tr></thead>
          <tbody>
            <tr><td>Glicemia de jejum (mg/dL)</td><td>&lt; 100</td><td>100–125</td><td>≥ 126</td></tr>
            <tr><td>Hemoglobina glicada — HbA1c (%)</td><td>&lt; 5,7</td><td>5,7–6,4</td><td>≥ 6,5</td></tr>
            <tr><td>Glicemia 2 h após 75 g de glicose (mg/dL)</td><td>&lt; 140</td><td>140–199</td><td>≥ 200</td></tr>
          </tbody>
        </table></div>
        <p class="note">O diagnóstico é feito pelo médico, em geral com dois exames alterados. A hemoglobina glicada mostra a média da glicose dos últimos 3 meses.</p>
        <h3>Pré-diabetes tem volta</h3>
        <p>Quem tem pré-diabetes pode <strong>evitar ou adiar o diabetes</strong> perdendo de 5 a 7% do peso e fazendo
        150 minutos de atividade física por semana. Esse é o momento ideal para mudar os hábitos.</p>`,
    },
    {
      id: 'dm-tratamento',
      guide: 'dm',
      sources: 'Diretriz da Sociedade Brasileira de Diabetes (SBD), edição 2024–2025.',
      icon: 'pill',
      title: 'Tratamento e metas',
      keywords: 'tratamento diabetes remédio metformina insulina meta glicada glicemia controle exames complicações',
      html: `
        <p class="lead">Manter a glicose controlada <strong>protege olhos, rins, nervos, coração e cérebro</strong>.
        O tratamento combina alimentação, atividade física e, quase sempre, remédios.</p>
        <h3>O que o diabetes sem controle pode causar</h3>
        <div class="grid-cards">
          <div class="mini-card"><strong>Olhos</strong><span>Retinopatia e perda de visão</span></div>
          <div class="mini-card"><strong>Rins</strong><span>Doença renal e necessidade de diálise</span></div>
          <div class="mini-card"><strong>Nervos e pés</strong><span>Dormência, feridas e amputações</span></div>
          <div class="mini-card"><strong>Coração e cérebro</strong><span>Infarto e AVC (derrame)</span></div>
        </div>
        <h3>Metas mais comuns</h3>
        <div class="table-wrap"><table>
          <thead><tr><th scope="col">Exame</th><th scope="col">Meta para a maioria dos adultos</th></tr></thead>
          <tbody>
            <tr><td>Hemoglobina glicada (HbA1c)</td><td>&lt; 7%</td></tr>
            <tr><td>Glicemia em jejum e antes das refeições</td><td>80 a 130 mg/dL</td></tr>
            <tr><td>Glicemia 2 horas após as refeições</td><td>&lt; 180 mg/dL</td></tr>
            <tr><td>Pressão arterial</td><td>&lt; 130/80 mmHg</td></tr>
          </tbody>
        </table></div>
        <p class="note">Para pessoas idosas, frágeis ou com risco de hipoglicemia, o médico costuma definir metas menos rígidas.</p>
        <h3>Sobre os remédios</h3>
        <ul>
          <li><strong>Tome todos os dias</strong>, nos horários combinados, mesmo quando a glicose estiver boa.</li>
          <li>A metformina pode causar enjoo ou diarreia no começo; tomar junto ou logo após a refeição costuma ajudar. Não pare sem falar com o médico.</li>
          <li>Alguns remédios mais novos também <strong>protegem o coração e os rins</strong>, além de baixar a glicose.</li>
          <li><strong>Precisar de insulina não é castigo nem sinal de fracasso</strong>: o diabetes muda com o tempo e a insulina é um tratamento seguro e eficaz.</li>
          <li>Se usa insulina, aprenda a aplicar, a fazer rodízio dos locais de aplicação e a guardar o frasco ou caneta (geladeira, longe do congelador).</li>
        </ul>
        <h3>Exames de rotina</h3>
        <ul>
          <li>Hemoglobina glicada a cada 3 a 6 meses.</li>
          <li>Uma vez por ano: <strong>exame de fundo de olho</strong>, exames de urina e sangue para os rins, colesterol e <strong>exame dos pés</strong>.</li>
          <li>Vacinas em dia: gripe, pneumonia, covid-19 e hepatite B.</li>
        </ul>`,
    },
    {
      id: 'dm-alimentacao',
      guide: 'dm',
      sources: 'Diretriz da Sociedade Brasileira de Diabetes (SBD), edição 2024–2025; Ministério da Saúde — Guia Alimentar para a População Brasileira.',
      icon: 'leaf',
      title: 'Alimentação e atividade física',
      keywords: 'alimentação dieta diabetes carboidrato açúcar doce fruta exercício atividade física caminhada peso',
      html: `
        <p class="lead">Não existe uma “dieta do diabético” única. O mais importante é <strong>comer comida de verdade,
        em horários regulares</strong>, e controlar a quantidade de carboidratos (açúcares e amidos).</p>
        <h3>Monte o prato</h3>
        <ul>
          <li><strong>Metade do prato</strong>: verduras e legumes (alface, couve, brócolis, abobrinha, tomate, cenoura).</li>
          <li><strong>Um quarto</strong>: proteína (feijão, lentilha, ovo, frango, peixe, carne magra).</li>
          <li><strong>Um quarto</strong>: carboidrato, de preferência integral (arroz integral, batata, mandioca, macarrão, pão).</li>
        </ul>
        <h3>Prefira</h3>
        <ul>
          <li>Feijão todos os dias, verduras e legumes à vontade.</li>
          <li>Frutas inteiras (e não sucos), 2 a 3 porções por dia, de preferência após as refeições.</li>
          <li>Água como bebida principal.</li>
          <li>Alimentos integrais e ricos em fibras, como aveia.</li>
        </ul>
        <h3>Evite</h3>
        <ul>
          <li><strong>Refrigerantes, sucos (inclusive os naturais e de caixinha)</strong> e bebidas adoçadas: elevam a glicose muito rápido.</li>
          <li>Doces, bolos, biscoitos recheados e ultraprocessados.</li>
          <li>Excesso de pão branco, farinha e tapioca na mesma refeição.</li>
          <li>Álcool em excesso; se beber, nunca em jejum (risco de hipoglicemia).</li>
        </ul>
        <h3>Atividade física</h3>
        <ul>
          <li>Pelo menos <strong>150 minutos por semana</strong> de atividade moderada (como caminhada rápida), sem ficar mais de 2 dias seguidos parado.</li>
          <li>Exercícios de <strong>fortalecimento muscular</strong> 2 a 3 vezes por semana.</li>
          <li>Uma caminhada de 10 a 15 minutos <strong>depois das refeições</strong> ajuda a baixar a glicose.</li>
          <li>Se usa insulina ou glibenclamida/gliclazida, leve sempre um carboidrato rápido (como balas ou suco) para o caso de hipoglicemia.</li>
          <li>Use tênis confortável e meias, e examine os pés depois do exercício.</li>
        </ul>
        <h3>Peso</h3>
        <p>Perder de 5 a 10% do peso já melhora bastante a glicose — e, em algumas pessoas, pode até levar o diabetes tipo 2 à remissão.</p>`,
    },
    {
      id: 'dm-hipo',
      guide: 'dm',
      sources: 'Diretriz da Sociedade Brasileira de Diabetes (SBD), edição 2024–2025 (regra dos 15).',
      icon: 'alert',
      title: 'Hipoglicemia e dias de doença',
      keywords: 'hipoglicemia glicose baixa tremor suor desmaio regra dos 15 hiperglicemia glicose alta doença vômito febre',
      html: `
        <p class="lead"><strong>Hipoglicemia</strong> é a glicose abaixo de <strong>70 mg/dL</strong>. É mais comum em quem usa
        insulina ou remédios como glibenclamida e gliclazida, principalmente após pular refeições, fazer exercício a mais ou beber álcool.</p>
        <h3>Sinais de hipoglicemia</h3>
        <p>Tremor, suor frio, coração acelerado, fome súbita, tontura, fraqueza, irritação, confusão, fala enrolada e, nos casos graves, desmaio ou convulsão.</p>
        <h3>O que fazer: a regra dos 15</h3>
        <ol>
          <li>Se possível, meça a glicose.</li>
          <li>Tome <strong>15 g de açúcar de absorção rápida</strong>: 1 colher de sopa de açúcar dissolvida em água, <strong>ou</strong> meio copo (150 mL) de suco de laranja ou de refrigerante comum (não diet).</li>
          <li>Espere <strong>15 minutos</strong> e meça de novo.</li>
          <li>Se continuar abaixo de 70, repita. Quando melhorar, faça um lanche ou a próxima refeição.</li>
        </ol>
        <div class="alert-box">
          <strong>Se a pessoa estiver desmaiada ou sem conseguir engolir: não dê nada pela boca. Ligue 192 (SAMU).</strong>
          <p>Avise o médico sempre que tiver hipoglicemia: talvez a dose precise de ajuste.</p>
        </div>
        <h3>Glicose muito alta</h3>
        <p>Muita sede, urina em excesso, boca seca, cansaço e visão embaçada. Glicemias repetidas acima de 300 mg/dL,
        principalmente com <strong>vômitos, dor na barriga, respiração rápida ou sonolência</strong>, exigem atendimento no mesmo dia.</p>
        <h3>Dias de doença (gripe, febre, diarreia, vômitos)</h3>
        <ul>
          <li><strong>Não pare a insulina</strong> por conta própria, mesmo comendo pouco: a doença costuma aumentar a glicose.</li>
          <li>Meça a glicose com mais frequência (a cada 3 a 4 horas, se possível).</li>
          <li>Beba bastante líquido e tente comer porções pequenas.</li>
          <li>Pergunte ao seu médico, com antecedência, <strong>quais remédios suspender</strong> se tiver vômitos, diarreia ou não conseguir se alimentar.</li>
          <li>Procure atendimento se não conseguir se hidratar ou se a glicose não baixar.</li>
        </ul>`,
    },
    {
      id: 'dm-pes',
      guide: 'dm',
      sources: 'Diretriz da Sociedade Brasileira de Diabetes (SBD), edição 2024–2025; IWGDF — Diretrizes de pé diabético (2023).',
      icon: 'foot',
      title: 'Cuidados com os pés',
      keywords: 'pé diabético feridas unha calo sapato calçado dormência neuropatia amputação',
      html: `
        <p class="lead">O diabetes pode diminuir a sensibilidade e a circulação dos pés. Um pequeno machucado pode
        <strong>passar despercebido e virar uma ferida grave</strong>. A maioria das amputações pode ser evitada com cuidados simples.</p>
        <h3>Todos os dias</h3>
        <ul>
          <li><strong>Olhe os pés</strong>, inclusive a sola e entre os dedos (use um espelho ou peça ajuda): procure cortes, bolhas, rachaduras, vermelhidão ou inchaço.</li>
          <li>Lave com água morna (teste a temperatura com o cotovelo, não com o pé) e <strong>seque bem entre os dedos</strong>.</li>
          <li>Hidrate a pele com creme, mas <strong>não passe entre os dedos</strong>.</li>
          <li>Use meias claras, sem costuras e sem elástico apertado.</li>
        </ul>
        <h3>Calçados</h3>
        <ul>
          <li><strong>Nunca ande descalço</strong>, nem dentro de casa ou na praia.</li>
          <li>Use calçados fechados, macios, confortáveis e do tamanho certo. Sapatos novos: use aos poucos.</li>
          <li>Antes de calçar, passe a mão por dentro para ver se não há pedrinhas ou costuras.</li>
        </ul>
        <h3>Não faça</h3>
        <ul>
          <li>Não corte calos nem use calicida, lâminas ou alicates nas cutículas.</li>
          <li>Não use bolsa de água quente, aquecedores ou escalda-pés.</li>
          <li>Corte as unhas <strong>retas</strong>, sem aprofundar os cantos; se tiver dificuldade, procure um profissional.</li>
        </ul>
        <div class="alert-box">
          <strong>Procure a unidade de saúde logo se notar:</strong>
          <ul>
            <li>Ferida, bolha ou corte que não melhora em poucos dias</li>
            <li>Pé vermelho, quente, inchado ou com pus</li>
            <li>Mudança de cor (pé roxo, pálido ou escuro) ou dor forte ao caminhar</li>
          </ul>
        </div>
        <p>Peça para examinarem seus pés <strong>pelo menos uma vez por ano</strong> — ou em todas as consultas, se você já teve feridas ou tem perda de sensibilidade.</p>`,
    },

    /* ===================== Colesterol e triglicerídeos ===================== */
    {
      id: 'dlp-oque',
      guide: 'dlp',
      sources: 'Diretriz Brasileira de Dislipidemias e Prevenção da Aterosclerose — 2025 (SBC).',
      icon: 'activity',
      title: 'Entenda seus exames',
      keywords: 'colesterol ldl hdl triglicerídeos gordura no sangue dislipidemia aterosclerose placa exames metas',
      html: `
        <p class="lead"><strong>Dislipidemia</strong> é o nome dado às alterações das gorduras do sangue: colesterol e triglicerídeos.
        Ela <strong>não causa sintomas</strong>, mas com o tempo forma placas nas artérias (aterosclerose), que podem causar infarto e AVC.</p>
        <h3>O que cada exame mede</h3>
        <div class="grid-cards">
          <div class="mini-card"><strong>LDL-colesterol</strong><span>O “colesterol ruim”: é o que forma placas. É o principal alvo do tratamento.</span></div>
          <div class="mini-card"><strong>HDL-colesterol</strong><span>O “colesterol bom”: ajuda a retirar colesterol das artérias.</span></div>
          <div class="mini-card"><strong>Triglicerídeos</strong><span>Sobem com açúcar, álcool e excesso de peso. Muito altos podem causar pancreatite.</span></div>
          <div class="mini-card"><strong>Não-HDL</strong><span>Soma de todas as partículas que formam placas. Também usado como meta.</span></div>
        </div>
        <h3>Qual deve ser o meu LDL?</h3>
        <p>Não existe um único valor “normal”: <strong>a meta depende do seu risco cardiovascular</strong>, que o médico calcula
        considerando idade, pressão, diabetes, tabagismo, doença renal e se você já teve infarto ou AVC.</p>
        <div class="table-wrap"><table>
          <thead><tr><th scope="col">Risco cardiovascular</th><th scope="col">Meta de LDL (mg/dL)</th></tr></thead>
          <tbody>
            <tr><td>Baixo</td><td>&lt; 115</td></tr>
            <tr><td>Intermediário</td><td>&lt; 100</td></tr>
            <tr><td>Alto</td><td>&lt; 70</td></tr>
            <tr><td>Muito alto (ex.: já teve infarto ou AVC)</td><td>&lt; 50</td></tr>
            <tr><td>Extremo</td><td>&lt; 40</td></tr>
          </tbody>
        </table></div>
        <p class="note">Triglicerídeos: desejável abaixo de 150 mg/dL em jejum (ou 175 mg/dL sem jejum).</p>
        <h3>Colesterol muito alto desde jovem</h3>
        <p>LDL <strong>acima de 190 mg/dL</strong>, ou casos de infarto precoce na família (homens antes dos 55 e mulheres
        antes dos 65 anos), podem indicar <strong>hipercolesterolemia familiar</strong>, uma condição genética. Nesses casos, pais, irmãos e filhos também devem fazer o exame.</p>`,
    },
    {
      id: 'dlp-tratamento',
      guide: 'dlp',
      sources: 'Diretriz Brasileira de Dislipidemias e Prevenção da Aterosclerose — 2025 (SBC); Cholesterol Treatment Trialists (CTT) Collaboration, Lancet 2010.',
      icon: 'pill',
      title: 'Remédios para o colesterol',
      keywords: 'estatina sinvastatina atorvastatina rosuvastatina ezetimiba remédio colesterol dor muscular efeitos colaterais',
      html: `
        <p class="lead">Os remédios para colesterol, principalmente as <strong>estatinas</strong> (sinvastatina, atorvastatina,
        rosuvastatina), estão entre os mais estudados da medicina. Eles <strong>reduzem infartos, AVCs e mortes</strong> — quanto mais baixam o LDL, maior a proteção.</p>
        <h3>Como tomar</h3>
        <ul>
          <li><strong>Todos os dias</strong>, por tempo indeterminado. Se parar, o colesterol volta a subir em poucas semanas e a proteção se perde.</li>
          <li>Sinvastatina funciona melhor à noite; atorvastatina e rosuvastatina podem ser tomadas em qualquer horário, sempre no mesmo.</li>
          <li>O exame normal <strong>não</strong> significa que pode parar: ele está normal por causa do remédio.</li>
          <li>Muitas pessoas precisam de um segundo remédio (como a <strong>ezetimiba</strong>) para chegar à meta.</li>
        </ul>
        <h3>Mitos e verdades</h3>
        <ul>
          <li><strong>“Estatina vicia.”</strong> Mito. Ela não causa dependência.</li>
          <li><strong>“Estatina estraga o fígado.”</strong> Mito. Alterações importantes são raras; o médico acompanha com exames quando necessário.</li>
          <li><strong>“Toda dor muscular é da estatina.”</strong> Mito. Na maioria das vezes a dor tem outra causa. Mesmo assim, <strong>avise o médico</strong>: trocar o remédio ou ajustar a dose costuma resolver.</li>
          <li><strong>“Posso usar só chá ou suplemento.”</strong> Mito. Nenhum chá ou produto natural substitui o tratamento.</li>
        </ul>
        <div class="alert-box">
          <strong>Procure atendimento se tiver dor muscular forte e generalizada com fraqueza ou urina escura (cor de Coca-Cola).</strong>
          <p>É uma reação rara, mas precisa de avaliação no mesmo dia.</p>
        </div>
        <h3>Acompanhamento</h3>
        <p>Repita o perfil lipídico conforme o médico pedir (geralmente de 4 a 12 semanas após iniciar ou mudar a dose, depois a cada 6 a 12 meses).</p>`,
    },
    {
      id: 'dlp-habitos',
      guide: 'dlp',
      sources: 'Diretriz Brasileira de Dislipidemias e Prevenção da Aterosclerose — 2025 (SBC); Ministério da Saúde — Guia Alimentar para a População Brasileira.',
      icon: 'leaf',
      title: 'Alimentação e hábitos',
      keywords: 'alimentação colesterol gordura saturada fritura ovo fibra aveia azeite peixe triglicerídeos álcool açúcar exercício',
      html: `
        <p class="lead">Mudanças nos hábitos ajudam a baixar o colesterol e, principalmente, os triglicerídeos.
        Para quem tem risco alto, elas <strong>complementam</strong> o remédio, mas normalmente não o substituem.</p>
        <h3>Reduza</h3>
        <ul>
          <li><strong>Gorduras saturadas</strong>: carnes gordas, pele de frango, bacon, torresmo, manteiga, banha, queijos amarelos e creme de leite.</li>
          <li><strong>Embutidos</strong> (linguiça, salsicha, salame, presunto) e frituras.</li>
          <li><strong>Ultraprocessados</strong> com gordura hidrogenada: biscoitos recheados, salgadinhos, sorvetes de massa, margarinas duras.</li>
        </ul>
        <h3>Prefira</h3>
        <ul>
          <li>Fibras: <strong>aveia</strong>, feijão, lentilha, grão-de-bico, frutas, verduras e legumes.</li>
          <li>Gorduras boas, com moderação: <strong>azeite</strong>, abacate, castanhas, nozes e amendoim.</li>
          <li>Peixes (sardinha, atum, salmão) 2 vezes por semana; frango sem pele e carnes magras.</li>
          <li>Leite e iogurte desnatados.</li>
          <li>Ovos podem fazer parte de uma alimentação saudável, sem exageros.</li>
        </ul>
        <h3>Se os triglicerídeos estão altos</h3>
        <ul>
          <li><strong>Corte açúcar, doces, refrigerantes e sucos</strong>, inclusive os naturais.</li>
          <li>Reduza pão branco, massas e farinhas.</li>
          <li><strong>Evite bebidas alcoólicas</strong>: o álcool eleva muito os triglicerídeos.</li>
        </ul>
        <h3>Outros hábitos</h3>
        <ul>
          <li><strong>Atividade física</strong>: 150 minutos por semana de exercício moderado, mais fortalecimento muscular; aumenta o HDL e baixa os triglicerídeos.</li>
          <li><strong>Perder peso</strong>: mesmo 5 a 10% já melhoram os exames.</li>
          <li><strong>Parar de fumar</strong>: o cigarro acelera a formação de placas. O SUS oferece tratamento gratuito.</li>
        </ul>`,
    },

    /* ===================== Insuficiência cardíaca ===================== */
    {
      id: 'ic-oque',
      guide: 'ic',
      sources: 'Diretriz Brasileira de Insuficiência Cardíaca Crônica e Aguda (SBC, 2018) e Atualização de Tópicos Emergentes (SBC, 2021).',
      icon: 'heart',
      title: 'O que é insuficiência cardíaca',
      keywords: 'insuficiência cardíaca coração fraco cansaço falta de ar inchaço pernas causas chagas',
      html: `
        <p class="lead">Na insuficiência cardíaca, o coração <strong>não consegue bombear ou encher-se de sangue</strong> como deveria.
        Isso não quer dizer que o coração “parou”: é uma doença crônica que, com tratamento correto, permite viver mais e melhor.</p>
        <h3>Sintomas mais comuns</h3>
        <ul>
          <li><strong>Falta de ar</strong> aos esforços, ao deitar (precisa de mais travesseiros) ou que acorda a pessoa à noite.</li>
          <li><strong>Inchaço</strong> nas pernas, tornozelos ou barriga.</li>
          <li>Cansaço e fraqueza, menos disposição para as atividades do dia a dia.</li>
          <li><strong>Ganho de peso rápido</strong>, por retenção de líquidos.</li>
          <li>Tosse seca à noite, perda de apetite.</li>
        </ul>
        <h3>Principais causas</h3>
        <div class="grid-cards">
          <div class="mini-card"><strong>Pressão alta</strong><span>Sem controle por muitos anos</span></div>
          <div class="mini-card"><strong>Infarto</strong><span>E outras doenças das artérias do coração</span></div>
          <div class="mini-card"><strong>Doença de Chagas</strong><span>Importante causa no Brasil</span></div>
          <div class="mini-card"><strong>Válvulas</strong><span>Doenças das válvulas do coração</span></div>
          <div class="mini-card"><strong>Outras</strong><span>Diabetes, álcool, arritmias, quimioterapia</span></div>
        </div>
        <h3>O que você pode fazer</h3>
        <p>O tratamento tem três partes que funcionam juntas: <strong>remédios tomados corretamente</strong>,
        <strong>autocuidado diário</strong> (peso, sal, sintomas) e <strong>acompanhamento regular</strong> com a equipe de saúde.
        Os próximos tópicos explicam cada uma.</p>`,
    },
    {
      id: 'ic-tratamento',
      guide: 'ic',
      sources: 'Diretriz Brasileira de Insuficiência Cardíaca Crônica e Aguda (SBC, 2018) e Atualização de Tópicos Emergentes (SBC, 2021).',
      icon: 'pill',
      title: 'Remédios',
      keywords: 'remédios insuficiência cardíaca diurético furosemida betabloqueador carvedilol espironolactona dapagliflozina empagliflozina sacubitril enalapril losartana',
      html: `
        <p class="lead">Os remédios da insuficiência cardíaca <strong>fazem o coração trabalhar melhor, reduzem internações e
        aumentam a sobrevida</strong> — mesmo quando você não sente diferença no dia a dia.</p>
        <h3>Tipos de remédio</h3>
        <ul>
          <li><strong>Remédios que protegem o coração</strong> (geralmente 3 ou 4 tipos juntos): betabloqueadores (carvedilol, metoprolol, bisoprolol),
          enalapril, losartana ou sacubitril/valsartana, espironolactona, e dapagliflozina ou empagliflozina.</li>
          <li><strong>Diuréticos</strong> (como a furosemida): eliminam o excesso de líquido e aliviam o inchaço e a falta de ar. A dose pode variar conforme o peso e os sintomas.</li>
        </ul>
        <h3>Como tomar</h3>
        <ul>
          <li><strong>Não pare nem mude a dose por conta própria.</strong> Parar de repente pode levar à internação.</li>
          <li>As doses costumam ser aumentadas aos poucos, a cada consulta, até a dose ideal. Isso é esperado.</li>
          <li>Um pouco de cansaço ou tontura no começo é comum; levante-se devagar. Se for forte, avise o médico.</li>
          <li>Tome o diurético pela manhã para não precisar levantar à noite para urinar.</li>
          <li>Leve sempre a lista atualizada dos seus remédios às consultas e ao pronto-socorro.</li>
        </ul>
        <div class="alert-box">
          <strong>Evite sem orientação médica:</strong>
          <ul>
            <li>Anti-inflamatórios (diclofenaco, ibuprofeno, nimesulida, cetoprofeno)</li>
            <li>Antigripais e descongestionantes</li>
            <li>Chás, suplementos e “remédios naturais”</li>
          </ul>
          <p>Eles podem reter líquido e piorar a insuficiência cardíaca.</p>
        </div>
        <h3>Vacinas</h3>
        <p>Mantenha em dia as vacinas contra <strong>gripe (todo ano), pneumonia e covid-19</strong>: infecções respiratórias são causa frequente de piora.</p>`,
    },
    {
      id: 'ic-autocuidado',
      guide: 'ic',
      sources: 'Diretriz Brasileira de Insuficiência Cardíaca Crônica e Aguda (SBC, 2018); Atualização de Tópicos Emergentes (SBC, 2021).',
      icon: 'scale',
      title: 'Autocuidado: peso, sal e líquidos',
      keywords: 'pesar todo dia peso diário sal líquidos água restrição hídrica atividade física álcool autocuidado',
      html: `
        <p class="lead">Pequenos cuidados diários ajudam a perceber a piora <strong>antes</strong> que ela fique grave e evitam internações.</p>
        <h3>Pese-se todos os dias</h3>
        <ul>
          <li>Pela manhã, <strong>depois de urinar e antes do café</strong>, com roupas leves e na mesma balança.</li>
          <li>Anote o peso num caderno ou no celular e leve nas consultas.</li>
          <li><strong>Ganho de mais de 2 kg em 3 dias</strong> geralmente é líquido acumulado: entre em contato com sua equipe de saúde.</li>
        </ul>
        <h3>Sal</h3>
        <ul>
          <li>Evite o excesso de sal: não use saleiro na mesa e prefira temperos naturais (alho, cebola, ervas, limão).</li>
          <li>Evite embutidos, enlatados, temperos prontos, salgadinhos e comida de lanchonete.</li>
        </ul>
        <h3>Líquidos</h3>
        <p>A maioria das pessoas <strong>não precisa</strong> restringir líquidos. Se o médico orientar limite (por exemplo, 1,5 litro por dia),
        lembre que sopa, sucos, leite, gelatina e frutas como melancia também contam. Para aliviar a sede, chupe pedrinhas de gelo ou gomos de fruta gelada.</p>
        <h3>Atividade física</h3>
        <ul>
          <li>Com a doença estável, exercícios regulares <strong>melhoram o fôlego e a qualidade de vida</strong>. Pergunte sobre reabilitação cardíaca.</li>
          <li>Comece com caminhadas curtas e aumente aos poucos. Você deve conseguir conversar durante o exercício.</li>
          <li>Não treine em dias de piora dos sintomas.</li>
        </ul>
        <h3>Outros cuidados</h3>
        <ul>
          <li><strong>Evite bebidas alcoólicas</strong> — se a causa da doença for o álcool, não beba nada.</li>
          <li>Não fume.</li>
          <li>Durma com a cabeceira elevada se tiver falta de ar ao deitar.</li>
        </ul>`,
    },
    {
      id: 'ic-alerta',
      guide: 'ic',
      sources: 'Diretriz Brasileira de Insuficiência Cardíaca Crônica e Aguda (SBC, 2018).',
      icon: 'alert',
      title: 'Sinais de alerta',
      keywords: 'piora sinais alerta emergência falta de ar inchaço ganho de peso desmaio dor no peito samu',
      html: `
        <p class="lead">Use este semáforo para saber o que fazer conforme os sintomas.</p>
        <div class="table-wrap"><table>
          <thead><tr><th scope="col">Situação</th><th scope="col">O que você sente</th><th scope="col">O que fazer</th></tr></thead>
          <tbody>
            <tr><td><strong>Verde</strong> — estável</td><td>Sem falta de ar nova, sem inchaço novo, peso estável</td><td>Continue os remédios e o autocuidado</td></tr>
            <tr><td><strong>Amarelo</strong> — atenção</td><td>Ganho de mais de 2 kg em 3 dias; mais inchaço nas pernas ou barriga;
              mais falta de ar nas atividades; precisa de mais travesseiros para dormir; tosse seca; tontura</td><td>Ligue ou vá à sua equipe de saúde <strong>no mesmo dia ou no dia seguinte</strong></td></tr>
            <tr><td><strong>Vermelho</strong> — emergência</td><td>Falta de ar em repouso; acordar sufocado; dor no peito; desmaio;
              coração disparado; confusão; escarro rosado com espuma</td><td><strong>Ligue 192 (SAMU)</strong> ou vá ao pronto-socorro imediatamente</td></tr>
          </tbody>
        </table></div>
        <div class="alert-box">
          <strong>Ligue 192 (SAMU) imediatamente se tiver:</strong>
          <ul>
            <li>Falta de ar intensa ou em repouso</li>
            <li>Dor ou aperto no peito que não passa</li>
            <li>Desmaio ou palpitação forte</li>
          </ul>
        </div>
        <p>Não espere a próxima consulta se estiver na zona amarela: tratar a piora cedo, muitas vezes só ajustando o diurético, evita internações.</p>`,
    },

    /* ===================== Quedas ===================== */
    {
      id: 'queda-oque',
      guide: 'queda',
      sources: 'Montero-Odasso M et al. World guidelines for falls prevention and management for older adults. Age Ageing 2022; Ministério da Saúde — Caderneta da Pessoa Idosa.',
      icon: 'elder',
      title: 'Por que as quedas acontecem',
      keywords: 'queda idoso risco de cair fratura fêmur medo de cair causas remédios tontura',
      html: `
        <p class="lead">Cerca de <strong>1 em cada 3 pessoas com mais de 65 anos cai pelo menos uma vez por ano</strong>.
        Quedas <strong>não são “normais da idade”</strong>: quase sempre têm causas que podem ser tratadas.</p>
        <h3>Por que é importante prevenir</h3>
        <div class="grid-cards">
          <div class="mini-card"><strong>Fraturas</strong><span>Principalmente de fêmur (quadril), punho e coluna</span></div>
          <div class="mini-card"><strong>Traumatismo na cabeça</strong><span>Mais grave em quem usa anticoagulante</span></div>
          <div class="mini-card"><strong>Medo de cair</strong><span>Leva a sair menos e a perder força</span></div>
          <div class="mini-card"><strong>Independência</strong><span>Perda da autonomia e internações</span></div>
        </div>
        <h3>O que aumenta o risco</h3>
        <ul>
          <li><strong>Fraqueza nas pernas</strong> e falta de equilíbrio.</li>
          <li><strong>Remédios</strong>: para dormir, calmantes, antidepressivos, para pressão e diuréticos, principalmente quando são muitos.</li>
          <li><strong>Tontura ao levantar</strong> (queda da pressão ao ficar em pé).</li>
          <li>Visão ruim, catarata, óculos desatualizados.</li>
          <li>Dor ou deformidade nos pés e calçados inadequados.</li>
          <li>Urgência para urinar, sobretudo à noite.</li>
          <li>Perda de memória, doença de Parkinson, AVC prévio.</li>
          <li>Casa com tapetes soltos, pouca luz e sem barras de apoio.</li>
          <li>Álcool.</li>
        </ul>
        <h3>Já caiu?</h3>
        <p><strong>Conte ao seu médico</strong>, mesmo que não tenha se machucado. Quem já caiu tem mais chance de cair de novo,
        e uma avaliação (força, equilíbrio, remédios, visão, pressão) ajuda a evitar a próxima queda.</p>`,
    },
    {
      id: 'queda-casa',
      guide: 'queda',
      sources: 'Ministério da Saúde — Caderneta da Pessoa Idosa; Montero-Odasso M et al. Age Ageing 2022.',
      icon: 'home',
      title: 'Casa segura',
      keywords: 'casa segura tapete banheiro barra de apoio iluminação escada cama adaptação ambiente',
      html: `
        <p class="lead">A maioria das quedas acontece <strong>dentro de casa</strong>. Pequenas adaptações fazem grande diferença.</p>
        <h3>Em toda a casa</h3>
        <ul>
          <li><strong>Retire tapetes soltos</strong> ou fixe-os com fita antiderrapante.</li>
          <li>Deixe os caminhos livres: sem fios, objetos, caixas ou móveis baixos no meio.</li>
          <li>Boa iluminação, com interruptores na entrada dos cômodos.</li>
          <li>Seque logo o chão molhado; evite cera.</li>
          <li>Cuidado com animais de estimação que circulam entre os pés.</li>
        </ul>
        <h3>Quarto</h3>
        <ul>
          <li>Deixe uma <strong>luz acesa no caminho até o banheiro</strong> à noite (luz noturna ou com sensor).</li>
          <li>Abajur ou interruptor ao alcance da cama.</li>
          <li>Cama em altura que permita sentar com os pés apoiados no chão.</li>
          <li>Telefone ou celular ao alcance da cama.</li>
        </ul>
        <h3>Banheiro</h3>
        <ul>
          <li><strong>Barras de apoio</strong> no box e ao lado do vaso sanitário.</li>
          <li>Tapete antiderrapante dentro e fora do box.</li>
          <li>Cadeira de banho, se tiver pouco equilíbrio.</li>
          <li>Não se apoie em toalheiros ou pias: eles não aguentam o peso.</li>
        </ul>
        <h3>Cozinha e escadas</h3>
        <ul>
          <li>Guarde o que usa com frequência em prateleiras à altura do peito; <strong>não suba em bancos ou cadeiras</strong>.</li>
          <li>Escadas com <strong>corrimão dos dois lados</strong>, boa iluminação e faixa antiderrapante na beira dos degraus.</li>
        </ul>`,
    },
    {
      id: 'queda-exercicio',
      guide: 'queda',
      sources: 'Sherrington C et al. Cochrane Database Syst Rev 2019 (exercício reduz quedas em ~23%); Montero-Odasso M et al. Age Ageing 2022.',
      icon: 'activity',
      title: 'Exercícios de força e equilíbrio',
      keywords: 'exercício equilíbrio força pernas tai chi fisioterapia caminhada levantar da cadeira prevenção',
      html: `
        <p class="lead">Exercícios de <strong>equilíbrio e fortalecimento das pernas</strong> são a medida que mais previne quedas:
        reduzem em cerca de <strong>1 em cada 4</strong> as quedas em pessoas idosas.</p>
        <h3>Como fazer</h3>
        <ul>
          <li>Pelo menos <strong>3 vezes por semana</strong>, de forma contínua — o benefício some se parar.</li>
          <li>Aumente a dificuldade aos poucos. Grupos de exercício, fisioterapia, tai chi e dança são ótimas opções.</li>
          <li>Pergunte na unidade de saúde sobre grupos gratuitos de atividade física (como o Programa Academia da Saúde).</li>
        </ul>
        <h3>Exemplos para fazer em casa</h3>
        <p class="note">Faça sempre com <strong>apoio firme à frente</strong> (bancada da pia ou encosto de uma cadeira pesada) e, de preferência, com alguém por perto no começo.</p>
        <ol>
          <li><strong>Sentar e levantar</strong> de uma cadeira firme, sem usar as mãos se possível: 10 vezes.</li>
          <li><strong>Ficar na ponta dos pés</strong> e descer devagar: 10 vezes.</li>
          <li><strong>Ficar em um pé só</strong>, segurando no apoio, por 10 segundos; troque de pé. Com o tempo, segure só com um dedo.</li>
          <li><strong>Andar em linha reta</strong>, colocando o calcanhar encostado na ponta do outro pé, junto à bancada: 10 passos.</li>
          <li><strong>Levantar a perna para o lado</strong>, mantendo o tronco reto: 10 vezes de cada lado.</li>
        </ol>
        <h3>Segurança</h3>
        <ul>
          <li>Pare se sentir tontura, dor no peito ou falta de ar.</li>
          <li>Use calçado firme ou fique descalço sobre piso não escorregadio, nunca de meias.</li>
          <li>Caminhar é ótimo para o coração, mas sozinho não basta para prevenir quedas: inclua os exercícios de equilíbrio.</li>
        </ul>`,
    },
    {
      id: 'queda-cuidados',
      guide: 'queda',
      sources: 'Montero-Odasso M et al. World guidelines for falls prevention and management for older adults. Age Ageing 2022; Ministério da Saúde — Caderneta da Pessoa Idosa.',
      icon: 'shield',
      title: 'Remédios, visão, calçados e o que fazer se cair',
      keywords: 'remédios para dormir calmante tontura levantar devagar óculos visão calçado bengala vitamina d osteoporose levantar do chão após queda',
      html: `
        <h3>Remédios</h3>
        <ul>
          <li>Leve <strong>todos os seus remédios</strong> (inclusive os comprados sem receita) para o médico revisar pelo menos uma vez por ano.</li>
          <li>Remédios para dormir e calmantes aumentam muito o risco de queda. <strong>Não pare por conta própria</strong>: pergunte se é possível reduzir aos poucos.</li>
        </ul>
        <h3>Levante-se devagar</h3>
        <ol>
          <li>Ao acordar, sente-se na beira da cama e espere um pouco.</li>
          <li>Mexa os pés e as pernas algumas vezes.</li>
          <li>Levante-se apoiado e só comece a andar quando estiver firme. Se sentir tontura, sente-se de novo.</li>
        </ol>
        <h3>Visão, pés e calçados</h3>
        <ul>
          <li>Consulte o oftalmologista regularmente; catarata tem tratamento.</li>
          <li>Óculos multifocais podem atrapalhar ao descer escadas ou andar na rua; tome cuidado redobrado.</li>
          <li>Use calçados <strong>fechados atrás, com sola antiderrapante e salto baixo</strong>. Evite chinelos soltos e andar de meias.</li>
          <li>Trate calos, unhas e dores nos pés.</li>
          <li>Se precisar de bengala ou andador, peça orientação ao fisioterapeuta sobre o modelo e a altura corretos.</li>
        </ul>
        <h3>Ossos</h3>
        <p>Pergunte ao médico sobre <strong>osteoporose</strong>: tratá-la reduz o risco de fratura se a queda acontecer.
        Vitamina D e cálcio só devem ser suplementados com orientação.</p>
        <h3>Se cair</h3>
        <ol>
          <li>Fique calmo e verifique se está machucado antes de tentar levantar.</li>
          <li>Se conseguir, role de lado, fique de quatro apoios e vá até uma cadeira firme. Apoie as mãos no assento, coloque um joelho à frente e levante-se devagar.</li>
          <li>Se não conseguir levantar, peça ajuda, cubra-se para não perder calor e mude de posição de tempos em tempos.</li>
          <li>Deixe o celular sempre por perto; quem mora sozinho pode combinar contatos diários com alguém de confiança.</li>
        </ol>
        <div class="alert-box">
          <strong>Ligue 192 (SAMU) ou procure o pronto-socorro se, após a queda, houver:</strong>
          <ul>
            <li>Batida na cabeça em quem usa anticoagulante, ou sonolência, vômitos e confusão</li>
            <li>Dor forte no quadril ou incapacidade de apoiar a perna</li>
            <li>Desmaio antes da queda ou dor no peito</li>
          </ul>
        </div>`,
    },

    /* ===================== Asma ===================== */
    {
      id: 'asma-oque',
      guide: 'asma',
      sources: 'Global Initiative for Asthma (GINA) — relatório 2025; Sociedade Brasileira de Pneumologia e Tisiologia (SBPT) — Recomendações para o manejo da asma.',
      icon: 'lungs',
      title: 'O que é asma',
      keywords: 'o que é asma bronquite chiado falta de ar tosse gatilhos alergia crise',
      html: `
        <p class="lead">Asma é uma <strong>inflamação crônica dos brônquios</strong>, os canais que levam o ar aos pulmões.
        Eles ficam sensíveis e, diante de certos gatilhos, se fecham, causando os sintomas. Não é contagiosa e, com tratamento correto,
        a maioria das pessoas leva uma vida normal, inclusive praticando esportes.</p>
        <h3>Sintomas</h3>
        <ul>
          <li><strong>Chiado</strong> no peito, falta de ar e sensação de aperto no peito.</li>
          <li><strong>Tosse</strong>, principalmente à noite, de madrugada ou com exercício.</li>
          <li>Os sintomas vão e voltam e pioram com gatilhos.</li>
        </ul>
        <h3>Gatilhos comuns</h3>
        <div class="grid-cards">
          <div class="mini-card"><strong>Infecções</strong><span>Gripes e resfriados</span></div>
          <div class="mini-card"><strong>Alérgenos</strong><span>Ácaros, poeira, mofo, pelos de animais, baratas</span></div>
          <div class="mini-card"><strong>Fumaça</strong><span>Cigarro (inclusive eletrônico), queimadas, fogão a lenha</span></div>
          <div class="mini-card"><strong>Ambiente</strong><span>Ar frio, poluição, cheiros fortes, produtos de limpeza</span></div>
          <div class="mini-card"><strong>Outros</strong><span>Exercício sem tratamento, emoções fortes, alguns remédios (anti-inflamatórios, betabloqueadores)</span></div>
        </div>
        <h3>A inflamação continua mesmo sem sintomas</h3>
        <p>Por isso o tratamento de base é feito com <strong>corticoide inalatório</strong>, que trata a inflamação.
        Usar só a “bombinha de alívio” (como o salbutamol, a “bombinha azul”) melhora o sintoma na hora, mas
        <strong>não trata a doença</strong> e, sozinha, aumenta o risco de crises graves.</p>
        <h3>Asma bem controlada é quando você</h3>
        <ul>
          <li>Tem sintomas no máximo 2 vezes por semana.</li>
          <li>Não acorda à noite por causa da asma.</li>
          <li>Precisa do remédio de alívio no máximo 2 vezes por semana.</li>
          <li>Consegue fazer todas as suas atividades, inclusive exercício.</li>
        </ul>
        <p>Se algum desses itens não acontece, converse com seu médico: o tratamento pode ser ajustado.</p>`,
    },
    {
      id: 'asma-remedios',
      guide: 'asma',
      sources: 'Global Initiative for Asthma (GINA) — relatório 2025; SBPT — Recomendações para o manejo da asma.',
      icon: 'pill',
      title: 'Remédios da asma',
      keywords: 'remédio asma bombinha corticoide inalatório budesonida formoterol salbutamol manutenção alívio',
      html: `
        <p class="lead">Os remédios da asma são, em sua maioria, <strong>inalados</strong>: vão direto aos pulmões,
        em doses pequenas e com poucos efeitos no resto do corpo.</p>
        <h3>Dois papéis diferentes</h3>
        <div class="grid-cards">
          <div class="mini-card"><strong>Controle (manutenção)</strong><span>Corticoide inalatório, sozinho ou junto com um broncodilatador de longa duração. Trata a inflamação e previne crises.</span></div>
          <div class="mini-card"><strong>Alívio (resgate)</strong><span>Abre os brônquios em minutos, durante os sintomas.</span></div>
        </div>
        <h3>O esquema mais usado hoje</h3>
        <p>Muitas pessoas usam <strong>uma única bombinha de budesonida + formoterol</strong> tanto para o controle
        (todos os dias, se indicado) quanto para o alívio dos sintomas. Assim, cada vez que você alivia o sintoma, também trata a inflamação.
        Seu médico vai dizer quantas inalações usar por dia e o máximo permitido.</p>
        <h3>Como usar bem</h3>
        <ul>
          <li><strong>Use o remédio de controle todos os dias</strong>, se foi prescrito assim, mesmo quando estiver bem.</li>
          <li>Depois de usar corticoide inalatório, <strong>enxágue a boca com água e cuspa</strong> para evitar sapinho e rouquidão.</li>
          <li>Leve a bombinha às consultas e peça para conferirem sua técnica: o erro de técnica é uma das principais causas de asma descontrolada.</li>
          <li>Tenha sempre a bombinha de alívio com você.</li>
          <li>Se estiver usando o alívio mais de 2 vezes por semana, ou acordando à noite, <strong>volte ao médico</strong>: o tratamento precisa de ajuste.</li>
        </ul>
        <h3>Mitos</h3>
        <ul>
          <li><strong>“Bombinha vicia ou faz mal ao coração.”</strong> Mito. Usada como orientado, ela é segura.</li>
          <li><strong>“Corticoide inalado engorda.”</strong> Mito. A dose é muito pequena; quem engorda é o corticoide em comprimido usado com frequência — e controlar a asma é justamente o que evita precisar dele.</li>
        </ul>
        <p class="note">Gestantes: continue o tratamento. Asma descontrolada é mais perigosa para o bebê do que os remédios inalatórios.</p>`,
    },
    {
      id: 'asma-bombinha',
      guide: 'asma',
      sources: 'Global Initiative for Asthma (GINA) — relatório 2025; SBPT — Recomendações para o manejo da asma.',
      icon: 'wind',
      title: 'Como usar a bombinha',
      keywords: 'como usar bombinha spray espaçador aerocâmara inalador pó seco técnica inalatória',
      html: `
        <p class="lead">Há dois tipos principais de inalador. Siga as instruções do seu modelo e peça para um profissional conferir.</p>
        <h3>Spray (aerossol) — de preferência com espaçador</h3>
        <ol>
          <li>Retire a tampa e <strong>agite</strong> o spray.</li>
          <li>Encaixe no espaçador (aerocâmara). Pode ser feito em casa com uma garrafa PET de 500 mL, se orientado pela equipe.</li>
          <li>Solte todo o ar dos pulmões, longe do bocal.</li>
          <li>Coloque o bocal na boca (ou a máscara bem ajustada no rosto), aperte o spray <strong>uma vez</strong>.</li>
          <li>Puxe o ar <strong>devagar e fundo</strong> (ou respire normalmente 5 a 6 vezes dentro do espaçador).</li>
          <li><strong>Prenda a respiração por cerca de 10 segundos</strong> e solte devagar.</li>
          <li>Se for usar outro jato, espere 30 a 60 segundos e repita.</li>
        </ol>
        <h3>Pó seco (cápsula, disco ou turbo)</h3>
        <ol>
          <li>Prepare a dose conforme o modelo (gire, abra ou fure a cápsula). <strong>Não agite</strong> e não sopre dentro do aparelho.</li>
          <li>Solte o ar longe do bocal.</li>
          <li>Feche bem os lábios no bocal e <strong>puxe o ar rápido e com força</strong>, fundo.</li>
          <li>Prenda a respiração por cerca de 10 segundos e solte devagar.</li>
          <li>Guarde em local seco, com a tampa fechada.</li>
        </ol>
        <h3>Depois</h3>
        <ul>
          <li>Se o remédio tiver corticoide, enxágue a boca e cuspa.</li>
          <li>Lave o espaçador uma vez por semana com água e detergente neutro e deixe secar ao ar, sem enxugar.</li>
          <li>Confira o contador de doses ou a validade e não deixe o remédio acabar.</li>
        </ul>`,
    },
    {
      id: 'asma-crise',
      guide: 'asma',
      sources: 'Global Initiative for Asthma (GINA) — relatório 2025; SBPT — Recomendações para o manejo da asma.',
      icon: 'alert',
      title: 'Crise de asma e plano de ação',
      keywords: 'crise de asma piora falta de ar plano de ação emergência pronto-socorro samu',
      html: `
        <p class="lead">Peça ao seu médico um <strong>plano de ação por escrito</strong>, com as doses que você deve usar em cada situação.
        Em geral, ele segue este semáforo:</p>
        <div class="table-wrap"><table>
          <thead><tr><th scope="col">Situação</th><th scope="col">O que você sente</th><th scope="col">O que fazer</th></tr></thead>
          <tbody>
            <tr><td><strong>Verde</strong> — controlada</td><td>Sem sintomas ou poucos, dorme bem, faz as atividades</td><td>Continue o tratamento de controle</td></tr>
            <tr><td><strong>Amarelo</strong> — piorando</td><td>Tosse, chiado ou falta de ar mais frequentes; acorda à noite; usa mais o alívio</td>
              <td>Use o alívio conforme o plano e aumente o tratamento como combinado. Se não melhorar em 2 a 3 dias, procure a unidade de saúde</td></tr>
            <tr><td><strong>Vermelho</strong> — crise grave</td><td>Falta de ar forte, dificuldade para falar frases, alívio não funciona ou dura pouco</td>
              <td><strong>Use o alívio e procure atendimento imediatamente</strong> (192 ou pronto-socorro)</td></tr>
          </tbody>
        </table></div>
        <div class="alert-box">
          <strong>Ligue 192 (SAMU) ou vá ao pronto-socorro se:</strong>
          <ul>
            <li>Não consegue falar uma frase inteira por falta de ar</li>
            <li>Lábios ou unhas ficam roxos ou acinzentados</li>
            <li>Fica sonolento, confuso ou muito agitado</li>
            <li>O remédio de alívio não melhora ou a melhora dura menos de 3 horas</li>
          </ul>
        </div>
        <h3>Depois de uma crise</h3>
        <ul>
          <li>Se recebeu corticoide em comprimido, tome pelo número de dias prescrito.</li>
          <li><strong>Marque consulta em até 1 semana</strong>: toda crise é um sinal de que o tratamento precisa ser revisto.</li>
          <li>Vacine-se contra gripe todos os anos e contra covid-19 conforme o calendário.</li>
        </ul>`,
    },

    /* ===================== DPOC ===================== */
    {
      id: 'dpoc-oque',
      guide: 'dpoc',
      sources: 'Global Initiative for Chronic Obstructive Lung Disease (GOLD) — relatório 2025; SBPT — Recomendações para o tratamento da DPOC.',
      icon: 'lungs',
      title: 'O que é DPOC',
      keywords: 'o que é dpoc enfisema bronquite crônica cigarro fogão a lenha falta de ar tosse catarro espirometria',
      html: `
        <p class="lead">DPOC (doença pulmonar obstrutiva crônica) é uma doença em que os brônquios e os pulmões ficam
        <strong>danificados de forma permanente</strong>, dificultando a saída do ar. Inclui o que muitos chamam de enfisema e bronquite crônica.</p>
        <h3>Causas</h3>
        <ul>
          <li><strong>Cigarro</strong> é a principal causa — inclusive cigarro de palha, cachimbo, narguilé e cigarro eletrônico.</li>
          <li><strong>Fumaça de fogão a lenha</strong> ou de carvão em ambiente fechado, por muitos anos.</li>
          <li>Poeiras e produtos químicos no trabalho, poluição e, mais raramente, causas genéticas.</li>
        </ul>
        <h3>Sintomas</h3>
        <ul>
          <li><strong>Falta de ar</strong> que piora aos poucos, primeiro nos esforços (subir escada, andar rápido) e depois em atividades simples.</li>
          <li>Tosse crônica, com ou sem catarro, principalmente pela manhã.</li>
          <li>Chiado no peito e cansaço.</li>
        </ul>
        <h3>Como é feito o diagnóstico</h3>
        <p>Pela <strong>espirometria</strong> (o “exame do sopro”), que mede o quanto e com que velocidade você consegue soltar o ar.</p>
        <h3>O que dá para fazer</h3>
        <p>A DPOC não tem cura, mas o tratamento <strong>alivia a falta de ar, reduz as crises e permite viver mais e melhor</strong>.
        A medida mais importante de todas é <strong>parar de fumar</strong> — em qualquer idade e em qualquer fase da doença.</p>`,
    },
    {
      id: 'dpoc-tratamento',
      guide: 'dpoc',
      sources: 'GOLD — relatório 2025; SBPT — Recomendações para o tratamento da DPOC; Ministério da Saúde — Programa Nacional de Controle do Tabagismo.',
      icon: 'pill',
      title: 'Tratamento: cigarro, remédios e vacinas',
      keywords: 'tratamento dpoc parar de fumar tabagismo remédios inalatórios broncodilatador tiotrópio vacinas oxigênio',
      html: `
        <h3>Parar de fumar</h3>
        <p>É o que mais muda o futuro da doença. O <strong>SUS oferece tratamento gratuito</strong> para parar de fumar,
        com grupos de apoio, adesivos e gomas de nicotina e remédios. Pergunte na sua unidade de saúde.
        Também evite ficar perto de fumaça de cigarro e de fogão a lenha.</p>
        <h3>Remédios inalatórios</h3>
        <ul>
          <li>Os principais são <strong>broncodilatadores de longa duração</strong> (como tiotrópio, formoterol, salmeterol, umeclidínio e vilanterol), usados todos os dias para manter os brônquios abertos.</li>
          <li>Algumas pessoas, com crises frequentes, também usam corticoide inalatório.</li>
          <li>Um broncodilatador de curta duração (como o salbutamol) pode ser usado para alívio.</li>
          <li><strong>A técnica correta importa tanto quanto o remédio</strong>: peça para conferirem como você usa o inalador.</li>
        </ul>
        <h3>Vacinas</h3>
        <p>Mantenha em dia as vacinas contra <strong>gripe (todo ano), pneumonia (pneumococo), covid-19</strong> e, quando indicado,
        coqueluche (dTpa), herpes-zóster e vírus sincicial respiratório. Infecções são a principal causa de crises.</p>
        <h3>Oxigênio em casa</h3>
        <p>Indicado apenas para quem tem oxigênio baixo no sangue, confirmado em exame. Quando indicado, ele aumenta a sobrevida se usado
        <strong>pelo menos 15 horas por dia</strong>.</p>
        <div class="alert-box">
          <strong>Nunca fume nem fique perto de fogo, fogão ou velas usando oxigênio: há risco de queimaduras graves e incêndio.</strong>
        </div>`,
    },
    {
      id: 'dpoc-respirar',
      guide: 'dpoc',
      sources: 'GOLD — relatório 2025; SBPT — Recomendações para o tratamento da DPOC.',
      icon: 'wind',
      title: 'Exercício e técnicas de respiração',
      keywords: 'reabilitação pulmonar exercício caminhada respiração frenolabial lábios franzidos falta de ar economizar energia',
      html: `
        <p class="lead">A falta de ar faz a pessoa se movimentar menos, o que enfraquece os músculos e piora ainda mais a falta de ar.
        <strong>Exercício regular quebra esse ciclo.</strong></p>
        <h3>Reabilitação pulmonar</h3>
        <p>Programas supervisionados de exercício e orientação melhoram a falta de ar, a disposição e a qualidade de vida,
        e reduzem internações. Pergunte se há um serviço de reabilitação ou fisioterapia respiratória perto de você.</p>
        <h3>Em casa</h3>
        <ul>
          <li>Caminhe todos os dias, começando com poucos minutos e aumentando aos poucos. Sentir um pouco de falta de ar durante o exercício é esperado.</li>
          <li>Faça exercícios para braços e pernas (levantar da cadeira, pesos leves, elásticos).</li>
          <li>Use o broncodilatador de alívio antes do exercício, se orientado.</li>
        </ul>
        <h3>Respiração com lábios franzidos</h3>
        <ol>
          <li>Puxe o ar pelo nariz, devagar, contando até 2.</li>
          <li>Franza os lábios como se fosse assobiar ou soprar uma vela.</li>
          <li>Solte o ar devagar pela boca, contando até 4 (o dobro do tempo).</li>
        </ol>
        <p>Use nos esforços (subir escadas, tomar banho) e quando sentir falta de ar.</p>
        <h3>Para poupar energia</h3>
        <ul>
          <li>Sente-se para tomar banho, se vestir e cozinhar.</li>
          <li>Planeje as atividades mais pesadas para o horário em que se sente melhor e faça pausas.</li>
          <li>Faça refeições menores e mais vezes ao dia; a barriga cheia aperta os pulmões.</li>
        </ul>`,
    },
    {
      id: 'dpoc-crise',
      guide: 'dpoc',
      sources: 'GOLD — relatório 2025.',
      icon: 'alert',
      title: 'Crise (exacerbação) e sinais de alerta',
      keywords: 'crise dpoc exacerbação piora catarro falta de ar febre emergência samu',
      html: `
        <p class="lead">Crise, ou <strong>exacerbação</strong>, é quando os sintomas pioram além do habitual por alguns dias.
        Tratar cedo evita internações. Combine com seu médico um <strong>plano de ação por escrito</strong>.</p>
        <h3>Sinais de que uma crise está começando</h3>
        <ul>
          <li>Mais falta de ar do que o normal.</li>
          <li>Mais catarro, ou catarro mais grosso, amarelo ou esverdeado.</li>
          <li>Mais tosse ou chiado; precisar mais do remédio de alívio.</li>
          <li>Febre, cansaço maior, inchaço nas pernas.</li>
        </ul>
        <p>Nesses casos, siga seu plano de ação e <strong>procure a unidade de saúde no mesmo dia ou no seguinte</strong>.</p>
        <div class="alert-box">
          <strong>Ligue 192 (SAMU) ou vá ao pronto-socorro se tiver:</strong>
          <ul>
            <li>Falta de ar intensa, mesmo em repouso, ou dificuldade para falar</li>
            <li>Lábios ou unhas roxos</li>
            <li>Sonolência, confusão ou agitação</li>
            <li>Dor no peito</li>
          </ul>
        </div>
        <h3>Depois de uma crise</h3>
        <ul>
          <li>Faça o tratamento completo (corticoide e antibiótico, se receitados).</li>
          <li>Volte à consulta em poucas semanas: o tratamento de manutenção pode precisar de ajuste.</li>
          <li>Retome a atividade física aos poucos e pergunte sobre reabilitação pulmonar.</li>
        </ul>`,
    },

    /* ===================== Fibromialgia ===================== */
    {
      id: 'fibro-oque',
      guide: 'fibro',
      sources: 'Macfarlane GJ et al. EULAR revised recommendations for the management of fibromyalgia. Ann Rheum Dis 2017; Sociedade Brasileira de Reumatologia.',
      icon: 'activity',
      title: 'O que é fibromialgia',
      keywords: 'o que é fibromialgia dor no corpo todo cansaço sono sensibilidade dor crônica',
      html: `
        <p class="lead">Fibromialgia é uma condição de <strong>dor crônica espalhada pelo corpo</strong>, acompanhada de cansaço,
        sono que não descansa e, muitas vezes, dificuldade de memória e concentração.</p>
        <h3>A dor é real</h3>
        <p>Na fibromialgia, o sistema nervoso fica “com o volume da dor aumentado” — o que os médicos chamam de
        <strong>sensibilização central</strong>. Os sinais de dor são amplificados, mesmo sem lesão nos músculos ou articulações.</p>
        <h3>O que a fibromialgia não é</h3>
        <ul>
          <li><strong>Não é inflamação</strong> e <strong>não deforma</strong> nem destrói articulações.</li>
          <li><strong>Não é “coisa da cabeça”</strong> nem fraqueza: é uma condição reconhecida e estudada.</li>
          <li>Os exames de sangue e imagem costumam ser normais — e isso é esperado. Eles servem para descartar outras doenças.</li>
        </ul>
        <h3>O que pode piorar os sintomas</h3>
        <ul>
          <li>Noites mal dormidas</li>
          <li>Estresse, ansiedade e depressão</li>
          <li>Ficar parado demais — ou exagerar no esforço em um dia bom</li>
          <li>Frio, infecções e mudanças bruscas na rotina</li>
        </ul>
        <h3>Tem tratamento</h3>
        <p>Não existe um remédio que resolva sozinho, mas a combinação de <strong>exercício, sono, manejo do estresse e,
        quando necessário, remédios</strong> reduz a dor e melhora muito a qualidade de vida.</p>`,
    },
    {
      id: 'fibro-tratamento',
      guide: 'fibro',
      sources: 'Macfarlane GJ et al. EULAR revised recommendations for the management of fibromyalgia. Ann Rheum Dis 2017.',
      icon: 'pill',
      title: 'Tratamento',
      keywords: 'tratamento fibromialgia exercício aeróbico hidroginástica terapia cognitivo-comportamental remédios amitriptilina duloxetina pregabalina',
      html: `
        <h3>1. Exercício físico: o tratamento mais eficaz</h3>
        <ul>
          <li><strong>Atividade aeróbica</strong> (caminhada, bicicleta, hidroginástica, dança) e <strong>fortalecimento</strong> reduzem a dor e o cansaço.</li>
          <li><strong>Comece bem devagar</strong>: 5 a 10 minutos por dia, aumentando aos poucos ao longo de semanas, até cerca de 150 minutos por semana.</li>
          <li>É normal sentir um pouco mais de dor no começo; isso não é sinal de lesão. Se piorar muito, reduza um pouco, mas não pare.</li>
          <li>Atividades na água morna, yoga, tai chi e pilates também ajudam.</li>
        </ul>
        <h3>2. Psicoterapia</h3>
        <p>A <strong>terapia cognitivo-comportamental</strong> ajuda a lidar com a dor, o sono e o estresse, e reduz o impacto da doença no dia a dia.</p>
        <h3>3. Remédios, quando necessários</h3>
        <ul>
          <li>Alguns remédios usados em doses baixas, como <strong>amitriptilina, ciclobenzaprina, duloxetina ou pregabalina</strong>, ajudam parte das pessoas, principalmente no sono e na dor.</li>
          <li>Eles atuam no sistema nervoso — e não significam que o médico acha que você tem “problema psicológico”.</li>
          <li>O efeito aparece em algumas semanas. Não pare de repente sem orientação.</li>
          <li><strong>Anti-inflamatórios e corticoides não funcionam</strong> na fibromialgia, e opioides fortes devem ser evitados: podem até piorar a dor com o tempo.</li>
        </ul>
        <h3>4. Outras opções</h3>
        <p>Acupuntura, hidroterapia, massagem e meditação podem ajudar algumas pessoas como complemento.</p>`,
    },
    {
      id: 'fibro-diaadia',
      guide: 'fibro',
      sources: 'Macfarlane GJ et al. Ann Rheum Dis 2017; Sociedade Brasileira de Reumatologia.',
      icon: 'moon',
      title: 'Sono, ritmo e dia a dia',
      keywords: 'sono higiene do sono ritmo pacing energia dias ruins estresse rotina fibromialgia',
      html: `
        <h3>Dosar a energia</h3>
        <ul>
          <li>Evite o ciclo “fazer tudo no dia bom e passar os dias seguintes de cama”.</li>
          <li><strong>Divida as tarefas</strong> em partes menores e intercale com pausas curtas.</li>
          <li>Mantenha uma rotina mais ou menos parecida todos os dias, inclusive nos dias de mais dor.</li>
        </ul>
        <h3>Dormir melhor</h3>
        <ul>
          <li>Deite e levante sempre no mesmo horário, inclusive nos fins de semana.</li>
          <li>Evite café, chá preto, chimarrão e refrigerante de cola depois do meio da tarde.</li>
          <li>Desligue celular e TV pelo menos 30 minutos antes de deitar.</li>
          <li>Evite cochilos longos durante o dia.</li>
          <li>Ronco alto e pausas na respiração devem ser contados ao médico.</li>
        </ul>
        <h3>Estresse e emoções</h3>
        <ul>
          <li>Técnicas de respiração lenta, relaxamento e meditação reduzem a tensão e a dor.</li>
          <li>Ansiedade e depressão são comuns e pioram a dor; tratá-las faz parte do tratamento da fibromialgia.</li>
          <li>Mantenha contato com amigos e atividades de que gosta.</li>
        </ul>
        <h3>Nos dias de piora</h3>
        <ul>
          <li>Calor local (banho morno, bolsa morna) e alongamentos leves ajudam.</li>
          <li>Reduza o ritmo, mas tente não ficar totalmente parado.</li>
          <li>Lembre-se: a crise passa.</li>
        </ul>
        <p class="note">Procure o médico se aparecerem sintomas novos, como febre, perda de peso, inchaço nas articulações ou fraqueza: eles não são típicos da fibromialgia.</p>`,
    },

    /* ===================== Depressão e ansiedade ===================== */
    {
      id: 'mental-oque',
      guide: 'mental',
      sources: 'Organização Mundial da Saúde — mhGAP; Ministério da Saúde — Rede de Atenção Psicossocial; CANMAT 2023 (depressão).',
      icon: 'smile',
      title: 'Entendendo depressão e ansiedade',
      keywords: 'o que é depressão ansiedade tristeza preocupação pânico sintomas saúde mental',
      html: `
        <p class="lead">Depressão e ansiedade são <strong>problemas de saúde comuns e tratáveis</strong>. Não são fraqueza,
        frescura nem falta de força de vontade. Muitas vezes aparecem juntas.</p>
        <h3>Sinais de depressão</h3>
        <p>Por pelo menos 2 semanas, na maior parte dos dias:</p>
        <ul>
          <li>Tristeza, vazio ou irritação</li>
          <li><strong>Perda do interesse ou do prazer</strong> em coisas de que gostava</li>
          <li>Cansaço, falta de energia, mudança no sono ou no apetite</li>
          <li>Dificuldade de concentração, sentimento de culpa ou de inutilidade</li>
          <li>Pensamentos de morte ou de que seria melhor não estar vivo</li>
        </ul>
        <h3>Sinais de ansiedade</h3>
        <ul>
          <li>Preocupação excessiva e difícil de controlar, quase todos os dias</li>
          <li>Inquietação, tensão muscular, irritabilidade e dificuldade para dormir</li>
          <li>Crises de <strong>pânico</strong>: medo intenso e súbito, com coração disparado, falta de ar, tremor, suor e sensação de que algo grave vai acontecer</li>
          <li>Evitar lugares ou situações por medo</li>
        </ul>
        <p class="note">Sintomas físicos como dor no peito ou falta de ar devem ser avaliados por um profissional antes de serem atribuídos à ansiedade.</p>
        <h3>Quando procurar ajuda</h3>
        <p>Quando os sintomas duram semanas, atrapalham o trabalho, os estudos, os relacionamentos ou o cuidado consigo.
        <strong>A unidade básica de saúde é a porta de entrada</strong>; os CAPS atendem os casos mais graves.</p>`,
    },
    {
      id: 'mental-tratamento',
      guide: 'mental',
      sources: 'CANMAT 2023 (depressão); Organização Mundial da Saúde — mhGAP; Ministério da Saúde — Rede de Atenção Psicossocial.',
      icon: 'pill',
      title: 'Tratamento',
      keywords: 'tratamento depressão ansiedade psicoterapia antidepressivo calmante benzodiazepínico clonazepam sertralina fluoxetina efeito colateral',
      html: `
        <p class="lead">O tratamento funciona para a maioria das pessoas. Pode incluir <strong>psicoterapia, remédios ou os dois</strong>,
        conforme a gravidade e a sua preferência.</p>
        <h3>Psicoterapia</h3>
        <p>Terapias como a cognitivo-comportamental ensinam formas de lidar com pensamentos, emoções e situações difíceis.
        Para casos leves a moderados, podem ser tão eficazes quanto os remédios.</p>
        <h3>Antidepressivos</h3>
        <p>São usados tanto para depressão quanto para ansiedade (por exemplo, sertralina, fluoxetina, escitalopram).</p>
        <ul>
          <li><strong>O efeito leva de 2 a 6 semanas</strong> para aparecer. Não desista antes.</li>
          <li>Enjoo, dor de cabeça ou um pouco mais de ansiedade podem surgir nos primeiros dias e costumam passar.</li>
          <li><strong>Não viciam</strong>, mas não devem ser parados de repente: a retirada é feita aos poucos, com o médico.</li>
          <li>Depois da melhora, continue por pelo menos <strong>6 a 12 meses</strong> para evitar que os sintomas voltem.</li>
        </ul>
        <h3>Calmantes (benzodiazepínicos)</h3>
        <p>Remédios como clonazepam, diazepam e alprazolam aliviam rapidamente, mas <strong>causam dependência</strong>,
        sonolência, problemas de memória e quedas. Devem ser usados apenas por pouco tempo, quando indicados, e nunca com álcool.</p>
        <div class="alert-box">
          <strong>Avise o médico logo se, ao iniciar ou mudar a dose de um remédio, surgirem pensamentos de se machucar, agitação intensa ou piora importante do humor.</strong>
        </div>`,
    },
    {
      id: 'mental-autocuidado',
      guide: 'mental',
      sources: 'Organização Mundial da Saúde — mhGAP; CANMAT 2023 (intervenções de estilo de vida).',
      icon: 'leaf',
      title: 'Autocuidado',
      keywords: 'autocuidado exercício sono rotina álcool respiração relaxamento rede de apoio',
      html: `
        <p class="lead">Atitudes do dia a dia não substituem o tratamento, mas <strong>ajudam muito</strong> na recuperação.</p>
        <ul>
          <li><strong>Movimente-se</strong>: caminhar 30 minutos, na maioria dos dias, melhora o humor e a ansiedade.</li>
          <li><strong>Mantenha uma rotina</strong> de horários para acordar, comer e dormir.</li>
          <li>Planeje <strong>pequenas atividades prazerosas</strong> todos os dias, mesmo sem vontade: a vontade costuma vir depois de começar.</li>
          <li><strong>Converse</strong> com pessoas de confiança; evite se isolar.</li>
          <li><strong>Evite álcool e outras drogas</strong>: eles pioram a depressão e a ansiedade e interferem nos remédios.</li>
          <li>Reduza café e energéticos se tiver ansiedade ou insônia.</li>
          <li>Limite notícias e redes sociais quando elas aumentarem a angústia.</li>
        </ul>
        <h3>Respiração para momentos de ansiedade</h3>
        <ol>
          <li>Sente-se e apoie uma mão na barriga.</li>
          <li>Puxe o ar pelo nariz contando até 4, enchendo a barriga.</li>
          <li>Segure por 2 segundos.</li>
          <li>Solte devagar pela boca contando até 6.</li>
          <li>Repita por alguns minutos.</li>
        </ol>
        <p>Numa crise de pânico, lembre-se: <strong>ela é muito desconfortável, mas passa</strong>, geralmente em poucos minutos.</p>`,
    },
    {
      id: 'mental-crise',
      guide: 'mental',
      sources: 'Centro de Valorização da Vida (CVV); Ministério da Saúde — Rede de Atenção Psicossocial; Organização Mundial da Saúde — mhGAP.',
      icon: 'phone',
      title: 'Em crise: onde buscar ajuda',
      keywords: 'suicídio pensamentos de morte crise cvv 188 caps emergência samu ajuda',
      html: `
        <p class="lead">Pensar em morte ou em se machucar é um sintoma que <strong>tem tratamento</strong>. Falar sobre isso
        não aumenta o risco — ao contrário, é o primeiro passo para receber ajuda.</p>
        <div class="alert-box">
          <strong>Se você está pensando em se machucar ou em tirar a própria vida:</strong>
          <ul>
            <li><strong>CVV — ligue 188</strong> (gratuito, 24 horas, sigiloso) ou acesse cvv.org.br</li>
            <li><strong>SAMU — 192</strong> ou o pronto-socorro mais próximo, se houver risco imediato</li>
            <li>Procure o <strong>CAPS</strong> ou a unidade de saúde da sua região</li>
          </ul>
        </div>
        <h3>Para familiares e amigos: sinais de alerta</h3>
        <ul>
          <li>Falar em morrer, em “sumir” ou em ser um peso para os outros</li>
          <li>Procurar meios de se machucar</li>
          <li>Despedir-se, doar objetos pessoais, isolar-se de repente</li>
          <li>Aumento do uso de álcool ou drogas</li>
          <li>Calma súbita depois de um período de muito sofrimento</li>
        </ul>
        <h3>Como ajudar</h3>
        <ul>
          <li>Pergunte diretamente e <strong>escute sem julgar</strong>.</li>
          <li>Não deixe a pessoa sozinha se houver risco imediato.</li>
          <li>Afaste remédios em excesso, armas e outros meios perigosos.</li>
          <li>Ajude a pessoa a buscar atendimento e acompanhe-a, se possível.</li>
        </ul>`,
    },
  ];

  // Guias exibidos na aba "Paciente", na ordem do seletor de temas
  window.EDU_GUIDES = [
    { id: 'has', title: 'Hipertensão arterial', icon: 'heart' },
    { id: 'dm', title: 'Diabetes', icon: 'drop' },
    { id: 'dlp', title: 'Colesterol e triglicerídeos', icon: 'activity' },
    { id: 'ic', title: 'Insuficiência cardíaca', icon: 'heart' },
    { id: 'queda', title: 'Prevenção de quedas no idoso', icon: 'elder' },
    { id: 'asma', title: 'Asma', icon: 'lungs' },
    { id: 'dpoc', title: 'DPOC', icon: 'lungs' },
    { id: 'fibro', title: 'Fibromialgia', icon: 'activity' },
    { id: 'mental', title: 'Depressão e ansiedade', icon: 'smile' },
  ];
})();
