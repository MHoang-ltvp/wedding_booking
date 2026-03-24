import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import '../styles/auth.css';

const AuthLayout = () => {
  const { user, loading } = useContext(AuthContext);

   
  if (loading) {
    return (
      <div className="auth-layout" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p className="text-muted">Đang tải...</p>
      </div>
    );
  }

  if (user) {
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'VENDOR') return <Navigate to="/vendor/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return (
    <div className="auth-layout">
      <div className="auth-image-side">
        <div className="auth-overlay"></div>
        <div className="auth-brand">
          <h1 className="brand-logo">Lumina</h1>
          <p className="brand-tagline">Elevating Your Special Day to Art.</p>
        </div>
      </div>
      <div className="auth-form-side">
        <div className="auth-container">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
