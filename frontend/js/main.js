// ===== THEME TOGGLE =====
function toggleTheme() {
    const body = document.body;
    const thumb = document.getElementById('themeThumb');
    
    if (body.classList.contains('dark-theme')) {
        body.classList.remove('dark-theme');
        body.classList.add('white-theme');
        localStorage.setItem('theme', 'white');
        thumb.textContent = '☀️';
    } else {
        body.classList.remove('white-theme');
        body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
        thumb.textContent = '🌙';
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const body = document.body;
    const thumb = document.getElementById('themeThumb');
    
    if (savedTheme === 'white') {
        body.classList.add('white-theme');
        body.classList.remove('dark-theme');
        if (thumb) thumb.textContent = '☀️';
    } else {
        body.classList.add('dark-theme');
        body.classList.remove('white-theme');
        if (thumb) thumb.textContent = '🌙';
    }
}

// Carregar tema ao iniciar
document.addEventListener('DOMContentLoaded', loadTheme);