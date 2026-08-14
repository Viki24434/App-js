const { getDbConnection } = require('../config/db');
const Finance = require('./Finance'); 
const STORE_ID = 1;

async function getAllOrders(date = null) {
    const db = await getDbConnection();
    let sql = `SELECT o.*, c.name as member_name, c.is_member 
               FROM orders o 
               LEFT JOIN customers c ON o.customer_id = c.id 
               WHERE o.store_id = ?`;
    let params = [STORE_ID];

    if (date) {
        sql += " AND DATE(o.created_at) = ?";
        params.push(date);
    }
    sql += " ORDER BY o.created_at DESC";
    const rows = await db.all(sql, params);
    return rows;
}

async function getOrderById(id) {
    const db = await getDbConnection();
    const row = await db.get("SELECT * FROM orders WHERE id = ?", [id]);
    return row;
}

async function getOrderItems(order_id) {
    const db = await getDbConnection();
    const rows = await db.all("SELECT oi.*, p.name as product_name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?", [order_id]);
    return rows;
}

async function createOrder(customer_name, items, tax_amount, discount, customer_id = 0) {
    const db = await getDbConnection();
    const invoice = 'INV-' + Date.now();
    let subtotal = 0;
    items.forEach(item => subtotal += (item.price * item.qty));
    const total_amount = (subtotal - discount) + tax_amount;

    const orderResult = await db.run(
        "INSERT INTO orders (store_id, customer_id, customer_name, invoice_number, total_amount, tax_amount, discount_amount, status, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', 'Belum Bayar')",
        [STORE_ID, customer_id, customer_name, invoice, total_amount, tax_amount, discount]
    );
    const order_id = orderResult.lastID;

    for (let item of items) {
        await db.run("INSERT INTO order_items (order_id, product_id, qty, price, subtotal) VALUES (?, ?, ?, ?, ?)", [order_id, item.product_id, item.qty, item.price, item.subtotal]);
        await db.run("UPDATE products SET stock = stock - ? WHERE id = ?", [item.qty, item.product_id]);
    }

    const cekTable = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='order_histories'");
    if (cekTable) {
        await db.run("INSERT INTO order_histories (order_id, status, description) VALUES (?, 'Pending', 'Pesanan baru dibuat')", [order_id]);
    }

    return order_id;
}

async function updateStatus(id, status) {
    const db = await getDbConnection();
    const result = await db.run("UPDATE orders SET status = ? WHERE id = ?", [status, id]);
    return result;
}

async function addPayment(order_id, user_id, method, amount) {
    const db = await getDbConnection();
    await db.run(
        "INSERT INTO payments (store_id, order_id, user_id, payment_method, amount) VALUES (?, ?, ?, ?, ?)", 
        [STORE_ID, order_id, user_id, method, amount]
    );
    
    const today = new Date().toISOString().split('T')[0];
    await Finance.updateBalance(today);

    const paidRow = await db.get("SELECT SUM(amount) as paid FROM payments WHERE order_id = ?", [order_id]);
    const paid = paidRow.paid || 0;
    const orderRow = await db.get("SELECT total_amount FROM orders WHERE id = ?", [order_id]);
    const total = orderRow.total_amount;
    
    const pS = (paid >= total) ? 'Lunas' : 'DP';
    await db.run("UPDATE orders SET payment_status = ? WHERE id = ?", [pS, order_id]);
}

module.exports = { getAllOrders, getOrderById, getOrderItems, createOrder, updateStatus, addPayment };