const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@zyronlabs.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Zyron2026';

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const token = jwt.sign(
        { email: ADMIN_EMAIL, role: 'admin' },
        process.env.JWT_SECRET || 'zyron_secret',
        { expiresIn: '7d' }
      );
      return res.json({
        success: true,
        token,
        user: { email: ADMIN_EMAIL, role: 'admin' }
      });
    }

    res.status(401).json({ error: 'Credenciais inválidas' });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.verify = (req, res) => {
  res.json({ success: true, user: { email: ADMIN_EMAIL, role: 'admin' } });
};

exports.logout = (req, res) => {
  res.json({ success: true });
};

exports.resetDados = async (req, res) => {
  try {
    console.log('🔄 Resetando todos os dados...');
    
    const leadsPath = path.join(__dirname, '../database/leads.json');
    const logsPath = path.join(__dirname, '../logs/notifications.json');
    
    // Limpar leads.json
    fs.writeFileSync(leadsPath, JSON.stringify([], null, 2));
    console.log('✅ leads.json limpo');

    // Limpar logs
    if (fs.existsSync(logsPath)) {
        fs.writeFileSync(logsPath, JSON.stringify([], null, 2));
        console.log('✅ Logs limpos');
    }

    res.json({ 
        success: true, 
        message: 'Todos os dados foram removidos com sucesso!',
        count: 0 
    });

  } catch (error) {
    console.error('❌ Erro ao resetar dados:', error);
    res.status(500).json({ error: 'Erro ao resetar dados: ' + error.message });
  }
};
