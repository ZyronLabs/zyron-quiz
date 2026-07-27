const quizPerguntas = require('../data/quiz.perguntas.json');

exports.getPerguntas = (req, res) => {
  try {
    res.json({
      total: quizPerguntas.length,
      perguntas: quizPerguntas
    });
  } catch (error) {
    console.error('Erro ao buscar perguntas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
