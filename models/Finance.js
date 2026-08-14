const { getDbConnection } = require('../config/db');
const STORE_ID = 1;

async function updateBalance(date) {
    const db = await getDbConnection();
    const payRows = await db.all(`
        SELECT payment_method, SUM(amount) as total 
        FROM payments 
        WHERE DATE(created_at) = ? AND store_id = ?
        GROUP BY payment_method
    `, [date, STORE_ID]);

    let cr = 0, tr = 0, qr = 0;

    payRows.forEach(row => {
        if (row.payment_method === 'Cash') cr = parseFloat(row.total);
        else if (row.payment_method === 'Transfer') tr = parseFloat(row.total);
        else if (row.payment_method === 'QRIS') qr = parseFloat(row.total);
    });

    const sql = `
        INSERT INTO finance (store_id, date, cash_revenue, transfer_revenue, qris_revenue) 
        VALUES (?, ?, ?, ?, ?) 
        ON CONFLICT(store_id, date) DO UPDATE SET 
        cash_revenue = excluded.cash_revenue,
        transfer_revenue = excluded.transfer_revenue,
        qris_revenue = excluded.qris_revenue
    `;
                 
    await db.run(sql, [STORE_ID, date, cr, tr, qr]);
}

async function getSummary(startDate, endDate) {
    const db = await getDbConnection();
    const summaryQuery = `
        SELECT 
            SUM(cash_revenue + cash_income - cash_expenditure) as saldo_cash,
            SUM(transfer_revenue + transfer_income - transfer_expenditure) as saldo_tf,
            SUM(qris_revenue) as saldo_qris,
            SUM(cash_revenue) as omzet_cash,
            SUM(cash_income) as pemasukan_cash,
            SUM(cash_expenditure) as pengeluaran_cash,
            SUM(transfer_revenue) as omzet_tf,
            SUM(transfer_income) as pemasukan_tf,
            SUM(transfer_expenditure) as pengeluaran_tf
        FROM finance 
        WHERE store_id = ?
    `;

    const piutangQuery = `
        SELECT COALESCE(SUM(total_amount - COALESCE((SELECT SUM(amount) FROM payments WHERE order_id = orders.id), 0)), 0) as piutang 
        FROM orders 
        WHERE payment_status != 'Lunas' AND store_id = ?
    `;

    const tableQuery = `
        SELECT * FROM finance 
        WHERE store_id = ? AND date BETWEEN ? AND ? 
        ORDER BY date ASC
    `;

    const summaryRow = await db.get(summaryQuery, [STORE_ID]);
    const piutangRow = await db.get(piutangQuery, [STORE_ID]);
    const tableRows = await db.all(tableQuery, [STORE_ID, startDate, endDate]);

    return {
        summary: {
            ...summaryRow,
            piutang: piutangRow.piutang
        },
        cashflows: tableRows
    };
}

async function storeIncome(data) {
    const db = await getDbConnection();
    const column = data.payment_method === 'Cash' ? 'cash_income' : 'transfer_income';
    const query = `
        INSERT INTO finance (store_id, date, ${column}) 
        VALUES (?, ?, ?) 
        ON CONFLICT(store_id, date) DO UPDATE SET ${column} = ${column} + ?
    `;
    const result = await db.run(query, [STORE_ID, data.date, data.amount, data.amount]);
    return result;
}

async function storeExpenditure(data) {
    const db = await getDbConnection();
    const column = data.payment_method === 'Cash' ? 'cash_expenditure' : 'transfer_expenditure';
    const query = `
        INSERT INTO finance (store_id, date, ${column}) 
        VALUES (?, ?, ?) 
        ON CONFLICT(store_id, date) DO UPDATE SET ${column} = ${column} + ?
    `;
    const result = await db.run(query, [STORE_ID, data.date, data.amount, data.amount]);
    return result;
}

module.exports = { updateBalance, getSummary, storeIncome, storeExpenditure };