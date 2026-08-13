const ExcelJS = require('exceljs');

window.financeRawData = { summary: {}, cashflows: [] };

window.initFinancePage = async function() {
    try {
        const formatRp = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);
        const formatK = (angka) => (angka / 1000).toFixed(0) + 'K';

        const startDateInput = document.getElementById('fin-start-date');
        const endDateInput = document.getElementById('fin-end-date');
        
        if (!startDateInput.value) {
            const today = new Date();
            startDateInput.value = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
            endDateInput.value = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
        }

        const data = await ipcRenderer.invoke('get-finance-summary', {
            start: startDateInput.value,
            end: endDateInput.value
        });
        
        if (!data) return;
        window.financeRawData = data; 
        const summary = data.summary;
        const cashflows = data.cashflows;

        document.getElementById('fin-saldo-kas').innerText = formatRp(summary.saldo_cash);
        document.getElementById('fin-breakdown-kas').innerHTML = `Jual: ${formatK(summary.omzet_cash)} | Masuk: ${formatK(summary.pemasukan_cash)} | Keluar: <span style="color:#ffb3b3;">${formatK(summary.pengeluaran_cash)}</span>`;
        
        document.getElementById('fin-saldo-tf').innerText = formatRp(summary.saldo_tf);
        document.getElementById('fin-breakdown-tf').innerHTML = `Jual: ${formatK(summary.omzet_tf)} | Masuk: ${formatK(summary.pemasukan_tf)} | Keluar: <span style="color:#ffb3b3;">${formatK(summary.pengeluaran_tf)}</span>`;
        
        document.getElementById('fin-saldo-qris').innerText = formatRp(summary.saldo_qris);
        document.getElementById('fin-piutang').innerText = formatRp(summary.piutang);

        const tbody = document.getElementById('finance-table-body');
        if (cashflows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">Belum ada data keuangan di rentang tanggal ini.</td></tr>';
            return;
        }

        let run_cash = parseFloat(summary.saldo_cash);
        let run_tf = parseFloat(summary.saldo_tf);
        let run_qris = parseFloat(summary.saldo_qris);

        tbody.innerHTML = cashflows.map(row => {
            const s_cash = run_cash;
            const s_tf = run_tf;
            const s_qris = run_qris;

            const m_cash = parseFloat(row.cash_revenue || 0) + parseFloat(row.cash_income || 0);
            const m_tf = parseFloat(row.transfer_revenue || 0) + parseFloat(row.transfer_income || 0);
            const m_qris = parseFloat(row.qris_revenue || 0);
            
            const k_cash = parseFloat(row.cash_expenditure || 0);
            const k_tf = parseFloat(row.transfer_expenditure || 0);

            run_cash -= (m_cash - k_cash);
            run_tf -= (m_tf - k_tf);
            run_qris -= m_qris;

            return `
                <tr>
                    <td style="border-right: 1px solid var(--border-color); font-weight: 600;">${new Date(row.date).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})}</td>
                    <td class="td-masuk">${formatRp(m_cash)}</td>
                    <td class="td-masuk">${formatRp(m_tf)}</td>
                    <td class="td-masuk" style="border-right: 1px solid var(--border-color); color: #8b5cf6;">${formatRp(m_qris)}</td>
                    
                    <td class="td-keluar">${formatRp(k_cash)}</td>
                    <td class="td-keluar" style="border-right: 1px solid var(--border-color);">${formatRp(k_tf)}</td>
                    
                    <td class="td-saldo" style="color: #10b981;">${formatRp(s_cash)}</td>
                    <td class="td-saldo" style="color: #0ea5e9;">${formatRp(s_tf)}</td>
                    <td class="td-saldo" style="color: #8b5cf6;">${formatRp(s_qris)}</td>
                </tr>
            `;
        }).join('');

        const form = document.getElementById('form-finance');
        if(!form._attached) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const type = document.getElementById('modal-fin-type').value;
                const dataInsert = {
                    date: document.getElementById('modal-fin-date').value,
                    description: document.getElementById('modal-fin-desc').value,
                    amount: document.getElementById('modal-fin-amount').value,
                    payment_method: document.getElementById('modal-fin-method').value
                };

                const endpoint = type === 'Income' ? 'store-income' : 'store-expenditure';
                const success = await ipcRenderer.invoke(endpoint, dataInsert);
                if(success) {
                    window.closeFinanceModal();
                    window.initFinancePage();
                }
            });
            form._attached = true;
        }

    } catch (e) {}
};

window.openFinanceModal = function(type) {
    const modal = document.getElementById('modal-finance');
    const title = document.getElementById('modal-fin-title');
    const btn = document.getElementById('btn-submit-finance');
    const typeInput = document.getElementById('modal-fin-type');
    
    document.getElementById('modal-fin-date').value = new Date().toISOString().split('T')[0];
    typeInput.value = type;

    if(type === 'Income') {
        title.innerHTML = '<i class="fas fa-hand-holding-usd" style="color: #0ea5e9;"></i> Tambah Pemasukan';
        btn.innerHTML = '<i class="fas fa-save"></i> Simpan Pemasukan';
        btn.style.background = '#0ea5e9';
    } else {
        title.innerHTML = '<i class="fas fa-file-invoice-dollar" style="color: #ef4444;"></i> Catat Pengeluaran';
        btn.innerHTML = '<i class="fas fa-save"></i> Simpan Pengeluaran';
        btn.style.background = '#ef4444';
    }
    
    modal.classList.add('active');
};

window.closeFinanceModal = function() {
    document.getElementById('modal-finance').classList.remove('active');
    document.getElementById('form-finance').reset();
};

window.exportFinanceToExcel = async function() {
    const data = window.financeRawData;
    if(!data || !data.cashflows || data.cashflows.length === 0) return;

    const sessionData = JSON.parse(localStorage.getItem('pos_session') || '{}');
    const storeName = sessionData.store_name || 'Toko Saya';
    const startDate = document.getElementById('fin-start-date').value;
    const endDate = document.getElementById('fin-end-date').value;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Laporan Kas', {views: [{showGridLines: false}]});

    sheet.mergeCells('A1:I1');
    sheet.getCell('A1').value = 'LAPORAN ARUS KAS & BUKU KEUANGAN';
    sheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

    sheet.mergeCells('A2:I2');
    sheet.getCell('A2').value = `Toko: ${storeName}  |  Periode: ${startDate} s/d ${endDate}`;
    sheet.getCell('A2').font = { size: 11, italic: true };
    sheet.getCell('A2').alignment = { horizontal: 'center' };
    
    sheet.addRow([]);

    sheet.mergeCells('A4:A5'); sheet.getCell('A4').value = 'TANGGAL';
    sheet.mergeCells('B4:D4'); sheet.getCell('B4').value = 'OMZET & PEMASUKAN (+)';
    sheet.getCell('B4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
    sheet.getCell('B4').font = { color: { argb: 'FF16A34A' }, bold: true };
    
    sheet.mergeCells('E4:F4'); sheet.getCell('E4').value = 'PENGELUARAN (-)';
    sheet.getCell('E4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
    sheet.getCell('E4').font = { color: { argb: 'FFDC2626' }, bold: true };
    
    sheet.mergeCells('G4:I4'); sheet.getCell('G4').value = 'SALDO AKHIR HARIAN';
    sheet.getCell('G4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    sheet.getCell('G4').font = { color: { argb: 'FF334155' }, bold: true };

    sheet.getCell('B5').value = 'Cash Laci'; sheet.getCell('C5').value = 'Transfer Bank'; sheet.getCell('D5').value = 'QRIS';
    sheet.getCell('E5').value = 'Cash Laci'; sheet.getCell('F5').value = 'Transfer Bank';
    sheet.getCell('G5').value = 'Sisa Cash'; sheet.getCell('H5').value = 'Sisa Transfer'; sheet.getCell('I5').value = 'Sisa QRIS';

    ['A4','B4','E4','G4','B5','C5','D5','E5','F5','G5','H5','I5'].forEach(cellRef => {
        let cell = sheet.getCell(cellRef);
        cell.font = cell.font || { bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = { top: {style:'medium', color:{argb:'FFCBD5E1'}}, left: {style:'thin', color:{argb:'FFCBD5E1'}}, bottom: {style:'medium', color:{argb:'FFCBD5E1'}}, right: {style:'thin', color:{argb:'FFCBD5E1'}} };
    });

    let run_cash = parseFloat(data.summary.saldo_cash);
    let run_tf = parseFloat(data.summary.saldo_tf);
    let run_qris = parseFloat(data.summary.saldo_qris);

    data.cashflows.forEach((row, index) => {
        let m_cash = parseFloat(row.cash_revenue||0) + parseFloat(row.cash_income||0);
        let m_tf = parseFloat(row.transfer_revenue||0) + parseFloat(row.transfer_income||0);
        let m_qris = parseFloat(row.qris_revenue||0);
        let k_cash = parseFloat(row.cash_expenditure||0);
        let k_tf = parseFloat(row.transfer_expenditure||0);

        let s_cash = run_cash; let s_tf = run_tf; let s_qris = run_qris;
        run_cash -= (m_cash - k_cash); run_tf -= (m_tf - k_tf); run_qris -= m_qris;

        // Mengonversi objek waktu ke format YYYY-MM-DD
        const tgl = new Date(row.date);
        const formatTgl = `${tgl.getFullYear()}-${String(tgl.getMonth() + 1).padStart(2, '0')}-${String(tgl.getDate()).padStart(2, '0')}`;

        const dataRow = sheet.addRow([formatTgl, m_cash, m_tf, m_qris, k_cash, k_tf, s_cash, s_tf, s_qris]);

        let isEven = index % 2 === 0;
        dataRow.eachCell((cell, colNum) => {
            if(isEven) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
            cell.border = { bottom: {style:'thin', color:{argb:'FFE2E8F0'}}, left: {style:'thin', color:{argb:'FFE2E8F0'}}, right: {style:'thin', color:{argb:'FFE2E8F0'}} };
            if (colNum > 1) cell.numFmt = 'Rp #,##0';
        });

        dataRow.getCell(2).font = {color: {argb: 'FF16A34A'}}; dataRow.getCell(3).font = {color: {argb: 'FF16A34A'}}; dataRow.getCell(4).font = {color: {argb: 'FF16A34A'}};
        dataRow.getCell(5).font = {color: {argb: 'FFDC2626'}}; dataRow.getCell(6).font = {color: {argb: 'FFDC2626'}};
        dataRow.getCell(7).font = {bold: true}; dataRow.getCell(8).font = {bold: true}; dataRow.getCell(9).font = {bold: true};
    });

    sheet.getColumn(1).width = 15;
    for(let i = 2; i <= 9; i++) sheet.getColumn(i).width = 18;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `Rekap_Keuangan_${startDate}_sd_${endDate}.xlsx`;
    a.click(); window.URL.revokeObjectURL(url);
};