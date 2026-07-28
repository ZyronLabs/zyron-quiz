const express = require('express');
const router = express.Router();
const { sequelize, dbType } = require('../config/database');
const logger = require('../services/logger.service');

// ===== VER TABELAS =====
router.get('/tables', async (req, res) => {
    try {
        if (dbType !== 'postgres') {
            return res.json({ 
                database: 'json', 
                message: 'Usando JSON, não PostgreSQL',
                tables: []
            });
        }

        const result = await sequelize.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);
        
        const tables = result[0].map(row => row.table_name);
        logger.info(`📊 Tabelas listadas: ${tables.join(', ')}`);
        
        res.json({
            database: 'postgres',
            tables: tables,
            count: tables.length
        });
    } catch (error) {
        logger.error('❌ Erro ao listar tabelas', error);
        res.status(500).json({ error: error.message });
    }
});

// ===== VER CONTEÚDO DA TABELA =====
router.get('/table/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const { limit = 100, offset = 0 } = req.query;
        
        if (dbType !== 'postgres') {
            return res.json({ 
                database: 'json', 
                message: 'Usando JSON, não PostgreSQL'
            });
        }

        // Verificar se a tabela existe
        const checkResult = await sequelize.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = :name
            );
        `, { replacements: { name } });
        
        if (!checkResult[0][0].exists) {
            return res.status(404).json({ error: `Tabela '${name}' não encontrada` });
        }

        // Buscar dados
        const dataResult = await sequelize.query(`
            SELECT * FROM "${name}" 
            ORDER BY data_cadastro DESC 
            LIMIT :limit OFFSET :offset;
        `, { replacements: { limit: parseInt(limit), offset: parseInt(offset) } });

        // Buscar contagem
        const countResult = await sequelize.query(`
            SELECT COUNT(*) FROM "${name}";
        `);

        logger.info(`📊 Tabela ${name}: ${countResult[0][0].count} registros`);
        
        res.json({
            table: name,
            total: parseInt(countResult[0][0].count),
            limit: parseInt(limit),
            offset: parseInt(offset),
            data: dataResult[0]
        });
    } catch (error) {
        logger.error(`❌ Erro ao ler tabela ${req.params.name}`, error);
        res.status(500).json({ error: error.message });
    }
});

// ===== INSERIR LEAD (TESTE) =====
router.post('/test-insert', async (req, res) => {
    try {
        const leadService = require('../services/lead.service');
        
        const testLead = {
            cliente: {
                nome: `Teste ${new Date().toLocaleString()}`,
                empresa: 'Empresa Teste',
                whatsapp: '+258846790999',
                email: 'teste@teste.com',
                segmento: 'Teste'
            },
            status: 'novo',
            comercial: {
                prioridade: 'media',
                contactado: false,
                observacoes: ''
            }
        };

        const lead = await leadService.createLead(testLead);
        logger.info(`✅ Lead de teste criado: ${lead.id}`);
        
        res.json({
            success: true,
            message: 'Lead de teste criado com sucesso!',
            lead: lead
        });
    } catch (error) {
        logger.error('❌ Erro ao criar lead de teste', error);
        res.status(500).json({ error: error.message });
    }
});

// ===== EXECUTAR SQL DIRETO (CUIDADO!) =====
router.post('/sql', async (req, res) => {
    try {
        const { query } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'Query é obrigatória' });
        }

        // Proteção: apenas SELECT em produção
        if (process.env.NODE_ENV === 'production' && !query.trim().toUpperCase().startsWith('SELECT')) {
            return res.status(403).json({ 
                error: 'Em produção, apenas consultas SELECT são permitidas' 
            });
        }

        if (dbType !== 'postgres') {
            return res.json({ 
                database: 'json', 
                message: 'Usando JSON, não PostgreSQL'
            });
        }

        const result = await sequelize.query(query);
        logger.info(`📊 SQL executado: ${query.substring(0, 100)}...`);
        
        res.json({
            success: true,
            query: query,
            result: result[0],
            rowCount: result[0].length
        });
    } catch (error) {
        logger.error('❌ Erro ao executar SQL', error);
        res.status(500).json({ error: error.message });
    }
});

// ===== ESTATÍSTICAS DO BANCO =====
router.get('/stats', async (req, res) => {
    try {
        if (dbType !== 'postgres') {
            return res.json({ 
                database: 'json', 
                message: 'Usando JSON, não PostgreSQL'
            });
        }

        const result = await sequelize.query(`
            SELECT 
                (SELECT COUNT(*) FROM leads) as total_leads,
                (SELECT COUNT(*) FROM leads WHERE status = 'novo') as novos,
                (SELECT COUNT(*) FROM leads WHERE status = 'contactado') as contactados,
                (SELECT COUNT(*) FROM leads WHERE status = 'cliente') as clientes,
                (SELECT COUNT(*) FROM leads WHERE pontuacao_total > 0) as quizzes_realizados,
                ROUND(AVG(pontuacao_total)::numeric, 2) as media_pontuacao
            FROM leads;
        `);

        res.json({
            database: 'postgres',
            stats: result[0][0]
        });
    } catch (error) {
        logger.error('❌ Erro ao buscar estatísticas do banco', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
