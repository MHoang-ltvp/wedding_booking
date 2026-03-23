import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/auth/AuthLayout';
import '../styles/auth.css';

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

function IconEye({ off }) {
  if (off) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M3 3l18 18M10.5 10.5a2 2 0 002.2 2.2M9.88 9.88A3 3 0 0114 14M6.53 6.53A9.4 9.4 0 0012 5c4 0 7.33 2.33 9 6a9.36 9.36 0 01-2.24 3.5M12 19c-4 0-7.33-2.33-9-6a9.3 9.3 0 012.06-2.94"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const homeForRole = (u) => {
    if (!u) return from;
    if (u.role === 'ADMIN') return '/admin/dashboard';
    if (u.role === 'VENDOR') return '/vendor/venues';
    return from;
  };

  useEffect(() => {
    if (user) {
      navigate(homeForRole(user), { replace: true });
    }
  }, [user, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login({
        email: email.trim(),
        password,
        remember,
      });
      if (data.success && data.token && data.user) {
        navigate(homeForRole(data.user), { replace: true });
      } else {
        setError(data.message || 'Đăng nhập thất bại.');
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
        <h1 className="auth-title">Chào mừng trở lại</h1>
        <p className="auth-subtitle">
          Quản lý không gian sự kiện đẳng cấp của bạn
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label className="auth-label" htmlFor="login-email">
              Email
            </label>
            <div className="auth-input-wrap">
              <IconMail />
              <input
                id="login-email"
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
            <label className="auth-label" htmlFor="login-password">
              Mật khẩu
            </label>
            <div className="auth-input-wrap">
              <IconLock />
              <input
                id="login-password"
                className="auth-input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="auth-input-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                <IconEye off={showPassword} />
              </button>
            </div>
          </div>

          <div className="auth-row-between">
            <label className="auth-checkbox">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Ghi nhớ tôi
            </label>
            <span className="auth-link auth-link--muted" title="Sắp có">
              Quên mật khẩu?
            </span>
          </div>

          <button className="auth-btn-primary" type="submit" disabled={loading}>
            {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </button>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
        </form>

        <p className="auth-footer">
          Chưa có tài khoản?{' '}
          <strong>
            <Link to="/register">Đăng ký ngay</Link>
          </strong>
        </p>
      </div>
    </AuthLayout>
  );
}

export default Login;
