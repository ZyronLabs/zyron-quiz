const API_URL = 'https://zyron-quiz.onrender.com/api';
let allLeads = [];
let currentPeriod = 'week';
let chartLeadsPeriodo = null;
let chartFunil = null;
let chartRadar = null;

// ===== CARREGAR DADOS =====
async function carregarDados() {
    try {
        console.log('🔄 Carregando dados...');
        const res = await fetch(`${API_URL}/leads`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        console.log('📊 Dados recebidos:', data);
        
        // Verificar se os leads estão no formato correto
        if (data.leads) {
            allLeads = data.leads;
        } else if (Array.isArray(data)) {
            allLeads = data;
        } else {
            allLeads = [];
        }
        
        console.log(`✅ ${allLeads.length} leads carregados`);
        atualizarDashboard(allLeads);
        atualizarGraficos(allLeads, currentPeriod);
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
    }
}

// ===== FUNÇÃO PARA OBTER NOME DO LEAD (compatível com ambos formatos) =====
function getLeadNome(lead) {
    if (lead.nome) return lead.nome;
    if (lead.cliente && lead.cliente.nome) return lead.cliente.nome;
    return 'N/A';
}

function getLeadEmpresa(lead) {
    if (lead.empresa) return lead.empresa;
    if (lead.cliente && lead.cliente.empresa) return lead.cliente.empresa;
    return '';
}

function getLeadWhatsapp(lead) {
    if (lead.whatsapp) return lead.whatsapp;
    if (lead.cliente && lead.cliente.whatsapp) return lead.cliente.whatsapp;
    return '';
}

function getLeadSegmento(lead) {
    if (lead.segmento) return lead.segmento;
    if (lead.cliente && lead.cliente.segmento) return lead.cliente.segmento;
    return '';
}

function getLeadPontuacao(lead) {
    if (lead.pontuacao_total !== undefined && lead.pontuacao_total !== null) return lead.pontuacao_total;
    if (lead.diagnostico && lead.diagnostico.pontuacao_total !== undefined) return lead.diagnostico.pontuacao_total;
    return 0;
}

function getLeadNivel(lead) {
    if (lead.nivel) return lead.nivel;
    if (lead.diagnostico && lead.diagnostico.nivel) return lead.diagnostico.nivel;
    return 'N/A';
}

function getLeadCategorias(lead) {
    if (lead.categorias) return lead.categorias;
    if (lead.diagnostico && lead.diagnostico.categorias) return lead.diagnostico.categorias;
    return null;
}

function getLeadNecessidades(lead) {
    if (lead.necessidades) return lead.necessidades;
    if (lead.diagnostico && lead.diagnostico.necessidades) return lead.diagnostico.necessidades;
    return { dores: [], solucoes: [] };
}

function getLeadPrioridade(lead) {
    if (lead.prioridade) return lead.prioridade;
    if (lead.comercial && lead.comercial.prioridade) return lead.comercial.prioridade;
    return 'media';
}

// ===== SET PERIOD =====
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

// ===== ATUALIZAR DASHBOARD =====
function atualizarDashboard(leads) {
    const total = leads.length;
    const quizzes = leads.filter(l => getLeadPontuacao(l) > 0).length;
    const pontuacoes = leads.map(l => getLeadPontuacao(l));
    const media = pontuacoes.length ? Math.round(pontuacoes.reduce((a, b) => a + b, 0) / pontuacoes.length) : 0;
    const prioritarios = leads.filter(l => getLeadPrioridade(l) === 'alta' || getLeadPontuacao(l) > 80).length;
    const clientes = leads.filter(l => l.status === 'cliente').length;
    const taxa = total ? Math.round((clientes / total) * 100) : 0;
    const receita = leads.reduce((acc, l) => {
        const score = getLeadPontuacao(l);
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
        const c = getLeadCategorias(l);
        if (c) {
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
        const sol = getLeadNecessidades(l).solucoes || [];
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
    
    const fills = document.querySelectorAll('#servicosRank .rank-item .fill');
    if (fills.length >= 5) {
        fills[0].style.width = (servMap['Website profissional'] / maxServ * 100) + '%';
        fills[1].style.width = (servMap['Sistema de gestão'] / maxServ * 100) + '%';
        fills[2].style.width = (servMap['Automação'] / maxServ * 100) + '%';
        fills[3].style.width = (servMap['IA'] / maxServ * 100) + '%';
        fills[4].style.width = (servMap['Loja online'] / maxServ * 100) + '%';
    }

    // Últimos leads (5)
    const recent = leads.slice(-5).reverse();
    const container = document.getElementById('recentList');
    if (recent.length === 0) {
        container.innerHTML = `<div class="recent-item"><span class="time">--</span><span class="name">Nenhum lead recente</span></div>`;
    } else {
        container.innerHTML = recent.map(l => {
            const tempo = timeAgo(new Date(l.data_cadastro));
            const score = getLeadPontuacao(l);
            const sol = (getLeadNecessidades(l).solucoes || [])[0] || '';
            return `<div class="recent-item">
                        <span class="time">${tempo}</span>
                        <span class="name">${getLeadNome(l)}</span>
                        <span class="score">${score} pts</span>
                        ${sol ? `<span class="tag">${sol}</span>` : ''}
                    </div>`;
        }).join('');
    }

    // Dores frequentes
    const dorMap = {};
    leads.forEach(l => {
        const dores = getLeadNecessidades(l).dores || [];
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

// ===== GRÁFICOS =====
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
    const ctx1 = document.getElementById('chartLeadsPeriodo');
    if (ctx1) {
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
    }

    // 2. Funil de Vendas
    const statusColorsArray = ['#34d399', '#fbbf24', '#fb923c', '#a78bfa', '#34d399', '#f87171'];
    const statusCount = { novo: 0, contactado: 0, reuniao_marcada: 0, proposta_enviada: 0, cliente: 0, perdido: 0 };
    filteredLeads.forEach(l => { if (statusCount[l.status] !== undefined) statusCount[l.status]++; });
    const statusLabels = ['Novos', 'Contactados', 'Reuniões', 'Propostas', 'Clientes', 'Perdidos'];
    const statusData = [statusCount.novo, statusCount.contactado, statusCount.reuniao_marcada, statusCount.proposta_enviada, statusCount.cliente, statusCount.perdido];

    if (chartFunil) chartFunil.destroy();
    const ctx2 = document.getElementById('chartFunil');
    if (ctx2) {
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
    }

    // 3. Radar
    const cats = { presencaDigital: 0, gestao: 0, automacao: 0, crescimento: 0, interesse: 0 };
    let countCats = 0;
    filteredLeads.forEach(l => {
        const c = getLeadCategorias(l);
        if (c) {
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
    const ctx3 = document.getElementById('chartRadar');
    if (ctx3) {
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
}

// ===== TIME AGO =====
function timeAgo(date) {
    const diff = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diff < 1) return 'agora';
    if (diff < 60) return diff + ' min';
    if (diff < 1440) return Math.floor(diff / 60) + ' h';
    return Math.floor(diff / 1440) + ' d';
}

// ===== FILTROS =====
function filtrarPorStatus(status) {
    window.location.href = '/admin/leads.html?status=' + status;
}

function verTodosStatus() {
    window.location.href = '/admin/leads.html';
}

// ===== THEME =====
function toggleTheme() {
    const body = document.body;
    const thumb = document.getElementById('themeThumb');
    if (body.classList.contains('dark-theme')) {
        body.classList.remove('dark-theme');
        body.classList.add('white-theme');
        localStorage.setItem('theme', 'white');
        thumb.innerHTML = '<i class="ph ph-sun ph-bold"></i>';
    } else {
        body.classList.remove('white-theme');
        body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
        thumb.innerHTML = '<i class="ph ph-moon ph-bold"></i>';
    }
}

function loadTheme() {
    const saved = localStorage.getItem('theme') || 'dark';
    const body = document.body;
    const thumb = document.getElementById('themeThumb');
    if (saved === 'white') {
        body.classList.add('white-theme');
        body.classList.remove('dark-theme');
        if (thumb) thumb.innerHTML = '<i class="ph ph-sun ph-bold"></i>';
    } else {
        body.classList.add('dark-theme');
        body.classList.remove('white-theme');
        if (thumb) thumb.innerHTML = '<i class="ph ph-moon ph-bold"></i>';
    }
}

// ===== LOGOUT =====
function logout() {
    localStorage.removeItem('adminLoggedIn');
    window.location.href = '/admin/login.html';
}

// ===== RESET =====
async function resetarDados() {
    if (!confirm('⚠️ ATENÇÃO: Isso vai REMOVER TODOS os leads permanentemente. Continuar?')) {
        return;
    }
    try {
        const btn = document.querySelector('.btn-reset');
        btn.disabled = true;
        btn.innerHTML = '<i class="ph ph-spinner ph-bold ph-spin"></i> Resetando...';
        const response = await fetch(`${API_URL}/admin/reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (data.success) {
            alert('✅ Todos os dados foram removidos com sucesso!');
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

// ===== AUTO-REFRESH =====
let refreshInterval = setInterval(() => {
    console.log('🔄 Auto-refresh...');
    carregarDados();
}, 30000);

document.addEventListener('click', () => {
    clearInterval(refreshInterval);
    refreshInterval = setInterval(() => {
        console.log('🔄 Auto-refresh...');
        carregarDados();
    }, 30000);
});

// ===== INICIAR =====
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    carregarDados();
});
