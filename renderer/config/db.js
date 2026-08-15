import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbInstance = null;

async function getDbConnection() {
    if (!dbInstance) {
        dbInstance = await open({
            filename: path.join(__dirname, '..', 'db_percetakan.sqlite'),
            driver: sqlite3.verbose().Database
        });
        
        await dbInstance.run('PRAGMA foreign_keys = ON');
    }
    return dbInstance;
}

async function inisialisasiDatabase() {
    try {
        const db = await getDbConnection();

        const userTable = await db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='users'`);

        if (!userTable) {
            console.log('Menyiapkan struktur awal tabel dari database.sql...');
            
            const sqlFilePath = path.join(__dirname, '..', 'database.sql');
            
            if (fs.existsSync(sqlFilePath)) {
                try {
                    const sqlFileContent = fs.readFileSync(sqlFilePath, 'utf8');
                    await db.exec(sqlFileContent);
                    console.log('Berhasil mengimpor struktur dan data dari database.sql!');
                } catch (err) {
                    console.error('Gagal eksekusi database.sql:', err.message);
                }
            } else {
                console.error('Peringatan: File database.sql tidak ditemukan di direktori utama.');
            }
        } else {
            console.log('Struktur database sudah ada, melewati proses impor.');
        }
        
        try {
            const columns = await db.all(`PRAGMA table_info(products)`);
            if (columns.length > 0) {
                const hasImgColumn = columns.some(col => col.name === 'img');
                if (!hasImgColumn) {
                    console.log('Menambahkan kolom img ke tabel products...');
                    await db.run(`ALTER TABLE products ADD COLUMN img TEXT DEFAULT 'default.png'`);
                    console.log('Kolom img berhasil ditambahkan.');
                }
            }
        } catch (e) {
            console.error('Peringatan: Gagal mengecek/menambah kolom img:', e.message);
        }

        try {
            await db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                name TEXT, 
                username TEXT, 
                password TEXT, 
                role TEXT
            )`);
            
            const cekUser = await db.get("SELECT COUNT(*) as total FROM users");
            if (cekUser.total === 0) {
                await db.run("INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)", ['Administrator', 'admin', 'admin', 'Super Admin']);
            }
        } catch (e) {
            console.error('Gagal membuat atau mengecek user admin:', e.message);
        }

        console.log('Database SQLite siap digunakan.');
    } catch (error) {
        console.error('Gagal inisialisasi database SQLite:', error.message);
    }
}

export {
    getDbConnection,
    inisialisasiDatabase
};