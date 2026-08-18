import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import Header from '../Header/Header';
import { useAuth } from '../../context/AuthContext';
import './MainLayout.css';

export default function MainLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <Sidebar onLogout={handleLogout} />
      <div className="main-wrapper">
        <Header />
        <main className="container-fluid">
          <div className="content-shell">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
}
