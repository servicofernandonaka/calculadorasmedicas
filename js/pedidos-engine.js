/* Pedidos de exames especiais: motor que monta o texto da justificativa e os avisos de pendência.
   Determinístico, sem DOM, sem rede e sem armazenamento. Os critérios clínicos ficam em js/pedidos-dados.js
   (cada um com fonte); este arquivo só aplica as regras declaradas nos dados.

   Regras declarativas (campo "regras" de cada exame):
     { id, nivel: 'alto'|'atencao'|'info', aviso, se: { criterio?: [ids, todos], criterioAlgum?: [ids], semGrupo?: [ids de grupos sem nenhum marcado],
                                                       grupoMenosQue?: { grupo, n } (marcados no grupo < n),
                                                       idadeMenor?, idadeMaior?, sexo?: 'F'|'M' } }
   "nivel: alto" bloqueia a geração do texto (ex.: contraindicação absoluta).
   Critério com "intervaloMin" (anos) e o campo numérico "anosDesde" preenchido: avisa se o exame anterior é mais recente que o intervalo. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PedidosEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const PRIORIDADES = {
    eletivo: 'Eletiva (rotina)',
    prioritario: 'Prioritária',
    urgente: 'Urgente',
  };
  const SEXOS = { F: 'feminino', M: 'masculino' };

  const arr = (x) => (Array.isArray(x) ? x : []);
  const idadeOk = (i) => Number.isInteger(i) && i >= 0 && i <= 120;
  const limpa = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  const fimDeFrase = (s) => (/[.!?:;]$/.test(s) ? s : s + '.');

  function achaExame(cat, id) {
    return arr(cat && cat.exames).find((x) => x.id === id) || null;
  }

  function todosCriterios(ex) {
    const out = [];
    for (const g of arr(ex.grupos)) for (const c of arr(g.criterios)) out.push(Object.assign({ grupo: g.id, grupoRotulo: g.rotulo }, c));
    return out;
  }

  /* Uma condição "se" casa quando todas as suas chaves são verdadeiras */
  function casa(se, ctx) {
    if (!se) return true;
    if (se.criterio && !arr(se.criterio).every((id) => ctx.marcados.has(id))) return false;
    if (se.criterioAlgum && !arr(se.criterioAlgum).some((id) => ctx.marcados.has(id))) return false;
    if (se.semGrupo && !arr(se.semGrupo).every((g) => !ctx.gruposMarcados.has(g))) return false;
    if (se.grupoMenosQue && !(ctx.contaGrupo(se.grupoMenosQue.grupo) < se.grupoMenosQue.n)) return false;
    if (se.idadeMenor != null && !(ctx.idade < se.idadeMenor)) return false;
    if (se.idadeMaior != null && !(ctx.idade > se.idadeMaior)) return false;
    if (se.sexo && ctx.sexo !== se.sexo) return false;
    return true;
  }

  function montar(cat, entrada) {
    const e = entrada || {};
    const ex = achaExame(cat, e.exame);
    const res = { exame: ex, pronto: false, bloqueado: false, faltas: [], avisos: [], texto: '', criteriosMarcados: [] };
    if (!ex) { res.faltas.push('Escolha o exame a solicitar.'); return res; }

    const idade = e.idade === '' || e.idade == null ? NaN : Number(e.idade);
    const sexo = e.sexo === 'F' || e.sexo === 'M' ? e.sexo : '';
    const criterios = todosCriterios(ex);
    const marcados = new Set(arr(e.criterios).filter((id) => criterios.some((c) => c.id === id)));
    const gruposMarcados = new Set();
    for (const c of criterios) if (marcados.has(c.id)) gruposMarcados.add(c.grupo);
    const escolhidos = criterios.filter((c) => marcados.has(c.id));
    res.criteriosMarcados = escolhidos.map((c) => c.id);
    const contaGrupo = (g) => criterios.filter((c) => c.grupo === g && marcados.has(c.id)).length;
    const ctx = { idade, sexo, marcados, gruposMarcados, contaGrupo };

    /* Pendências: sem isso o pedido costuma voltar */
    if (!idadeOk(idade)) res.faltas.push('Informe a idade (0 a 120 anos).');
    if (!sexo) res.faltas.push('Informe o sexo.');
    if (!escolhidos.length) res.faltas.push('Marque ao menos um critério de indicação.');
    if (!PRIORIDADES[e.prioridade]) res.faltas.push('Informe a prioridade do pedido.');
    const cidSel = arr(ex.cids).find((c) => c[0] === e.cid);
    if (!cidSel) res.faltas.push('Escolha o CID-10 da indicação.');
    const campos = arr(ex.campos);
    const exigido = (c) => c.exigidoQuando ? casa(c.exigidoQuando, ctx) : !!c.obrigatorio;
    for (const c of campos) if (exigido(c) && !limpa((e.campos || {})[c.id])) res.faltas.push(c.exigidoMsg || `Preencha: ${c.rotulo}.`);

    /* Regras do exame (contraindicações, baixo valor, idade) */
    for (const r of arr(ex.regras)) {
      if (!casa(r.se, ctx)) continue;
      // Regras só fazem sentido com idade válida quando dependem dela
      if ((r.se && (r.se.idadeMenor != null || r.se.idadeMaior != null)) && !idadeOk(idade)) continue;
      res.avisos.push({ id: r.id, nivel: r.nivel || 'atencao', texto: r.aviso });
    }
    /* Intervalo mínimo entre exames (vigilância) */
    const anosDesde = limpa((e.campos || {}).anosDesde).replace(',', '.');
    if (anosDesde !== '' && Number.isFinite(Number(anosDesde))) {
      for (const c of escolhidos) {
        if (c.intervaloMin != null && Number(anosDesde) < c.intervaloMin) {
          res.avisos.push({ id: 'intervalo-' + c.id, nivel: 'atencao',
            texto: `Intervalo recomendado para este achado: ${String(c.intervaloMin).replace('.', ',')} ano(s) (${c.intervaloFonte || 'ver fonte'}). O exame anterior foi há ${String(anosDesde).replace('.', ',')} ano(s): o pedido antes do prazo costuma ser devolvido, a menos que haja sintoma ou outra indicação.` });
        }
      }
    }
    res.bloqueado = res.avisos.some((a) => a.nivel === 'alto');
    res.avisos.sort((a, b) => ['alto', 'atencao', 'info'].indexOf(a.nivel) - ['alto', 'atencao', 'info'].indexOf(b.nivel));

    if (res.faltas.length || res.bloqueado) return res;

    /* Texto para o prontuário */
    const L = [];
    L.push(`SOLICITAÇÃO: ${ex.nome}`);
    L.push(`Prioridade: ${PRIORIDADES[e.prioridade]}.`);
    L.push(`Paciente do sexo ${SEXOS[sexo]}, ${idade} ano${idade === 1 ? '' : 's'}.`);
    L.push(`Indicação (CID-10): ${cidSel[0]} - ${cidSel[1]}.`);
    const quadro = limpa(e.quadro);
    if (quadro) L.push('', 'Quadro clínico: ' + fimDeFrase(quadro));
    L.push('', 'Critérios de indicação presentes:');
    for (const c of escolhidos) L.push('- ' + fimDeFrase(c.frase || c.rotulo));
    for (const c of campos) {
      const v = limpa((e.campos || {})[c.id]);
      if (v) L.push('', `${c.rotuloNoTexto || c.rotulo}: ${fimDeFrase(v)}`);
    }
    const aviso = res.avisos.filter((a) => a.nivel !== 'info').map((a) => a.texto);
    if (e.contraRevisadas && ex.contraConfirmacao) L.push('', fimDeFrase(ex.contraConfirmacao));
    const obs = limpa(e.obs);
    if (obs) L.push('', 'Observações: ' + fimDeFrase(obs));
    if (ex.fechamento) L.push('', fimDeFrase(ex.fechamento));
    const refs = [];
    for (const c of escolhidos) {
      const f = ex.fontes && ex.fontes[c.fonte];
      if (f && f.curta && !refs.includes(f.curta)) refs.push(f.curta);
    }
    if (refs.length) L.push('', `Referência${refs.length > 1 ? 's' : ''}: ${refs.join('; ')}.`);
    res.texto = L.join('\n');
    res.avisosTexto = aviso;
    res.pronto = true;
    return res;
  }

  return { PRIORIDADES, SEXOS, achaExame, todosCriterios, montar, casa };
});
