/* ========================================
   DASHBOARD SCRIPT
   ======================================== */

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
        
        allLeads = data.leads || [];
        console.log(`✅ ${allLeads.length} leads carregados`);
        
        atualizarDashboard(allLeads);
        atualizarGraficos(allLeads, currentPeriod);
        document.getElementById('sidebarLeads').textContent = allLeads.length;
    } catch (error) {
        console.error('❌ Erro:', error);
        // Mostrar zeros
        document.getElementById('totalLeads').textContent = '0';
        document.getElementById('totalQuizzes').textContent = '0';
        document.getElementById('mediaPontuacao').textContent = '0';
        document.getElementById('leadsPrioritarios').textContent = '0';
        document.getElementById('receitaPotencial').textContent = '0 MZN';
        document.getElementById('taxaConversao').textContent = '0%';
        document.getElementById('sidebarLeads').textContent = '0';
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
        case 'week': cutoff.setDate(now.getDate() - 7); break;
        case 'month': cutoff.setMonth(now.getMonth() - 1); break;
        case 'year': cutoff.setFullYear(now.getFullYear() - 1); break;
        default: cutoff.setDate(now.getDate() - 7);
    }
    return leads.filter(l => new Date(l.data_cadastro) >= cutoff);
}

// ===== ATUALIZAR DASHBOARD =====
function atualizarDashboard(leads) {
    const total = leads.length;
    const quizzes = leads.filter(l => getPontuacao(l) > 0).length;
    const pontuacoes = leads.map(l => getPontuacao(l)).filter(p => p > 0);
    const media = pontuacoes.length ? Math.round(pontuacoes.reduce((a, b) => a + b, 0) / pontuacoes.length) : 0;
    const prioritarios = leads.filter(l => getPrioridade(l) === 'alta' || getPontuacao(l) > 80).length;
    const clientes = leads.filter(l => l.status === 'cliente').length;
    const taxa = total ? Math.round((clientes / total) * 100) : 0;
    const receita = leads.reduce((acc, l) => {
        const score = getPontuacao(l);
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
        const c = getCategorias(l);
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
        const sol = getNecessidades(l).solucoes || [];
        sol.forEach(s => { if (servMap[s] !== undefined) servMap[s]++; });
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

    // Últimos leads
    const recent = leads.slice(-5).reverse();
    const container = document.getElementById('recentList');
    if (recent.length === 0) {
        container.innerHTML = `<div class="recent-item"><span class="time">--</span><span class="name">Nenhum lead recente</span></div>`;
    } else {
        container.innerHTML = recent.map(l => {
            const tempo = timeAgo(new Date(l.data_cadastro));
            const score = getPontuacao(l);
            const sol = (getNecessidades(l).solucoes || [])[0] || '';
            return `<div class="recent-item">
                        <span class="time">${tempo}</span>
                        <span class="name">${getNome(l)}</span>
                        <span class="score">${score} pts</span>
                        ${sol ? `<span class="tag">${sol}</span>` : ''}
                    </div>`;
        }).join('');
    }

    // Dores
    const dorMap = {};
    leads.forEach(l => {
        const dores = getNecessidades(l).dores || [];
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
    
    const periodMap = {};
    const hoje = new Date();
    let labels = [], valores = [];
    let days = period === 'month' ? 30 : period === 'year' ? 12 : 7;

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(hoje);
        let key, label;
        if (period === 'year') {
            d.setMonth(d.getMonth() - i);
            key = d.toISOString().split('T')[0].slice(0, 7);
            label = d.toLocaleDateString('pt-MZ', { month: 'short', year: 'numeric' });
        } else {
            d.setDate(d.getDate() - i);
            key = d.toISOString().split('T')[0];
            label = d.toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short' });
        }
        periodMap[key] = 0;
        labels.push(label);
        valores.push(0);
    }

    filteredLeads.forEach(l => {
        const d = new Date(l.data_cadastro);
        let key = period === 'year' ? d.toISOString().split('T')[0].slice(0, 7) : d.toISOString().split('T')[0];
        if (periodMap[key] !== undefined) {
            const idx = Object.keys(periodMap).indexOf(key);
            if (idx !== -1) valores[idx]++;
        }
    });

    // Gráfico de barras
    if (chartLeadsPeriodo) chartLeadsPeriodo.destroy();
    const ctx1 = document.getElementById('chartLeadsPeriodo');
    if (ctx1) {
        chartLeadsPeriodo = new Chart(ctx1, {
            type: 'bar',
            data: { labels, datasets: [{ label: 'Leads', data: valores, backgroundColor: 'rgba(139,92,246,0.6)', borderColor: '#8B5CF6', borderWidth: 2, borderRadius: 4 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
        });
    }

    // Funil
    const statusCount = { novo: 0, contactado: 0, reuniao_marcada: 0, proposta_enviada: 0, cliente: 0, perdido: 0 };
    filteredLeads.forEach(l => { if (statusCount[l.status] !== undefined) statusCount[l.status]++; });
    const statusLabels = ['Novos', 'Contactados', 'Reuniões', 'Propostas', 'Clientes', 'Perdidos'];
    const statusData = [statusCount.novo, statusCount.contactado, statusCount.reuniao_marcada, statusCount.proposta_enviada, statusCount.cliente, statusCount.perdido];
    const statusColors = ['#34d399', '#fbbf24', '#fb923c', '#a78bfa', '#34d399', '#f87171'];

    if (chartFunil) chartFunil.destroy();
    const ctx2 = document.getElementById('chartFunil');
    if (ctx2) {
        chartFunil = new Chart(ctx2, {
            type: 'bar',
            data: { labels: statusLabels, datasets: [{ label: 'Leads', data: statusData, backgroundColor: statusColors.map(c => c + '80'), borderColor: statusColors, borderWidth: 2, borderRadius: 4 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }

    // Radar
    const cats = { presencaDigital: 0, gestao: 0, automacao: 0, crescimento: 0, interesse: 0 };
    let countCats = 0;
    filteredLeads.forEach(l => {
        const c = getCategorias(l);
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
                    backgroundColor: 'rgba(139,92,246,0.2)',
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
                plugins: { legend: { display: false } },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 25,
                        ticks: { stepSize: 5, backdropColor: 'transparent' },
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        pointLabels: { font: { size: 10 } }
                    }
                }
            }
        });
    }
}

// ===== RESET =====
async function resetarDados() {
    if (!confirm('⚠️ ATENÇÃO: Isso vai REMOVER TODOS os leads. Continuar?')) return;
    try {
        const btn = document.querySelector('.btn-reset');
        btn.disabled = true;
        btn.innerHTML = '<i class="ph ph-spinner ph-bold ph-spin"></i> Resetando...';
        const response = await fetch(`${API_URL}/admin/reset`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        const data = await response.json();
        if (data.success) {
            alert('✅ Dados removidos!');
            await carregarDados();
        } else {
            alert('❌ Erro: ' + data.error);
        }
    } catch (error) {
        alert('❌ Erro: ' + error.message);
    } finally {
        const btn = document.querySelector('.btn-reset');
        btn.disabled = false;
        btn.innerHTML = '<i class="ph ph-arrow-counter-clockwise ph-bold"></i> Reset';
    }
}

// ===== AUTO-REFRESH =====
setInterval(() => { carregarDados(); }, 30000);

// ===== INICIAR =====
document.addEventListener('DOMContentLoaded', carregarDados);
