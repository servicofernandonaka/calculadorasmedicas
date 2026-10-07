/* Material educativo para pacientes — Hipertensão arterial */
(function () {
  'use strict';

  window.EDU = [
    {
      id: 'has-oque',
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
      icon: 'pill',
      title: 'Importância do tratamento',
      keywords: 'tratamento remédio medicamento adesão parar remédio importância complicações',
      html: `
        <p class="lead">Controlar a pressão é uma das medidas que <strong>mais salvam vidas</strong> na medicina. Cada
        redução de 10 mmHg na pressão sistólica diminui em cerca de <strong>20% o risco de infarto</strong> e em
        <strong>mais de 25% o risco de AVC (derrame)</strong>.</p>
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
          <li>Bebidas alcoólicas — se beber, no máximo 1 dose/dia (mulheres) ou 2 doses/dia (homens)</li>
        </ul>
        <h3>Exemplo de prato</h3>
        <p>Metade do prato com verduras e legumes, ¼ com arroz integral ou outro cereal, ¼ com feijão e uma proteína
        magra (frango, peixe, ovo) — temperados com ervas e um fio de azeite.</p>`,
    },
    {
      id: 'has-atividade',
      icon: 'activity',
      title: 'Atividade física',
      keywords: 'atividade física exercício caminhada academia musculação esporte',
      html: `
        <p class="lead">Exercício regular reduz a pressão em média <strong>5 a 8 mmHg</strong>, melhora o coração, o humor,
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
          <li>Faça 2 medidas com 1 minuto de intervalo.</li>
        </ol>
        <h3>Quando medir</h3>
        <p>Quando o médico pedir um protocolo: <strong>3 medidas pela manhã</strong> (antes do café e dos remédios) e
        <strong>3 à noite</strong> (antes do jantar), por 5 dias. Anote tudo, com data e hora, e leve na consulta.</p>
        <p>Em casa, valores médios <strong>≥ 130/80 mmHg</strong> são considerados elevados.</p>`,
    },
    {
      id: 'has-habitos',
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
  ];
})();
