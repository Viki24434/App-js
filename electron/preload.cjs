const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {

  // ===== Aktivasi & Lisensi =====
  checkActivation: () => ipcRenderer.invoke('check-activation'),
  activateDevice: (lisensiInput) => ipcRenderer.invoke('activate-device', lisensiInput),

  // ===== Auth =====
  login: (credentials) => ipcRenderer.invoke('auth-login', credentials),
  logout: () => ipcRenderer.invoke('auth-logout'),
  checkAuth: () => ipcRenderer.invoke('check-auth'),
  getIpAddress: () => ipcRenderer.invoke('get-ip-address'),

  // ===== Dashboard =====
  getDashboardData: () => ipcRenderer.invoke('get-dashboard-data'),

  // ===== Settings =====
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (data) => ipcRenderer.invoke('save-settings', data),

  // ===== Products =====
  getProducts: () => ipcRenderer.invoke('get-products'),
  getProduct: (id) => ipcRenderer.invoke('get-product', id),
  createProduct: (data) => ipcRenderer.invoke('create-product', data),
  updateProduct: (id, data) => ipcRenderer.invoke('update-product', id, data),
  deleteProduct: (id) => ipcRenderer.invoke('delete-product', id),
  uploadProductImage: (payload) => ipcRenderer.invoke('upload-product-image', payload),

  // ===== Categories =====
  getCategories: () => ipcRenderer.invoke('get-categories'),
  createCategory: (data) => ipcRenderer.invoke('create-category', data),
  updateCategory: (id, data) => ipcRenderer.invoke('update-category', id, data),
  deleteCategory: (id) => ipcRenderer.invoke('delete-category', id),

  // ===== Units =====
  getUnits: () => ipcRenderer.invoke('get-units'),
  createUnit: (data) => ipcRenderer.invoke('create-unit', data),
  updateUnit: (id, data) => ipcRenderer.invoke('update-unit', id, data),
  deleteUnit: (id) => ipcRenderer.invoke('delete-unit', id),

  // ===== Customers =====
  getCustomers: () => ipcRenderer.invoke('get-customers'),

  // ===== Users =====
  getUsers: () => ipcRenderer.invoke('get-users'),

  // ===== Orders / POS =====
  getOrders: (filters) => ipcRenderer.invoke('get-orders', filters),
  getOrderDetail: (id) => ipcRenderer.invoke('get-order-detail', id),
  getPrintData: (id) => ipcRenderer.invoke('get-print-data', id),
  createOrder: (data) => ipcRenderer.invoke('create-order', data),
  processPayment: (data) => ipcRenderer.invoke('process-payment', data),

  // ===== Finance =====
  getFinanceSummary: (filter) => ipcRenderer.invoke('get-finance-summary', filter),
  storeIncome: (data) => ipcRenderer.invoke('store-income', data),
  storeExpenditure: (data) => ipcRenderer.invoke('store-expenditure', data),

  // ===== Reports =====
  getSalesReport: (filter) => ipcRenderer.invoke('get-sales-report', filter),
  getProductReport: () => ipcRenderer.invoke('get-product-report'),
  getCustomerReport: (filter) => ipcRenderer.invoke('get-customer-report', filter),
  getPaymentMethodReport: (filter) => ipcRenderer.invoke('get-payment-method-report', filter),
  getReceivablesReport: () => ipcRenderer.invoke('get-receivables-report'),
  getIncomeExpenditureReport: (filter) => ipcRenderer.invoke('get-income-expenditure-report', filter),
  getProfitLossReport: (filter) => ipcRenderer.invoke('get-profit-loss-report', filter),

});
