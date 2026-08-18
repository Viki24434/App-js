import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

export default function Header() {
  const { user } = useAuth();
  const [storeName, setStoreName] = useState('Memuat...');
  const [ipAddress, setIpAddress] = useState('Memuat IP...');
  const [logoUrl, setLogoUrl] = useState(null);

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : '?';

  useEffect(() => {
    (async () => {
      try {
        if (window.api && window.api.getSettings) {
          const settings = await window.api.getSettings();
          if (settings && (settings.store_name || settings.name)) {
            setStoreName(settings.store_name || settings.name);
          } else {
            setStoreName('POS Percetakan');
          }
        }

        if (window.api && window.api.getIpAddress) {
          const ip = await window.api.getIpAddress();
          setIpAddress(ip);
        }
      } catch (error) {
        console.error('Gagal memuat data navbar:', error);
        setStoreName('POS Percetakan');
        setIpAddress('127.0.0.1');
      }
    })();
  }, []);

  return (
    <nav className="top-navbar">
      <div className="navbar-brand">
        {logoUrl ? (
          <img src={logoUrl} alt="Logo Toko" className="navbar-logo" />
        ) : (
          <i className="fas fa-store"></i>
        )}
        <span className="store-name">{storeName}</span>
      </div>
      
      <div className="navbar-right">
        <div className="navbar-ip" title="Alamat IP Server Lokal">
          <i className="fas fa-network-wired"></i> {ipAddress}
        </div>
        
        <div className="navbar-user">
          <div className="navbar-user-meta">
            <strong>{user?.name || 'USERNAME'}</strong>
            <small>{user?.role || 'Kasir'}</small>
          </div>
          <div className="navbar-avatar">{initial}</div>
        </div>
      </div>
    </nav>
  );
}