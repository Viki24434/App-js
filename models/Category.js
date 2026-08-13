const { pool } = require('../config/db');

async function getAll() {
    const [rows] = await pool.query("SELECT * FROM categories ORDER BY name ASC");
    return rows;
}

async function create(data) {
    const [result] = await pool.query("INSERT INTO categories (name) VALUES (?)", [data.name]);
    return result;
}

async function remove(id) {
    const [result] = await pool.query("DELETE FROM categories WHERE id = ?", [id]);
    return result;
}

async function update(id, data) {
    const [result] = await pool.query("UPDATE categories SET name = ? WHERE id = ?", [data.name, id]);
    return result;
}

module.exports = { getAll, create, remove, update };