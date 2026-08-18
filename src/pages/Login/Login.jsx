import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card/Card';
import Input from '../../components/Input/Input';
import PasswordInput from '../../components/PasswordInput/PasswordInput';
import Button from '../../components/Button/Button';
import Alert from '../../components/Alert/Alert';
import './Login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const response = await window.api.login({ username, password });

    if (response.success) {
      login(response.user);
      navigate('/');
    } else {
      setError(response.message);
    }
  };

  return (
    <div style={{display: "flex", justifyContent: "center", alignItems: "center", height: "100%"}}>
      <Card minWidth={400}>
        <div className="login-header">
          <div className="login-icon">
            <i className="fas fa-print fa-2x"></i>
          </div>
          <h2>Selamat Datang</h2>
          <p>Silakan login ke POS Percetakan</p>
        </div>

        <Alert>{error}</Alert>

        <form onSubmit={handleSubmit}>
          <Input
            label="Username"
            type="text"
            required
            placeholder="Masukkan username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <PasswordInput
            label="Password"
            required
            placeholder="Masukkan password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" fullWidth icon="fas fa-sign-in-alt">
            Masuk Sekarang
          </Button>
        </form>
      </Card>
    </div>
  );
}
