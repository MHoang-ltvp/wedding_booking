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
    role: 'CUSTOMER'
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
        <h2>Create an Account</h2>
        <p>Join us to start your journey</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="input-group">
          <label>I am a...</label>
          <div className="role-selector d-flex gap-3">
            <label className={`role-option ${formData.role === 'CUSTOMER' ? 'active' : ''}`}>
              <input type="radio" name="role" value="CUSTOMER" checked={formData.role === 'CUSTOMER'} onChange={handleChange} />
              Customer
            </label>
            <label className={`role-option ${formData.role === 'VENDOR' ? 'active' : ''}`}>
              <input type="radio" name="role" value="VENDOR" checked={formData.role === 'VENDOR'} onChange={handleChange} />
              Vendor
            </label>
          </div>
        </div>

        <div className="input-group">
          <label>Full Name</label>
          <div className="input-wrapper">
            <User className="input-icon" size={20} />
            <input type="text" name="fullName" className="input-field with-icon" placeholder="John Doe" value={formData.fullName} onChange={handleChange} required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3" style={{marginBottom: '0'}}>
          <div className="input-group">
            <label>Email</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={20} />
              <input type="email" name="email" className="input-field with-icon" placeholder="Email" value={formData.email} onChange={handleChange} required />
            </div>
          </div>
          <div className="input-group">
            <label>Phone</label>
            <div className="input-wrapper">
              <Phone className="input-icon" size={20} />
              <input type="tel" name="phone" className="input-field with-icon" placeholder="Phone" value={formData.phone} onChange={handleChange} required />
            </div>
          </div>
        </div>

        <div className="input-group">
          <label>Password</label>
          <div className="input-wrapper">
            <Lock className="input-icon" size={20} />
            <input type="password" name="password" className="input-field with-icon" placeholder="Create password" value={formData.password} onChange={handleChange} required />
          </div>
        </div>

        <div className="auth-actions">
          <button type="submit" className="btn btn-primary full-width" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </div>
      </form>

      <div className="auth-footer text-center mt-4">
        <p>Already have an account? <Link to="/login" className="auth-link">Sign in</Link></p>
      </div>
    </div>
  );
};

export default Register;
