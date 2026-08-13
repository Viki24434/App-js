const { pool } = require('../config/db');
const STORE_ID = 1;

async function updateBalance(date) {
    const [payRows] = await pool.query(`
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
        ON DUPLICATE KEY UPDATE 
        cash_revenue = VALUES(cash_revenue),
        transfer_revenue = VALUES(transfer_revenue),
        qris_revenue = VALUES(qris_revenue)
    `;
                 
    await pool.query(sql, [STORE_ID, date, cr, tr, qr]);
}

async function getSummary(startDate, endDate) {
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

    const [summaryRows] = await pool.query(summaryQuery, [STORE_ID]);
    const [piutangRows] = await pool.query(piutangQuery, [STORE_ID]);
    const [tableRows] = await pool.query(tableQuery, [STORE_ID, startDate, endDate]);

    return {
        summary: {
            ...summaryRows[0],
            piutang: piutangRows[0].piutang
        },
        cashflows: tableRows
    };
}

async function storeIncome(data) {
    const column = data.payment_method === 'Cash' ? 'cash_income' : 'transfer_income';
    const query = `
        INSERT INTO finance (store_id, date, ${column}) 
        VALUES (?, ?, ?) 
        ON DUPLICATE KEY UPDATE ${column} = ${column} + ?
    `;
    const [result] = await pool.query(query, [STORE_ID, data.date, data.amount, data.amount]);
    return result;
}

async function storeExpenditure(data) {
    const column = data.payment_method === 'Cash' ? 'cash_expenditure' : 'transfer_expenditure';
    const query = `
        INSERT INTO finance (store_id, date, ${column}) 
        VALUES (?, ?, ?) 
        ON DUPLICATE KEY UPDATE ${column} = ${column} + ?
    `;
    const [result] = await pool.query(query, [STORE_ID, data.date, data.amount, data.amount]);
    return result;
}

module.exports = { updateBalance, getSummary, storeIncome, storeExpenditure };