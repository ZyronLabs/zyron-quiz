const express = require('express');
const router = express.Router();
const leadController = require('../controllers/lead.controller');

// Rotas públicas
router.post('/', leadController.criarLead);
router.post('/quiz', leadController.submeterQuiz);

// Rotas do dashboard
router.get('/', leadController.getLeads);
router.get('/stats', leadController.getStats);
router.get('/:id', leadController.getLeadById);
router.put('/:id/status', leadController.updateStatus);

module.exports = router;
