/* ========================================
   DASHBOARD SCRIPT
   ======================================== */

let allLeads = [];
let currentPeriod = 'week';
let chartLeadsPeriodo = null;
let chartFunil = null;
let chartRadar = null;

async function carregarDados() {
    try {
        const res = await fetch(`${API_URL}/leads`);
        const data = await res.json();
        allLeads = data.leads || [];
        atualizarDashboard(allLeads);
        atualizarGraficos(allLeads, currentPeriod);
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

function setPeriod(period) {
    currentPeriod = period;
    document.querySelectorAll('.btn-period').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.period === period);
    });
    atualizarGraficos(allLeads, period);
}

function filtrarPorPeriodo(leads, period) {
    const now = new Date();
    let cutoff = new Date(now);
    
    switch(period) {
        case 'week':
            cutoff.setDate(now.getDate() - 7);
            break;
        case 'month':
            cutoff.setMonth(now.getMonth() - 1);
            break;
        case 'year':
            cutoff.setFullYear(now.getFullYear() - 1);
            break;
        default:
            cutoff.setDate(now.getDate() - 7);
    }
    
    return leads.filter(l => new Date(l.data_cadastro) >= cutoff);
}

function atualizarDashboard(leads) {
    const total = leads.length;
    const quizzes = leads.filter(l => l.diagnostico).length;
    const pontuacoes = leads.map(l => l.diagnostico?.pontuacao_total || 0);
    const media = pontuacoes.length ? Math.round(pontuacoes.reduce((a, b) => a + b, 0) / pontuacoes.length) : 0;
    const prioritarios = leads.filter(l => l.comercial?.prioridade === 'alta' || (l.diagnostico?.pontuacao_total || 0) > 80).length;
    const clientes = leads.filter(l => l.status === 'cliente').length;
    const taxa = total ? Math.round((clientes / total) * 100) : 0;
    const receita = leads.reduce((acc, l) => {
        const score = l.diagnostico?.pontuacao_total || 0;
        if (score > 70) acc += 50000;
        else if (score > 40) acc += 25000;
        else acc += 10000;
        return acc;
    }, 0);

    document.getElementById('totalLeads').textContent = total;
    document.getElementById('totalQuizzes').textContent = quizzes;
    document.getElementById('mediaPontuacao').textContent = media;
    document.getElementById('leadsPrioritarios').textContent = prioritarios;
    document.getElementById('receitaPotencial').textContent = receita.toLocaleString('pt-MZ') + ' MZN';
    document.getElementById('taxaConversao').textContent = taxa + '%';
    document.getElementById('sidebarLeads').textContent = total;

    // Funil
    const statusCount = { novo: 0, contactado: 0, reuniao_marcada: 0, proposta_enviada: 0, cliente: 0, perdido: 0 };
    leads.forEach(l => { if (statusCount[l.status] !== undefined) statusCount[l.status]++; });
    document.getElementById('fNovo').textContent = statusCount.novo;
    document.getElementById('fContactado').textContent = statusCount.contactado;
    document.getElementById('fReuniao').textContent = statusCount.reuniao_marcada;
    document.getElementById('fProposta').textContent = statusCount.proposta_enviada;
    document.getElementById('fCliente').textContent = statusCount.cliente;
    document.getElementById('fPerdido').textContent = statusCount.perdido;

    // Score por categoria
    const cats = { presencaDigital: 0, gestao: 0, automacao: 0, crescimento: 0, interesse: 0 };
    let countCats = 0;
    leads.forEach(l => {
        if (l.diagnostico?.categorias) {
            const c = l.diagnostico.categorias;
            cats.presencaDigital += c.presencaDigital || 0;
            cats.gestao += c.gestao || 0;
            cats.automacao += c.automacao || 0;
            cats.crescimento += c.crescimento || 0;
            cats.interesse += c.interesse || 0;
            countCats++;
        }
    });
    if (countCats > 0) {
        document.getElementById('sPresenca').textContent = Math.round(cats.presencaDigital / countCats);
        document.getElementById('sGestao').textContent = Math.round(cats.gestao / countCats);
        document.getElementById('sAutomacao').textContent = Math.round(cats.automacao / countCats);
        document.getElementById('sCrescimento').textContent = Math.round(cats.crescimento / countCats);
        document.getElementById('sInteresse').textContent = Math.round(cats.interesse / countCats);
    }

    // Serviços
    const servMap = { 'Website profissional': 0, 'Sistema de gestão': 0, 'Automação': 0, 'IA': 0, 'Loja online': 0 };
    leads.forEach(l => {
        const sol = l.diagnostico?.necessidades?.solucoes || [];
        sol.forEach(s => {
            if (servMap[s] !== undefined) servMap[s]++;
        });
    });
    const maxServ = Math.max(...Object.values(servMap), 1);
    document.getElementById('servWebsite').textContent = servMap['Website profissional'];
    document.getElementById('servSistema').textContent = servMap['Sistema de gestão'];
    document.getElementById('servAutomacao').textContent = servMap['Automação'];
    document.getElementById('servIA').textContent = servMap['IA'];
    document.getElementById('servLoja').textContent = servMap['Loja online'];
    document.querySelector('#servicosRank .rank-item:nth-child(1) .fill').style.width = (servMap['Website profissional'] / maxServ * 100) + '%';
    document.querySelector('#servicosRank .rank-item:nth-child(2) .fill').style.width = (servMap['Sistema de gestão'] / maxServ * 100) + '%';
    document.querySelector('#servicosRank .rank-item:nth-child(3) .fill').style.width = (servMap['Automação'] / maxServ * 100) + '%';
    document.querySelector('#servicosRank .rank-item:nth-child(4) .fill').style.width = (servMap['IA'] / maxServ * 100) + '%';
    document.querySelector('#servicosRank .rank-item:nth-child(5) .fill').style.width = (servMap['Loja online'] / maxServ * 100) + '%';

    // Últimos leads (5)
    const recent = leads.slice(-5).reverse();
    const container = document.getElementById('recentList');
    if (recent.length === 0) {
        container.innerHTML = `<div class="recent-item"><span class="time">--</span><span class="name">Nenhum lead recente</span></div>`;
    } else {
        container.innerHTML = recent.map(l => {
            const tempo = timeAgo(new Date(l.data_cadastro));
            const score = l.diagnostico?.pontuacao_total || 0;
            const sol = (l.diagnostico?.necessidades?.solucoes || [])[0] || '';
            return `<div class="recent-item">
                        <span class="time">${tempo}</span>
                        <span class="name">${l.cliente?.nome || 'N/A'}</span>
                        <span class="score">${score} pts</span>
                        ${sol ? `<span class="tag">${sol}</span>` : ''}
                    </div>`;
        }).join('');
    }

    // Dores frequentes
    const dorMap = {};
    leads.forEach(l => {
        const dores = l.diagnostico?.necessidades?.dores || [];
        dores.forEach(d => { dorMap[d] = (dorMap[d] || 0) + 1; });
    });
    const sortedDores = Object.entries(dorMap).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const dorContainer = document.getElementById('doresFrequentes');
    if (sortedDores.length === 0) {
        dorContainer.innerHTML = '<span style="color:rgba(255,255,255,0.3); font-size:0.8rem;">Nenhum dado ainda</span>';
    } else {
        dorContainer.innerHTML = sortedDores.map(([dor, count]) =>
            `<span class="tag-dor">${dor} <strong>${count}</strong></span>`
        ).join('');
    }
}

function atualizarGraficos(leads, period) {
    const filteredLeads = filtrarPorPeriodo(leads, period);
    
    // 1. Leads por período
    const periodMap = {};
    const hoje = new Date();
    let labels = [];
    let valores = [];

    switch(period) {
        case 'week':
            for (let i = 6; i >= 0; i--) {
                const d = new Date(hoje);
                d.setDate(d.getDate() - i);
                const key = d.toISOString().split('T')[0];
                const label = d.toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short' });
                periodMap[key] = 0;
                labels.push(label);
                valores.push(0);
            }
            break;
        case 'month':
            for (let i = 29; i >= 0; i--) {
                const d = new Date(hoje);
                d.setDate(d.getDate() - i);
                const key = d.toISOString().split('T')[0];
                const label = d.toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short' });
                periodMap[key] = 0;
                labels.push(label);
                valores.push(0);
            }
            break;
        case 'year':
            for (let i = 11; i >= 0; i--) {
                const d = new Date(hoje);
                d.setMonth(d.getMonth() - i);
                const key = d.toISOString().split('T')[0].slice(0, 7);
                const label = d.toLocaleDateString('pt-MZ', { month: 'short', year: 'numeric' });
                periodMap[key] = 0;
                labels.push(label);
                valores.push(0);
            }
            break;
        default:
            for (let i = 6; i >= 0; i--) {
                const d = new Date(hoje);
                d.setDate(d.getDate() - i);
                const key = d.toISOString().split('T')[0];
                const label = d.toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short' });
                periodMap[key] = 0;
                labels.push(label);
                valores.push(0);
            }
    }

    filteredLeads.forEach(l => {
        const d = new Date(l.data_cadastro);
        let key;
        if (period === 'year') {
            key = d.toISOString().split('T')[0].slice(0, 7);
        } else {
            key = d.toISOString().split('T')[0];
        }
        if (periodMap[key] !== undefined) {
            const idx = Object.keys(periodMap).indexOf(key);
            if (idx !== -1) valores[idx]++;
        }
    });

    if (chartLeadsPeriodo) chartLeadsPeriodo.destroy();
    const ctx1 = document.getElementById('chartLeadsPeriodo').getContext('2d');
    chartLeadsPeriodo = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Leads',
                data: valores,
                backgroundColor: 'rgba(139, 92, 246, 0.6)',
                borderColor: '#8B5CF6',
                borderWidth: 2,
                borderRadius: 4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.parsed.y + ' leads';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1, color: 'rgba(255,255,255,0.3)' },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                },
                x: {
                    ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 9 } },
                    grid: { display: false }
                }
            }
        }
    });

    // 2. Funil de Vendas
    const statusColorsArray = ['#34d399', '#fbbf24', '#fb923c', '#a78bfa', '#34d399', '#f87171'];
    const statusCount = { novo: 0, contactado: 0, reuniao_marcada: 0, proposta_enviada: 0, cliente: 0, perdido: 0 };
    filteredLeads.forEach(l => { if (statusCount[l.status] !== undefined) statusCount[l.status]++; });
    const statusLabels = ['Novos', 'Contactados', 'Reuniões', 'Propostas', 'Clientes', 'Perdidos'];
    const statusData = [statusCount.novo, statusCount.contactado, statusCount.reuniao_marcada, statusCount.proposta_enviada, statusCount.cliente, statusCount.perdido];

    if (chartFunil) chartFunil.destroy();
    const ctx2 = document.getElementById('chartFunil').getContext('2d');
    chartFunil = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: statusLabels,
            datasets: [{
                label: 'Leads',
                data: statusData,
                backgroundColor: statusColorsArray.map(c => c + '80'),
                borderColor: statusColorsArray,
                borderWidth: 2,
                borderRadius: 4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.parsed.y + ' leads';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1, color: 'rgba(255,255,255,0.3)' },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                },
                x: {
                    ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 10 } },
                    grid: { display: false }
                }
            }
        }
    });

    // 3. Radar - Score por categoria
    const cats = { presencaDigital: 0, gestao: 0, automacao: 0, crescimento: 0, interesse: 0 };
    let countCats = 0;
    filteredLeads.forEach(l => {
        if (l.diagnostico?.categorias) {
            const c = l.diagnostico.categorias;
            cats.presencaDigital += c.presencaDigital || 0;
            cats.gestao += c.gestao || 0;
            cats.automacao += c.automacao || 0;
            cats.crescimento += c.crescimento || 0;
            cats.interesse += c.interesse || 0;
            countCats++;
        }
    });
    const radarLabels = ['Presença', 'Gestão', 'Automação', 'Crescimento', 'Interesse'];
    const radarData = countCats > 0 ? [
        Math.round(cats.presencaDigital / countCats),
        Math.round(cats.gestao / countCats),
        Math.round(cats.automacao / countCats),
        Math.round(cats.crescimento / countCats),
        Math.round(cats.interesse / countCats)
    ] : [0, 0, 0, 0, 0];
    const maxValues = [25, 25, 20, 20, 10];

    if (chartRadar) chartRadar.destroy();
    const ctx3 = document.getElementById('chartRadar').getContext('2d');
    chartRadar = new Chart(ctx3, {
        type: 'radar',
        data: {
            labels: radarLabels,
            datasets: [{
                label: 'Score Médio',
                data: radarData,
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                borderColor: '#8B5CF6',
                borderWidth: 2,
                pointBackgroundColor: '#8B5CF6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const max = maxValues[context.dataIndex];
                            return context.parsed.r + ' / ' + max;
                        }
                    }
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 25,
                    ticks: { color: 'rgba(255,255,255,0.3)', stepSize: 5, backdropColor: 'transparent' },
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    angleLines: { color: 'rgba(255,255,255,0.05)' },
                    pointLabels: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } }
                }
            }
        }
    });
}

// ===== FUNÇÃO DE RESET (LIMPAR TUDO) =====
async function resetarDados() {
    if (!confirm('⚠️ ATENÇÃO: Isso vai REMOVER TODOS os leads permanentemente. Continuar?')) {
        return;
    }
    
    try {
        const btn = document.querySelector('.btn-reset');
        btn.disabled = true;
        btn.innerHTML = '<i class="ph ph-spinner ph-bold ph-spin"></i> Resetando...';
        
        console.log('📤 Enviando requisição de reset...');
        
        const response = await fetch(`${API_URL}/admin/reset`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        console.log('📥 Resposta:', data);
        
        if (data.success) {
            alert('✅ Todos os dados foram removidos com sucesso!\n\nO sistema está limpo para novos leads.');
            // Recarregar dados
            await carregarDados();
        } else {
            alert('❌ Erro ao resetar: ' + (data.error || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('❌ Erro ao resetar:', error);
        alert('❌ Erro ao resetar dados: ' + error.message);
    } finally {
        const btn = document.querySelector('.btn-reset');
        btn.disabled = false;
        btn.innerHTML = '<i class="ph ph-arrow-counter-clockwise ph-bold"></i> Reset';
    }
}

function filtrarPorStatus(status) {
    window.location.href = '/admin/leads.html?status=' + status;
}

function verTodosStatus() {
    window.location.href = '/admin/leads.html';
}

// Iniciar
document.addEventListener('DOMContentLoaded', carregarDados);

// ===== AUTO REFRESH =====
// Recarregar dados a cada 30 segundos
setInterval(() => {
    console.log('🔄 Auto-refresh...');
    carregarDados();
}, 30000);
