import { useEffect, useState } from 'react';
import Button from '../../components/Button/Button';
import Alert from '../../components/Alert/Alert';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await window.api.getCustomers();
        setCustomers(res || []);
      } catch (e) {
        setError('Gagal memuat data pelanggan.');
      }
    })();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert>{error}</Alert>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2><i className="fas fa-users"></i> Data Langganan</h2>
        <Button variant="primary" icon="fas fa-plus" onClick={() => alert('Fitur tambah pelanggan')}>
          Tambah Pelanggan
        </Button>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table id="customer-table" className="table-modern" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Nama Pelanggan</th>
                <th>No. Telepon</th>
                <th>Alamat</th>
                <th style={{ textAlign: 'center' }}>Status Member</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody id="customer-list-body">
              {customers.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>Memuat data...</td></tr>
              ) : (
                customers.map((c, idx) => (
                  <tr key={c.id || idx}>
                    <td><b>{c.name || c.nama}</b></td>
                    <td>{c.phone || c.telepon || '-'}</td>
                    <td>{c.address || c.alamat || '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge-pill" style={{ background: '#dcfce7', color: '#166534' }}>
                        {c.status || 'Member'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn-icon btn-primary" style={{ width: '30px', height: '30px' }} onClick={() => alert('Detail pelanggan')}>
                        <i className="fas fa-eye" style={{ fontSize: '12px' }}></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}