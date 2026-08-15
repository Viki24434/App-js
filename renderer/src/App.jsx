import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './components/MainLayout/MainLayout';
import Login from './pages/Login/Login';
import Activation from './pages/Activation/Activation';
import Dashboard from './pages/Dashboard/Dashboard';

// import Orders from './pages/Orders/Orders';
// import Products from './pages/Products/Products';
// import Customers from './pages/Customers/Customers';
// import Finance from './pages/Finance/Finance';
// import Reports from './pages/Reports/Reports';
// import Users from './pages/Users/Users';
// import Settings from './pages/Settings/Settings';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
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
            {/* Halaman-halaman berikut menyusul setelah dikirim satu per satu */}
            {/* <Route path="orders" element={<Orders />} /> */}
            {/* <Route path="products" element={<Products />} /> */}
            {/* <Route path="customers" element={<Customers />} /> */}
            {/* <Route path="finance" element={<Finance />} /> */}
            {/* <Route path="reports" element={<Reports />} /> */}
            {/* <Route path="users" element={<Users />} /> */}
            {/* <Route path="settings" element={<Settings />} /> */}
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
