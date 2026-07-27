/* ========================================
   SERVIÇO DE CÁLCULO DE ORÇAMENTO
   ======================================== */

class BudgetService {
    constructor() {
        // Preços base por serviço (em MZN)
        this.prices = {
            website: {
                basico: 25000,
                profissional: 45000,
                ecommerce: 65000
            },
            sistema: {
                basico: 35000,
                profissional: 65000,
                enterprise: 95000
            },
            automacao: {
                basico: 20000,
                avancado: 50000
            },
            ia: {
                basico: 50000,
                avancado: 100000
            },
            marketing: {
                basico: 15000,
                avancado: 35000
            }
        };
    }

    calcularOrcamento(lead) {
        const respostas = lead.respostas_quiz || {};
        const diagnostico = lead.diagnostico || {};
        const pontuacao = diagnostico.pontuacao_total || 0;
        const solucoes = diagnostico.necessidades?.solucoes || [];
        
        let orcamento = {
            total: 0,
            detalhes: [],
            recomendacoes: [],
            nivel: 'basico'
        };

        // 1. Website
        if (solucoes.some(s => s.includes('Website') || s.includes('presença online'))) {
            const presenca = respostas.presenca_online || '';
            if (presenca === 'Não possui presença online') {
                orcamento.detalhes.push({
                    servico: 'Website Profissional',
                    valor: this.prices.website.profissional,
                    justificativa: 'Necessidade de presença online'
                });
                orcamento.total += this.prices.website.profissional;
            } else if (presenca === 'Apenas WhatsApp/Facebook') {
                orcamento.detalhes.push({
                    servico: 'Website + SEO',
                    valor: this.prices.website.profissional + 5000,
                    justificativa: 'Presença digital limitada'
                });
                orcamento.total += this.prices.website.profissional + 5000;
            } else {
                orcamento.detalhes.push({
                    servico: 'Website + Estratégia Digital',
                    valor: this.prices.website.profissional + 10000,
                    justificativa: 'Aprimorar estratégia digital'
                });
                orcamento.total += this.prices.website.profissional + 10000;
            }
        }

        // 2. Sistema de Gestão
        if (solucoes.some(s => s.includes('Sistema') || s.includes('gestão'))) {
            const gestao = respostas.gestao_vendas || '';
            if (gestao === 'Papel/caderno' || gestao === 'Excel') {
                orcamento.detalhes.push({
                    servico: 'Sistema de Gestão Básico',
                    valor: this.prices.sistema.basico,
                    justificativa: 'Processos manuais'
                });
                orcamento.total += this.prices.sistema.basico;
            } else if (gestao === 'WhatsApp') {
                orcamento.detalhes.push({
                    servico: 'Sistema de Gestão Profissional',
                    valor: this.prices.sistema.profissional,
                    justificativa: 'Informações dispersas'
                });
                orcamento.total += this.prices.sistema.profissional;
            } else {
                orcamento.detalhes.push({
                    servico: 'Sistema Empresarial',
                    valor: this.prices.sistema.enterprise,
                    justificativa: 'Negócio com sistema próprio'
                });
                orcamento.total += this.prices.sistema.enterprise;
            }
        }

        // 3. Automação
        if (solucoes.some(s => s.includes('Automação') || s.includes('automatizar'))) {
            const tempo = respostas.tempo_repetitivo || '';
            if (tempo === 'Muitas horas') {
                orcamento.detalhes.push({
                    servico: 'Automação Avançada',
                    valor: this.prices.automacao.avancado,
                    justificativa: 'Muitas horas em tarefas repetitivas'
                });
                orcamento.total += this.prices.automacao.avancado;
            } else if (tempo === 'Algumas horas por semana') {
                orcamento.detalhes.push({
                    servico: 'Automação Básica',
                    valor: this.prices.automacao.basico,
                    justificativa: 'Tarefas repetitivas semanais'
                });
                orcamento.total += this.prices.automacao.basico;
            }
        }

        // 4. IA (Inteligência Artificial)
        if (solucoes.some(s => s.includes('IA') || s.includes('inteligência'))) {
            if (pontuacao > 70) {
                orcamento.detalhes.push({
                    servico: 'IA Avançada',
                    valor: this.prices.ia.avancado,
                    justificativa: 'Negócio com alta maturidade digital'
                });
                orcamento.total += this.prices.ia.avancado;
            } else {
                orcamento.detalhes.push({
                    servico: 'IA Básica',
                    valor: this.prices.ia.basico,
                    justificativa: 'Iniciando com IA'
                });
                orcamento.total += this.prices.ia.basico;
            }
        }

        // 5. Marketing Digital
        if (solucoes.some(s => s.includes('Marketing') || s.includes('clientes'))) {
            const desafios = respostas.desafios || [];
            if (desafios.includes('Atrair clientes')) {
                orcamento.detalhes.push({
                    servico: 'Marketing Digital Avançado',
                    valor: this.prices.marketing.avancado,
                    justificativa: 'Dificuldade em atrair clientes'
                });
                orcamento.total += this.prices.marketing.avancado;
            } else {
                orcamento.detalhes.push({
                    servico: 'Marketing Digital Básico',
                    valor: this.prices.marketing.basico,
                    justificativa: 'Presença digital limitada'
                });
                orcamento.total += this.prices.marketing.basico;
            }
        }

        // Determinar nível do orçamento
        if (orcamento.total > 100000) {
            orcamento.nivel = 'enterprise';
            orcamento.recomendacoes.push('Plano Enterprise - Soluções completas');
        } else if (orcamento.total > 50000) {
            orcamento.nivel = 'profissional';
            orcamento.recomendacoes.push('Plano Profissional - Soluções integradas');
        } else if (orcamento.total > 20000) {
            orcamento.nivel = 'basico';
            orcamento.recomendacoes.push('Plano Básico - Soluções essenciais');
        } else {
            orcamento.nivel = 'start';
            orcamento.recomendacoes.push('Plano Start - Primeiros passos');
        }

        if (orcamento.total > 0) {
            orcamento.recomendacoes.push(`Orçamento total estimado: ${orcamento.total.toLocaleString('pt-MZ')} MZN`);
        }

        return orcamento;
    }

    // Calcular orçamento para múltiplos leads (estatísticas)
    calcularEstatisticasOrcamento(leads) {
        let totalOrcamento = 0;
        let count = 0;
        const niveis = { start: 0, basico: 0, profissional: 0, enterprise: 0 };

        leads.forEach(lead => {
            if (lead.diagnostico) {
                const orcamento = this.calcularOrcamento(lead);
                totalOrcamento += orcamento.total;
                count++;
                if (orcamento.nivel) {
                    niveis[orcamento.nivel] = (niveis[orcamento.nivel] || 0) + 1;
                }
            }
        });

        return {
            totalOrcamento,
            media: count > 0 ? Math.round(totalOrcamento / count) : 0,
            count,
            niveis
        };
    }
}

module.exports = new BudgetService();
