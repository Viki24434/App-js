import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import Alert from '../../components/Alert/Alert';
import Table from '../../components/Table/Table';
import IconButton from '../../components/IconButton/IconButton';
import { formatRp } from '../../utils/format';
import './Create.css';

const ITEMS_PER_PAGE = 12; // Jumlah produk per halaman

export default function CreateOrder() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Filter & Pagination State
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [discount, setDiscount] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [resProd, resCat] = await Promise.all([
          window.api.getProducts(),
          window.api.getCategories()
        ]);
        setProducts(resProd || []);
        setCategories(resCat || []);
      } catch (e) {
        setError('Gagal memuat produk dan kategori.');
      }
    })();
  }, []);

  // Reset ke halaman 1 setiap kali melakukan pencarian atau ganti kategori
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory]);

  const getImageUrl = (imgName) => {
    return imgName && imgName !== 'default.png'
      ? `pos-file://${imgName}`
      : 'https://placehold.co/100x100/e2e8f0/64748b?text=No+Image';
  };

  const addToCart = (product) => {
    if (product.stock <= 0) return;

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          alert(`Stok tidak mencukupi! Sisa stok hanya ${product.stock}.`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, qty: item.qty + 1, subtotal: (item.qty + 1) * item.price }
            : item
        );
      }
      return [...prevCart, { id: product.id, name: product.name, price: product.price, qty: 1, subtotal: product.price }];
    });
  };

  const updateQty = (id, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === id) {
            const productRef = products.find(p => p.id === id);
            const newQty = item.qty + delta;
            
            if (newQty > productRef?.stock) {
              alert(`Stok tidak mencukupi! Sisa stok hanya ${productRef.stock}.`);
              return item;
            }
            
            return newQty > 0 ? { ...item, qty: newQty, subtotal: newQty * item.price } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const discValue = parseFloat(discount) || 0;
  const grandTotal = Math.max(0, subtotal - discValue);

  const handleProcessOrder = async () => {
    if (cart.length === 0) {
      alert('Keranjang masih kosong!');
      return;
    }

    try {
      const payload = {
        customerName: customerName.trim() || 'Umum',
        items: cart,
        discount: discValue,
        grandTotal,
        amountPaid: grandTotal,
        paymentMethod: 'Cash',
      };

      const orderId = await window.api.createOrder(payload);
      if (orderId) {
        alert('Pesanan berhasil diproses!');
        navigate('/orders');
      } else {
        alert('Gagal memproses pesanan.');
      }
    } catch (e) {
      alert('Terjadi kesalahan sistem.');
    }
  };

  // Logika Filter
  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) || p.code?.toLowerCase().includes(search.toLowerCase());
    
    // PERBAIKAN: Ubah p.category_id menjadi string agar cocok dengan selectedCategory
    const matchCategory = selectedCategory ? String(p.category_id) === selectedCategory : true;
    
    return matchSearch && matchCategory;
  });

  // Logika Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const cartColumns = [
    { key: 'name', label: 'Item' },
    {
      key: 'qty',
      label: 'Qty',
      headerStyle: { width: 70, textAlign: 'center' },
      cellStyle: { textAlign: 'center' },
      render: (item) => (
        <div className="qty-stepper">
          <button type="button" onClick={() => updateQty(item.id, -1)}>-</button>
          <span>{item.qty}</span>
          <button type="button" onClick={() => updateQty(item.id, 1)}>+</button>
        </div>
      ),
    },
    {
      key: 'subtotal',
      label: 'Sub',
      headerStyle: { textAlign: 'right' },
      cellStyle: { textAlign: 'right' },
      render: (item) => formatRp(item.subtotal),
    },
    {
      key: 'remove',
      label: '',
      headerStyle: { width: 30 },
      cellStyle: { textAlign: 'center' },
      render: (item) => <IconButton icon="fas fa-trash" variant="danger" onClick={() => removeFromCart(item.id)} title="Hapus" />,
    },
  ];

  return (
    <div className="create-order-page">
      <Alert>{error}</Alert>

      <div className="create-order-header">
        <h2><i className="fas fa-desktop"></i> Kasir / Transaksi Baru</h2>
        <Button variant="secondary" icon="fas fa-arrow-left" onClick={() => navigate('/orders')}>
          Kembali
        </Button>
      </div>

      <div className="create-order-layout">
        <div className="card product-panel">
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <select 
              className="input-field" 
              style={{ flex: 1, margin: 0 }}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Semua Kategori</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            
            <input
              type="text"
              className="input-field"
              placeholder="Cari nama atau scan barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 2, margin: 0 }}
            />
          </div>

          <div className="product-grid">
            {currentProducts.length === 0 ? (
              <p style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '20px', color: 'var(--muted)' }}>Produk tidak ditemukan.</p>
            ) : (
              currentProducts.map((p) => {
                const isOutOfStock = p.stock <= 0;
                
                return (
                  <div 
                    key={p.id} 
                    className="product-tile" 
                    onClick={() => !isOutOfStock && addToCart(p)}
                    style={{ 
                      padding: '8px', 
                      position: 'relative',
                      opacity: isOutOfStock ? 0.6 : 1,
                      cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                      border: isOutOfStock ? '1px solid #fee2e2' : ''
                    }}
                  >
                    <span style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      background: isOutOfStock ? '#ef4444' : '#10b981',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: '800',
                      padding: '3px 6px',
                      borderRadius: '4px',
                      zIndex: 2,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      Stok: {p.stock}
                    </span>

                    <img 
                      src={getImageUrl(p.img)} 
                      alt={p.name} 
                      style={{ width: '100%', height: '80px', objectFit: 'contain', borderRadius: '6px', marginBottom: '6px', background: '#f8fafc', border: '1px solid #e2e8f0' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', overflow: 'hidden' }}>
                      <b style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</b>
                      <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '13px' }}>{formatRp(p.price)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px', padding: '10px 0', borderTop: '1px solid var(--border-color)' }}>
              <Button 
                variant="secondary" 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                disabled={currentPage === 1}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                <i className="fas fa-chevron-left" style={{ marginRight: '5px' }}></i> Prev
              </Button>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--dark)' }}>
                Hal {currentPage} dari {totalPages}
              </span>
              <Button 
                variant="secondary" 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                disabled={currentPage === totalPages}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                Next <i className="fas fa-chevron-right" style={{ marginLeft: '5px' }}></i>
              </Button>
            </div>
          )}
        </div>

        <div className="card cart-panel">
          <h3>Keranjang</h3>

          <Input
            placeholder="Nama Pelanggan (Kosongkan jika Umum)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />

          <div className="cart-table-wrapper">
            <Table columns={cartColumns} data={cart} emptyText="Keranjang kosong" />
          </div>

          <div className="cart-summary">
            <div className="summary-row">
              <span>Subtotal</span><strong>{formatRp(subtotal)}</strong>
            </div>
            <div className="summary-row">
              <span>Diskon (Rp)</span>
              <input
                type="number"
                className="input-field discount-input"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                min="0"
              />
            </div>
            <div className="summary-row summary-total">
              <strong>TOTAL</strong><strong>{formatRp(grandTotal)}</strong>
            </div>
          </div>

          <Button variant="success" fullWidth icon="fas fa-check-circle" onClick={handleProcessOrder} className="process-order-btn">
            Proses Pembayaran
          </Button>
        </div>
      </div>
    </div>
  );
}