import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader/PageHeader';
import Card from '../../components/Card/Card';
import Table from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import Select from '../../components/Select/Select';
import Modal from '../../components/Modal/Modal';
import Alert from '../../components/Alert/Alert';

const formatRp = (v) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(v || 0);

export default function Finance() {
  const [summary, setSummary] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('Income');
  const [modalDate, setModalDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalDesc, setModalDesc] = useState('');
  const [modalAmount, setModalAmount] = useState('');
  const [modalMethod, setModalMethod] = useState('Cash');

  const loadData = async () => {
    try {
      const res = await window.api.getFinanceSummary({ start: startDate, end: endDate });
      setSummary(res);
    } catch (e) {
      setError('Gagal memuat rekapitulasi keuangan.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    loadData();
  };

  const openModal = (type) => {
    setModalType(type);
    setModalDate(new Date().toISOString().split('T')[0]);
    setModalDesc('');
    setModalAmount('');
    setModalMethod('Cash');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        date: modalDate,
        description: modalDesc,
        amount: parseFloat(modalAmount) || 0,
        method: modalMethod,
      };

      let success = false;
      if (modalType === 'Income') {
        success = await window.api.storeIncome(payload);
      } else {
        success = await window.api.storeExpenditure(payload);
      }

      if (success) {
        setModalOpen(false);
        loadData();
      } else {
        alert('Gagal menyimpan transaksi.');
      }
    } catch (e) {
      alert('Terjadi kesalahan sistem.');
    }
  };

  const financeColumns = [
    { key: 'date', cellStyle: { textAlign: 'center', borderBottom: '1px solid var(--border-color)' } },
    { key: 'cash_in', cellStyle: { textAlign: 'right', color: '#16a34a', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }, render: (row) => formatRp(row.cash_in) },
    { key: 'tf_in', cellStyle: { textAlign: 'right', color: '#16a34a', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }, render: (row) => formatRp(row.tf_in) },
    { key: 'qris_in', cellStyle: { textAlign: 'right', color: '#16a34a', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }, render: (row) => formatRp(row.qris_in) },
    { key: 'cash_out', cellStyle: { textAlign: 'right', color: '#e11d48', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }, render: (row) => formatRp(row.cash_out) },
    { key: 'tf_out', cellStyle: { textAlign: 'right', color: '#e11d48', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }, render: (row) => formatRp(row.tf_out) },
    { key: 'saldo_cash', cellStyle: { textAlign: 'right', fontWeight: 700, borderBottom: '1px solid var(--border-color)' }, render: (row) => formatRp(row.saldo_cash) },
    { key: 'saldo_tf', cellStyle: { textAlign: 'right', fontWeight: 700, borderBottom: '1px solid var(--border-color)' }, render: (row) => formatRp(row.saldo_tf) },
    { key: 'saldo_qris', cellStyle: { textAlign: 'right', fontWeight: 700, borderBottom: '1px solid var(--border-color)' }, render: (row) => formatRp(row.saldo_qris) }
  ];

  const customFinanceHeader = (
    <>
      <tr>
        <th rowSpan="2" style={{ borderRight: '1px solid var(--border-color)', verticalAlign: 'middle', textAlign: 'center', padding: '14px 12px' }}>Tanggal</th>
        <th colSpan="3" style={{ background: '#f0fdf4', color: '#16a34a', borderRight: '1px solid var(--border-color)', textAlign: 'center', padding: '10px' }}>OMZET & MASUK (+)</th>
        <th colSpan="2" style={{ background: '#fef2f2', color: '#e11d48', borderRight: '1px solid var(--border-color)', textAlign: 'center', padding: '10px' }}>PENGELUARAN (-)</th>
        <th colSpan="3" style={{ background: '#f8fafc', color: '#334155', textAlign: 'center', padding: '10px' }}>SISA SALDO HARIAN</th>
      </tr>
      <tr>
        <th style={{ background: '#f0fdf4', color: '#16a34a', textAlign: 'right', fontSize: '11px', padding: '10px' }}>Cash</th>
        <th style={{ background: '#f0fdf4', color: '#16a34a', textAlign: 'right', fontSize: '11px', padding: '10px' }}>Transfer</th>
        <th style={{ background: '#f0fdf4', color: '#16a34a', textAlign: 'right', fontSize: '11px', padding: '10px' }}>QRIS</th>
        <th style={{ background: '#fef2f2', color: '#e11d48', textAlign: 'right', fontSize: '11px', padding: '10px' }}>Cash</th>
        <th style={{ background: '#fef2f2', color: '#e11d48', textAlign: 'right', fontSize: '11px', padding: '10px' }}>Transfer</th>
        <th style={{ background: '#f8fafc', color: '#10b981', textAlign: 'right', fontSize: '11px', padding: '10px' }}>Cash</th>
        <th style={{ background: '#f8fafc', color: '#0ea5e9', textAlign: 'right', fontSize: '11px', padding: '10px' }}>Transfer</th>
        <th style={{ background: '#f8fafc', color: '#8b5cf6', textAlign: 'right', fontSize: '11px', padding: '10px' }}>QRIS</th>
      </tr>
    </>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Alert>{error}</Alert>

      <PageHeader title="Arus Kas & Buku Keuangan" icon="fas fa-wallet">
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button variant="info" icon="fas fa-hand-holding-usd" onClick={() => openModal('Income')}>
            Pemasukan
          </Button>
          <Button variant="danger" icon="fas fa-file-invoice-dollar" onClick={() => openModal('Expenditure')}>
            Pengeluaran
          </Button>
          <Button variant="success" icon="fas fa-sync-alt" onClick={loadData}>
            Refresh
          </Button>
        </div>
      </PageHeader>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <div className="card-stat stat-kas" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', position: 'relative', overflow: 'hidden', color: 'white', padding: '24px', borderRadius: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '150px' }}>
          <i className="fas fa-cash-register stat-bg-icon" style={{ position: 'absolute', right: '-10px', bottom: '-10px', fontSize: '90px', opacity: '0.15', transform: 'rotate(-15deg)' }}></i>
          <h4 style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', fontWeight: '800', opacity: 0.9 }}>Saldo Kas / Laci</h4>
          <h2 style={{ margin: '10px 0', fontSize: '24px', fontWeight: '800' }}>{formatRp(summary?.saldoKas)}</h2>
          <div style={{ fontSize: '11px', fontWeight: '600', background: 'rgba(255,255,255,0.2)', padding: '8px 12px', borderRadius: '12px' }}>
            Jual: {formatRp(summary?.kasJual)} | Masuk: {formatRp(summary?.kasMasuk)} | Keluar: {formatRp(summary?.kasKeluar)}
          </div>
        </div>

        <div className="card-stat stat-tf" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)', position: 'relative', overflow: 'hidden', color: 'white', padding: '24px', borderRadius: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '150px' }}>
          <i className="fas fa-university stat-bg-icon" style={{ position: 'absolute', right: '-10px', bottom: '-10px', fontSize: '90px', opacity: '0.15', transform: 'rotate(-15deg)' }}></i>
          <h4 style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', fontWeight: '800', opacity: 0.9 }}>Saldo Transfer / Bank</h4>
          <h2 style={{ margin: '10px 0', fontSize: '24px', fontWeight: '800' }}>{formatRp(summary?.saldoTf)}</h2>
          <div style={{ fontSize: '11px', fontWeight: '600', background: 'rgba(255,255,255,0.2)', padding: '8px 12px', borderRadius: '12px' }}>
            Jual: {formatRp(summary?.tfJual)} | Masuk: {formatRp(summary?.tfMasuk)} | Keluar: {formatRp(summary?.tfKeluar)}
          </div>
        </div>

        <div className="card-stat stat-qris" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', position: 'relative', overflow: 'hidden', color: 'white', padding: '24px', borderRadius: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '150px' }}>
          <i className="fas fa-qrcode stat-bg-icon" style={{ position: 'absolute', right: '-10px', bottom: '-10px', fontSize: '90px', opacity: '0.15', transform: 'rotate(-15deg)' }}></i>
          <h4 style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', fontWeight: '800', opacity: 0.9 }}>Saldo QRIS (Omzet)</h4>
          <h2 style={{ margin: '10px 0', fontSize: '24px', fontWeight: '800' }}>{formatRp(summary?.saldoQris)}</h2>
          <div style={{ fontSize: '11px', fontWeight: '600', background: 'rgba(255,255,255,0.2)', padding: '8px 12px', borderRadius: '12px' }}>*Mencatat total omzet kotor QRIS yang masuk.</div>
        </div>

        <div className="card-stat stat-piutang" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', position: 'relative', overflow: 'hidden', color: 'white', padding: '24px', borderRadius: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '150px' }}>
          <i className="fas fa-handshake stat-bg-icon" style={{ position: 'absolute', right: '-10px', bottom: '-10px', fontSize: '90px', opacity: '0.15', transform: 'rotate(-15deg)' }}></i>
          <h4 style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', fontWeight: '800', opacity: 0.9 }}>Total Piutang</h4>
          <h2 style={{ margin: '10px 0', fontSize: '24px', fontWeight: '800' }}>{formatRp(summary?.totalPiutang)}</h2>
          <div style={{ fontSize: '11px', fontWeight: '600', background: 'rgba(255,255,255,0.2)', padding: '8px 12px', borderRadius: '12px' }}>Total tagihan pelanggan yang belum dilunasi.</div>
        </div>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px', background: '#f8fafc', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--dark)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-calendar-alt" style={{ color: 'var(--primary)' }}></i> Rekapitulasi Harian
          </h3>
          <form onSubmit={handleFilter} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input type="date" className="input-field" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: '8px 12px', fontSize: '12px', height: '38px', margin: 0 }} />
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--muted)' }}>s/d</span>
            <input type="date" className="input-field" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: '8px 12px', fontSize: '12px', height: '38px', margin: 0 }} />
            <Button type="submit" variant="secondary" style={{ height: '38px' }}>Terapkan</Button>
          </form>
        </div>

        <Table 
          customHeader={customFinanceHeader}
          columns={financeColumns}
          data={summary?.rekap || []}
          emptyText="Tidak ada data rekapitulasi."
          keyField="date"
        />
      </Card>

      {modalOpen && (
        <Modal 
          title={modalType === 'Income' ? 'Tambah Pemasukan Kas' : 'Tambah Pengeluaran Kas'} 
          icon={modalType === 'Income' ? 'fas fa-hand-holding-usd' : 'fas fa-file-invoice-dollar'}
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '12px' }}>
              <Input 
                label="Tanggal" 
                type="date" 
                value={modalDate} 
                onChange={(e) => setModalDate(e.target.value)} 
                required 
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <Input 
                label="Keterangan" 
                placeholder="Contoh: Beli Kertas / Bayar Listrik" 
                value={modalDesc} 
                onChange={(e) => setModalDesc(e.target.value)} 
                required 
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <Input 
                label="Jumlah Nominal (Rp)" 
                type="number" 
                value={modalAmount} 
                onChange={(e) => setModalAmount(e.target.value)} 
                required 
                min="0"
                style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--primary)' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <Select label="Metode / Sumber Dana" value={modalMethod} onChange={(e) => setModalMethod(e.target.value)} required>
                <option value="Cash">Uang Tunai (Cash Laci)</option>
                <option value="Transfer">Transfer / Bank</option>
              </Select>
            </div>

            <Button type="submit" variant={modalType === 'Income' ? 'success' : 'danger'} fullWidth style={{ justifyContent: 'center', height: '42px' }}>
              Simpan Transaksi
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}