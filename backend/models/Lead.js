const { DataTypes } = require('sequelize');
const { sequelize, dbType } = require('../config/database');

let Lead = null;

if (dbType === 'postgres' && sequelize) {
  Lead = sequelize.define('Lead', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      unique: true
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'novo'
    },
    data_cadastro: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    nome: DataTypes.STRING,
    empresa: DataTypes.STRING,
    whatsapp: DataTypes.STRING,
    email: DataTypes.STRING,
    segmento: DataTypes.STRING,
    pontuacao_total: DataTypes.INTEGER,
    nivel: DataTypes.STRING,
    descricao: DataTypes.TEXT,
    recomendacao: DataTypes.TEXT,
    categorias: DataTypes.JSON,
    necessidades: DataTypes.JSON,
    respostas_quiz: DataTypes.JSON,
    orcamento: DataTypes.JSON,
    prioridade: DataTypes.STRING,
    contactado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    observacoes: DataTypes.TEXT,
    data_quiz: DataTypes.DATE,
    ultima_atualizacao: DataTypes.DATE
  }, {
    tableName: 'leads',
    timestamps: false
  });
}

module.exports = Lead;
