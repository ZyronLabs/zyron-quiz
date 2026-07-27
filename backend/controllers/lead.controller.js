const leadService = require('../services/lead.service');
const scoringService = require('../services/scoring.service');
const rulesService = require('../services/rules.service');
const webhookService = require('../services/webhook.service');
const { validarWhatsApp, validarEmail } = require('../utils/validation');

// Importar budget service com fallback
let budgetService = null;
try {
    budgetService = require('../services/budget.service');
} catch (error) {
    console.warn('⚠️ budget.service não encontrado, usando fallback');
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
    const { nome, empresa, whatsapp, email, segmento } = req.body;

    if (!nome || !whatsapp || !email) {
      return res.status(400).json({ error: 'Nome, WhatsApp e Email são obrigatórios' });
    }

    if (!validarWhatsApp(whatsapp)) {
      return res.status(400).json({ error: 'WhatsApp inválido. Use o formato +258XXXXXXXXX' });
    }

    if (!validarEmail(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    const leadData = {
      cliente: { nome, empresa: empresa || '', whatsapp, email, segmento: segmento || '' },
      status: 'novo',
      comercial: { prioridade: 'media', contactado: false, observacoes: '' }
    };

    const lead = await leadService.createLead(leadData);
    
    res.status(201).json({
      success: true,
      leadId: lead.id,
      message: 'Lead criado com sucesso.'
    });

  } catch (error) {
    console.error('Erro ao criar lead:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.submeterQuiz = async (req, res) => {
  try {
    const { leadId, respostas } = req.body;

    console.log('📥 Recebendo quiz para lead:', leadId);

    if (!leadId || !respostas) {
      return res.status(400).json({ error: 'leadId e respostas são obrigatórios' });
    }

    const lead = await leadService.getLeadById(leadId);
    if (!lead) {
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
    
    // Calcular orçamento com fallback
    let orcamento = { total: 0, detalhes: [], recomendacoes: [], nivel: 'basico' };
    try {
        orcamento = budgetService.calcularOrcamento({
            respostas_quiz: respostasMapeadas,
            diagnostico: diagnostico
        });
    } catch (error) {
        console.error('❌ Erro ao calcular orçamento:', error.message);
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
        console.error('Erro no webhook:', err.message);
      });
    }, 100);

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
    console.error('❌ Erro ao submeter quiz:', error);
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
    console.error('Erro ao buscar leads:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.getLeadById = async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await leadService.getLeadById(id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }
    res.json(lead);
  } catch (error) {
    console.error('Erro ao buscar lead:', error);
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
    res.json({ success: true, lead });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ error: error.message || 'Erro interno do servidor' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const stats = await leadService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
