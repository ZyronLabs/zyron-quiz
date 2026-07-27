const leadService = require('../services/lead.service');
const scoringService = require('../services/scoring.service');
const rulesService = require('../services/rules.service');
const webhookService = require('../services/webhook.service');
const logger = require('../services/logger.service');
const { validarWhatsApp, validarEmail } = require('../utils/validation');

let budgetService = null;
try {
  budgetService = require('../services/budget.service');
} catch (error) {
  logger.warn('⚠️ budget.service não encontrado, usando fallback');
  budgetService = {
    calcularOrcamento: (lead) => ({
      total: 0,
      detalhes: [],
      recomendacoes: ['Orçamento não disponível'],
      nivel: 'basico'
    }),
    calcularEstatisticasOrcamento: (leads) => ({
      totalOrcamento: 0,
      media: 0,
      count: 0,
      niveis: { start: 0, basico: 0, profissional: 0, enterprise: 0 }
    })
  };
}

exports.criarLead = async (req, res) => {
  try {
    logger.info('📥 Criando lead', { body: req.body });
    
    const { nome, empresa, whatsapp, email, segmento } = req.body;

    if (!nome || !whatsapp || !email) {
      logger.warn('⚠️ Campos obrigatórios faltando', { nome, whatsapp, email });
      return res.status(400).json({ error: 'Nome, WhatsApp e Email são obrigatórios' });
    }

    if (!validarWhatsApp(whatsapp)) {
      logger.warn('⚠️ WhatsApp inválido', { whatsapp });
      return res.status(400).json({ error: 'WhatsApp inválido. Use o formato +258XXXXXXXXX' });
    }

    if (!validarEmail(email)) {
      logger.warn('⚠️ Email inválido', { email });
      return res.status(400).json({ error: 'Email inválido' });
    }

    const leadData = {
      cliente: { nome, empresa: empresa || '', whatsapp, email, segmento: segmento || '' },
      status: 'novo',
      comercial: { prioridade: 'media', contactado: false, observacoes: '' }
    };

    const lead = await leadService.createLead(leadData);
    
    logger.info(`✅ Lead criado com sucesso: ${lead.id}`, { leadId: lead.id, nome });
    
    res.status(201).json({
      success: true,
      leadId: lead.id,
      message: 'Lead criado com sucesso.'
    });

  } catch (error) {
    logger.error('❌ Erro ao criar lead', error, { body: req.body });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.submeterQuiz = async (req, res) => {
  try {
    const { leadId, respostas } = req.body;

    logger.info(`📥 Submetendo quiz para lead: ${leadId}`, { leadId });

    if (!leadId || !respostas) {
      logger.warn('⚠️ leadId ou respostas faltando', { leadId });
      return res.status(400).json({ error: 'leadId e respostas são obrigatórios' });
    }

    const lead = await leadService.getLeadById(leadId);
    if (!lead) {
      logger.warn(`⚠️ Lead não encontrado: ${leadId}`);
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    const respostasMapeadas = {
      presenca_online: respostas.q1 || '',
      origem_clientes: respostas.q2 || '',
      gestao_vendas: respostas.q3 || '',
      possui_sistema: respostas.q4 || '',
      tempo_repetitivo: respostas.q5 || '',
      desafios: respostas.q6 || [],
      solucoes_interesse: respostas.q7 || [],
      tamanho_negocio: respostas.q8 || '',
      interesse_automacao: respostas.q9 || '',
      orcamento: respostas.q10 || ''
    };

    const diagnostico = scoringService.calcularPontuacao(respostasMapeadas);
    const necessidades = rulesService.analisarRespostas(respostasMapeadas);
    
    let orcamento = { total: 0, detalhes: [], recomendacoes: [], nivel: 'basico' };
    try {
      orcamento = budgetService.calcularOrcamento({
        respostas_quiz: respostasMapeadas,
        diagnostico: diagnostico
      });
    } catch (error) {
      logger.error('❌ Erro ao calcular orçamento', error);
    }

    const leadAtualizado = {
      diagnostico: {
        pontuacao_total: diagnostico.total,
        categorias: diagnostico.categorias,
        nivel: diagnostico.nivel,
        descricao: diagnostico.descricao,
        recomendacao: diagnostico.recomendacao,
        necessidades: {
          dores: necessidades.dores,
          solucoes: necessidades.solucoes
        }
      },
      respostas_quiz: respostasMapeadas,
      orcamento: orcamento,
      comercial: {
        prioridade: necessidades.prioridade,
        contactado: false,
        observacoes: ''
      }
    };

    const updatedLead = await leadService.updateLead(leadId, leadAtualizado);

    const webhookData = {
      id: updatedLead.id,
      status: updatedLead.status,
      data_cadastro: updatedLead.data_cadastro,
      cliente: {
        nome: updatedLead.nome || updatedLead.cliente?.nome,
        empresa: updatedLead.empresa || updatedLead.cliente?.empresa,
        whatsapp: updatedLead.whatsapp || updatedLead.cliente?.whatsapp,
        email: updatedLead.email || updatedLead.cliente?.email,
        segmento: updatedLead.segmento || updatedLead.cliente?.segmento
      },
      diagnostico: {
        pontuacao_total: diagnostico.total,
        nivel: diagnostico.nivel,
        descricao: diagnostico.descricao,
        categorias: diagnostico.categorias,
        necessidades: {
          dores: necessidades.dores,
          solucoes: necessidades.solucoes
        }
      },
      orcamento: orcamento,
      respostas_quiz: respostasMapeadas,
      comercial: updatedLead.comercial
    };

    setTimeout(() => {
      webhookService.enviarDados(webhookData).catch(err => {
        logger.error('❌ Erro no webhook (assíncrono)', err);
      });
    }, 100);

    logger.info(`✅ Quiz finalizado para lead: ${leadId}`, { leadId, pontuacao: diagnostico.total });

    return res.status(200).json({
      success: true,
      leadId: updatedLead.id,
      diagnostico: {
        pontuacao: diagnostico.total,
        nivel: diagnostico.nivel,
        descricao: diagnostico.descricao,
        recomendacao: diagnostico.recomendacao,
        categorias: diagnostico.categorias,
        necessidades: necessidades,
        orcamento: orcamento
      }
    });

  } catch (error) {
    logger.error('❌ Erro ao submeter quiz', error, { body: req.body });
    res.status(500).json({ error: 'Erro interno do servidor: ' + error.message });
  }
};

exports.getLeads = async (req, res) => {
  try {
    const { segmento, nivel, servico, status, data_inicio, data_fim } = req.query;
    const filtros = { segmento, nivel, servico, status, data_inicio, data_fim };
    const leads = await leadService.filterLeads(filtros);
    res.json({ total: leads.length, leads });
  } catch (error) {
    logger.error('❌ Erro ao buscar leads', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.getLeadById = async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await leadService.getLeadById(id);
    if (!lead) {
      logger.warn(`⚠️ Lead não encontrado: ${id}`);
      return res.status(404).json({ error: 'Lead não encontrado' });
    }
    res.json(lead);
  } catch (error) {
    logger.error('❌ Erro ao buscar lead', error, { id: req.params.id });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, observacoes } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status é obrigatório' });
    }
    
    const lead = await leadService.updateLeadStatus(id, status, observacoes);
    logger.info(`✅ Status atualizado: ${id} → ${status}`);
    res.json({ success: true, lead });
  } catch (error) {
    logger.error('❌ Erro ao atualizar status', error, { id: req.params.id, body: req.body });
    res.status(500).json({ error: error.message || 'Erro interno do servidor' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const stats = await leadService.getStats();
    res.json(stats);
  } catch (error) {
    logger.error('❌ Erro ao buscar estatísticas', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
