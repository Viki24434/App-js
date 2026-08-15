import { useEffect, useState } from 'react';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Alert>{error}</Alert>

      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '20px 30px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2><i className="fas fa-wallet" style={{ color: '#10b981' }}></i> Arus Kas & Buku Keuangan</h2>
          <p style={{ margin: '5px 0 0', color: 'var(--muted)', fontSize: '13px' }}>Pantau pemasukan, pengeluaran, dan sisa saldo harian toko Anda.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button variant="info" icon="fas fa-hand-holding-usd" onClick={() => openModal('Income')} style={{ background: '#0ea5e9', padding: '10px 16px', borderRadius: '12px', fontWeight: '600' }}>
            Pemasukan
          </Button>
          <Button variant="danger" icon="fas fa-file-invoice-dollar" onClick={() => openModal('Expenditure')} style={{ background: '#ef4444', padding: '10px 16px', borderRadius: '12px', fontWeight: '600' }}>
            Pengeluaran
          </Button>
          <Button variant="success" icon="fas fa-sync-alt" onClick={loadData} style={{ background: '#f59e0b', padding: '10px 16px', borderRadius: '12px', fontWeight: '600' }}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Grid Stats */}
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

        <div className="card-stat stat-qris" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', position: 'relative', overflow: 'hidden', color: 'white', padding: '24px', borderRadius: '20px', display: 'flex', flexDirection: 'column', justifycontent: 'space-between', minHeight: '150px' }}>
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

      {/* Rekapitulasi Panel */}
      <div className="panel-glass" style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
        <div style={{ padding: '20px', background: '#f8fafc', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--dark)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-calendar-alt" style={{ color: 'var(--primary)' }}></i> Rekapitulasi Harian
          </h3>
          <form onSubmit={handleFilter} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input type="date" className="input-field" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: '8px 12px', fontSize: '12px', height: '38px', margin: 0 }} />
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--muted)' }}>s/d</span>
            <input type="date" className="input-field" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: '8px 12px', fontSize: '12px', height: '38px', margin: 0 }} />
            <Button type="submit" variant="secondary" style={{ background: 'var(--dark)', padding: '8px 15px', height: '38px' }}>Terapkan</Button>
          </form>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table-modern" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
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
            </thead>
            <tbody>
              {!summary?.rekap || summary.rekap.length === 0 ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>Tidak ada data rekapitulasi.</td></tr>
              ) : (
                summary.rekap.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ textAlign: 'center', padding: '14px 12px', borderBottom: '1px solid var(--border-color)' }}>{row.date}</td>
                    <td style={{ textAlign: 'right', color: '#16a34a', fontWeight: 600, padding: '14px 12px', borderBottom: '1px solid var(--border-color)' }}>{formatRp(row.cash_in)}</td>
                    <td style={{ textAlign: 'right', color: '#16a34a', fontWeight: 600, padding: '14px 12px', borderBottom: '1px solid var(--border-color)' }}>{formatRp(row.tf_in)}</td>
                    <td style={{ textAlign: 'right', color: '#16a34a', fontWeight: 600, padding: '14px 12px', borderBottom: '1px solid var(--border-color)' }}>{formatRp(row.qris_in)}</td>
                    <td style={{ textAlign: 'right', color: '#e11d48', fontWeight: 600, padding: '14px 12px', borderBottom: '1px solid var(--border-color)' }}>{formatRp(row.cash_out)}</td>
                    <td style={{ textAlign: 'right', color: '#e11d48', fontWeight: 600, padding: '14px 12px', borderBottom: '1px solid var(--border-color)' }}>{formatRp(row.tf_out)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, padding: '14px 12px', borderBottom: '1px solid var(--border-color)' }}>{formatRp(row.saldo_cash)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, padding: '14px 12px', borderBottom: '1px solid var(--border-color)' }}>{formatRp(row.saldo_tf)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, padding: '14px 12px', borderBottom: '1px solid var(--border-color)' }}>{formatRp(row.saldo_qris)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Transaksi Kas */}
      {modalOpen && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-box" style={{ maxWidth: '450px' }}>
            <button className="modal-close" onClick={() => setModalOpen(false)}><i className="fas fa-times"></i></button>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', fontWeight: '800' }}>
              {modalType === 'Income' ? 'Tambah Pemasukan Kas' : 'Tambah Pengeluaran Kas'}
            </h3>

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Tanggal</label>
                <input type="date" className="input-field" value={modalDate} onChange={(e) => setModalDate(e.target.value)} required />
              </div>

              <div className="input-group" style={{ marginTop: '12px' }}>
                <label>Keterangan</label>
                <input type="text" className="input-field" placeholder="Contoh: Beli Kertas / Bayar Listrik" value={modalDesc} onChange={(e) => setModalDesc(e.target.value)} required />
              </div>

              <div className="input-group" style={{ marginTop: '12px' }}>
                <label>Jumlah Nominal (Rp)</label>
                <input type="number" className="input-field" value={modalAmount} onChange={(e) => setModalAmount(e.target.value)} required style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--primary)' }} min="0" />
              </div>

              <div className="input-group" style={{ marginTop: '12px' }}>
                <label>Metode / Sumber Dana</label>
                <select className="input-field" value={modalMethod} onChange={(e) => setModalMethod(e.target.value)} required>
                  <option value="Cash">Uang Tunai (Cash Laci)</option>
                  <option value="Transfer">Transfer / Bank</option>
                </select>
              </div>

              <Button type="submit" variant={modalType === 'Income' ? 'success' : 'danger'} fullWidth style={{ marginTop: '20px', justifyContent: 'center', height: '45px', fontSize: '14px' }}>
                Simpan Transaksi
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}