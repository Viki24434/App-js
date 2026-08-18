import { useEffect, useState } from 'react';
import Input from '../../components/Input/Input';
import Select from '../../components/Select/Select';
import Button from '../../components/Button/Button';
import Alert from '../../components/Alert/Alert';
import Modal from '../../components/Modal/Modal';
import Table from '../../components/Table/Table';
import RowActions from '../../components/RowActions/RowActions';
import PageHeader from '../../components/PageHeader/PageHeader';
import { formatRp } from '../../utils/format';
import './Products.css';

const EMPTY_PRODUCT = { id: '', code: '', name: '', category_id: '', unit_id: '', price: '', stock: '0' };
const EMPTY_CATEGORY = { id: '', name: '' };
const EMPTY_UNIT = { id: '', name: '', symbol: '' };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const [productModal, setProductModal] = useState({ open: false, form: EMPTY_PRODUCT, file: null });
  const [categoryModal, setCategoryModal] = useState({ open: false, form: EMPTY_CATEGORY });
  const [unitModal, setUnitModal] = useState({ open: false, form: EMPTY_UNIT });

  const loadData = async () => {
    try {
      const [resProd, resCat, resUnit] = await Promise.all([
        window.api.getProducts(),
        window.api.getCategories(),
        window.api.getUnits(),
      ]);
      setProducts(resProd || []);
      setCategories(resCat || []);
      setUnits(resUnit || []);
    } catch (e) {
      setError('Gagal memuat data produk.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ===== Produk =====
  const openProductModal = (product = null) => {
    setProductModal({
      open: true,
      file: null,
      form: product
        ? {
            id: product.id,
            code: product.code || '',
            name: product.name || '',
            category_id: product.category_id || '',
            unit_id: product.unit_id || '',
            price: product.price || '',
            stock: product.stock || '0',
          }
        : EMPTY_PRODUCT,
    });
  };

  const saveProduct = async (e) => {
    e.preventDefault();
    const { form, file } = productModal;
    try {
      let imageName = 'default.png';
      if (file) {
        const buffer = await file.arrayBuffer();
        const uploadRes = await window.api.uploadProductImage({ buffer });
        if (uploadRes.success) imageName = uploadRes.fileName;
      }

      const payload = {
        code: form.code,
        name: form.name,
        category_id: form.category_id || null,
        unit_id: form.unit_id || null,
        price: parseFloat(form.price),
        stock: parseInt(form.stock),
        img: imageName,
      };

      if (form.id) {
        await window.api.updateProduct(form.id, payload);
      } else {
        await window.api.createProduct(payload);
      }

      setProductModal({ open: false, form: EMPTY_PRODUCT, file: null });
      loadData();
    } catch (err) {
      setError('Gagal menyimpan produk.');
    }
  };

  const deleteProduct = async (id) => {
    if (confirm('Yakin ingin menghapus produk ini?')) {
      await window.api.deleteProduct(id);
      loadData();
    }
  };

  // ===== Kategori =====
  const openCategoryModal = (cat = null) => {
    setCategoryModal({ open: true, form: cat ? { id: cat.id, name: cat.name } : EMPTY_CATEGORY });
  };

  const saveCategory = async (e) => {
    e.preventDefault();
    const { form } = categoryModal;
    if (form.id) {
      await window.api.updateCategory(form.id, { name: form.name });
    } else {
      await window.api.createCategory({ name: form.name });
    }
    setCategoryModal({ open: false, form: EMPTY_CATEGORY });
    loadData();
  };

  const deleteCategory = async (id) => {
    if (confirm('Hapus kategori ini?')) {
      await window.api.deleteCategory(id);
      loadData();
    }
  };

  // ===== Satuan =====
  const openUnitModal = (unit = null) => {
    setUnitModal({
      open: true,
      form: unit ? { id: unit.id, name: unit.name, symbol: unit.symbol } : EMPTY_UNIT,
    });
  };

  const saveUnit = async (e) => {
    e.preventDefault();
    const { form } = unitModal;
    const payload = { name: form.name, symbol: form.symbol };
    if (form.id) {
      await window.api.updateUnit(form.id, payload);
    } else {
      await window.api.createUnit(payload);
    }
    setUnitModal({ open: false, form: EMPTY_UNIT });
    loadData();
  };

  const deleteUnit = async (id) => {
    if (confirm('Hapus satuan ini?')) {
      await window.api.deleteUnit(id);
      loadData();
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.code?.toLowerCase().includes(search.toLowerCase())
  );

  const productColumns = [
    { key: 'code', label: 'Kode' },
    { key: 'name', label: 'Nama Produk', render: (p) => <b>{p.name}</b> },
    { key: 'category_name', label: 'Kategori', render: (p) => p.category_name || '-' },
    { key: 'stock', label: 'Stok' },
    { key: 'price', label: 'Harga Jual', render: (p) => formatRp(p.price) },
  ];

  const categoryColumns = [
    { key: 'id', label: 'ID', headerStyle: { width: 50 } },
    { key: 'name', label: 'Nama Kategori', render: (c) => <b>{c.name}</b> },
  ];

  const unitColumns = [
    { key: 'name', label: 'Nama Satuan', render: (u) => <b>{u.name}</b> },
    { key: 'symbol', label: 'Simbol' },
  ];

  return (
    <div className="products-page">
      <Alert>{error}</Alert>

      <PageHeader
        icon="fas fa-box"
        title="Manajemen Produk"
        actionLabel="Tambah Produk"
        actionIcon="fas fa-plus"
        onAction={() => openProductModal()}
      />

      <div className="card products-table-card">
        <div className="products-search">
          <Input
            placeholder="Cari nama produk atau kode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Table
          columns={productColumns}
          data={filteredProducts}
          emptyText="Tidak ada produk."
          renderActions={(p) => (
            <RowActions onEdit={() => openProductModal(p)} onDelete={() => deleteProduct(p.id)} />
          )}
        />
      </div>

      <div className="products-grid">
        <div>
          <PageHeader
            icon="fas fa-tags"
            title="Kategori"
            actionLabel="Tambah Kategori"
            actionIcon="fas fa-plus"
            onAction={() => openCategoryModal()}
          />
          <div className="card">
            <Table
              columns={categoryColumns}
              data={categories}
              emptyText="Belum ada kategori."
              renderActions={(c) => (
                <RowActions onEdit={() => openCategoryModal(c)} onDelete={() => deleteCategory(c.id)} />
              )}
            />
          </div>
        </div>

        <div>
          <PageHeader
            icon="fas fa-ruler-combined"
            title="Satuan"
            actionLabel="Tambah Satuan"
            actionIcon="fas fa-plus"
            onAction={() => openUnitModal()}
          />
          <div className="card">
            <Table
              columns={unitColumns}
              data={units}
              emptyText="Belum ada satuan."
              renderActions={(u) => (
                <RowActions onEdit={() => openUnitModal(u)} onDelete={() => deleteUnit(u.id)} />
              )}
            />
          </div>
        </div>
      </div>

      {/* Modal Produk */}
      <Modal
        isOpen={productModal.open}
        onClose={() => setProductModal({ ...productModal, open: false })}
        icon="fas fa-box"
        title={productModal.form.id ? 'Edit Produk' : 'Tambah Produk Baru'}
      >
        <form onSubmit={saveProduct}>
          <div className="form-row">
            <Input
              label="Kode Produk"
              placeholder="Otomatis"
              value={productModal.form.code}
              onChange={(e) => setProductModal({ ...productModal, form: { ...productModal.form, code: e.target.value } })}
            />
            <Input
              label="Nama Produk *"
              required
              value={productModal.form.name}
              onChange={(e) => setProductModal({ ...productModal, form: { ...productModal.form, name: e.target.value } })}
            />
          </div>

          <div className="form-row">
            <Select
              label="Kategori"
              value={productModal.form.category_id}
              onChange={(e) => setProductModal({ ...productModal, form: { ...productModal.form, category_id: e.target.value } })}
            >
              <option value="">Pilih...</option>
              {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </Select>
            <Select
              label="Satuan"
              value={productModal.form.unit_id}
              onChange={(e) => setProductModal({ ...productModal, form: { ...productModal.form, unit_id: e.target.value } })}
            >
              <option value="">Pilih...</option>
              {units.map((u) => (<option key={u.id} value={u.id}>{u.name}</option>))}
            </Select>
          </div>

          <div className="form-row">
            <Input
              label="Harga Jual (Rp) *"
              type="number"
              min="0"
              required
              value={productModal.form.price}
              onChange={(e) => setProductModal({ ...productModal, form: { ...productModal.form, price: e.target.value } })}
            />
            <Input
              label="Stok Awal"
              type="number"
              min="0"
              value={productModal.form.stock}
              onChange={(e) => setProductModal({ ...productModal, form: { ...productModal.form, stock: e.target.value } })}
            />
          </div>

          <div className="input-group">
            <label>Gambar Produk</label>
            <input
              type="file"
              className="input-field"
              accept="image/*"
              onChange={(e) => setProductModal({ ...productModal, file: e.target.files[0] })}
            />
          </div>

          <Button type="submit" variant="success" fullWidth>
            Simpan Produk
          </Button>
        </form>
      </Modal>

      {/* Modal Kategori */}
      <Modal
        isOpen={categoryModal.open}
        onClose={() => setCategoryModal({ ...categoryModal, open: false })}
        title="Kategori"
        maxWidth={400}
      >
        <form onSubmit={saveCategory}>
          <Input
            label="Nama Kategori"
            required
            value={categoryModal.form.name}
            onChange={(e) => setCategoryModal({ ...categoryModal, form: { ...categoryModal.form, name: e.target.value } })}
          />
          <div className="modal-actions">
            <Button type="submit" variant="success">Simpan</Button>
            <Button type="button" variant="secondary" onClick={() => setCategoryModal({ ...categoryModal, open: false })}>Batal</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Satuan */}
      <Modal
        isOpen={unitModal.open}
        onClose={() => setUnitModal({ ...unitModal, open: false })}
        title="Satuan"
        maxWidth={400}
      >
        <form onSubmit={saveUnit}>
          <Input
            label="Nama Satuan"
            required
            value={unitModal.form.name}
            onChange={(e) => setUnitModal({ ...unitModal, form: { ...unitModal.form, name: e.target.value } })}
          />
          <Input
            label="Simbol"
            value={unitModal.form.symbol}
            onChange={(e) => setUnitModal({ ...unitModal, form: { ...unitModal.form, symbol: e.target.value } })}
          />
          <div className="modal-actions">
            <Button type="submit" variant="success">Simpan</Button>
            <Button type="button" variant="secondary" onClick={() => setUnitModal({ ...unitModal, open: false })}>Batal</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
