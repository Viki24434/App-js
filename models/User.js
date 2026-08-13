const { pool } = require('../config/db');
const bcrypt = require('bcrypt'); // Pastikan sudah "npm install bcrypt"
const STORE_ID = 1;

async function getAll() {
    const [rows] = await pool.query("SELECT id, name, username, role FROM users WHERE store_id = ? ORDER BY id DESC", [STORE_ID]);
    return rows;
}

async function getStats() {
    const sql = `SELECT COUNT(*) AS total_users, 
                 SUM(CASE WHEN role = 'Admin' THEN 1 ELSE 0 END) AS total_admin,
                 SUM(CASE WHEN role = 'Kasir' THEN 1 ELSE 0 END) AS total_kasir
                 FROM users WHERE store_id = ?`;
    const [rows] = await pool.query(sql, [STORE_ID]);
    return rows[0];
}

async function isUsernameTaken(username, excludeId = null) {
    let sql = "SELECT id FROM users WHERE store_id = ? AND username = ?";
    let params = [STORE_ID, username];
    if (excludeId !== null) {
        sql += " AND id != ?";
        params.push(excludeId);
    }
    const [rows] = await pool.query(sql, params);
    return rows.length > 0;
}

async function create(data) {
    if (await isUsernameTaken(data.username)) return 'duplicate_username';
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const [result] = await pool.query("INSERT INTO users (store_id, name, username, password, role) VALUES (?, ?, ?, ?, ?)", [STORE_ID, data.name, data.username, hashedPassword, data.role]);
    return result;
}

async function update(id, data) {
    if (await isUsernameTaken(data.username, id)) return 'duplicate_username';
    
    if (data.password) {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const [result] = await pool.query("UPDATE users SET name = ?, username = ?, password = ?, role = ? WHERE id = ? AND store_id = ?", [data.name, data.username, hashedPassword, data.role, id, STORE_ID]);
        return result;
    } else {
        const [result] = await pool.query("UPDATE users SET name = ?, username = ?, role = ? WHERE id = ? AND store_id = ?", [data.name, data.username, data.role, id, STORE_ID]);
        return result;
    }
}

async function deleteUser(id, currentUserId) {
    if (id == currentUserId) return 'cannot_delete_self';
    const [result] = await pool.query("DELETE FROM users WHERE id = ? AND store_id = ?", [id, STORE_ID]);
    return result;
}

module.exports = { getAll, getStats, create, update, deleteUser };