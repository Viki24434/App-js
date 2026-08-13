
function initActivation() {
    document.getElementById('form-activation').addEventListener('submit', async (e) => {
        e.preventDefault();
        const lisensi = document.getElementById('license-key').value;
        const sukses = await ipcRenderer.invoke('activate-device', lisensi);
        
        if (sukses) {
            alert('Aktivasi Berhasil! Silakan Login.');
            window.loadPage('login');
        } else {
            alert('Kode Lisensi Tidak Valid untuk Komputer ini!');
        }
    });
}

window.initLogin = function() {
    const form = document.getElementById('form-login');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const usernameVal = document.getElementById('login-username').value;
            const passwordVal = document.getElementById('login-password').value;

            const response = await ipcRenderer.invoke('auth-login', {
                username: usernameVal,
                password: passwordVal
            });

            if (response.success) {
                localStorage.setItem('pos_session', JSON.stringify(response.user));
                window.tampilkanUI(response.user);
                window.loadPage('dashboard');
            } else {
                alert(response.message);
            }
        });
    }
};
