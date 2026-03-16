import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:9999';

/**
 * Trang đăng nhập: form email/password, gọi POST /api/auth/login,
 * lưu token + user vào localStorage, redirect về /.
 */
function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/api/auth/login`, {
        email: email.trim(),
        password,
      });
      if (data.success && data.token && data.user) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/', { replace: true });
        window.location.reload(); // để Header cập nhật (đọc lại user từ localStorage)
      } else {
        setError(data.message || 'Đăng nhập thất bại.');
      }
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || 'Lỗi kết nối. Kiểm tra backend đã chạy chưa.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Đăng nhập</h1>
      <form onSubmit={handleSubmit} style={{ marginTop: '1rem', maxWidth: '320px' }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <label htmlFor="email">Email</label>
          <br />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{ width: '100%', padding: '0.35rem' }}
          />
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="password">Mật khẩu</label>
          <br />
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{ width: '100%', padding: '0.35rem' }}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
      {error && (
        <p style={{ marginTop: '0.75rem', color: '#c00' }}>{error}</p>
      )}
      <p style={{ marginTop: '1rem' }}>
        Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
      </p>
    </div>
  );
}

export default Login;
