import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './components/MainLayout/MainLayout';
import Login from './pages/Login/Login';
import Activation from './pages/Activation/Activation';
import Dashboard from './pages/Dashboard/Dashboard';

import Orders from './pages/Orders/Orders';
import CreateOrder from './pages/Orders/Create';
import Products from './pages/Products/Products';
import Customers from './pages/Customers/Customers';
import Finance from './pages/Finance/Finance';
import Reports from './pages/Reports/Reports';
import Users from './pages/Users/Users';
import Settings from './pages/Settings/Settings';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const status = await window.api.checkActivation();
        
        if (status !== true && location.pathname !== '/activation') {
          navigate('/activation', { replace: true });
        } else if (status === true && location.pathname === '/activation') {
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsChecking(false);
      }
    })();
  }, [navigate, location.pathname]);

  if (isChecking) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc', color: 'var(--primary)', fontWeight: 'bold' }}>
        Memeriksa Lisensi Sistem...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/activation" element={<Activation />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/create" element={<CreateOrder />} />
        <Route path="products" element={<Products />} />
        <Route path="customers" element={<Customers />} />
        <Route path="finance" element={<Finance />} />
        <Route path="reports" element={<Reports />} />
        <Route path="users" element={<Users />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
}