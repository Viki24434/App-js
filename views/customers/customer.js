async function initCustomerPage() {
    try {
        const tbody = document.getElementById('customer-list-body');
        const customers = await ipcRenderer.invoke('get-customers');
        if (!tbody || !customers) return;

        tbody.innerHTML = customers.map(c => `
            <tr>
                <td style="text-align: left; font-weight: bold;">${c.name}</td>
                <td>${c.phone || '-'}</td>
                <td>${c.address || '-'}</td>
                <td><span class="badge" style="background: ${c.is_member ? '#dcfce7' : '#f1f5f9'}; color: ${c.is_member ? '#10b981' : '#64748b'};">${c.is_member ? 'Member' : 'Biasa'}</span></td>
                <td>
                    <button class="btn btn-info"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch(e) { console.error("Gagal load pelanggan", e); }
}