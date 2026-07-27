require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize, dbType } = require('./config/database');

const leadRoutes = require('./routes/lead.routes');
const quizRoutes = require('./routes/quiz.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 3000;

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

// Sincronizar banco se for PostgreSQL
if (dbType === 'postgres' && sequelize) {
  sequelize.sync().then(() => {
    console.log('✅ Tabelas sincronizadas');
  }).catch(err => {
    console.error('❌ Erro ao sincronizar:', err.message);
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/api/health`);
  console.log(`💾 Database: ${dbType === 'postgres' ? 'PostgreSQL' : 'JSON'}`);
  console.log(`🔗 Webhook: ${process.env.CHEGOU_WEBHOOK_SECRET ? '✅ Configurado' : '❌ Não configurado'}`);
});
// Dashboard refresh
const dashboardRoutes = require('./routes/dashboard.routes');
app.use('/api/dashboard', dashboardRoutes);
