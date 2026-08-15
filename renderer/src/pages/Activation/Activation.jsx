import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/Card/Card';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import './Activation.css';

export default function Activation() {
  const [deviceId, setDeviceId] = useState('MEMUAT...');
  const [licenseKey, setLicenseKey] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const result = await window.api.checkActivation();
        setDeviceId(
          typeof result === 'string' && result !== 'true' ? result : 'ERROR_DEVICE_ID'
        );
      } catch (err) {
        console.error('Gagal memuat Device ID:', err);
        setDeviceId('GAGAL MEMUAT');
      }
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const sukses = await window.api.activateDevice(licenseKey);

    if (sukses) {
      alert('Aktivasi Berhasil! Silakan Login.');
      navigate('/login');
    } else {
      alert('Kode Lisensi Tidak Valid untuk Komputer ini!');
    }
  };

  return (
    <Card maxWidth={450}>
      <div className="activation-header">
        <i className="fas fa-lock fa-3x"></i>
        <h2>Aktivasi Perangkat</h2>
        <p>Aplikasi ini mendeteksi perangkat baru. Silakan masukkan kunci aktivasi untuk komputer ini.</p>
      </div>

      <div className="device-id-box">
        <small>Device ID Anda:</small>
        <strong>{deviceId}</strong>
      </div>

      <form onSubmit={handleSubmit}>
        <Input
          type="text"
          required
          placeholder="Masukkan Kunci Lisensi..."
          value={licenseKey}
          onChange={(e) => setLicenseKey(e.target.value)}
          style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}
        />
        <Button type="submit" fullWidth>
          Aktivasi Sekarang
        </Button>
      </form>
    </Card>
  );
}
