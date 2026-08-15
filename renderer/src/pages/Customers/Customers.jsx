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

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState('Member');

  const loadData = async () => {
    try {
      const res = await window.api.getCustomers();
      setCustomers(res || []);
    } catch (e) {
      setError('Gagal memuat data pelanggan.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (customer = null) => {
    if (customer) {
      setCustomerId(customer.id);
      setName(customer.name || customer.nama || '');
      setPhone(customer.phone || customer.telepon || '');
      setAddress(customer.address || customer.alamat || '');
      setStatus(customer.status || 'Member');
    } else {
      setCustomerId('');
      setName('');
      setPhone('');
      setAddress('');
      setStatus('Member');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { name, phone, address, status };
      
      if (customerId) {
        await window.api.updateCustomer(customerId, payload);
      } else {
        await window.api.createCustomer(payload);
      }
      
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setError('Gagal menyimpan data pelanggan.');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Yakin ingin menghapus pelanggan ini?')) {
      try {
        await window.api.deleteCustomer(id);
        loadData();
      } catch (err) {
        setError('Gagal menghapus pelanggan.');
      }
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      (c.name || c.nama || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || c.telepon || '').toLowerCase().includes(search.toLowerCase())
  );

  const tableColumns = [
    {
      key: 'name',
      label: 'Nama Pelanggan',
      render: (row) => <b>{row.name || row.nama}</b>
    },
    {
      key: 'phone',
      label: 'No. Telepon',
      render: (row) => row.phone || row.telepon || '-'
    },
    {
      key: 'address',
      label: 'Alamat',
      render: (row) => row.address || row.alamat || '-'
    },
    {
      key: 'status',
      label: 'Status',
      headerStyle: { textAlign: 'center' },
      cellStyle: { textAlign: 'center' },
      render: (row) => (
        <StatusBadge variant={row.status === 'VIP' ? 'warning' : 'success'}>
          {row.status || 'Member'}
        </StatusBadge>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert>{error}</Alert>

      <PageHeader title="Data Langganan" icon="fas fa-users">
        <Button variant="primary" icon="fas fa-plus" onClick={() => handleOpenModal()}>
          Tambah Pelanggan
        </Button>
      </PageHeader>

      <Card>
        <Input
        placeholder="Cari nama atau no. telepon..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        />
        
        <Table 
          columns={tableColumns} 
          data={filteredCustomers} 
          emptyText="Tidak ada data pelanggan." 
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

      {isModalOpen && (
        <Modal 
          title={customerId ? 'Edit Pelanggan' : 'Tambah Pelanggan'} 
          icon="fas fa-user"
          onClose={() => setIsModalOpen(false)}
        >
          <form onSubmit={handleSave}>
            <div style={{ marginBottom: '12px' }}>
              <Input 
                label="Nama Pelanggan *" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <Input 
                label="No. Telepon / WhatsApp" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dark)', display: 'block', marginBottom: '6px' }}>Alamat Lengkap</label>
              <textarea 
                className="input-field" 
                rows="3" 
                value={address} 
                onChange={(e) => setAddress(e.target.value)}
                style={{ resize: 'vertical' }}
              ></textarea>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <Select label="Status Member" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Member">Member</option>
                <option value="VIP">VIP</option>
                <option value="Umum">Umum</option>
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
      )}
    </div>
  );
}