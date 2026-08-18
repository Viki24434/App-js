import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import Alert from '../../components/Alert/Alert';
import Table from '../../components/Table/Table';
import IconButton from '../../components/IconButton/IconButton';
import { formatRp } from '../../utils/format';
import './Create.css';

export default function CreateOrder() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [discount, setDiscount] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await window.api.getProducts();
        setProducts(res || []);
      } catch (e) {
        setError('Gagal memuat produk.');
      }
    })();
  }, []);

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
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
            const newQty = item.qty + delta;
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

  const filteredProducts = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.code?.toLowerCase().includes(search.toLowerCase())
  );

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
          <Input
            placeholder="Cari nama atau scan barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="product-search"
          />
          <div className="product-grid">
            {filteredProducts.map((p) => (
              <div key={p.id} className="product-tile" onClick={() => addToCart(p)}>
                <b>{p.name}</b>
                <span>{formatRp(p.price)}</span>
              </div>
            ))}
          </div>
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
