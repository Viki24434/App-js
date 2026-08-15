import { getDbConnection } from '../config/db.js';

async function getAll() {
    const db = await getDbConnection();
    const rows = await db.all("SELECT * FROM units ORDER BY name ASC");
    return rows;
}

async function create(data) {
    const db = await getDbConnection();
    const result = await db.run("INSERT INTO units (name, symbol) VALUES (?, ?)", [data.name, data.symbol]);
    return result;
}

async function remove(id) {
    const db = await getDbConnection();
    const result = await db.run("DELETE FROM units WHERE id = ?", [id]);
    return result;
}

async function update(id, data) {
    const db = await getDbConnection();
    const result = await db.run("UPDATE units SET name = ?, symbol = ? WHERE id = ?", [data.name, data.symbol, id]);
    return result;
}

export { getAll, create, remove, update };