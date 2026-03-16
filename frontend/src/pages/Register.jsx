import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:9999';

const ROLE_OPTIONS = [
  { value: 'CUSTOMER', label: 'Khách Hàng' },
  { value: 'VENDOR', label: 'Chủ Nhà Hàng' },
];

/**
 * Trang đăng ký: email, fullName, phone, password, dropdown "Bạn là ai".
 * Gọi POST /api/auth/register, lưu token + user, redirect về /.
 */
function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('CUSTOMER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordMismatch = confirmPassword !== '' && password !== confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Mật khẩu chưa khớp.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/api/auth/register`, {
        email: email.trim(),
        fullName: fullName.trim(),
        phone: phone.trim(),
        password,
        role,
      });
      if (data.success && data.token && data.user) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/', { replace: true });
        window.location.reload();
      } else {
        setError(data.message || 'Đăng ký thất bại.');
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Lỗi kết nối. Kiểm tra backend đã chạy chưa.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Đăng ký</h1>
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
        <div style={{ marginBottom: '0.5rem' }}>
          <label htmlFor="fullName">Họ tên</label>
          <br />
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
            style={{ width: '100%', padding: '0.35rem' }}
          />
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label htmlFor="phone">Số điện thoại</label>
          <br />
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            autoComplete="tel"
            style={{ width: '100%', padding: '0.35rem' }}
          />
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label htmlFor="password">Mật khẩu</label>
          <br />
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            style={{ width: '100%', padding: '0.35rem' }}
          />
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label htmlFor="confirmPassword">Nhập lại mật khẩu</label>
          <br />
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            style={{
              width: '100%',
              padding: '0.35rem',
              ...(passwordMismatch && { borderColor: '#c00', outline: '1px solid #c00' }),
            }}
          />
          {passwordMismatch && (
            <p style={{ margin: '0.25rem 0 0', color: '#c00', fontSize: '0.9rem' }}>
              Chưa khớp
            </p>
          )}
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="role">Bạn là</label>
          <br />
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ width: '100%', padding: '0.35rem' }}
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={loading || passwordMismatch}>
          {loading ? 'Đang đăng ký...' : 'Đăng ký'}
        </button>
      </form>
      {error && (
        <p style={{ marginTop: '0.75rem', color: '#c00' }}>{error}</p>
      )}
      <p style={{ marginTop: '1rem' }}>
        Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
      </p>
    </div>
  );
}

export default Register;
