const { sequelize, dbType } = require('../config/database');
const Lead = require('../models/Lead');

async function sync() {
  if (dbType !== 'postgres') {
    console.log('⚠️ Não está usando PostgreSQL');
    return;
  }
  
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado ao PostgreSQL');
    
    // Sincronizar com force true para recriar tabelas
    await sequelize.sync({ force: true });
    console.log('✅ Tabelas recriadas com sucesso!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

sync();
