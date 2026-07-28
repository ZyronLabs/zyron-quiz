const fs = require('fs');
const path = require('path');
const LeadModel = require('../models/Lead');
const { sequelize, dbType } = require('../config/database');

class LeadService {
  constructor() {
    this.leadsPath = path.join(__dirname, '../database/leads.json');
    this.usePostgres = dbType === 'postgres' && LeadModel;
    this.inicializarArquivo();
  }

  inicializarArquivo() {
    const dir = path.dirname(this.leadsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.leadsPath)) {
      fs.writeFileSync(this.leadsPath, JSON.stringify([], null, 2));
    }
  }

  // ===== MÉTODOS =====
  async getAllLeads() {
    if (this.usePostgres) {
      try {
        return await LeadModel.findAll({ order: [['data_cadastro', 'DESC']] });
      } catch (error) {
        return this.getAllLeadsJSON();
      }
    }
    return this.getAllLeadsJSON();
  }

  getAllLeadsJSON() {
    try {
      const data = fs.readFileSync(this.leadsPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  async getLeadById(id) {
    if (this.usePostgres) {
      try {
        return await LeadModel.findOne({ where: { id } });
      } catch (error) {
        return this.getLeadByIdJSON(id);
      }
    }
    return this.getLeadByIdJSON(id);
  }

  getLeadByIdJSON(id) {
    const leads = this.getAllLeadsJSON();
    return leads.find(lead => lead.id === id);
  }

  async createLead(leadData) {
    const { cliente, status, comercial, origem } = leadData;
    const id = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    
    if (this.usePostgres) {
      try {
        return await LeadModel.create({
          id,
          status: status || 'novo',
          data_cadastro: new Date(),
          nome: cliente.nome,
          empresa: cliente.empresa || '',
          whatsapp: cliente.whatsapp,
          email: cliente.email,
          segmento: cliente.segmento || '',
          origem: origem || 'Direto',
          prioridade: comercial?.prioridade || 'media',
          contactado: comercial?.contactado || false,
          observacoes: comercial?.observacoes || ''
        });
      } catch (error) {
        return this.createLeadJSON({ cliente, status, comercial, origem, id });
      }
    }
    return this.createLeadJSON({ cliente, status, comercial, origem, id });
  }

  createLeadJSON(data) {
    const leads = this.getAllLeadsJSON();
    const novoLead = {
      id: data.id,
      status: data.status || 'novo',
      data_cadastro: new Date().toISOString(),
      cliente: data.cliente,
      origem: data.origem || 'Direto',
      comercial: {
        prioridade: data.comercial?.prioridade || 'media',
        contactado: false,
        observacoes: data.comercial?.observacoes || ''
      }
    };
    leads.push(novoLead);
    fs.writeFileSync(this.leadsPath, JSON.stringify(leads, null, 2));
    return novoLead;
  }

  async updateLead(id, data) {
    if (this.usePostgres) {
      try {
        const lead = await LeadModel.findOne({ where: { id } });
        if (!lead) throw new Error('Lead não encontrado');
        
        if (data.diagnostico) {
          lead.pontuacao_total = data.diagnostico.pontuacao_total;
          lead.nivel = data.diagnostico.nivel;
          lead.descricao = data.diagnostico.descricao;
          lead.recomendacao = data.diagnostico.recomendacao;
          lead.categorias = data.diagnostico.categorias;
          lead.necessidades = data.diagnostico.necessidades;
        }
        if (data.respostas_quiz) lead.respostas_quiz = data.respostas_quiz;
        if (data.orcamento) lead.orcamento = data.orcamento;
        if (data.comercial) {
          lead.prioridade = data.comercial.prioridade || lead.prioridade;
          lead.contactado = data.comercial.contactado !== undefined ? data.comercial.contactado : lead.contactado;
          lead.observacoes = data.comercial.observacoes || lead.observacoes;
        }
        lead.data_quiz = new Date();
        lead.ultima_atualizacao = new Date();
        await lead.save();
        return lead;
      } catch (error) {
        return this.updateLeadJSON(id, data);
      }
    }
    return this.updateLeadJSON(id, data);
  }

  updateLeadJSON(id, data) {
    const leads = this.getAllLeadsJSON();
    const index = leads.findIndex(l => l.id === id);
    if (index === -1) throw new Error('Lead não encontrado');
    
    leads[index] = { ...leads[index], ...data, ultima_atualizacao: new Date().toISOString() };
    fs.writeFileSync(this.leadsPath, JSON.stringify(leads, null, 2));
    return leads[index];
  }

  async updateLeadStatus(id, status, observacoes = '') {
    if (this.usePostgres) {
      try {
        const lead = await LeadModel.findOne({ where: { id } });
        if (!lead) throw new Error('Lead não encontrado');
        lead.status = status;
        lead.contactado = status !== 'novo';
        if (observacoes) lead.observacoes = observacoes;
        lead.ultima_atualizacao = new Date();
        await lead.save();
        return lead;
      } catch (error) {
        return this.updateLeadStatusJSON(id, status, observacoes);
      }
    }
    return this.updateLeadStatusJSON(id, status, observacoes);
  }

  updateLeadStatusJSON(id, status, observacoes = '') {
    const leads = this.getAllLeadsJSON();
    const index = leads.findIndex(l => l.id === id);
    if (index === -1) throw new Error('Lead não encontrado');
    
    leads[index].status = status;
    leads[index].comercial.contactado = status !== 'novo';
    if (observacoes) leads[index].comercial.observacoes = observacoes;
    leads[index].ultima_atualizacao = new Date().toISOString();
    
    fs.writeFileSync(this.leadsPath, JSON.stringify(leads, null, 2));
    return leads[index];
  }

  async deleteLead(id) {
    if (this.usePostgres) {
      try {
        const lead = await LeadModel.findOne({ where: { id } });
        if (!lead) throw new Error('Lead não encontrado');
        await lead.destroy();
        return lead;
      } catch (error) {
        return this.deleteLeadJSON(id);
      }
    }
    return this.deleteLeadJSON(id);
  }

  deleteLeadJSON(id) {
    const leads = this.getAllLeadsJSON();
    const index = leads.findIndex(l => l.id === id);
    if (index === -1) throw new Error('Lead não encontrado');
    const deleted = leads.splice(index, 1);
    fs.writeFileSync(this.leadsPath, JSON.stringify(leads, null, 2));
    return deleted[0];
  }

  async filterLeads(filtros) {
    if (this.usePostgres) {
      try {
        const where = {};
        if (filtros.segmento) where.segmento = filtros.segmento;
        if (filtros.nivel) where.nivel = filtros.nivel;
        if (filtros.status) where.status = filtros.status;
        if (filtros.origem) where.origem = filtros.origem;
        return await LeadModel.findAll({ where, order: [['data_cadastro', 'DESC']] });
      } catch (error) {
        return this.filterLeadsJSON(filtros);
      }
    }
    return this.filterLeadsJSON(filtros);
  }

  filterLeadsJSON(filtros) {
    let leads = this.getAllLeadsJSON();
    if (filtros.segmento) {
      leads = leads.filter(l => l.cliente?.segmento === filtros.segmento);
    }
    if (filtros.nivel) {
      leads = leads.filter(l => l.diagnostico?.nivel === filtros.nivel);
    }
    if (filtros.status) {
      leads = leads.filter(l => l.status === filtros.status);
    }
    if (filtros.origem) {
      leads = leads.filter(l => l.origem === filtros.origem);
    }
    return leads;
  }

  async getStats() {
    if (this.usePostgres) {
      try {
        const leads = await LeadModel.findAll();
        const total = leads.length;
        const quizzesRealizados = leads.filter(l => l.pontuacao_total !== null).length;
        const pontuacoes = leads.filter(l => l.pontuacao_total !== null).map(l => l.pontuacao_total);
        const mediaPontuacao = pontuacoes.length > 0 ? Math.round(pontuacoes.reduce((a, b) => a + b, 0) / pontuacoes.length) : 0;
        const leadsInteressados = leads.filter(l => l.status === 'novo' && l.prioridade === 'alta').length;
        return { total, quizzesRealizados, mediaPontuacao, leadsInteressados };
      } catch (error) {
        return this.getStatsJSON();
      }
    }
    return this.getStatsJSON();
  }

  getStatsJSON() {
    const leads = this.getAllLeadsJSON();
    const total = leads.length;
    const quizzesRealizados = leads.filter(l => l.diagnostico).length;
    const pontuacoes = leads.filter(l => l.diagnostico?.pontuacao_total).map(l => l.diagnostico.pontuacao_total);
    const mediaPontuacao = pontuacoes.length > 0 ? Math.round(pontuacoes.reduce((a, b) => a + b, 0) / pontuacoes.length) : 0;
    const leadsInteressados = leads.filter(l => l.status === 'novo' && l.comercial?.prioridade === 'alta').length;
    return { total, quizzesRealizados, mediaPontuacao, leadsInteressados };
  }
}

module.exports = new LeadService();
