import { useEffect, useState } from 'react';
import Button from '../../components/Button/Button';
import Alert from '../../components/Alert/Alert';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await window.api.getUsers();
        setUsers(res || []);
      } catch (e) {
        setError('Gagal memuat data pengguna.');
      }
    })();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert>{error}</Alert>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2><i className="fas fa-users-cog"></i> Pengaturan User</h2>
        <Button variant="primary" icon="fas fa-plus" onClick={() => alert('Fitur tambah akun')}>
          Tambah Akun
        </Button>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table id="user-table" className="table-modern" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Nama Lengkap</th>
                <th>Username</th>
                <th>Role / Hak Akses</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody id="user-list-body">
              {users.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>Memuat data...</td></tr>
              ) : (
                users.map((u, idx) => (
                  <tr key={u.id || idx}>
                    <td><b>{u.name || u.nama}</b></td>
                    <td>{u.username}</td>
                    <td>
                      <span className="badge-pill" style={{ background: '#dcfce7', color: '#166534' }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn-icon btn-primary" style={{ width: '30px', height: '30px' }} onClick={() => alert('Detail user')}>
                        <i className="fas fa-edit" style={{ fontSize: '12px' }}></i>
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