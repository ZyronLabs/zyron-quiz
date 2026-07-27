const axios = require('axios');
const fs = require('fs');
const path = require('path');

class WebhookService {
  constructor() {
    this.webhookSecret = process.env.CHEGOU_WEBHOOK_SECRET || '';
    this.webhookUrl = this.webhookSecret 
      ? `https://api.chegou.dev/v1/${this.webhookSecret}`
      : null;
    this.logPath = path.join(__dirname, '../logs/notifications.json');
    this.maxRetries = 2;
    this.enabled = true;
    this.frontendUrl = process.env.FRONTEND_URL || 'https://zyron-quiz.onrender.com';
    
    if (this.webhookUrl && this.enabled) {
      console.log(`✅ Webhook configurado`);
    } else {
      console.log('⚠️ Webhook desabilitado');
    }
  }

  async enviarDados(leadData) {
    if (!this.enabled || !this.webhookUrl) {
      console.log('ℹ️ Webhook desabilitado');
      return { success: false, error: 'Webhook não configurado' };
    }

    let tentativa = 0;
    let ultimoErro = null;

    while (tentativa < this.maxRetries) {
      try {
        console.log(`📤 Enviando webhook (tentativa ${tentativa + 1}/${this.maxRetries})...`);
        
        const payload = this.montarPayload(leadData);

        const response = await axios.post(this.webhookUrl, payload, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });

        console.log(`✅ Webhook enviado! Status: ${response.status}`);
        this.registrarLog({
          evento: 'push_success',
          lead_id: leadData.id,
          status: response.status,
          timestamp: new Date().toISOString()
        });

        return { success: true, status: response.status };

      } catch (error) {
        ultimoErro = error;
        tentativa++;
        
        if (error.response) {
          console.error(`❌ HTTP ${error.response.status}:`, error.response.data);
        } else {
          console.error(`❌ Tentativa ${tentativa} falhou:`, error.message);
        }
        
        if (tentativa < this.maxRetries) {
          console.log(`⏳ Aguardando 2 segundos...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    this.registrarLog({
      evento: 'push_failed',
      lead_id: leadData.id,
      tentativas: this.maxRetries,
      erro: ultimoErro ? ultimoErro.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    });

    console.error(`❌ Webhook falhou após ${this.maxRetries} tentativas`);
    return { 
      success: false, 
      error: 'Falha após todas as tentativas'
    };
  }

  montarPayload(leadData) {
    const cliente = leadData.cliente || {};
    const diagnostico = leadData.diagnostico || {};
    const necessidades = diagnostico.necessidades || {};
    const orcamento = leadData.orcamento || {};
    
    const nome = cliente.nome || 'Lead';
    const empresa = cliente.empresa || '';
    const whatsapp = cliente.whatsapp || '';
    const segmento = cliente.segmento || '';
    
    const pontuacao = diagnostico.pontuacao_total || diagnostico.pontuacao || 0;
    const nivel = diagnostico.nivel || 'Não avaliado';
    const orcamentoTotal = orcamento.total || 0;
    const orcamentoNivel = orcamento.nivel || 'basico';
    
    const dores = necessidades.dores || [];
    const solucoes = necessidades.solucoes || [];

    const canal = this.determinarCanal(segmento, pontuacao, solucoes);
    const prioridade = this.determinarPrioridade(pontuacao, orcamentoTotal);

    let message = `👤 ${nome}`;
    if (empresa) message += ` | ${empresa}`;
    if (segmento) message += ` | ${segmento}`;
    message += `\n\n📊 ${pontuacao} pts · ${nivel}`;
    message += `\n💰 Orçamento: ${orcamentoTotal.toLocaleString('pt-MZ')} MZN (${orcamentoNivel})`;
    
    if (solucoes.length > 0) {
      message += `\n🎯 Interesse: ${solucoes.slice(0, 3).join(', ')}`;
      if (solucoes.length > 3) message += ` +${solucoes.length - 3}`;
    }
    
    if (dores.length > 0) {
      message += `\n⚠️ Dores: ${dores.slice(0, 2).join(', ')}`;
      if (dores.length > 2) message += ` +${dores.length - 2}`;
    }

    message += `\n\n📌 Canal: ${canal}`;
    message += `\n🔴 Prioridade: ${prioridade}`;

    const actions = [];
    actions.push({
      label: "👤 Ver Lead",
      url: `${this.frontendUrl}/admin/dashboard.html`
    });
    
    if (whatsapp) {
      const numeroLimpo = whatsapp.replace(/\s/g, '').replace(/^\+/, '');
      actions.push({
        label: "💬 WhatsApp",
        url: `https://wa.me/${numeroLimpo}`
      });
    }

    if (orcamentoTotal > 50000) {
      actions.push({
        label: "💰 Ver Orçamento",
        url: `${this.frontendUrl}/admin/leads.html`
      });
    }

    return {
      title: `🟣 ${canal} - ${nome}`,
      subtitle: `${nivel} · ${pontuacao} pts · ${prioridade}`,
      message: message,
      sound: "success",
      channel: canal.toLowerCase().replace(/\s/g, '_'),
      interruption: "time-sensitive",
      open_url: `${this.frontendUrl}/admin/dashboard.html`,
      image_url: "https://via.placeholder.com/200x200/8B5CF6/FFFFFF?text=ZL",
      actions: actions,
      lead: {
        id: leadData.id,
        nome: nome,
        empresa: empresa,
        segmento: segmento,
        whatsapp: whatsapp,
        pontuacao: pontuacao,
        nivel: nivel,
        orcamento: orcamentoTotal,
        prioridade: prioridade,
        canal: canal
      }
    };
  }

  determinarCanal(segmento, pontuacao, solucoes) {
    const canalMap = {
      'Restaurante': 'Gastronomia',
      'Clínica': 'Saúde',
      'Escola': 'Educação',
      'Loja': 'Comércio',
      'Serviços': 'Serviços',
      'Outro': 'Geral'
    };

    let canal = canalMap[segmento] || 'Geral';

    if (pontuacao > 70) {
      canal = 'Tech Avançado';
    } else if (pontuacao > 40) {
      canal = 'Digitalização';
    }

    if (solucoes.some(s => s.includes('IA') || s.includes('Automação'))) {
      canal = 'Automação & IA';
    }

    return canal;
  }

  determinarPrioridade(pontuacao, orcamento) {
    if (pontuacao > 70 && orcamento > 50000) return '🔥 MUITO ALTA';
    if (pontuacao > 60 || orcamento > 30000) return '⚡ ALTA';
    if (pontuacao > 40) return '📌 MÉDIA';
    return '💤 BAIXA';
  }

  registrarLog(dados) {
    try {
      const dir = path.dirname(this.logPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      let logs = [];
      if (fs.existsSync(this.logPath)) {
        try {
          const content = fs.readFileSync(this.logPath, 'utf8');
          logs = JSON.parse(content);
        } catch (e) {
          logs = [];
        }
      }
      
      logs.push(dados);
      if (logs.length > 1000) logs = logs.slice(-1000);
      
      fs.writeFileSync(this.logPath, JSON.stringify(logs, null, 2));
    } catch (error) {
      // Silenciar erro de log para não atrapalhar
    }
  }

  getLogs(limite = 50) {
    try {
      if (fs.existsSync(this.logPath)) {
        const content = fs.readFileSync(this.logPath, 'utf8');
        return JSON.parse(content).slice(-limite);
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  async testarWebhook() {
    console.log('🧪 Testando webhook...');
    const testData = {
      id: 'test_' + Date.now(),
      status: 'teste',
      data_cadastro: new Date().toISOString(),
      cliente: {
        nome: 'João Manuel',
        empresa: 'Restaurante Sabores',
        whatsapp: '+258846790902',
        email: 'joao@email.com',
        segmento: 'Restaurante'
      },
      diagnostico: {
        pontuacao_total: 65,
        nivel: 'Intermediário',
        descricao: 'Teste',
        necessidades: {
          dores: ['Pouca presença online', 'Processos manuais'],
          solucoes: ['Website profissional', 'Sistema de gestão']
        }
      },
      orcamento: {
        total: 45000,
        nivel: 'profissional'
      },
      comercial: {
        prioridade: 'alta',
        contactado: false,
        observacoes: ''
      }
    };

    return await this.enviarDados(testData);
  }
}

module.exports = new WebhookService();
