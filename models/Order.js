const { pool } = require('../config/db');
const Finance = require('./Finance'); // Relasi ke Finance
const STORE_ID = 1;

async function getAllOrders(date = null) {
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
    const [rows] = await pool.query(sql, params);
    return rows;
}

async function getOrderById(id) {
    const [rows] = await pool.query("SELECT * FROM orders WHERE id = ?", [id]);
    return rows[0];
}

async function getOrderItems(order_id) {
    const [rows] = await pool.query("SELECT oi.*, p.name as product_name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?", [order_id]);
    return rows;
}

async function createOrder(customer_name, items, tax_amount, discount, customer_id = 0) {
    const invoice = 'INV-' + Date.now();
    let subtotal = 0;
    items.forEach(item => subtotal += (item.price * item.qty));
    const total_amount = (subtotal - discount) + tax_amount;

    const [orderResult] = await pool.query(
        "INSERT INTO orders (store_id, customer_id, customer_name, invoice_number, total_amount, tax_amount, discount_amount, status, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', 'Belum Bayar')",
        [STORE_ID, customer_id, customer_name, invoice, total_amount, tax_amount, discount]
    );
    const order_id = orderResult.insertId;

    for (let item of items) {
        await pool.query("INSERT INTO order_items (order_id, product_id, qty, price, subtotal) VALUES (?, ?, ?, ?, ?)", [order_id, item.product_id, item.qty, item.price, item.subtotal]);
        await pool.query("UPDATE products SET stock = stock - ? WHERE id = ?", [item.qty, item.product_id]);
    }

    const [cekTable] = await pool.query("SHOW TABLES LIKE 'order_histories'");
    if (cekTable.length > 0) {
        await pool.query("INSERT INTO order_histories (order_id, status, description) VALUES (?, 'Pending', 'Pesanan baru dibuat')", [order_id]);
    }

    return order_id;
}

async function updateStatus(id, status) {
    const [result] = await pool.query("UPDATE orders SET status = ? WHERE id = ?", [status, id]);
    return result;
}

async function addPayment(order_id, user_id, method, amount) {
    await pool.query(
        "INSERT INTO payments (store_id, order_id, user_id, payment_method, amount) VALUES (?, ?, ?, ?, ?)", 
        [STORE_ID, order_id, user_id, method, amount]
    );
    
    const today = new Date().toISOString().split('T')[0];
    await Finance.updateBalance(today);

    const [paidRows] = await pool.query("SELECT SUM(amount) as paid FROM payments WHERE order_id = ?", [order_id]);
    const paid = paidRows[0].paid || 0;
    const [orderRows] = await pool.query("SELECT total_amount FROM orders WHERE id = ?", [order_id]);
    const total = orderRows[0].total_amount;
    
    const pS = (paid >= total) ? 'Lunas' : 'DP';
    await pool.query("UPDATE orders SET payment_status = ? WHERE id = ?", [pS, order_id]);
}

module.exports = { getAllOrders, getOrderById, getOrderItems, createOrder, updateStatus, addPayment };