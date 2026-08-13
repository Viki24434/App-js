const contentArea = document.getElementById('content-area');

const routes = {
    'login': { file: 'auth/login.html', init: 'initLogin' },
    'dashboard': { file: 'dashboard/index.html', init: 'initDashboard' },
    'product': { file: 'products/index.html', init: 'initProductPage' },
    'order': { file: 'orders/index.html', init: 'initOrderPage' },
    'order-create': { file: 'orders/create.html', init: 'initPosPage' },
    'report': { file: 'reports/index.html', init: 'initReportPage' },
    'customer': { file: 'customers/index.html', init: 'initCustomerPage' },
    'user': { file: 'users/index.html', init: 'initUserPage' },
    'setting': { file: 'settings/index.html', init: 'initSettingPage' },
    'finance': { file: 'finance/index.html', init: 'initFinancePage' },
    'activation': { file: 'auth/activation.html', init: 'initActivation' }
};

window.loadPage = async function(page) {
    if (page === 'logout') {
        localStorage.removeItem('pos_session');
        window.sembunyikanUI();
        window.loadPage('login');
        return;
    }

    const route = routes[page];
    if (!route) return;

    try {
        const response = await fetch(route.file);
        const html = await response.text();
        contentArea.innerHTML = html;

        document.querySelectorAll('.sidebar a').forEach(el => el.classList.remove('active'));
        const activeLink = document.querySelector(`.sidebar a[onclick="loadPage('${page}')"]`);
        if (activeLink) activeLink.classList.add('active');

        if (route.init) {
            const initFn = window[route.init];
            if (typeof initFn === 'function') {
                await initFn();
            }
        }
    } catch (e) {
        console.error(e);
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    const isActivated = await ipcRenderer.invoke('check-activation');
    
    if (isActivated !== true) {
        window.sembunyikanUI();
        window.loadPage('activation');
        return;
    }

    const sessionData = localStorage.getItem('pos_session');
    
    if (sessionData) {
        const user = JSON.parse(sessionData);
        window.tampilkanUI(user);
        window.loadPage('dashboard');
    } else {
        window.sembunyikanUI();
        window.loadPage('login');
    }
});

window.showPaymentModal = function(invoice, total, callback) {
    const oldModal = document.getElementById('custom-payment-modal');
    if (oldModal) oldModal.remove();

    const modalHtml = `
    <div class="modal-overlay active" id="custom-payment-modal">
        <div class="modal-box">
            <button class="modal-close" onclick="document.getElementById('custom-payment-modal').remove()">&times;</button>
            <h3 style="color: var(--primary); margin-bottom: 16px;">Pembayaran: ${invoice}</h3>
            
            <div class="form-group">
                <label>Total Tagihan (Rp)</label>
                <input type="text" value="${total.toLocaleString('id-ID')}" readonly style="background: #e2e8f0; font-weight: bold; color: #0f172a;">
            </div>

            <div class="form-group">
                <label>Metode Pembayaran</label>
                <select id="payment-method-input" style="font-weight: bold; font-size: 14px;">
                    <option value="Cash">Cash</option>
                    <option value="Transfer">Transfer</option>
                    <option value="QRIS">QRIS</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Nominal Bayar Pelanggan (Rp)</label>
                <input type="number" id="payment-amount-input" value="${total}" style="font-weight: bold; font-size: 16px;">
            </div>
            
            <div style="text-align: right; margin-top: 24px;">
                <button class="btn btn-danger" onclick="document.getElementById('custom-payment-modal').remove()" style="margin-right: 8px;">Batal</button>
                <button class="btn btn-success" id="btn-confirm-payment"><i class="fas fa-check"></i> Proses Bayar</button>
            </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const inputAmount = document.getElementById('payment-amount-input');
    const inputMethod = document.getElementById('payment-method-input');
    inputAmount.focus();
    inputAmount.select(); 

    document.getElementById('btn-confirm-payment').onclick = function() {
        const amountPaid = parseFloat(inputAmount.value);
        const paymentMethod = inputMethod.value;

        if (!amountPaid || amountPaid < total) {
            alert('Nominal uang tidak mencukupi untuk membayar tagihan!');
            return;
        }
        document.getElementById('custom-payment-modal').remove();
        callback(amountPaid, paymentMethod);
    };
};
