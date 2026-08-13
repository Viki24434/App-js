window.initProductPage = async function() {
    try {
        window.attachCategoryFormHandler();
        window.attachUnitFormHandler();

        const btnAddCat = document.getElementById('btn-add-category');
        if (btnAddCat) btnAddCat.onclick = () => window.openCategoryModal();
        
        const btnAddUnit = document.getElementById('btn-add-unit');
        if (btnAddUnit) btnAddUnit.onclick = () => window.openUnitModal();

        await window.initCategoryPage();
        await window.initUnitPage();

        const tbody = document.getElementById('product-list-body');
        const products = await ipcRenderer.invoke('get-products');
        
        if(!tbody || !products) return;

        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Belum ada produk</td></tr>';
        } else {
            tbody.innerHTML = products.map(p => `
                <tr>
                    <td style="font-weight: 600; color: var(--primary);">${p.product_code}</td>
                    <td style="display: flex; align-items: center; gap: 12px;">
                        <img src="../assets/img/product/${p.img || 'default.png'}" 
                             style="width: 40px; height: 40px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-color);">
                        <span style="font-weight: 600;">${p.name}</span>
                    </td>
                    <td><span class="badge" style="background: #f1f5f9; color: #475569;">${p.category_name || '-'}</span></td>
                    <td><span class="badge" style="background: ${p.stock <= 5 ? '#fee2e2' : '#dcfce7'}; color: ${p.stock <= 5 ? '#ef4444' : '#10b981'};">${p.stock} ${p.unit_name || ''}</span></td>
                    <td style="font-weight: 700;">Rp ${parseInt(p.price).toLocaleString('id-ID')}</td>
                    <td>
                        <div class="action-group">
                            <button class="btn-icon" style="background: #3b82f6;" onclick="window.editProduct(${p.id})"><i class="fas fa-edit"></i></button>
                            <button class="btn-icon" style="background: #ef4444;" onclick="window.deleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        const formModal = document.getElementById('form-modal-product');
        if (formModal) {
            const newForm = formModal.cloneNode(true);
            formModal.parentNode.replaceChild(newForm, formModal);
            
            newForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const fileInput = document.getElementById('modal-prod-img');
                let finalImage = document.getElementById('modal-prod-current-img').value || 'default.png';

                if (fileInput && fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    const arrayBuffer = await file.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    const res = await ipcRenderer.invoke('upload-product-image', { name: file.name, buffer: buffer });
                    if (res && res.success) finalImage = res.fileName;
                }

                const data = {
                    product_code: document.getElementById('modal-prod-code').value,
                    name: document.getElementById('modal-prod-name').value,
                    category_id: document.getElementById('modal-prod-category').value || null,
                    unit_id: document.getElementById('modal-prod-unit').value || null,
                    price: document.getElementById('modal-prod-price').value,
                    stock: document.getElementById('modal-prod-stock').value,
                    img: finalImage
                };

                const editId = document.getElementById('modal-prod-id').value;
                if (editId) {
                    await ipcRenderer.invoke('update-product', editId, data);
                } else {
                    await ipcRenderer.invoke('create-product', data);
                }
                
                window.closeProductModal();
                window.initProductPage();
            });
        }
    } catch(e) {}
};

window.openProductModal = async function() {
    const modal = document.getElementById('modal-add-product');
    if (modal) modal.classList.add('active');
    
    document.getElementById('modal-prod-id').value = '';
    document.getElementById('modal-prod-current-img').value = '';
    
    const catSelect = document.getElementById('modal-prod-category');
    const unitSelect = document.getElementById('modal-prod-unit');
    
    const categories = await ipcRenderer.invoke('get-categories').catch(()=>[]);
    const units = await ipcRenderer.invoke('get-units').catch(()=>[]);
    
    catSelect.innerHTML = '<option value="">Pilih...</option>';
    unitSelect.innerHTML = '<option value="">Pilih...</option>';
    
    categories.forEach(c => catSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`);
    units.forEach(u => unitSelect.innerHTML += `<option value="${u.id}">${u.name}</option>`);
};

window.closeProductModal = function() {
    const modal = document.getElementById('modal-add-product');
    if (modal) modal.classList.remove('active');
    const form = document.getElementById('form-modal-product');
    if (form) form.reset(); 
};

window.editProduct = async function(id) {
    const prod = await ipcRenderer.invoke('get-product', id);
    if (!prod) return;
    
    await window.openProductModal();
    
    document.getElementById('modal-prod-id').value = prod.id;
    document.getElementById('modal-prod-current-img').value = prod.img || '';
    document.getElementById('modal-prod-code').value = prod.product_code || '';
    document.getElementById('modal-prod-name').value = prod.name || '';
    document.getElementById('modal-prod-price').value = prod.price || 0;
    document.getElementById('modal-prod-stock').value = prod.stock || 0;
    document.getElementById('modal-prod-category').value = prod.category_id || '';
    document.getElementById('modal-prod-unit').value = prod.unit_id || '';
};

window.deleteProduct = function(id) {
    const modal = document.getElementById('modal-confirm');
    if (!modal) return;
    document.getElementById('confirm-title').innerText = 'Hapus Produk';
    document.getElementById('confirm-message').innerText = 'Yakin ingin menghapus produk ini?';
    modal.classList.add('active');
    const yes = document.getElementById('confirm-yes');
    
    const onYes = async () => {
        const ok = await ipcRenderer.invoke('delete-product', id);
        if (ok) window.initProductPage();
        modal.classList.remove('active');
        yes.removeEventListener('click', onYes);
    };
    
    yes.addEventListener('click', onYes);
};

window.initCategoryPage = async function() {
    try {
        const tbody = document.getElementById('category-list-body');
        const categories = await ipcRenderer.invoke('get-categories');
        if (!tbody || !categories) return;

        if (categories.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Belum ada kategori</td></tr>';
        } else {
            tbody.innerHTML = categories.map(c => `
                <tr>
                    <td style="font-weight: 600; color: var(--muted);">${c.id}</td>
                    <td style="font-weight: 600;">${c.name}</td>
                    <td>
                        <div class="action-group">
                            <button class="btn-icon" style="background: #3b82f6;" onclick="window.openCategoryModal(${c.id}, '${c.name.replace(/'/g, "\\'")}')"><i class="fas fa-edit"></i></button>
                            <button class="btn-icon" style="background: #ef4444;" onclick="window.deleteCategory(${c.id})"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    } catch(e) {}
};

window.initUnitPage = async function() {
    try {
        const tbody = document.getElementById('unit-list-body');
        const units = await ipcRenderer.invoke('get-units');
        if (!tbody || !units) return;

        if (units.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Belum ada satuan</td></tr>';
        } else {
            tbody.innerHTML = units.map(u => `
                <tr>
                    <td style="font-weight: 600;">${u.name}</td>
                    <td><span class="badge" style="background: #f1f5f9; color: var(--dark);">${u.symbol}</span></td>
                    <td>
                        <div class="action-group">
                            <button class="btn-icon" style="background: #3b82f6;" onclick="window.openUnitModal(${u.id}, '${u.name.replace(/'/g, "\\'")}', '${u.symbol.replace(/'/g, "\\'")}')"><i class="fas fa-edit"></i></button>
                            <button class="btn-icon" style="background: #ef4444;" onclick="window.deleteUnit(${u.id})"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    } catch(e) {}
};

window.openCategoryModal = function(id = null, name = null) {
    const modal = document.getElementById('modal-category');
    if (!modal) return;
    document.getElementById('modal-cat-id').value = id || '';
    document.getElementById('modal-cat-name').value = name || '';
    modal.classList.add('active');
};

window.closeCategoryModal = function() {
    const modal = document.getElementById('modal-category');
    if (modal) modal.classList.remove('active');
    const form = document.getElementById('form-modal-category');
    if (form) form.reset();
};

window.attachCategoryFormHandler = function() {
    const catForm = document.getElementById('form-modal-category');
    if (!catForm || catForm._attached) return;
    catForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('modal-cat-id').value;
        const name = document.getElementById('modal-cat-name').value.trim();
        if (!name) return;
        
        if (id) {
            await ipcRenderer.invoke('update-category', id, { name });
        } else {
            await ipcRenderer.invoke('create-category', { name });
        }
        window.closeCategoryModal();
        window.initProductPage();
    });
    catForm._attached = true;
};

window.deleteCategory = function(id) {
    const modal = document.getElementById('modal-confirm');
    if (!modal) return;
    document.getElementById('confirm-title').innerText = 'Hapus Kategori';
    document.getElementById('confirm-message').innerText = 'Yakin ingin menghapus kategori ini?';
    modal.classList.add('active');
    const yes = document.getElementById('confirm-yes');
    
    const onYes = async () => {
        const ok = await ipcRenderer.invoke('delete-category', id);
        if (ok) window.initProductPage();
        modal.classList.remove('active');
        yes.removeEventListener('click', onYes);
    };
    
    yes.addEventListener('click', onYes);
};

window.openUnitModal = function(id = null, name = null, symbol = null) {
    const modal = document.getElementById('modal-unit');
    if (!modal) return;
    document.getElementById('modal-unit-id').value = id || '';
    document.getElementById('modal-unit-name').value = name || '';
    document.getElementById('modal-unit-symbol').value = symbol || '';
    modal.classList.add('active');
};

window.closeUnitModal = function() {
    const modal = document.getElementById('modal-unit');
    if (modal) modal.classList.remove('active');
    const form = document.getElementById('form-modal-unit');
    if (form) form.reset();
};

window.attachUnitFormHandler = function() {
    const unitForm = document.getElementById('form-modal-unit');
    if (!unitForm || unitForm._attached) return;
    unitForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('modal-unit-id').value;
        const name = document.getElementById('modal-unit-name').value.trim();
        const symbol = document.getElementById('modal-unit-symbol').value.trim();
        if (!name || !symbol) return;
        
        if (id) {
            await ipcRenderer.invoke('update-unit', id, { name, symbol });
        } else {
            await ipcRenderer.invoke('create-unit', { name, symbol });
        }
        window.closeUnitModal();
        window.initProductPage();
    });
    unitForm._attached = true;
};

window.deleteUnit = function(id) {
    const modal = document.getElementById('modal-confirm');
    if (!modal) return;
    document.getElementById('confirm-title').innerText = 'Hapus Satuan';
    document.getElementById('confirm-message').innerText = 'Yakin ingin menghapus satuan ini?';
    modal.classList.add('active');
    const yes = document.getElementById('confirm-yes');
    
    const onYes = async () => {
        const ok = await ipcRenderer.invoke('delete-unit', id);
        if (ok) window.initProductPage();
        modal.classList.remove('active');
        yes.removeEventListener('click', onYes);
    };
    
    yes.addEventListener('click', onYes);
};

window.filterProductTable = function() {
    const input = document.getElementById('product-search').value.toLowerCase();
    const rows = document.querySelectorAll('#product-list-body tr');
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(input) ? '' : 'none';
    });
};