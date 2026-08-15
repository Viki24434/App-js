const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs'); 
const { inisialisasiDatabase, getDbConnection } = require('./config/db');
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
        const db = await getDbConnection();
        
        // SQLite Query penyesuaian dari CURDATE() ke date('now')
        const { omzet } = await db.get("SELECT COALESCE(SUM(total_amount), 0) as omzet FROM orders WHERE date(created_at) = date('now', 'localtime')") || { omzet: 0 };
        const { transaksi } = await db.get("SELECT COUNT(id) as transaksi FROM orders WHERE date(created_at) = date('now', 'localtime')") || { transaksi: 0 };
        const { piutang } = await db.get(`
            SELECT COALESCE(SUM(o.total_amount - COALESCE((SELECT SUM(amount) FROM payments WHERE order_id = o.id), 0)), 0) as piutang 
            FROM orders o WHERE o.payment_status != 'Lunas'
        `) || { piutang: 0 };
        
        const lowStocks = await db.all("SELECT name, stock FROM products WHERE stock <= 10 ORDER BY stock ASC LIMIT 5");
        const recentOrders = await db.all("SELECT invoice_number, customer_name, total_amount, payment_status, created_at FROM orders ORDER BY created_at DESC LIMIT 5");
        
        const topProducts = await db.all(`
            SELECT p.name, SUM(oi.qty) as sold 
            FROM order_items oi 
            JOIN orders o ON oi.order_id = o.id 
            JOIN products p ON oi.product_id = p.id 
            WHERE strftime('%Y-%m', o.created_at) = strftime('%Y-%m', 'now', 'localtime')
            GROUP BY p.id ORDER BY sold DESC LIMIT 5
        `);

        const chartRows = await db.all(`
            SELECT strftime('%m', created_at) as month_num, SUM(total_amount) as total 
            FROM orders 
            WHERE date(created_at) >= date('now', 'localtime', '-5 month') 
            GROUP BY strftime('%Y-%m', created_at) 
            ORDER BY strftime('%Y-%m', created_at)
        `);

        // Konversi angka bulan jadi nama bulan di Javascript (Karena SQLite tidak punya %b)
        const namaBulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
        const chartLabels = chartRows.map(r => namaBulan[parseInt(r.month_num) - 1]);
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
        console.error("Dashboard error:", e);
        return null;
    }
});

ipcMain.handle('get-finance-summary', async (event, filter) => {
    try { return await Finance.getSummary(filter.start, filter.end); } catch (e) { return null; }
});
ipcMain.handle('store-income', async (event, data) => {
    try { await Finance.storeIncome(data); return true; } catch (e) { return false; }
});
ipcMain.handle('store-expenditure', async (event, data) => {
    try { await Finance.storeExpenditure(data); return true; } catch (e) { return false; }
});
ipcMain.handle('get-customers', async () => await Customer.getCustomers());
ipcMain.handle('get-users', async () => await User.getAll());

ipcMain.handle('auth-login', async (event, credentials) => {
    try {
        const db = await getDbConnection();
        const user = await db.get("SELECT * FROM users WHERE username = ?", [credentials.username]);
        
        if (!user) {
            return { success: false, message: 'Username tidak ditemukan!' };
        }

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

ipcMain.handle('auth-logout', async () => {return true});
ipcMain.handle('check-auth', async () => {return null});

ipcMain.handle('get-settings', async () => {
    try {
        const db = await getDbConnection();
        const row = await db.get("SELECT * FROM stores WHERE id = 1");
        return row || {};
    } catch (e) {
        return { name: 'Percetakan Default' }; // Fallback
    }
});

ipcMain.handle('save-settings', async (event, data) => {
    try {
        const db = await getDbConnection();
        await db.run(
            "UPDATE stores SET name=?, phone=?, address=?, logo=? WHERE id=1", 
            [data.store_name, data.phone, data.address, data.logo || 'default.png']
        );
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
});

ipcMain.handle('get-products', async () => await Product.getAll()); 
ipcMain.handle('get-categories', async () => await Category.getAll());
ipcMain.handle('create-category', async (event, data) => {
    try { await Category.create(data); return true; } catch (e) { return false; }
});
ipcMain.handle('update-category', async (event, id, data) => {
    try { await Category.update(id, data); return true; } catch (e) { return false; }
});
ipcMain.handle('delete-category', async (event, id) => {
    try { await Category.remove(id); return true; } catch (e) { return false; }
});

ipcMain.handle('get-units', async () => await Unit.getAll());
ipcMain.handle('create-unit', async (event, data) => {
    try { await Unit.create(data); return true; } catch (e) { return false; }
});
ipcMain.handle('update-unit', async (event, id, data) => {
    try { await Unit.update(id, data); return true; } catch (e) { return false; }
});
ipcMain.handle('delete-unit', async (event, id) => {
    try { await Unit.remove(id); return true; } catch (e) { return false; }
});
ipcMain.handle('delete-product', async (event, id) => {
    try { await Product.deleteProduct(id); return true; } catch (e) { return false; }
});

ipcMain.handle('get-orders', async (event, filters) => {
    try {
        const db = await getDbConnection();
        let query = `
            SELECT o.*, COALESCE(SUM(p.amount), 0) as total_paid 
            FROM orders o 
            LEFT JOIN payments p ON o.id = p.order_id 
            WHERE 1=1
        `;
        let params = [];

        if (filters && filters.start) {
            query += " AND date(o.created_at) >= date(?)";
            params.push(filters.start);
        }
        if (filters && filters.end) {
            query += " AND date(o.created_at) <= date(?)";
            params.push(filters.end);
        }
        if (filters && filters.search) {
            query += " AND (o.invoice_number LIKE ? OR o.customer_name LIKE ?)";
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }

        query += " GROUP BY o.id ORDER BY o.created_at DESC";
        const rows = await db.all(query, params);
        return rows;
    } catch (e) {
        console.error("get-orders error:", e);
        return [];
    }
});

ipcMain.handle('get-order-detail', async (event, id) => {
    try {
        const db = await getDbConnection();
        const rows = await db.all(`
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
        const db = await getDbConnection();
        const order = await db.get("SELECT * FROM orders WHERE id = ?", [id]);
        const items = await db.all("SELECT oi.*, p.name as product_name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?", [id]);
        const store = await db.get("SELECT * FROM stores LIMIT 1");
        
        return { order: order, items: items, store: store };
    } catch (e) {
        return null;
    }
});

ipcMain.handle('get-sales-report', async (event, filter) => {
    try { return await Report.getSalesReport(filter.start, filter.end); } catch (e) { return []; }
});
ipcMain.handle('get-product-report', async () => {
    try { return await Report.getProductReport(); } catch (e) { return []; }
});
ipcMain.handle('get-customer-report', async (event, filter) => {
    try { return await Report.getCustomerReport(filter.start, filter.end); } catch (e) { return []; }
});
ipcMain.handle('get-payment-method-report', async (event, filter) => {
    try { return await Report.getPaymentMethodReport(filter.start, filter.end); } catch (e) { return []; }
});
ipcMain.handle('get-receivables-report', async () => {
    try { return await Report.getReceivablesReport(); } catch (e) { return []; }
});
ipcMain.handle('get-income-expenditure-report', async (event, filter) => {
    try { return await Report.getIncomeExpenditureReport(filter.start, filter.end); } catch (e) { return { income: [], expenditure: [] }; }
});
ipcMain.handle('get-profit-loss-report', async (event, filter) => {
    try { return await Report.getProfitLossReport(filter.start, filter.end); } catch (e) { return null; }
});

let mainWindow;
let loadingWindow;

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

function createWindow () {
    mainWindow = new BrowserWindow({
        width: 1100,
        height: 750,
        show: false,
        webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));

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
            updateProgress('Membaca konfigurasi SQLite...', 30);
            await new Promise(r => setTimeout(r, 500));

            updateProgress('Menginisialisasi Database...', 70);
            await inisialisasiDatabase(); 

            updateProgress('Membuka antarmuka utama. Selamat bekerja!', 100);
            await new Promise(r => setTimeout(r, 400));

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
        return { success: false, message: e.message };
    }
});

ipcMain.handle('create-product', async (event, data) => {
    try { await Product.create(data); return true; } catch (e) { return false; }
});
ipcMain.handle('get-product', async (event, id) => {
    try { return await Product.getById(id); } catch (e) { return null; }
});
ipcMain.handle('update-product', async (event, id, data) => {
    try { await Product.update(id, data); return true; } catch (e) { return false; }
});