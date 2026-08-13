
const { ipcRenderer } = require('electron');

window.sembunyikanUI = function() {
    const sidebar = document.querySelector('.sidebar');
    const header = document.querySelector('.top-header');
    const wrapper = document.querySelector('.main-wrapper');
    if(sidebar) sidebar.style.display = 'none';
    if(header) header.style.display = 'none';
    if(wrapper) {
        wrapper.style.marginLeft = '0';
        wrapper.style.width = '100%';
    }
};

window.tampilkanUI = function(user) {
    const sidebar = document.querySelector('.sidebar');
    const header = document.querySelector('.top-header');
    const wrapper = document.querySelector('.main-wrapper');
    if(sidebar) sidebar.style.display = 'block';
    if(header) header.style.display = 'flex';
    if(wrapper) {
        wrapper.style.marginLeft = ''; 
        wrapper.style.width = '';
    }
    
    if(user && user.name) {
        const nameEl = document.querySelector('.header-user-meta strong');
        const roleEl = document.querySelector('.header-user-meta small');
        const avatarEl = document.querySelector('.header-avatar');
        
        if(nameEl) nameEl.innerText = user.name;
        if(roleEl) roleEl.innerText = user.role || 'User';
        if(avatarEl) avatarEl.innerText = user.name.charAt(0).toUpperCase();
    }
};
