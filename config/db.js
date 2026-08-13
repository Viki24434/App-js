
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'db_percetakan',
    port: 2026,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true
});

async function inisialisasiDatabase() {
    try {
        await pool.query(`CREATE DATABASE IF NOT EXISTS db_percetakan`);
        
        await pool.query(`USE db_percetakan`);

        const [rows] = await pool.query(`SHOW TABLES LIKE 'users'`);

        if (rows.length === 0) {
            console.log('Menyiapkan struktur awal tabel dari database.sql...');
            
            const sqlFilePath = path.join(__dirname, '..', 'database.sql');
            
            if (fs.existsSync(sqlFilePath)) {
                const sqlFileContent = fs.readFileSync(sqlFilePath, 'utf8');
                
                await pool.query(sqlFileContent);
                console.log('Berhasil mengimpor struktur dan data dari database.sql!');
            } else {
                console.error('Peringatan: File database.sql tidak ditemukan di direktori utama.');
            }
        } else {
            console.log('Struktur database sudah ada, melewati proses impor.');
        }
        
        try {
            const [colRows] = await pool.query("SHOW COLUMNS FROM products LIKE 'img'");
            if (colRows.length === 0) {
                console.log('Menambahkan kolom `img` ke tabel products...');
                await pool.query("ALTER TABLE products ADD COLUMN img varchar(255) DEFAULT 'default.png'");
                console.log('Kolom `img` berhasil ditambahkan.');
            }
        } catch (e) {
        }
        try {
            const [catCol] = await pool.query("SELECT EXTRA FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'id'");
            if (!catCol || catCol.length === 0 || (catCol[0].EXTRA || '').toLowerCase().indexOf('auto_increment') === -1) {
                try {
                    console.log('Memperbarui struktur kolom id pada tabel categories...');
                    await pool.query("ALTER TABLE categories MODIFY id int NOT NULL AUTO_INCREMENT PRIMARY KEY");
                } catch (e) {
                    console.warn('Gagal mengubah categories.id:', e.message);
                }
            }
        } catch (e) {
        }

        try {
            const [unitCol] = await pool.query("SELECT EXTRA FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'units' AND COLUMN_NAME = 'id'");
            if (!unitCol || unitCol.length === 0 || (unitCol[0].EXTRA || '').toLowerCase().indexOf('auto_increment') === -1) {
                try {
                    console.log('Memperbarui struktur kolom id pada tabel units...');
                    await pool.query("ALTER TABLE units MODIFY id int NOT NULL AUTO_INCREMENT PRIMARY KEY");
                } catch (e) {
                    console.warn('Gagal mengubah units.id:', e.message);
                }
            }
        } catch (e) {
        }
        console.log('Database MariaDB siap dan terhubung di port 2026.');
    } catch (error) {
        console.error('Gagal inisialisasi database MariaDB:', error.message);
    }
}

module.exports = {
    pool,
    inisialisasiDatabase
};