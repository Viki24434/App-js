const { getDbConnection } = require('../config/db');

async function getAll() {
    const db = await getDbConnection();
    const rows = await db.all("SELECT * FROM categories ORDER BY name ASC");
    return rows;
}

async function create(data) {
    const db = await getDbConnection();
    const result = await db.run("INSERT INTO categories (name) VALUES (?)", [data.name]);
    return result;
}

async function remove(id) {
    const db = await getDbConnection();
    const result = await db.run("DELETE FROM categories WHERE id = ?", [id]);
    return result;
}

async function update(id, data) {
    const db = await getDbConnection();
    const result = await db.run("UPDATE categories SET name = ? WHERE id = ?", [data.name, id]);
    return result;
}

module.exports = { getAll, create, remove, update };