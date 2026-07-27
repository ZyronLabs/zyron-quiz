const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quiz.controller');

router.get('/perguntas', quizController.getPerguntas);

module.exports = router;
