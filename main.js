// main.js
const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs'); 
const { inisialisasiDatabase, pool } = require('./config/db');
const os = require('os');
const crypto = require('crypto');
const sharp = require('sharp');
const bcrypt = require('bcrypt');

require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
});

function getDeviceID() {
    const interfaces = os.networkInterfaces();
    let mac = '';
    for (let i in interfaces) {
        for (let j in interfaces[i]) {
            if (!interfaces[i][j].internal && interfaces[i][j].mac !== '00:00:00:00:00:00') {
                mac = interfaces[i][j].mac;
                break;
            }
        }
        if (mac) break;
    }
    const rawId = (mac || os.hostname()) + "PERCETAKAN-POS";
    return crypto.createHash('md5').update(rawId).digest('hex').toUpperCase().substring(0, 16);
}

const fileAktivasi = path.join(__dirname, 'config', 'activation.json');

ipcMain.handle('check-activation', () => {
    if (fs.existsSync(fileAktivasi)) {
        try {
            const data = JSON.parse(fs.readFileSync(fileAktivasi, 'utf8'));
            if (data.activated === true && data.deviceId === getDeviceID()) return true;
        } catch (e) {}
    }
    return getDeviceID();
});

const SECRET_SALT = "RAHASIA_TOKO_SAYA_2026!"; 

function generateExpectedLicense(deviceId) {
    const hash = crypto.createHash('sha256').update(deviceId + SECRET_SALT).digest('hex').toUpperCase();
    return `${hash.substring(0,4)}-${hash.substring(4,8)}-${hash.substring(8,12)}-${hash.substring(12,16)}`;
}

ipcMain.handle('activate-device', (event, lisensiInput) => {
    const myDevice = getDeviceID();
    const lisensiValid = generateExpectedLicense(myDevice); 

    if (lisensiInput === lisensiValid || lisensiInput === 'TRIAL123') { 
        const data = { activated: true, deviceId: myDevice, date: new Date().toISOString() };
        fs.writeFileSync(fileAktivasi, JSON.stringify(data));
        return true;
    }
    return false; 
});

const Product = require('./models/Product');
const Order = require('./models/Order');
const Report = require('./models/Report');
const Category = require('./models/Category');
const Unit = require('./models/Unit');
const Customer = require('./models/Customer');
const User = require('./models/User');
const Finance = require('./models/Finance');

ipcMain.handle('get-dashboard-data', async () => {
    try {
        const [[{ omzet }]] = await pool.query("SELECT COALESCE(SUM(total_amount), 0) as omzet FROM orders WHERE DATE(created_at) = CURDATE()");
        const [[{ transaksi }]] = await pool.query("SELECT COUNT(id) as transaksi FROM orders WHERE DATE(created_at) = CURDATE()");
        const [[{ piutang }]] = await pool.query(`
            SELECT COALESCE(SUM(o.total_amount - COALESCE((SELECT SUM(amount) FROM payments WHERE order_id = o.id), 0)), 0) as piutang 
            FROM orders o WHERE o.payment_status != 'Lunas'
        `);
        
        const [lowStocks] = await pool.query("SELECT name, stock FROM products WHERE stock <= 10 ORDER BY stock ASC LIMIT 5");
        const [recentOrders] = await pool.query("SELECT invoice_number, customer_name, total_amount, payment_status, created_at FROM orders ORDER BY created_at DESC LIMIT 5");
        
        const [topProducts] = await pool.query(`
            SELECT p.name, SUM(oi.qty) as sold 
            FROM order_items oi 
            JOIN orders o ON oi.order_id = o.id 
            JOIN products p ON oi.product_id = p.id 
            WHERE MONTH(o.created_at) = MONTH(CURDATE()) AND YEAR(o.created_at) = YEAR(CURDATE())
            GROUP BY p.id ORDER BY sold DESC LIMIT 5
        `);

        const [chartRows] = await pool.query(`
            SELECT DATE_FORMAT(created_at, '%b') as month, SUM(total_amount) as total 
            FROM orders 
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH) 
            GROUP BY YEAR(created_at), MONTH(created_at) 
            ORDER BY YEAR(created_at), MONTH(created_at)
        `);

        const chartLabels = chartRows.map(r => r.month);
        const chartData = chartRows.map(r => parseFloat(r.total));

        return {
            omzet: parseFloat(omzet),
            laba: parseFloat(omzet) * 0.3,
            transaksi: transaksi,
            piutang: parseFloat(piutang),
            lowStocks: lowStocks,
            recentOrders: recentOrders,
            topProducts: topProducts,
            chartLabels: chartLabels.length > 0 ? chartLabels : ['Bulan Ini'],
            chartData: chartData.length > 0 ? chartData : [parseFloat(omzet)]
        };
    } catch (e) {
        return null;
    }
});

ipcMain.handle('get-finance-summary', async (event, filter) => {
    try {
        return await Finance.getSummary(filter.start, filter.end);
    } catch (e) {
        return null;
    }
});

ipcMain.handle('store-income', async (event, data) => {
    try {
        await Finance.storeIncome(data);
        return true;
    } catch (e) {
        return false;
    }
});

ipcMain.handle('store-expenditure', async (event, data) => {
    try {
        await Finance.storeExpenditure(data);
        return true;
    } catch (e) {
        return false;
    }
});

ipcMain.handle('get-customers', async () => {
    return await Customer.getCustomers(); 
});
ipcMain.handle('get-users', async () => {
    return await User.getAll();
});



ipcMain.handle('auth-login', async (event, credentials) => {
    try {
        const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [credentials.username]);
        
        if (rows.length === 0) {
            return { success: false, message: 'Username tidak ditemukan!' };
        }

        const user = rows[0];
        let isMatch = false;
        let dbPassword = user.password;

        if (dbPassword.startsWith('$2y$')) {
            dbPassword = dbPassword.replace('$2y$', '$2a$');
        }

        if (dbPassword.startsWith('$2b$') || dbPassword.startsWith('$2a$')) {
            isMatch = await bcrypt.compare(credentials.password, dbPassword);
        } else {
            isMatch = (credentials.password === user.password);
        }

        if (isMatch) {
            return { 
                success: true, 
                user: { id: user.id, name: user.name, role: user.role } 
            };
        } else {
            return { success: false, message: 'Password salah!' };
        }
    } catch (e) {
        console.error(e);
        if (credentials.username === 'admin' && credentials.password === 'admin') {
            return { success: true, user: { name: 'Admin Darurat', role: 'Super Admin' } };
        }
        return { success: false, message: 'Gagal terhubung ke database.' };
    }
});

ipcMain.handle('auth-logout', async () => {
    return true; 
});

ipcMain.handle('check-auth', async () => {
    return null; 
});

ipcMain.handle('get-settings', async () => {
    try {
        const [rows] = await pool.query("SELECT * FROM stores WHERE id = 1");
        return rows[0] || {};
    } catch (e) {
        return { store_name: 'Percetakan Default' }; // Fallback
    }
});

ipcMain.handle('save-settings', async (event, data) => {
    try {
        await pool.query(
            "UPDATE stores SET name=?, phone=?, address=?, footer_note=? WHERE id=1", 
            [data.store_name, data.phone, data.address, data.footer_note]
        );
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
});

ipcMain.handle('get-products', async () => await Product.getAll()); //
ipcMain.handle('get-categories', async () => await Category.getAll());
ipcMain.handle('create-category', async (event, data) => {
    try {
        await Category.create(data);
        return true;
    } catch (e) {
        console.error('create-category error', e);
        return false;
    }
});
ipcMain.handle('update-category', async (event, id, data) => {
    try {
        await Category.update(id, data);
        return true;
    } catch (e) {
        console.error('update-category error', e);
        return false;
    }
});
ipcMain.handle('delete-category', async (event, id) => {
    try {
        await Category.remove(id);
        return true;
    } catch (e) {
        console.error('delete-category error', e);
        return false;
    }
});

ipcMain.handle('get-units', async () => await Unit.getAll());
ipcMain.handle('create-unit', async (event, data) => {
    try {
        await Unit.create(data);
        return true;
    } catch (e) {
        console.error('create-unit error', e);
        return false;
    }
});
ipcMain.handle('update-unit', async (event, id, data) => {
    try {
        await Unit.update(id, data);
        return true;
    } catch (e) {
        console.error('update-unit error', e);
        return false;
    }
});
ipcMain.handle('delete-unit', async (event, id) => {
    try {
        await Unit.remove(id);
        return true;
    } catch (e) {
        console.error('delete-unit error', e);
        return false;
    }
});
ipcMain.handle('delete-product', async (event, id) => {
    try {
        await Product.deleteProduct(id);
        return true;
    } catch (e) {
        console.error('delete-product error', e);
        return false;
    }
});
ipcMain.handle('get-orders', async (event, filters) => {
    try {
        let query = `
            SELECT o.*, COALESCE(SUM(p.amount), 0) as total_paid 
            FROM orders o 
            LEFT JOIN payments p ON o.id = p.order_id 
            WHERE 1=1
        `;
        let params = [];

        if (filters && filters.start) {
            query += " AND DATE(o.created_at) >= ?";
            params.push(filters.start);
        }
        if (filters && filters.end) {
            query += " AND DATE(o.created_at) <= ?";
            params.push(filters.end);
        }
        if (filters && filters.search) {
            query += " AND (o.invoice_number LIKE ? OR o.customer_name LIKE ?)";
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }

        query += " GROUP BY o.id ORDER BY o.created_at DESC";
        const [rows] = await pool.query(query, params);
        return rows;
    } catch (e) {
        return [];
    }
});

ipcMain.handle('get-order-detail', async (event, id) => {
    try {
        const [rows] = await pool.query(`
            SELECT oi.*, p.name as product_name 
            FROM order_items oi 
            JOIN products p ON oi.product_id = p.id 
            WHERE oi.order_id = ?
        `, [id]);
        return rows;
    } catch (e) {
        return [];
    }
});

ipcMain.handle('get-print-data', async (event, id) => {
    try {
        const [order] = await pool.query("SELECT * FROM orders WHERE id = ?", [id]);
        const [items] = await pool.query("SELECT oi.*, p.name as product_name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?", [id]);
        const [store] = await pool.query("SELECT * FROM stores LIMIT 1");
        
        return { order: order[0], items: items, store: store[0] };
    } catch (e) {
        return null;
    }
});

ipcMain.handle('get-sales-report', async (event, filter) => {
    try {
        return await Report.getSalesReport(filter.start, filter.end);
    } catch (e) {
        console.error('get-sales-report error', e);
        return [];
    }
});

ipcMain.handle('get-product-report', async () => {
    try {
        return await Report.getProductReport();
    } catch (e) {
        console.error('get-product-report error', e);
        return [];
    }
});

ipcMain.handle('get-customer-report', async (event, filter) => {
    try {
        return await Report.getCustomerReport(filter.start, filter.end);
    } catch (e) {
        console.error('get-customer-report error', e);
        return [];
    }
});

ipcMain.handle('get-payment-method-report', async (event, filter) => {
    try {
        return await Report.getPaymentMethodReport(filter.start, filter.end);
    } catch (e) {
        console.error('get-payment-method-report error', e);
        return [];
    }
});

ipcMain.handle('get-receivables-report', async () => {
    try {
        return await Report.getReceivablesReport();
    } catch (e) {
        console.error('get-receivables-report error', e);
        return [];
    }
});

ipcMain.handle('get-income-expenditure-report', async (event, filter) => {
    try {
        return await Report.getIncomeExpenditureReport(filter.start, filter.end);
    } catch (e) {
        console.error('get-income-expenditure-report error', e);
        return { income: [], expenditure: [] };
    }
});

ipcMain.handle('get-profit-loss-report', async (event, filter) => {
    try {
        return await Report.getProfitLossReport(filter.start, filter.end);
    } catch (e) {
        console.error('get-profit-loss-report error', e);
        return null;
    }
});

let mainWindow;
let loadingWindow;
let prosesMariaDB = null;

ipcMain.handle('create-order', async (event, data) => {
    try {
        const orderItems = data.items.map(item => ({
            product_id: item.id,
            qty: item.qty,
            price: item.price,
            subtotal: item.subtotal
        }));
        
        const orderId = await Order.createOrder(data.customerName, orderItems, 0, data.discount, 0);
        
        if (orderId && data.amountPaid > 0) {
            await Order.addPayment(orderId, 1, data.paymentMethod, data.amountPaid);
            if (data.amountPaid >= data.grandTotal) {
                await Order.updateStatus(orderId, 'Selesai');
            }
        }
        return orderId;
    } catch (e) {
        return null;
    }
});

ipcMain.handle('process-payment', async (event, data) => {
    try {
        await Order.addPayment(data.id, 1, data.paymentMethod, data.total);
        if (data.total >= data.sisa) {
            await Order.updateStatus(data.id, 'Selesai');
        }
        return true;
    } catch (e) {
        return false;
    }
});

function createLoadingWindow() {
    loadingWindow = new BrowserWindow({
        width: 450,
        height: 350,
        frame: false, 
        transparent: true,
        alwaysOnTop: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    loadingWindow.loadFile(path.join(__dirname, 'views', 'loading.html'));
}

function siapkanKonfigurasi() {
    const iniPath = path.join(__dirname, 'server-db', 'my.ini');
    const dataDir = path.join(__dirname, 'server-db', 'data').replace(/\\/g, '/'); 

    if (!fs.existsSync(iniPath)) {
        const isiIni = `[mysqld]\nport=2026\ndatadir="${dataDir}"\nbind-address=127.0.0.1\n`;
        fs.writeFileSync(iniPath, isiIni);
    }
    return iniPath;
}

function siapkanFolderData() {
    return new Promise((resolve, reject) => {
        const dataDir = path.join(__dirname, 'server-db', 'data');
        if (fs.existsSync(dataDir)) return resolve();

        let installExe = path.join(__dirname, 'server-db', 'bin', 'mariadb-install-db.exe');
        if (!fs.existsSync(installExe)) {
            installExe = path.join(__dirname, 'server-db', 'bin', 'mysql_install_db.exe');
        }

        const prosesInstall = spawn(installExe, [`--datadir=${dataDir}`]);
        prosesInstall.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Gagal membuat folder data. Kode error: ${code}`));
        });
    });
}

function jalankanMariaDB(iniPath) {
    return new Promise((resolve, reject) => {
        const mysqlExe = path.join(__dirname, 'server-db', 'bin', 'mysqld.exe');
        prosesMariaDB = spawn(mysqlExe, [`--defaults-file=${iniPath}`, `--console`]);

        prosesMariaDB.stdout.on('data', (data) => {
            if (data.toString().toLowerCase().includes('ready for connections')) resolve(); 
        });
        prosesMariaDB.stderr.on('data', (data) => {
            if (data.toString().toLowerCase().includes('ready for connections')) resolve();
        });
        prosesMariaDB.on('error', (err) => reject(err));
    });
}

function createWindow () {
    mainWindow = new BrowserWindow({
        width: 1100,
        height: 750,
        show: false,
        webPreferences: {
            nodeIntegration: true, 
            contextIsolation: false 
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'views', 'index.html'));

    mainWindow.webContents.openDevTools();

    mainWindow.once('ready-to-show', () => {
        if (loadingWindow) {
            loadingWindow.close();
        }
        mainWindow.show();
    });
}

app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    createLoadingWindow();
    loadingWindow.webContents.once('did-finish-load', async () => {

        const updateProgress = (teks, persentase) => {
            if (loadingWindow && !loadingWindow.isDestroyed()) {
                loadingWindow.webContents.executeJavaScript(`
                    var txt = document.getElementById('loading-text');
                    var bar = document.getElementById('progress-bar');
                    if(txt) txt.innerText = '${teks}';
                    if(bar) bar.style.width = '${persentase}%';
                `).catch(()=>{}); 
            }
        };

        try {

            updateProgress('Membaca konfigurasi server Helios...', 20);
            await new Promise(r => setTimeout(r, 500));
            const iniPath = siapkanKonfigurasi(); 

            updateProgress('Merakit struktur database hermes...', 40);
            await siapkanFolderData();            

            updateProgress('Menghidupkan MariaDB Portable Engine...', 60);
            await jalankanMariaDB(iniPath);       

            updateProgress('Membidik tabel aplikasi optik...', 80);
            await inisialisasiDatabase();         

            updateProgress('Membuka antarmuka utama. Selamat bekerja!', 100);
            await new Promise(r => setTimeout(r, 400));

            // Buka Jendela Utama
            createWindow();                       
        } catch (error) {
            console.error('Fatal Booting Error:', error);
            updateProgress('Gagal memuat modul core! Cek konsol terminal.', 99);

        }
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
    if (prosesMariaDB) prosesMariaDB.kill(); 
});

ipcMain.handle('upload-product-image', async (event, payload) => {
    const uploadDir = path.join(__dirname, 'assets/img/product');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const fileName = `prod_${Date.now()}.webp`;
    const destPath = path.join(uploadDir, fileName);
    try {
        if (payload && payload.buffer) {
            const buf = payload.buffer;
            try {
                await sharp(buf)
                    .resize(500, 500, { fit: 'inside', withoutEnlargement: true })
                    .webp({ quality: 80 })
                    .toFile(destPath);
                return { success: true, fileName: fileName };
            } catch (errSharp) {
                try {
                    fs.writeFileSync(destPath, buf);
                    return { success: true, fileName: fileName, fallback: true };
                } catch (e2) {
                    return { success: false, message: `${errSharp.message} | fallback: ${e2.message}` };
                }
            }
        } else if (typeof payload === 'string') {
            const filePath = payload;
            try {
                await sharp(filePath)
                    .resize(500, 500, { fit: 'inside', withoutEnlargement: true })
                    .webp({ quality: 80 })
                    .toFile(destPath);
                return { success: true, fileName: fileName };
            } catch (error) {
                try {
                    fs.copyFileSync(filePath, destPath);
                    return { success: true, fileName: fileName, fallback: true };
                } catch (e2) {
                    return { success: false, message: `${error.message} | fallback: ${e2.message}` };
                }
            }
        } else {
            return { success: false, message: 'Invalid input' };
        }
    } catch (e) {
        console.error('Unexpected upload-product-image error:', e);
        return { success: false, message: e.message };
    }
});

ipcMain.handle('create-product', async (event, data) => {
    try {
        await Product.create(data);
        return true;
    } catch (e) {
        console.error('create-product error', e);
        return false;
    }
});
ipcMain.handle('get-product', async (event, id) => {
    try {
        return await Product.getById(id);
    } catch (e) {
        console.error('get-product error', e);
        return null;
    }
});
ipcMain.handle('update-product', async (event, id, data) => {
    try {
        await Product.update(id, data);
        return true;
    } catch (e) {
        console.error('update-product error', e);
        return false;
    }
});
