const express = require('express');
const router = express.Router();
const logger = require('../services/logger.service');

// Obter logs
router.get('/', (req, res) => {
  try {
    const { limit = 100, type = 'all' } = req.query;
    const logs = logger.getLogs(parseInt(limit), type);
    res.json({
      success: true,
      total: logs.length,
      logs: logs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter apenas erros
router.get('/errors', (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const logs = logger.getLogs(parseInt(limit), 'error');
    res.json({
      success: true,
      total: logs.length,
      errors: logs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Limpar logs
router.delete('/clear', (req, res) => {
  try {
    const result = logger.clearLogs();
    if (result.success) {
      res.json({ success: true, message: 'Logs limpos com sucesso' });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Log de teste
router.post('/test', (req, res) => {
  logger.info('🧪 Log de teste', { test: 'ok', data: req.body });
  logger.warn('⚠️ Aviso de teste');
  logger.error('❌ Erro de teste', new Error('Erro simulado'));
  
  res.json({ success: true, message: 'Logs de teste criados' });
});

module.exports = router;
