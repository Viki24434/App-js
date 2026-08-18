import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import Select from '../../components/Select/Select';
import Alert from '../../components/Alert/Alert';
import Modal from '../../components/Modal/Modal';
import Table from '../../components/Table/Table';
import IconButton from '../../components/IconButton/IconButton';
import PageHeader from '../../components/PageHeader/PageHeader';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import { formatRp } from '../../utils/format';
import './Orders.css';

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState({ start: '', end: '', search: '' });
  const [error, setError] = useState('');

  const [detail, setDetail] = useState({ open: false, invoice: '', items: [] });
  const [payment, setPayment] = useState({
    open: false, orderId: '', sisa: 0, nominal: '', method: 'Cash', info: '',
  });

  const loadOrders = async () => {
    try {
      const data = await window.api.getOrders(filter);
      setOrders(data || []);
    } catch (e) {
      setError('Gagal memuat data pesanan.');
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadOrders();
  };

  const openDetail = async (id, invoice) => {
    try {
      const items = await window.api.getOrderDetail(id);
      setDetail({ open: true, invoice, items: items || [] });
    } catch (e) {
      setError('Gagal memuat detail pesanan.');
    }
  };

  const openPayment = (order) => {
    const sisa = order.total_amount - (order.total_paid || 0);
    setPayment({
      open: true,
      orderId: order.id,
      sisa,
      nominal: sisa,
      method: 'Cash',
      info: sisa <= 0 ? 'Lunas' : 'Belum Lunas',
    });
  };

  const handleNominalChange = (val) => {
    const num = parseFloat(val) || 0;
    setPayment((p) => ({
      ...p,
      nominal: val,
      info: num >= p.sisa ? 'Lunas (Akan mengubah status pesanan)' : 'Sebagian (Masih ada sisa tagihan)',
    }));
  };

  const setLunas = () => {
    setPayment((p) => ({ ...p, nominal: p.sisa, info: 'Lunas (Akan mengubah status pesanan)' }));
  };

  const submitPayment = async () => {
    try {
      const success = await window.api.processPayment({
        id: payment.orderId,
        total: parseFloat(payment.nominal) || 0,
        sisa: payment.sisa,
        paymentMethod: payment.method,
      });
      if (success) {
        setPayment((p) => ({ ...p, open: false }));
        loadOrders();
      } else {
        alert('Gagal memproses pembayaran.');
      }
    } catch (e) {
      alert('Terjadi kesalahan sistem.');
    }
  };

  const orderColumns = [
    { key: 'invoice_number', label: 'No. Invoice', cellStyle: { fontWeight: 700, color: 'var(--primary)' } },
    { key: 'customer_name', label: 'Pelanggan', render: (o) => <b>{o.customer_name}</b> },
    { key: 'total_amount', label: 'Total Tagihan', render: (o) => formatRp(o.total_amount) },
    { key: 'payment_status', label: 'Status', headerStyle: { textAlign: 'center' }, cellStyle: { textAlign: 'center' }, render: (o) => <StatusBadge status={o.payment_status} /> },
    { key: 'created_at', label: 'Tanggal', render: (o) => new Date(o.created_at).toLocaleString('id-ID') },
  ];

  const itemColumns = [
    { key: 'product_name', label: 'Item' },
    { key: 'qty', label: 'Qty', headerStyle: { textAlign: 'center' }, cellStyle: { textAlign: 'center' } },
    { key: 'price', label: 'Harga', headerStyle: { textAlign: 'right' }, cellStyle: { textAlign: 'right' }, render: (i) => formatRp(i.price) },
    { key: 'subtotal', label: 'Subtotal', headerStyle: { textAlign: 'right' }, cellStyle: { textAlign: 'right' }, render: (i) => formatRp(i.subtotal) },
  ];

  return (
    <div className="orders-page">
      <Alert>{error}</Alert>

      <PageHeader
        title="Riwayat Pesanan"
        subtitle="Daftar seluruh transaksi dan status pembayaran"
        actionLabel="Buat Pesanan Baru"
        actionIcon="fas fa-plus"
        onAction={() => navigate('/orders/create')}
      />

      <div className="card">
        <form onSubmit={handleSearch} className="orders-filter">
          <Input label="Dari Tanggal" type="date" value={filter.start} onChange={(e) => setFilter({ ...filter, start: e.target.value })} />
          <Input label="Sampai Tanggal" type="date" value={filter.end} onChange={(e) => setFilter({ ...filter, end: e.target.value })} />
          <Input
            label="Pencarian"
            placeholder="Cari No. Invoice atau Nama..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            className="orders-filter-search"
          />
          <Button type="submit" variant="info" icon="fas fa-search">Cari</Button>
        </form>
      </div>

      <div className="card">
        <Table
          columns={orderColumns}
          data={orders}
          emptyText="Tidak ada data pesanan."
          renderActions={(o) => (
            <div className="row-actions">
              <IconButton icon="fas fa-eye" variant="primary" title="Detail" onClick={() => openDetail(o.id, o.invoice_number)} />
              {o.payment_status !== 'Lunas' && (
                <IconButton icon="fas fa-wallet" variant="success" title="Bayar" onClick={() => openPayment(o)} />
              )}
            </div>
          )}
        />
      </div>

      <Modal
        isOpen={detail.open}
        onClose={() => setDetail({ ...detail, open: false })}
        title={`Detail Pesanan: ${detail.invoice}`}
        maxWidth={700}
      >
        <Table columns={itemColumns} data={detail.items} keyField="product_name" emptyText="Tidak ada item." />
      </Modal>

      <Modal
        isOpen={payment.open}
        onClose={() => setPayment({ ...payment, open: false })}
        title="Form Pembayaran"
        maxWidth={450}
      >
        <Input label="Sisa Tagihan yang Belum Dibayar" value={formatRp(payment.sisa)} readOnly className="payment-sisa" />

        <div className="input-group">
          <label>Nominal Bayar</label>
          <div className="payment-nominal-row">
            <input
              type="number"
              className="input-field"
              value={payment.nominal}
              onChange={(e) => handleNominalChange(e.target.value)}
              placeholder="Jumlah bayar"
            />
            <Button variant="success" icon="fas fa-check-double" onClick={setLunas}>Lunaskan</Button>
          </div>
        </div>

        <Select label="Metode Pembayaran" value={payment.method} onChange={(e) => setPayment({ ...payment, method: e.target.value })}>
          <option value="Cash">Cash</option>
          <option value="Transfer">Transfer</option>
          <option value="QRIS">QRIS</option>
        </Select>

        <Input label="Status Pembayaran" value={payment.info} readOnly />

        <Button variant="primary" fullWidth icon="fas fa-save" onClick={submitPayment} className="payment-submit">
          Simpan Pembayaran
        </Button>
      </Modal>
    </div>
  );
}
