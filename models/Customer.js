const { getDbConnection } = require('../config/db');
const STORE_ID = 1;

async function getCustomers() {
    const db = getDbConnection();
    const [rows] = await db.all("SELECT * FROM customers WHERE store_id = ? ORDER BY name ASC", [STORE_ID]);
    return rows;
}

async function addCustomer(data) {
    const db = getDbConnection();
    const [result] = await db.run(
        "INSERT INTO customers (store_id, name, phone, address, is_member) VALUES (?, ?, ?, ?, ?)",
        [STORE_ID, data.name, data.phone, data.address, data.is_member]
    );
    return result;
}

async function updateCustomer(data) {
    const db = getDbConnection();
    const [result] = await db.run(
        "UPDATE customers SET name=?, phone=?, address=?, is_member=? WHERE id=? AND store_id=?",
        [data.name, data.phone, data.address, data.is_member, data.id, STORE_ID]
    );
    return result;
}

async function deleteCustomer(id) {
    const db = getDbConnection();
    const [result] = await db.run("DELETE FROM customers WHERE id=? AND store_id=?", [id, STORE_ID]);
    return result;
}

module.exports = { getCustomers, addCustomer, updateCustomer, deleteCustomer };