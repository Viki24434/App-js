const { pool } = require('../config/db');

async function getAll() {
    const [rows] = await pool.query("SELECT * FROM units ORDER BY name ASC");
    return rows;
}

async function create(data) {
    const [result] = await pool.query("INSERT INTO units (name, symbol) VALUES (?, ?)", [data.name, data.symbol]);
    return result;
}

async function remove(id) {
    const [result] = await pool.query("DELETE FROM units WHERE id = ?", [id]);
    return result;
}

async function update(id, data) {
    const [result] = await pool.query("UPDATE units SET name = ?, symbol = ? WHERE id = ?", [data.name, data.symbol, id]);
    return result;
}

module.exports = { getAll, create, remove, update };