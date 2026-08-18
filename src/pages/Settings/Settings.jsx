import { useEffect, useState } from 'react';
import Button from '../../components/Button/Button';
import Alert from '../../components/Alert/Alert';

export default function Settings() {
  const [storeName, setStoreName] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storeFooter, setStoreFooter] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await window.api.getSettings();
        if (res) {
          setStoreName(res.name || res.store_name || '');
          setStorePhone(res.phone || '');
          setStoreAddress(res.address || '');
          setStoreFooter(res.footer || '');
        }
      } catch (e) {
        setError('Gagal memuat pengaturan toko.');
      }
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const success = await window.api.saveSettings({
        store_name: storeName,
        phone: storePhone,
        address: storeAddress,
        footer: storeFooter,
      });
      if (success) {
        setMessage('Pengaturan berhasil disimpan!');
      } else {
        setError('Gagal menyimpan pengaturan.');
      }
    } catch (e) {
      setError('Terjadi kesalahan sistem.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Alert variant="error">{error}</Alert>
      <Alert variant="success">{message}</Alert>

      <div style={{ marginBottom: '20px' }}>
        <h2><i className="fas fa-cogs"></i> Pengaturan Toko</h2>
      </div>

      <div className="card" style={{ maxWidth: '700px', margin: '0' }}>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Nama Toko / Percetakan</label>
            <input
              type="text"
              className="input-field"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              required
            />
          </div>

          <div className="input-group" style={{ marginTop: '12px' }}>
            <label>No. Telepon / WhatsApp</label>
            <input
              type="text"
              className="input-field"
              value={storePhone}
              onChange={(e) => setStorePhone(e.target.value)}
            />
          </div>

          <div className="input-group" style={{ marginTop: '12px' }}>
            <label>Alamat Lengkap</label>
            <textarea
              className="input-field"
              rows="3"
              value={storeAddress}
              onChange={(e) => setStoreAddress(e.target.value)}
              style={{ resize: 'vertical' }}
            ></textarea>
          </div>

          <div className="input-group" style={{ marginTop: '12px' }}>
            <label>Catatan Kaki Struk (Footer)</label>
            <textarea
              className="input-field"
              rows="2"
              placeholder="Contoh: Terima kasih telah berbelanja!"
              value={storeFooter}
              onChange={(e) => setStoreFooter(e.target.value)}
              style={{ resize: 'vertical' }}
            ></textarea>
          </div>

          <Button
            type="submit"
            variant="success"
            icon="fas fa-save"
            style={{ padding: '12px 20px', marginTop: '10px' }}
          >
            Simpan Pengaturan
          </Button>
        </form>
      </div>
    </div>
  );
}