import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const NAV_GROUPS = [
  {
    label: 'Utama',
    items: [
      { to: '/', icon: 'fas fa-home', label: 'Dashboard', end: true },
      { to: '/orders', icon: 'fas fa-shopping-cart', label: 'Kasir / Orders' },
    ],
  },
  {
    label: 'Master Data',
    items: [
      { to: '/products', icon: 'fas fa-box', label: 'Data Produk' },
      { to: '/customers', icon: 'fas fa-users', label: 'Data Langganan' },
    ],
  },
  {
    label: 'Sistem & Laporan',
    items: [
      { to: '/finance', icon: 'fas fa-wallet', label: 'Arus Kas & Buku Kas' },
      { to: '/reports', icon: 'fas fa-chart-line', label: 'Laporan Keuangan' },
      { to: '/users', icon: 'fas fa-users-cog', label: 'Pengaturan User' },
      { to: '/settings', icon: 'fas fa-cogs', label: 'Pengaturan Toko' },
    ],
  },
];

export default function Sidebar({ onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon"><i className="fas fa-print"></i></div>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-title">POS Percetakan</span>
          <span className="sidebar-brand-subtitle">Workspace</span>
        </div>
      </div>

      <nav>
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="nav-group">{group.label}</div>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                <i className={item.icon}></i>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-logout">
        <a onClick={onLogout}>
          <i className="fas fa-sign-out-alt"></i>
          <span>Logout</span>
        </a>
      </div>
    </aside>
  );
}
