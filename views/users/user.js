async function initUserPage() {
    try {
        const tbody = document.getElementById('user-list-body');
        const users = await ipcRenderer.invoke('get-users');
        if (!tbody || !users) return;

        tbody.innerHTML = users.map(u => `
            <tr>
                <td style="text-align: left;">${u.name}</td>
                <td><code>${u.username}</code></td>
                <td><span class="badge" style="background: ${u.role === 'Admin' ? '#e0e7ff' : '#fef3c7'}; color: ${u.role === 'Admin' ? '#4f46e5' : '#d97706'};">${u.role}</span></td>
                <td>
                    <button class="btn btn-info"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch(e) { console.error("Gagal load user", e); }
}