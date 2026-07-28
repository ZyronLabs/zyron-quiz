/* ========================================
   ANALYTICS SCRIPT
   ======================================== */

let chartSegmentos = null;
let chartOrigens = null;
let allLeads = [];

async function carregarAnalytics() {
    try {
        const res = await fetch(`${API_URL}/leads`);
        const data = await res.json();
        allLeads = data.leads || [];
        atualizarAnalytics(allLeads);
    } catch (e) {
        console.error(e);
    }
}

function atualizarAnalytics(leads) {
    // Segmentos
    const segMap = {};
    leads.forEach(l => {
        const s = getSegmento(l) || 'Outro';
        segMap[s] = (segMap[s] || 0) + 1;
    });
    const sortedSeg = Object.entries(segMap).sort((a, b) => b[1] - a[1]);
    const segContainer = document.getElementById('segmentosList');
    
    if (sortedSeg.length === 0) {
        segContainer.innerHTML = '<span style="color:rgba(255,255,255,0.3);">Sem dados</span>';
    } else {
        const max = sortedSeg[0][1];
        segContainer.innerHTML = sortedSeg.map(([nome, count]) => `
            <div class="chart-bar-horizontal">
                <span class="label">${nome}</span>
                <div class="bar"><div class="fill" style="width:${(count / max) * 100}%;"></div></div>
                <span class="value">${count}</span>
            </div>
        `).join('');
    }

    // Gráfico de Pizza - Segmentos
    const segLabels = sortedSeg.map(s => s[0]);
    const segData = sortedSeg.map(s => s[1]);
    const segColors = ['#8B5CF6', '#a78bfa', '#6D28D9', '#c4b5fd', '#ddd6fe', '#7c3aed', '#fbbf24', '#34d399'];

    if (chartSegmentos) chartSegmentos.destroy();
    const ctx1 = document.getElementById('chartSegmentos');
    if (ctx1) {
        if (segLabels.length === 0) {
            chartSegmentos = new Chart(ctx1, {
                type: 'doughnut',
                data: { labels: ['Sem dados'], datasets: [{ data: [1], backgroundColor: ['rgba(255,255,255,0.05)'] }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: 'rgba(255,255,255,0.3)' } } } }
            });
        } else {
            chartSegmentos = new Chart(ctx1, {
                type: 'doughnut',
                data: {
                    labels: segLabels,
                    datasets: [{
                        data: segData,
                        backgroundColor: segColors.slice(0, segLabels.length),
                        borderColor: 'rgba(255,255,255,0.05)',
                        borderWidth: 2,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.6)', font: { size: 10 }, padding: 10, usePointStyle: true } },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percent = total ? Math.round((context.parsed / total) * 100) : 0;
                                    return context.label + ': ' + context.parsed + ' (' + percent + '%)';
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    // Origens
    const origMap = {};
    leads.forEach(l => {
        const o = getOrigem(l) || 'Direto';
        origMap[o] = (origMap[o] || 0) + 1;
    });
    const sortedOrig = Object.entries(origMap).sort((a, b) => b[1] - a[1]);
    
    // Exibir origens em texto
    const origContainer = document.getElementById('origens');
    if (sortedOrig.length === 0 || (sortedOrig.length === 1 && sortedOrig[0][0] === 'Direto')) {
        origContainer.innerHTML = '<span style="color:rgba(255,255,255,0.3);">Sem dados</span>';
    } else {
        origContainer.innerHTML = sortedOrig.map(([nome, count]) =>
            `<span style="background:rgba(255,255,255,0.03); padding:0.2rem 0.6rem; border-radius:9999px; font-size:0.75rem; border:1px solid rgba(255,255,255,0.04);"><strong>${nome}</strong> ${count}</span>`
        ).join('');
    }

    // Gráfico de Pizza - Origens
    const origLabels = sortedOrig.map(s => s[0]);
    const origData = sortedOrig.map(s => s[1]);
    const origColors = ['#1877f2', '#e4405f', '#25D366', '#8B5CF6', '#34a853', '#fbbf24', '#f87171', '#6D28D9'];

    if (chartOrigens) chartOrigens.destroy();
    const ctx2 = document.getElementById('chartOrigens');
    if (ctx2) {
        if (origLabels.length === 0 || (origLabels.length === 1 && origLabels[0] === 'Direto')) {
            chartOrigens = new Chart(ctx2, {
                type: 'doughnut',
                data: { labels: ['Sem dados'], datasets: [{ data: [1], backgroundColor: ['rgba(255,255,255,0.05)'] }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: 'rgba(255,255,255,0.3)' } } } }
            });
        } else {
            chartOrigens = new Chart(ctx2, {
                type: 'doughnut',
                data: {
                    labels: origLabels,
                    datasets: [{
                        data: origData,
                        backgroundColor: origColors.slice(0, origLabels.length),
                        borderColor: 'rgba(255,255,255,0.05)',
                        borderWidth: 2,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.6)', font: { size: 10 }, padding: 10, usePointStyle: true } },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percent = total ? Math.round((context.parsed / total) * 100) : 0;
                                    return context.label + ': ' + context.parsed + ' (' + percent + '%)';
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    // Leads por dia
    const dias = {};
    const hoje = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(hoje);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        dias[key] = 0;
    }
    leads.forEach(l => {
        const d = new Date(l.data_cadastro);
        const key = d.toISOString().split('T')[0];
        if (dias[key] !== undefined) dias[key]++;
    });
    const maxDia = Math.max(...Object.values(dias), 1);
    const diaContainer = document.getElementById('leadsPorDia');
    
    if (Object.values(dias).every(v => v === 0)) {
        diaContainer.innerHTML = '<span style="color:rgba(255,255,255,0.3);">Sem dados</span>';
    } else {
        diaContainer.innerHTML = Object.entries(dias).map(([key, count]) => {
            const label = new Date(key).toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short' });
            return `<div class="chart-bar-horizontal"><span class="label" style="min-width:60px;">${label}</span><div class="bar"><div class="fill" style="width:${(count / maxDia) * 100}%;"></div></div><span class="value">${count}</span></div>`;
        }).join('');
    }

    // Tempo médio
    let totalMin = 0, count = 0;
    leads.forEach(l => {
        if (l.status === 'contactado' || l.status === 'reuniao_marcada' || l.status === 'proposta_enviada' || l.status === 'cliente') {
            const created = new Date(l.data_cadastro);
            const updated = l.ultima_atualizacao ? new Date(l.ultima_atualizacao) : new Date();
            const diff = Math.floor((updated - created) / 60000);
            if (diff > 0) { totalMin += diff; count++; }
        }
    });
    const avgMin = count ? Math.round(totalMin / count) : 0;
    const horas = Math.floor(avgMin / 60);
    const minutos = avgMin % 60;
    document.getElementById('tempoMedio').textContent = count ? `${horas}h ${minutos}min` : 'N/A';
}

// ===== INICIAR =====
document.addEventListener('DOMContentLoaded', carregarAnalytics);
setInterval(carregarAnalytics, 30000);
