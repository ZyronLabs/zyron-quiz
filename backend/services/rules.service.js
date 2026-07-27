class RulesService {
  analisarRespostas(respostas) {
    const dores = [];
    const solucoes = [];

    if (respostas.presenca_online) {
      if (respostas.presenca_online === 'Não possui presença online') {
        dores.push('Pouca presença online');
        solucoes.push('Website profissional');
      }
    }

    if (respostas.gestao_vendas) {
      if (respostas.gestao_vendas === 'Papel/caderno' || respostas.gestao_vendas === 'Excel') {
        dores.push('Processos manuais');
        solucoes.push('Sistema de gestão');
      }
    }

    if (respostas.desafios && Array.isArray(respostas.desafios)) {
      respostas.desafios.forEach(desafio => {
        if (desafio === 'Atrair clientes') {
          dores.push('Dificuldade em captar clientes');
          solucoes.push('Marketing digital');
        }
        if (desafio === 'Automatizar tarefas') {
          dores.push('Tarefas repetitivas');
          solucoes.push('Automação de processos');
        }
      });
    }

    if (respostas.solucoes_interesse && Array.isArray(respostas.solucoes_interesse)) {
      respostas.solucoes_interesse.forEach(solucao => {
        if (!solucoes.includes(solucao)) {
          solucoes.push(solucao);
        }
      });
    }

    const prioridade = dores.length > 0 ? 'alta' : 'media';

    return {
      dores: [...new Set(dores)],
      solucoes: [...new Set(solucoes)],
      prioridade
    };
  }
}

module.exports = new RulesService();
