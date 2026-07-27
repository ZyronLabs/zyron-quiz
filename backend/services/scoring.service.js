class ScoringService {
  calcularPontuacao(respostas) {
    const categorias = {
      presencaDigital: 0,
      gestao: 0,
      automacao: 0,
      crescimento: 0,
      interesse: 0
    };

    const presencaMap = {
      'Não possui presença online': 0,
      'Apenas WhatsApp/Facebook': 10,
      'Possui website': 20,
      'Website + estratégias digitais': 25
    };
    categorias.presencaDigital = presencaMap[respostas.presenca_online] || 0;

    const gestaoMap = {
      'Papel/caderno': 0,
      'Excel': 10,
      'WhatsApp': 15,
      'Sistema próprio': 25
    };
    categorias.gestao = gestaoMap[respostas.gestao_vendas] || 0;

    const automacaoMap = {
      'Pouco': 5,
      'Algumas horas por semana': 10,
      'Muitas horas': 20
    };
    categorias.automacao = automacaoMap[respostas.tempo_repetitivo] || 0;

    const crescimentoMap = {
      'Freelancer': 5,
      'Pequena empresa': 10,
      'Média empresa': 15,
      'Grande empresa': 20
    };
    categorias.crescimento = crescimentoMap[respostas.tamanho_negocio] || 0;

    const interesseMap = {
      'Não': 0,
      'Talvez': 5,
      'Sim': 10
    };
    categorias.interesse = interesseMap[respostas.interesse_automacao] || 0;

    const total = Object.values(categorias).reduce((a, b) => a + b, 0);

    let nivel, descricao, recomendacao;
    if (total <= 30) {
      nivel = 'Inicial';
      descricao = 'Seu negócio ainda tem muitas oportunidades de digitalização.';
      recomendacao = 'Recomendamos começar com Website profissional e presença online.';
    } else if (total <= 70) {
      nivel = 'Intermediário';
      descricao = 'Seu negócio já utiliza tecnologia, mas existem processos que podem ser melhorados.';
      recomendacao = 'Recomendamos sistemas de gestão e automação de processos.';
    } else {
      nivel = 'Avançado';
      descricao = 'Seu negócio está preparado para soluções digitais mais avançadas.';
      recomendacao = 'Recomendamos soluções SaaS, IA e sistemas personalizados.';
    }

    return { total, categorias, nivel, descricao, recomendacao };
  }
}

module.exports = new ScoringService();
