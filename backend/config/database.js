const { Sequelize } = require('sequelize');

// Tentar conectar ao PostgreSQL
let sequelize = null;
let dbType = 'json';

try {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (databaseUrl) {
    console.log('📦 Conectando ao PostgreSQL...');
    sequelize = new Sequelize(databaseUrl, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    });
    dbType = 'postgres';
    console.log('✅ PostgreSQL configurado');
  } else {
    console.log('⚠️ DATABASE_URL não encontrada, usando JSON fallback');
  }
} catch (error) {
  console.error('❌ Erro ao configurar PostgreSQL:', error.message);
  console.log('⚠️ Usando JSON fallback');
}

module.exports = { sequelize, dbType };
