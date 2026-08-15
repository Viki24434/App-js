import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import Alert from '../../components/Alert/Alert';

export default function Activation() {
  const navigate = useNavigate();
  const [deviceId, setDeviceId] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const status = await window.api.checkActivation();
        if (status === true) {
          navigate('/login');
        } else {
          setDeviceId(status);
          setLoading(false);
        }
      } catch (err) {
        setError('Gagal membaca Device ID. Pastikan jembatan API terhubung.');
        setLoading(false);
      }
    })();
  }, [navigate]);

  const handleActivate = async (e) => {
    e.preventDefault();
    setError('');

    if (!licenseKey.trim()) {
      setError('Masukkan kode lisensi terlebih dahulu!');
      return;
    }

    try {
      const success = await window.api.activateDevice(licenseKey.trim());
      if (success) {
        navigate('/login');
      } else {
        setError('Lisensi tidak valid atau tidak cocok untuk perangkat ini.');
      }
    } catch (err) {
      setError('Terjadi kesalahan sistem saat proses aktivasi.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' }}>
        <p style={{ color: 'var(--muted)', fontWeight: 600 }}>Memeriksa status aktivasi...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' }}>
      <div className="card" style={{ maxWidth: '450px', width: '100%', padding: '30px', margin: '20px', textAlign: 'center', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
        
        <div style={{ marginBottom: '25px' }}>
          <div style={{ width: '60px', height: '60px', background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 15px', fontSize: '24px' }}>
            <i className="fas fa-lock"></i>
          </div>
          <h2 style={{ color: 'var(--dark)', margin: '0 0 10px 0', fontSize: '22px', fontWeight: 800 }}>
            Aktivasi Perangkat
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
            Aplikasi ini memerlukan lisensi resmi untuk digunakan. Silakan berikan Device ID berikut ke pihak developer.
          </p>
        </div>

        <Alert>{error}</Alert>

        <div style={{ background: '#f1f5f9', padding: '15px', borderRadius: '12px', marginBottom: '25px', border: '1px dashed #cbd5e1' }}>
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Device ID Anda
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '20px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '2px', wordBreak: 'break-all' }}>
            {deviceId || 'MEMUAT...'}
          </p>
        </div>

        <form onSubmit={handleActivate} style={{ textAlign: 'left' }}>
          <Input
            label="Kode Lisensi"
            placeholder="XXXX-XXXX-XXXX-XXXX"
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
            required
          />
          
          <Button 
            type="submit" 
            variant="primary" 
            fullWidth 
            icon="fas fa-key"
            style={{ marginTop: '20px', height: '48px', justifyContent: 'center', fontSize: '15px', fontWeight: 700 }}
          >
            Aktivasi Sekarang
          </Button>
        </form>

      </div>
    </div>
  );
}