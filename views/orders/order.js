window.formatRp = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

window.openModal = function(id) { document.getElementById(id).style.display = 'flex'; };
window.closeModal = function(id) { document.getElementById(id).style.display = 'none'; };

window.initOrderPage = async function() {
    try {
        const filterStart = document.getElementById('filter-start')?.value || '';
        const filterEnd = document.getElementById('filter-end')?.value || '';
        const filterSearch = document.getElementById('filter-search')?.value || '';

        const orders = await ipcRenderer.invoke('get-orders', { start: filterStart, end: filterEnd, search: filterSearch });
        const tbody = document.getElementById('order-list-body');
        if (!tbody) return;

        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 30px; color: #64748b;">Data tidak ditemukan.</td></tr>';
            return;
        }

        tbody.innerHTML = orders.map(order => {
            const sisaTagihan = order.total_amount - (order.total_paid || 0);
            let statusText = '';
            let badgeStyle = '';
            let isLunas = false;

            if (sisaTagihan <= 0) {
                statusText = 'Lunas';
                badgeStyle = 'background: #dcfce7; color: #166534;';
                isLunas = true;
            } else if ((order.total_paid || 0) > 0) {
                statusText = 'DP';
                badgeStyle = 'background: #fef3c7; color: #b45309;';
            } else {
                statusText = 'Belum Bayar';
                badgeStyle = 'background: #fee2e2; color: #991b1b;';
            }

            const actionBtns = `
                <button class="btn-icon btn-detail" onclick="window.openDetail(${order.id}, '${order.invoice_number}')">
                    <i class="fas fa-eye"></i>
                </button>
                ${isLunas 
                    ? `<button class="btn-icon btn-disabled" disabled><i class="fas fa-check"></i></button>` 
                    : `<button class="btn-icon btn-payment" onclick="window.openPayment(${order.id}, ${sisaTagihan})"><i class="fas fa-money-bill-wave"></i></button>`
                }
                <button class="btn-icon btn-pdf" onclick="window.downloadStrukPDF(${order.id})">
                    <i class="fas fa-file-pdf"></i>
                </button>
                <button class="btn-icon btn-print" onclick="window.printThermal(${order.id})">
                    <i class="fas fa-print"></i>
                </button>
            `;

            return `
                <tr>
                    <td style="font-weight: 600; color: #2b6cb0;">${order.invoice_number}</td>
                    <td style="font-weight: 500;">${order.customer_name}</td>
                    <td style="font-weight: 600;">${window.formatRp(order.total_amount)}</td>
                    <td style="text-align: center;"><span style="padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; ${badgeStyle}">${statusText}</span></td>
                    <td>${new Date(order.created_at).toLocaleDateString('id-ID')}</td>
                    <td><div class="action-group">${actionBtns}</div></td>
                </tr>
            `;
        }).join('');
    } catch(e) {}
};

window.openDetail = async function(id, inv_no) {
    document.getElementById('detailTitle').innerText = 'Detail Pesanan: ' + inv_no;
    document.getElementById('detailBody').innerHTML = '<tr><td colspan="4" style="text-align:center;">Memuat data...</td></tr>';
    window.openModal('detailModal');

    try {
        const details = await ipcRenderer.invoke('get-order-detail', id);
        document.getElementById('detailBody').innerHTML = details.map(item => `
            <tr>
                <td>${item.product_name}</td>
                <td>${item.qty}</td>
                <td>${window.formatRp(item.price)}</td>
                <td style="font-weight:600;">${window.formatRp(item.subtotal)}</td>
            </tr>
        `).join('');
    } catch (e) {
        document.getElementById('detailBody').innerHTML = '<tr><td colspan="4" style="text-align:center;">Gagal memuat detail</td></tr>';
    }
};

window.openPayment = function(id, sisaTagihanAngka) {
    document.getElementById('pay_order_id').value = id;
    document.getElementById('pay_sisa_tagihan').value = sisaTagihanAngka; 
    document.getElementById('pay_total').value = window.formatRp(sisaTagihanAngka);
    document.getElementById('pay_nominal').value = '';
    document.getElementById('pay_info').value = '';
    window.openModal('paymentModal');
};

window.setLunas = function() {
    document.getElementById('pay_nominal').value = document.getElementById('pay_sisa_tagihan').value;
    window.checkPaymentStatus();
};

window.checkPaymentStatus = function() {
    const sisaTagihan = parseFloat(document.getElementById('pay_sisa_tagihan').value) || 0;
    const nominalBayar = parseFloat(document.getElementById('pay_nominal').value) || 0;
    const inputInfo = document.getElementById('pay_info');

    if (nominalBayar <= 0 || isNaN(nominalBayar)) {
        inputInfo.value = "";
        inputInfo.style.color = "#64748b";
    } else if (nominalBayar >= sisaTagihan) {
        inputInfo.value = "Lunas";
        inputInfo.style.color = "#166534";
    } else {
        inputInfo.value = "DP";
        inputInfo.style.color = "#b45309";
    }
};

window.submitPayment = async function() {
    const id = document.getElementById('pay_order_id').value;
    const nominal = parseFloat(document.getElementById('pay_nominal').value);
    const method = document.getElementById('pay_method').value;
    const sisa = parseFloat(document.getElementById('pay_sisa_tagihan').value);

    if (!nominal) return;

    const success = await ipcRenderer.invoke('process-payment', { id: id, total: nominal, paymentMethod: method, sisa: sisa });
    if (success) {
        window.closeModal('paymentModal');
        window.initOrderPage();
    }
};

window.printThermal = async function(id) {
    document.getElementById('loadingText').innerText = "Menghubungkan ke Printer...";
    document.getElementById('loadingPrint').style.display = 'flex';

    try {
        const data = await ipcRenderer.invoke('get-print-data', id);
        
        let html = `
        <html>
        <head>
            <style>
                @page { margin: 0; size: auto; }
                body { font-family: 'Courier New', Courier, monospace; margin: 0; padding: 10px; width: 100%; box-sizing: border-box; font-size: 12px; color: #000; }
                .text-center { text-align: center; }
                .text-left { text-align: left; }
                .text-right { text-align: right; }
                .font-bold { font-weight: bold; }
                .dashed-line { border-top: 1px dashed #000; margin: 5px 0; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; }
                td { vertical-align: top; padding-bottom: 2px; }
            </style>
        </head>
        <body>
            <div class="text-center">
                <div class="font-bold" style="font-size:16px; text-transform:uppercase;">${data.store.name}</div>
            </div>
            <div class="dashed-line" style="margin-top:8px;"></div>
            <div class="text-left" style="margin-bottom: 8px; font-size:11px; line-height:1.4;">
                <table style="width: 100%;">
                    <tr><td style="width: 45px;">Inv</td><td>: ${data.order.invoice_number}</td></tr>
                    <tr><td>Nama</td><td>: ${data.order.customer_name}</td></tr>
                </table>
            </div>
            <div class="dashed-line"></div>
            <table>`;

        data.items.forEach(item => {
            html += `<tr><td colspan="2" class="font-bold">${item.product_name}</td></tr>
                     <tr><td>${item.qty}x ${window.formatRp(item.price)}</td><td class="text-right">${window.formatRp(item.subtotal)}</td></tr>`;
        });

        html += `
            </table>
            <div class="dashed-line"></div>
            <table>
                <tr><td class="font-bold">Total</td><td class="text-right font-bold">${window.formatRp(data.order.total_amount)}</td></tr>
            </table>
            <div class="dashed-line"></div>
            <div class="text-center" style="margin-top:10px;">Terima Kasih!</div>
        </body>
        </html>`;

        let iframe = document.getElementById('thermalFrame');
        let doc = iframe.contentWindow.document;
        doc.open();
        doc.write(html);
        doc.close();

        setTimeout(() => {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            document.getElementById('loadingPrint').style.display = 'none';
        }, 500);
    } catch (e) {
        document.getElementById('loadingPrint').style.display = 'none';
    }
};

async function initPosPage() {
    posCart = []; 
    try {
        const grid = document.getElementById('pos-product-grid');
        const products = await ipcRenderer.invoke('get-products').catch(()=>[]);
        
        function renderProducts(items) {
            const grid = document.getElementById('pos-product-grid');
            if(!grid) return;
            
            grid.innerHTML = items.map(p => {
                const imgSrc = p.img ? `../assets/img/product/${p.img}` : '../assets/img/product/default.png';
                
                return `
                <div onclick="addToCart(${p.id}, '${p.name.replace(/'/g, "\\'")}', ${p.price})" style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; cursor: pointer; text-align: center; background: #fff; transition: transform 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <img src="${imgSrc}" style="width: 100%; height: 90px; object-fit: cover; border-radius: 6px; margin-bottom: 8px; border: 1px solid #f1f5f9;">
                    
                    <div style="font-weight: 600; font-size: 11px; margin-bottom: 4px; height: 32px; overflow: hidden; color: var(--text-color);">${p.name}</div>
                    <div style="color: var(--primary); font-size: 13px; font-weight: bold;">Rp ${p.price.toLocaleString('id-ID')}</div>
                </div>
                `;
            }).join('');
        }
        renderProducts(products);

        const searchInput = document.getElementById('pos-search');
        if (searchInput) {
            searchInput.addEventListener('keyup', (e) => {
                const keyword = e.target.value.toLowerCase();
                const filtered = products.filter(p => 
                    p.name.toLowerCase().includes(keyword) || 
                    (p.product_code && p.product_code.toLowerCase().includes(keyword))
                );
                renderProducts(filtered);
            });
        }

        const discountInput = document.getElementById('pos-discount');
        if (discountInput) {
            discountInput.addEventListener('input', renderCart);
        }

        const btnProcess = document.getElementById('btn-process-order');
        if (btnProcess) {
            const newBtn = btnProcess.cloneNode(true);
            btnProcess.parentNode.replaceChild(newBtn, btnProcess);
            
            newBtn.addEventListener('click', () => {
                if (posCart.length === 0) return alert('Keranjang masih kosong!');
                
                const customerName = document.getElementById('pos-customer').value || 'Umum';
                const discount = parseFloat(document.getElementById('pos-discount').value) || 0;
                
                let subtotal = 0;
                posCart.forEach(item => subtotal += item.subtotal);
                const grandTotal = subtotal - discount;

                window.showPaymentModal('Pesanan Baru', grandTotal, async function(amountPaid, paymentMethod) {
                    const orderData = {
                        customerName: customerName,
                        discount: discount,
                        items: posCart,
                        grandTotal: grandTotal,
                        amountPaid: amountPaid,
                        paymentMethod: paymentMethod
                    };
                    
                    const orderId = await ipcRenderer.invoke('create-order', orderData);
                    
                    if (orderId) {
                        const kembalian = amountPaid - grandTotal;
                        alert(`Pesanan Lunas!\nKembalian: Rp ${kembalian.toLocaleString('id-ID')}`);
                        window.loadPage('order'); 
                    } else {
                        alert('Gagal membuat pesanan!');
                    }
                });
            });
        }
    } catch(e) { console.error(e); }
}

window.addToCart = function(id, name, price) {
    const exist = posCart.find(item => item.id === id);
    if (exist) {
        exist.qty += 1;
        exist.subtotal = exist.qty * exist.price;
    } else {
        posCart.push({ id, name, price, qty: 1, subtotal: price });
    }
    renderCart();
};

window.removeFromCart = function(index) {
    posCart.splice(index, 1);
    renderCart();
};

function renderCart() {
    const tbody = document.getElementById('pos-cart-body');
    if(!tbody) return;
    
    let subtotal = 0;
    if (posCart.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center;">Keranjang kosong</td></tr>`;
        document.getElementById('pos-subtotal').innerText = 'Rp 0';
        document.getElementById('pos-total').innerText = 'Rp 0';
        return;
    }

    tbody.innerHTML = posCart.map((item, index) => {
        subtotal += item.subtotal;
        return `
        <tr>
            <td style="padding: 5px;">${item.name}</td>
            <td style="padding: 5px;">${item.qty}</td>
            <td style="text-align: right; padding: 5px;">${item.subtotal.toLocaleString('id-ID')}</td>
            <td style="text-align: center;"><button onclick="removeFromCart(${index})" style="color:red; background:none; border:none; cursor:pointer;"><i class="fas fa-times"></i></button></td>
        </tr>`;
    }).join('');

    const discount = parseFloat(document.getElementById('pos-discount') ? document.getElementById('pos-discount').value : 0) || 0;
    document.getElementById('pos-subtotal').innerText = `Rp ${subtotal.toLocaleString('id-ID')}`;
    document.getElementById('pos-total').innerText = `Rp ${(subtotal - discount).toLocaleString('id-ID')}`;
}