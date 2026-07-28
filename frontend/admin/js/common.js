/* ========================================
   COMMON ADMIN SCRIPTS
   ======================================== */

const API_URL = 'https://zyron-quiz.onrender.com/api';

// ===== THEME =====
function toggleTheme() {
    const body = document.body;
    const thumb = document.getElementById('themeThumb');
    if (body.classList.contains('dark-theme')) {
        body.classList.remove('dark-theme');
        body.classList.add('white-theme');
        localStorage.setItem('theme', 'white');
        if (thumb) thumb.innerHTML = '<i class="ph ph-sun ph-bold"></i>';
    } else {
        body.classList.remove('white-theme');
        body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
        if (thumb) thumb.innerHTML = '<i class="ph ph-moon ph-bold"></i>';
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

// ===== TIME AGO =====
function timeAgo(date) {
    const diff = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diff < 1) return 'agora';
    if (diff < 60) return diff + ' min';
    if (diff < 1440) return Math.floor(diff / 60) + ' h';
    return Math.floor(diff / 1440) + ' d';
}

// ===== FUNÇÕES AUXILIARES PARA LEADS =====
function getNome(lead) {
    return lead.nome || lead.cliente?.nome || 'N/A';
}

function getEmpresa(lead) {
    return lead.empresa || lead.cliente?.empresa || '';
}

function getWhatsapp(lead) {
    return lead.whatsapp || lead.cliente?.whatsapp || '';
}

function getSegmento(lead) {
    return lead.segmento || lead.cliente?.segmento || '';
}

function getOrigem(lead) {
    return lead.origem || 'Direto';
}

function getPontuacao(lead) {
    if (lead.pontuacao_total !== undefined && lead.pontuacao_total !== null) return lead.pontuacao_total;
    if (lead.diagnostico?.pontuacao_total !== undefined) return lead.diagnostico.pontuacao_total;
    if (lead.pontuacao !== undefined) return lead.pontuacao;
    return 0;
}

function getNivel(lead) {
    if (lead.nivel) return lead.nivel;
    if (lead.diagnostico?.nivel) return lead.diagnostico.nivel;
    return 'N/A';
}

function getCategorias(lead) {
    if (lead.categorias) return lead.categorias;
    if (lead.diagnostico?.categorias) return lead.diagnostico.categorias;
    return null;
}

function getNecessidades(lead) {
    if (lead.necessidades) return lead.necessidades;
    if (lead.diagnostico?.necessidades) return lead.diagnostico.necessidades;
    return { dores: [], solucoes: [] };
}

function getPrioridade(lead) {
    if (lead.prioridade) return lead.prioridade;
    if (lead.comercial?.prioridade) return lead.comercial.prioridade;
    return 'media';
}

// ===== STATUS CLASSES =====
const statusClasses = {
    'novo': 'status-novo',
    'contactado': 'status-contactado',
    'reuniao_marcada': 'status-reuniao',
    'proposta_enviada': 'status-proposta',
    'cliente': 'status-cliente',
    'perdido': 'status-perdido'
};

const statusLabels = {
    'novo': '🟢 Novo',
    'contactado': '🟡 Contactado',
    'reuniao_marcada': '🟠 Reunião',
    'proposta_enviada': '🟣 Proposta',
    'cliente': '✅ Cliente',
    'perdido': '❌ Perdido'
};

const nivelEmoji = {
    'Inicial': '🔴',
    'Intermediário': '🟡',
    'Avançado': '🟢'
};

// ===== INICIAR =====
document.addEventListener('DOMContentLoaded', loadTheme);
