function updateDashClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    
    const timeEl = document.getElementById('live-time');
    const dateEl = document.getElementById('live-date');
    if(timeEl) timeEl.innerText = timeStr;
    if(dateEl) dateEl.innerText = dateStr;
}

async function initDashboard() {
    setInterval(updateDashClock, 1000);
    updateDashClock();

    const session = JSON.parse(localStorage.getItem('pos_session') || '{}');
    if(session.name) document.getElementById('dash-user-name').innerText = `Halo, ${session.name}!`;

    try {
        const data = await ipcRenderer.invoke('get-dashboard-data');
        if (!data) return;

        const formatRp = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);

        document.getElementById('dash-omzet').innerText = formatRp(data.omzet);
        document.getElementById('dash-laba').innerText = formatRp(data.laba);
        document.getElementById('dash-transaksi').innerText = `${data.transaksi} Struk`;
        document.getElementById('dash-piutang').innerText = formatRp(data.piutang);

        const stockContainer = document.getElementById('low-stock-container');
        if (data.lowStocks.length === 0) {
            stockContainer.innerHTML = `<div style="text-align:center; padding: 20px; color: #10b981;"><i class="fas fa-check-circle fa-2x"></i><p style="margin: 10px 0 0; font-weight: 600;">Stok Aman</p></div>`;
        } else {
            stockContainer.innerHTML = data.lowStocks.map(item => `
                <div class="item-modern">
                    <div class="item-text">
                        <b>${item.name}</b>
                        <span>Sisa stok kritis</span>
                    </div>
                    <span class="badge-pill" style="background: #fee2e2; color: #ef4444;">${item.stock} Unit</span>
                </div>
            `).join('');
        }

        const topContainer = document.getElementById('top-products-container');
        if (data.topProducts.length === 0) {
            topContainer.innerHTML = `<p style="text-align: center; padding: 20px;">Belum ada data penjualan.</p>`;
        } else {
            topContainer.innerHTML = data.topProducts.map((item, index) => `
                <div class="item-modern">
                    <div class="item-info">
                        <div class="item-rank">${index + 1}</div>
                        <div class="item-text"><b>${item.name}</b><span>Paling sering dipesan</span></div>
                    </div>
                    <b style="color: var(--primary);">${item.sold}x</b>
                </div>
            `).join('');
        }

        const recentContainer = document.getElementById('recent-orders-container');
        if (data.recentOrders.length === 0) {
            recentContainer.innerHTML = `<tr><td colspan="4" style="text-align: center;">Tidak ada transaksi</td></tr>`;
        } else {
            recentContainer.innerHTML = data.recentOrders.map(order => `
                <tr>
                    <td style="font-weight: 700; color: var(--primary);">${order.invoice_number}</td>
                    <td><b>${order.customer_name}</b></td>
                    <td>${formatRp(order.total_amount)}</td>
                    <td style="text-align: center;">
                        <span class="badge-pill" style="${order.payment_status === 'Lunas' ? 'background: #dcfce7; color: #166534;' : 'background: #fee2e2; color: #991b1b;'}">
                            ${order.payment_status}
                        </span>
                    </td>
                </tr>
            `).join('');
        }

        const ctx = document.getElementById('revenueChart');
        if (ctx && window.Chart) {
            new Chart(ctx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: data.chartLabels,
                    datasets: [{
                        label: 'Pendapatan',
                        data: data.chartData,
                        borderColor: '#4f46e5',
                        backgroundColor: 'rgba(79, 70, 229, 0.1)',
                        borderWidth: 4,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: '#4f46e5',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, grid: { borderDash: [5, 5], color: '#e2e8f0' } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }
    } catch (e) { console.error(e); }
}