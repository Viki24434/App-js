import { useAuth } from '../../context/AuthContext';
import './Header.css';

export default function Header() {
  const { user } = useAuth();
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : '?';

  return (
    <header className="top-header">
      <div className="header-title">
        <i className="fas fa-store"></i>
        <span>POS</span>
      </div>
      <div className="header-user">
        <div className="header-user-meta">
          <strong>{user?.name || 'USERNAME'}</strong>
          <small>{user?.role || 'ROLE'}</small>
        </div>
        <div className="header-avatar">{initial}</div>
      </div>
    </header>
  );
}
