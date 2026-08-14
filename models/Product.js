const { getDbConnection } = require('../config/db');
const STORE_ID = 1;

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function generateUniqueCode(store_id) {
    const db = await getDbConnection();
    while (true) {
        const code = getRandomInt(100000, 999999).toString();
        const rows = await db.all("SELECT id FROM products WHERE store_id = ? AND product_code = ?", [store_id, code]);
        if (rows.length === 0) return code;
    }
}

async function getAll() {
    const db = await getDbConnection();
    const sql = `SELECT p.*, c.name as category_name, u.name as unit_name 
                 FROM products p 
                 LEFT JOIN categories c ON p.category_id = c.id 
                 LEFT JOIN units u ON p.unit_id = u.id 
                 WHERE p.store_id = ? ORDER BY p.id DESC`;
    const rows = await db.all(sql, [STORE_ID]);
    return rows;
}

async function getById(id) {
    const db = await getDbConnection();
    const row = await db.get("SELECT * FROM products WHERE id = ?", [id]);
    return row;
}

async function getByCategory(category_id) {
    const db = await getDbConnection();
    const rows = await db.all("SELECT id, name, price, stock FROM products WHERE category_id = ? AND store_id = ? AND stock > 0", [category_id, STORE_ID]);
    return rows;
}

async function create(data) {
    const db = await getDbConnection();
    let product_code = data.product_code || await generateUniqueCode(STORE_ID);
    
    const sql = "INSERT INTO products (store_id, category_id, unit_id, product_code, name, price, stock, img) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    const result = await db.run(sql, [
        STORE_ID, 
        data.category_id, 
        data.unit_id, 
        product_code, 
        data.name, 
        data.price, 
        data.stock, 
        data.img
    ]);
    return result;
}

async function update(id, data) {
    const db = await getDbConnection();
    let product_code = data.product_code ? data.product_code.trim() : '';
    if (!product_code) {
        product_code = await generateUniqueCode(STORE_ID);
    } else {
        const check = await db.all("SELECT id FROM products WHERE store_id = ? AND product_code = ? AND id != ?", [STORE_ID, product_code, id]);
        if (check.length > 0) product_code = await generateUniqueCode(STORE_ID);
    }

    const sql = "UPDATE products SET category_id = ?, unit_id = ?, product_code = ?, name = ?, purchase_price = ?, price = ?, stock = ?, img = ? WHERE id = ?";
    const result = await db.run(sql, [
        data.category_id,
        data.unit_id,
        product_code,
        data.name,
        data.purchase_price || 0,
        data.price,
        data.stock,
        data.img || null,
        id
    ]);
    return result;
}

async function deleteProduct(id) {
    const db = await getDbConnection();
    const result = await db.run("DELETE FROM products WHERE id = ?", [id]);
    return result;
}

async function updateStock(id, qty) {
    const db = await getDbConnection();
    const result = await db.run("UPDATE products SET stock = stock + ? WHERE id = ?", [qty, id]);
    return result;
}

module.exports = { getAll, getById, getByCategory, create, update, deleteProduct, updateStock };