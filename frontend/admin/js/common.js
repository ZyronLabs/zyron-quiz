/* ========================================
   COMMON ADMIN SCRIPTS
   ======================================== */

const API_URL = "https://zyron-quiz.onrender.com/api";

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

// ===== INICIAR =====
document.addEventListener('DOMContentLoaded', loadTheme);
