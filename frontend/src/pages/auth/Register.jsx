import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { User, Mail, Lock, Phone } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'CUSTOMER',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const result = await register(formData);
    setIsLoading(false);
    if (result.success) {
      if (result.role === 'VENDOR') navigate('/vendor/dashboard', { replace: true });
      else navigate('/', { replace: true });
    }
  };

  return (
    <div className="auth-box fade-in">
      <div className="auth-header">
        <h2>Tạo tài khoản</h2>
        <p>Tham gia để đặt tiệc hoặc quản lý nhà hàng</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="input-group">
          <label>Tôi là…</label>
          <div className="role-selector d-flex gap-3">
            <label className={`role-option ${formData.role === 'CUSTOMER' ? 'active' : ''}`}>
              <input type="radio" name="role" value="CUSTOMER" checked={formData.role === 'CUSTOMER'} onChange={handleChange} />
              Khách hàng
            </label>
            <label className={`role-option ${formData.role === 'VENDOR' ? 'active' : ''}`}>
              <input type="radio" name="role" value="VENDOR" checked={formData.role === 'VENDOR'} onChange={handleChange} />
              Nhà cung cấp
            </label>
          </div>
        </div>

        <div className="input-group">
          <label>Họ và tên</label>
          <div className="input-wrapper">
            <User className="input-icon" size={20} />
            <input
              type="text"
              name="fullName"
              className="input-field with-icon"
              placeholder="Nguyễn Văn A"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3" style={{ marginBottom: '0' }}>
          <div className="input-group">
            <label>Email</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={20} />
              <input
                type="email"
                name="email"
                className="input-field with-icon"
                placeholder="email@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="input-group">
            <label>Điện thoại</label>
            <div className="input-wrapper">
              <Phone className="input-icon" size={20} />
              <input
                type="tel"
                name="phone"
                className="input-field with-icon"
                placeholder="0900 000 000"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        <div className="input-group">
          <label>Mật khẩu</label>
          <div className="input-wrapper">
            <Lock className="input-icon" size={20} />
            <input
              type="password"
              name="password"
              className="input-field with-icon"
              placeholder="Tạo mật khẩu"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="auth-actions">
          <button type="submit" className="btn btn-primary full-width" disabled={isLoading}>
            {isLoading ? 'Đang tạo tài khoản…' : 'Đăng ký'}
          </button>
        </div>
      </form>

      <div className="auth-footer text-center mt-4">
        <p>
          Đã có tài khoản?{' '}
          <Link to="/login" className="auth-link">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
