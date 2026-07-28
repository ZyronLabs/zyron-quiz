/* ========================================
   LEADS SCRIPT
   ======================================== */

let leadsAtuais = [];

// ===== CARREGAR LEADS =====
async function carregarLeads(filtros = {}) {
    try {
        const params = new URLSearchParams(filtros).toString();
        const res = await fetch(`${API_URL}/leads?${params}`);
        const data = await res.json();
        leadsAtuais = data.leads || [];
        document.getElementById('sidebarLeads').textContent = leadsAtuais.length;
        renderizarLeads(leadsAtuais);
    } catch (e) {
        console.error(e);
    }
}

// ===== RENDERIZAR CARDS =====
function renderizarLeads(leads) {
    const container = document.getElementById('leadsGrid');
    const no = document.getElementById('noLeads');
    if (leads.length === 0) {
        container.innerHTML = '';
        no.style.display = 'block';
        return;
    }
    no.style.display = 'none';
    
    container.innerHTML = leads.map(l => {
        const sol = getNecessidades(l).solucoes || [];
        const nome = getNome(l);
        const empresa = getEmpresa(l);
        const whatsapp = getWhatsapp(l);
        const segmento = getSegmento(l);
        const pontuacao = getPontuacao(l);
        const nivel = getNivel(l);
        const status = l.status || 'novo';
        
        return `
            <div class="lead-card" onclick="abrirDetalhes('${l.id}')">
                <div class="head">
                    <div>
                        <div class="name"><i class="ph ph-user ph-bold"></i> ${nome}</div>
                        ${empresa ? `<div class="company"><i class="ph ph-buildings ph-bold"></i> ${empresa}</div>` : ''}
                    </div>
                    <span class="badge-status ${statusClasses[status] || 'status-novo'}">${statusLabels[status] || status}</span>
                </div>
                <div class="tags">
                    ${segmento ? `<span class="tag"><i class="ph ph-tag ph-bold"></i> ${segmento}</span>` : ''}
                    ${whatsapp ? `<span class="tag tag-whatsapp"><i class="ph ph-whatsapp-logo ph-bold"></i> ${whatsapp}</span>` : ''}
                    <span class="tag">${nivelEmoji[nivel] || ''} ${nivel}</span>
                </div>
                <div class="footer">
                    <span class="score"><i class="ph ph-star ph-bold"></i> ${pontuacao} pts</span>
                    <span style="font-size:0.65rem; color:rgba(255,255,255,0.25);">${sol.slice(0, 2).join(', ')}${sol.length > 2 ? '...' : ''}</span>
                    <span class="click-hint"><i class="ph ph-arrow-circle-right ph-bold"></i></span>
                </div>
            </div>
        `;
    }).join('');
}

// ===== ABRIR DETALHES =====
async function abrirDetalhes(leadId) {
    try {
        const res = await fetch(`${API_URL}/leads/${leadId}`);
        const lead = await res.json();
        const modal = document.getElementById('modalDetalhes');
        const content = document.getElementById('modalContent');
        
        const nome = getNome(lead);
        const empresa = getEmpresa(lead);
        const whatsapp = getWhatsapp(lead);
        const segmento = getSegmento(lead);
        const origem = getOrigem(lead);
        const pontuacao = getPontuacao(lead);
        const nivel = getNivel(lead);
        const sol = getNecessidades(lead).solucoes || [];
        const dores = getNecessidades(lead).dores || [];
        const status = lead.status || 'novo';

        content.innerHTML = `
            <div style="margin-bottom:1rem;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h2 style="font-size:1.3rem; font-weight:700;"><i class="ph ph-user ph-bold"></i> ${nome}</h2>
                    <span class="badge-status ${statusClasses[status] || 'status-novo'}">${statusLabels[status] || status}</span>
                </div>
                ${empresa ? `<p style="color:rgba(255,255,255,0.5);"><i class="ph ph-buildings ph-bold"></i> ${empresa}</p>` : ''}
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; background:rgba(255,255,255,0.02); padding:0.75rem; border-radius:0.5rem; margin-bottom:1rem;">
                <div><span style="font-size:0.6rem; color:rgba(255,255,255,0.3);">WhatsApp</span><br><span style="font-weight:500;"><i class="ph ph-whatsapp-logo ph-bold" style="color:#25D366;"></i> ${whatsapp || 'N/A'}</span></div>
                <div><span style="font-size:0.6rem; color:rgba(255,255,255,0.3);">Email</span><br><span style="font-weight:500;"><i class="ph ph-envelope ph-bold"></i> ${lead.email || 'N/A'}</span></div>
                <div><span style="font-size:0.6rem; color:rgba(255,255,255,0.3);">Segmento</span><br><span style="font-weight:500;"><i class="ph ph-tag ph-bold"></i> ${segmento || 'N/A'}</span></div>
                <div><span style="font-size:0.6rem; color:rgba(255,255,255,0.3);">Origem</span><br><span style="font-weight:500;"><i class="ph ph-arrow-circle-down ph-bold"></i> ${origem || 'Direto'}</span></div>
                <div><span style="font-size:0.6rem; color:rgba(255,255,255,0.3);">Data</span><br><span style="font-weight:500;"><i class="ph ph-calendar ph-bold"></i> ${new Date(lead.data_cadastro).toLocaleString('pt-MZ')}</span></div>
            </div>
            <div style="background:rgba(255,255,255,0.02); padding:0.75rem; border-radius:0.5rem; margin-bottom:1rem;">
                <div style="display:flex; justify-content:space-between;">
                    <span style="font-size:1.2rem; font-weight:700; color:#8B5CF6;"><i class="ph ph-star ph-bold"></i> ${pontuacao} pts</span>
                    <span>${nivelEmoji[nivel] || ''} ${nivel || 'N/A'}</span>
                </div>
                <p style="font-size:0.8rem; color:rgba(255,255,255,0.5);">${lead.descricao || ''}</p>
            </div>
            ${sol.length ? `
                <div style="margin-bottom:0.5rem; background:rgba(139,92,246,0.04); padding:0.5rem; border-radius:0.5rem;">
                    <span style="font-size:0.6rem; color:rgba(255,255,255,0.3);"><i class="ph ph-lightbulb ph-bold"></i> Soluções</span><br>
                    ${sol.map(s => `<span style="font-size:0.75rem; background:rgba(139,92,246,0.08); padding:0.1rem 0.4rem; border-radius:9999px; color:#8B5CF6; display:inline-block; margin:0.1rem;">${s}</span>`).join(' ')}
                </div>
            ` : ''}
            ${dores.length ? `
                <div style="margin-bottom:1rem; background:rgba(239,68,68,0.04); padding:0.5rem; border-radius:0.5rem;">
                    <span style="font-size:0.6rem; color:rgba(255,255,255,0.3);"><i class="ph ph-warning ph-bold"></i> Dores</span><br>
                    ${dores.map(d => `<span style="font-size:0.75rem; background:rgba(239,68,68,0.08); padding:0.1rem 0.4rem; border-radius:9999px; color:#f87171; display:inline-block; margin:0.1rem;">${d}</span>`).join(' ')}
                </div>
            ` : ''}
            <div style="display:flex; gap:0.5rem; padding-top:0.5rem; border-top:1px solid rgba(255,255,255,0.04); flex-wrap:wrap;">
                <select onchange="atualizarStatus('${lead.id}', this.value)" class="input-zyron" style="flex:1; min-width:120px; padding:0.3rem 0.5rem; font-size:0.75rem; border-radius:0.5rem;">
                    <option value="novo" ${status === 'novo' ? 'selected' : ''}>🟢 Novo</option>
                    <option value="contactado" ${status === 'contactado' ? 'selected' : ''}>🟡 Contactado</option>
                    <option value="reuniao_marcada" ${status === 'reuniao_marcada' ? 'selected' : ''}>🟠 Reunião</option>
                    <option value="proposta_enviada" ${status === 'proposta_enviada' ? 'selected' : ''}>🟣 Proposta</option>
                    <option value="cliente" ${status === 'cliente' ? 'selected' : ''}>✅ Cliente</option>
                    <option value="perdido" ${status === 'perdido' ? 'selected' : ''}>❌ Perdido</option>
                </select>
                ${whatsapp ? `
                    <a href="https://wa.me/${whatsapp.replace(/\s/g, '').replace(/^\+/, '')}" target="_blank" class="btn-primary" style="padding:0.3rem 0.6rem; font-size:0.75rem; text-decoration:none; width:auto; background:#25D366;">
                        <i class="ph ph-whatsapp-logo ph-bold"></i>
                    </a>
                ` : ''}
                <button onclick="deletarLead('${lead.id}')" class="btn-danger" style="padding:0.3rem 0.6rem; font-size:0.75rem;">
                    <i class="ph ph-trash ph-bold"></i> Remover
                </button>
                <button onclick="fecharModal()" class="btn-secondary" style="padding:0.3rem 0.6rem; font-size:0.75rem;">
                    <i class="ph ph-x ph-bold"></i> Fechar
                </button>
            </div>
        `;

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    } catch (e) {
        console.error(e);
        alert('Erro ao carregar detalhes.');
    }
}

function fecharModal(e) {
    if (e && e.target !== e.currentTarget) return;
    document.getElementById('modalDetalhes').classList.remove('active');
    document.body.style.overflow = '';
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fecharModal();
});

// ===== ATUALIZAR STATUS =====
async function atualizarStatus(leadId, novoStatus) {
    try {
        const res = await fetch(`${API_URL}/leads/${leadId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: novoStatus })
        });
        if (res.ok) {
            aplicarFiltros();
            fecharModal();
            setTimeout(() => abrirDetalhes(leadId), 300);
        }
    } catch (e) {
        console.error(e);
    }
}

// ===== DELETAR LEAD =====
async function deletarLead(leadId) {
    if (!confirm('⚠️ ATENÇÃO: Isso vai REMOVER este lead permanentemente. Continuar?')) {
        return;
    }
    try {
        const res = await fetch(`${API_URL}/leads/${leadId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        if (res.ok) {
            alert('✅ Lead removido com sucesso!');
            fecharModal();
            carregarLeads();
        } else {
            const data = await res.json();
            alert('❌ Erro: ' + data.error);
        }
    } catch (error) {
        alert('❌ Erro: ' + error.message);
    }
}

// ===== FILTROS =====
function aplicarFiltros() {
    const filtros = {
        status: document.getElementById('filtroStatus').value,
        segmento: document.getElementById('filtroSegmento').value,
        nivel: document.getElementById('filtroNivel').value
    };
    Object.keys(filtros).forEach(k => { if (!filtros[k]) delete filtros[k]; });
    carregarLeads(filtros);
}

function limparFiltros() {
    document.getElementById('filtroStatus').value = '';
    document.getElementById('filtroSegmento').value = '';
    document.getElementById('filtroNivel').value = '';
    carregarLeads();
}

function filtrarStatus(status) {
    document.getElementById('filtroStatus').value = status;
    aplicarFiltros();
}

// ===== EXPORTAR CSV =====
function exportarCSV() {
    if (!leadsAtuais.length) { alert('Nenhum lead para exportar.'); return; }
    const headers = ['Nome', 'Empresa', 'WhatsApp', 'Email', 'Segmento', 'Origem', 'Pontuação', 'Nível', 'Interesse', 'Status'];
    const rows = leadsAtuais.map(l => {
        const sol = getNecessidades(l).solucoes || [];
        return [
            getNome(l),
            getEmpresa(l),
            getWhatsapp(l),
            l.email || '',
            getSegmento(l),
            getOrigem(l),
            getPontuacao(l),
            getNivel(l),
            sol.join('; '),
            l.status || ''
        ];
    });
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// ===== INICIAR =====
const urlParams = new URLSearchParams(window.location.search);
const statusParam = urlParams.get('status');
if (statusParam) {
    document.getElementById('filtroStatus').value = statusParam;
}
carregarLeads({ status: statusParam || '' });
