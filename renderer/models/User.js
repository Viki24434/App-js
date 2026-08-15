import { getDbConnection } from '../config/db.js';
import bcrypt from 'bcrypt';
const STORE_ID = 1;

async function getAll() {
    const db = await getDbConnection();
    const rows = await db.all("SELECT id, name, username, role FROM users WHERE store_id = ? ORDER BY id DESC", [STORE_ID]);
    return rows;
}

async function getStats() {
    const db = await getDbConnection();
    const sql = `SELECT COUNT(*) AS total_users, 
                 SUM(CASE WHEN role = 'Admin' THEN 1 ELSE 0 END) AS total_admin,
                 SUM(CASE WHEN role = 'Kasir' THEN 1 ELSE 0 END) AS total_kasir
                 FROM users WHERE store_id = ?`;
    const row = await db.get(sql, [STORE_ID]);
    return row;
}

async function isUsernameTaken(username, excludeId = null) {
    const db = await getDbConnection();
    let sql = "SELECT id FROM users WHERE store_id = ? AND username = ?";
    let params = [STORE_ID, username];
    if (excludeId !== null) {
        sql += " AND id != ?";
        params.push(excludeId);
    }
    const rows = await db.all(sql, params);
    return rows.length > 0;
}

async function create(data) {
    const db = await getDbConnection();
    if (await isUsernameTaken(data.username)) return 'duplicate_username';
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const result = await db.run("INSERT INTO users (store_id, name, username, password, role) VALUES (?, ?, ?, ?, ?)", [STORE_ID, data.name, data.username, hashedPassword, data.role]);
    return result;
}

async function update(id, data) {
    const db = await getDbConnection();
    if (await isUsernameTaken(data.username, id)) return 'duplicate_username';
    
    if (data.password) {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const result = await db.run("UPDATE users SET name = ?, username = ?, password = ?, role = ? WHERE id = ? AND store_id = ?", [data.name, data.username, hashedPassword, data.role, id, STORE_ID]);
        return result;
    } else {
        const result = await db.run("UPDATE users SET name = ?, username = ?, role = ? WHERE id = ? AND store_id = ?", [data.name, data.username, data.role, id, STORE_ID]);
        return result;
    }
}

async function deleteUser(id, currentUserId) {
    const db = await getDbConnection();
    if (id == currentUserId) return 'cannot_delete_self';
    const result = await db.run("DELETE FROM users WHERE id = ? AND store_id = ?", [id, STORE_ID]);
    return result;
}

export { getAll, getStats, create, update, deleteUser };