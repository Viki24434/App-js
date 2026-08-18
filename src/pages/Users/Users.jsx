import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader/PageHeader';
import Card from '../../components/Card/Card';
import Table from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import IconButton from '../../components/IconButton/IconButton';
import Input from '../../components/Input/Input';
import Select from '../../components/Select/Select';
import Alert from '../../components/Alert/Alert';
import Modal from '../../components/Modal/Modal';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import RowActions from '../../components/RowActions/RowActions';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Kasir');

  const loadData = async () => {
    try {
      const res = await window.api.getUsers();
      setUsers(res || []);
    } catch (e) {
      setError('Gagal memuat data pengguna.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (user = null) => {
    if (user) {
      setUserId(user.id);
      setName(user.name || user.nama || '');
      setUsername(user.username || '');
      setPassword('');
      setRole(user.role || 'Kasir');
    } else {
      setUserId('');
      setName('');
      setUsername('');
      setPassword('');
      setRole('Kasir');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { name, username, role };
      if (password) payload.password = password;

      if (userId) {
        if (window.api.updateUser) {
          await window.api.updateUser(userId, payload);
        } else {
          alert('Fungsi update user belum tersedia di API.');
        }
      } else {
        if (window.api.createUser) {
          await window.api.createUser(payload);
        } else {
          alert('Fungsi create user belum tersedia di API.');
        }
      }

      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setError('Gagal menyimpan data pengguna.');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Yakin ingin menghapus akun ini?')) {
      try {
        if (window.api.deleteUser) {
          await window.api.deleteUser(id);
          loadData();
        } else {
          alert('Fungsi delete user belum tersedia di API.');
        }
      } catch (err) {
        setError('Gagal menghapus pengguna.');
      }
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      (u.name || u.nama || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.username || '').toLowerCase().includes(search.toLowerCase())
  );

  const tableColumns = [
    {
      key: 'name',
      label: 'Nama Lengkap',
      render: (row) => <b>{row.name || row.nama}</b>
    },
    {
      key: 'username',
      label: 'Username',
      render: (row) => row.username
    },
    {
      key: 'role',
      label: 'Role / Hak Akses',
      headerStyle: { textAlign: 'center' },
      cellStyle: { textAlign: 'center' },
      render: (row) => (
        <StatusBadge variant={row.role === 'Admin' ? 'warning' : 'success'}>
          {row.role}
        </StatusBadge>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert>{error}</Alert>

      <PageHeader 
        title="Pengaturan User" 
        icon="fas fa-users-cog" 
        actionLabel="Tambah Akun"
        actionIcon="fas fa-plus"
        onAction={() => handleOpenModal()}
      />

      <Card>
        <div style={{ marginBottom: '15px', maxWidth: '300px' }}>
          <Input
            placeholder="Cari nama atau username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Table
          columns={tableColumns}
          data={filteredUsers}
          emptyText="Tidak ada data pengguna."
          keyField="id"
          renderActions={(row) => (
            <RowActions>
              <IconButton
                icon="fas fa-edit"
                variant="primary"
                onClick={() => handleOpenModal(row)}
              />
              <IconButton
                icon="fas fa-trash"
                variant="danger"
                onClick={() => handleDelete(row.id)}
              />
            </RowActions>
          )}
        />
      </Card>

      <Modal
        isOpen={isModalOpen}
        id="modal-user"
        title={userId ? 'Edit Akun User' : 'Tambah Akun User'}
        icon="fas fa-user-cog"
        onClose={() => setIsModalOpen(false)}
      >
        <form onSubmit={handleSave}>
          <div style={{ marginBottom: '12px' }}>
            <Input
              label="Nama Lengkap *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <Input
              label="Username *"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <Input
              label={userId ? 'Password (Kosongkan jika tidak diubah)' : 'Password *'}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!userId}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <Select label="Role / Hak Akses" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="Admin">Admin</option>
              <option value="Kasir">Kasir</option>
            </Select>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Button type="submit" variant="success" fullWidth style={{ justifyContent: 'center' }}>
              Simpan
            </Button>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}