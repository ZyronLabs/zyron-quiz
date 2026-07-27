require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize, dbType } = require('./config/database');
const logger = require('./services/logger.service');

const leadRoutes = require('./routes/lead.routes');
const quizRoutes = require('./routes/quiz.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de logging
app.use(logger.middleware());

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../frontend')));

// Rotas
app.use('/api/leads', leadRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/admin', adminRoutes);

// Dashboard refresh
const dashboardRoutes = require('./routes/dashboard.routes');
app.use('/api/dashboard', dashboardRoutes);

// Logs routes
const logsRoutes = require('./routes/logs.routes');
app.use('/api/logs', logsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: dbType || 'json',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Fallback para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Middleware de erro global
app.use((err, req, res, next) => {
  logger.error('❌ Erro não tratado', err, {
    url: req.url,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
    ip: req.ip
  });
  
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Tente novamente mais tarde',
    timestamp: new Date().toISOString()
  });
});

// Sincronizar banco se for PostgreSQL
if (dbType === 'postgres' && sequelize) {
  sequelize.sync().then(() => {
    logger.info('✅ Tabelas sincronizadas');
  }).catch(err => {
    logger.error('❌ Erro ao sincronizar tabelas', err);
  });
}

app.listen(PORT, () => {
  logger.info(`🚀 Servidor rodando na porta ${PORT}`);
  logger.info(`📊 Health: http://localhost:${PORT}/api/health`);
  logger.info(`💾 Database: ${dbType === 'postgres' ? 'PostgreSQL' : 'JSON'}`);
  logger.info(`🔗 Webhook: ${process.env.CHEGOU_WEBHOOK_SECRET ? '✅ Configurado' : '❌ Não configurado'}`);
});
