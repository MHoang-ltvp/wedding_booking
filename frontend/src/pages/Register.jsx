import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/auth/AuthLayout';
import '../styles/auth.css';

function IconUser() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5 20v-1c0-2.5 2-4.5 7-4.5s7 2 7 4.5v1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconStore() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10l2-6h12l2 6v2H4v-2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M6 12v8h12v-8M9 20v-4h6v4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconMail() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6h16v12H4V6zm0 0l8 6 8-6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="5"
        y="11"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8 11V8a4 4 0 118 0v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const ROLES = [
  { value: 'CUSTOMER', label: 'Khách hàng', Icon: IconUser },
  { value: 'VENDOR', label: 'Chủ sạp', Icon: IconStore },
];

function Register() {
  const navigate = useNavigate();
  const { register, user } = useAuth();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('CUSTOMER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const passwordMismatch =
    confirmPassword !== '' && password !== confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận chưa khớp.');
      return;
    }
    setLoading(true);
    try {
      const data = await register(
        {
          email: email.trim(),
          fullName: fullName.trim(),
          phone: phone.trim(),
          password,
          role,
        },
        true
      );
      if (data.success && data.token && data.user) {
        navigate('/', { replace: true });
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
    <AuthLayout>
      <div className="auth-card">
        <p className="auth-tagline">Premium concierge</p>
        <h1 className="auth-title">Tạo tài khoản mới</h1>
        <p className="auth-subtitle">
          Bắt đầu hành trình tổ chức sự kiện đẳng cấp cùng chúng tôi.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <fieldset className="auth-role-fieldset">
            <legend className="auth-role-label">Bạn là ai?</legend>
            <div className="auth-role-grid">
            {ROLES.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                className={`auth-role-card ${
                  role === value ? 'auth-role-card--active' : ''
                }`}
                onClick={() => setRole(value)}
                aria-pressed={role === value}
              >
                <Icon />
                {label}
              </button>
            ))}
            </div>
          </fieldset>

          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-name">
              Họ và tên
            </label>
            <div className="auth-input-wrap">
              <IconUser />
              <input
                id="reg-name"
                className="auth-input"
                type="text"
                autoComplete="name"
                placeholder="Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-email">
              Email
            </label>
            <div className="auth-input-wrap">
              <IconMail />
              <input
                id="reg-email"
                className="auth-input"
                type="email"
                autoComplete="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-phone">
              Số điện thoại
            </label>
            <div className="auth-input-wrap">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.8-.4 1.2-.2 1.1.4 2.3.6 3.6.6.7 0 1.2.5 1.2 1.2V20c0 .7-.5 1.2-1.2 1.2C9.4 21.2 2.8 14.6 2.8 6.2 2.8 5.5 3.3 5 4 5h3.5c.7 0 1.2.5 1.2 1.2 0 1.3.2 2.5.6 3.6.1.4 0 .9-.2 1.2l-2.2 2.2z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
              </svg>
              <input
                id="reg-phone"
                className="auth-input"
                type="tel"
                autoComplete="tel"
                placeholder="0901 234 567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="auth-grid-2">
            <div className="auth-field">
              <label className="auth-label" htmlFor="reg-pass">
                Mật khẩu
              </label>
              <div className="auth-input-wrap">
                <IconLock />
                <input
                  id="reg-pass"
                  className="auth-input"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="auth-field">
              <label className="auth-label" htmlFor="reg-pass2">
                Xác nhận mật khẩu
              </label>
              <div className="auth-input-wrap">
                <IconLock />
                <input
                  id="reg-pass2"
                  className="auth-input"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
          {passwordMismatch && (
            <p className="auth-field-error">Mật khẩu chưa khớp.</p>
          )}

          <button
            className="auth-btn-primary"
            type="submit"
            disabled={loading || passwordMismatch}
            style={{ marginTop: '1rem' }}
          >
            {loading ? 'Đang tạo tài khoản…' : 'Tạo tài khoản'}
          </button>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
        </form>

        <p className="auth-footer">
          Đã có tài khoản?{' '}
          <strong>
            <Link to="/login">Đăng nhập</Link>
          </strong>
        </p>
      </div>
    </AuthLayout>
  );
}

export default Register;
