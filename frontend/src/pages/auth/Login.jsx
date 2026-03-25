import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { Mail, Lock, ArrowRight } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);
    if (result.success) {
      if (result.role === 'ADMIN') navigate('/admin/dashboard', { replace: true });
      else if (result.role === 'VENDOR') navigate('/vendor/dashboard', { replace: true });
      else navigate(from === '/login' ? '/' : from, { replace: true });
    }
  };

  return (
    <div className="auth-box fade-in">
      <div className="auth-header">
        <h2>Chào mừng trở lại</h2>
        <p>Đăng nhập để tiếp tục đặt tiệc và quản lý hồ sơ</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="input-group">
          <label>Email</label>
          <div className="input-wrapper">
            <Mail className="input-icon" size={20} />
            <input
              type="email"
              className="input-field with-icon"
              placeholder="Nhập email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="input-group">
          <label>Mật khẩu</label>
          <div className="input-wrapper">
            <Lock className="input-icon" size={20} />
            <input
              type="password"
              className="input-field with-icon"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="auth-actions">
          <button type="submit" className="btn btn-primary full-width" disabled={isLoading}>
            {isLoading ? 'Đang đăng nhập…' : 'Đăng nhập'}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </div>
      </form>

      <div className="auth-footer">
        <p>
          Chưa có tài khoản?{' '}
          <Link to="/register" className="auth-link">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
