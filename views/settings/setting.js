async function initSettingPage() {
    try {
        const settings = await ipcRenderer.invoke('get-settings');
        if (settings) {
            document.getElementById('setting-store-name').value = settings.store_name || '';
            document.getElementById('setting-store-phone').value = settings.phone || '';
            document.getElementById('setting-store-address').value = settings.address || '';
            document.getElementById('setting-store-footer').value = settings.footer_note || '';
        }

        document.getElementById('form-settings').addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                store_name: document.getElementById('setting-store-name').value,
                phone: document.getElementById('setting-store-phone').value,
                address: document.getElementById('setting-store-address').value,
                footer_note: document.getElementById('setting-store-footer').value,
            };
            await ipcRenderer.invoke('save-settings', data);
            alert('Pengaturan berhasil disimpan!');
        });
    } catch(e) { console.error("Gagal load settings", e); }
}