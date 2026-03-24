import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Header from '../components/Header';

/**
 * Layout công khai cho khách (CUSTOMER / chưa đăng nhập).
 * Vendor & Admin không dùng màn hình chung này — luôn vào khu vực riêng.
 */
const MainLayout = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="main-layout" style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <p className="text-muted">Đang tải...</p>
      </div>
    );
  }

  if (user?.role === 'VENDOR') {
    return <Navigate to="/vendor/dashboard" replace />;
  }
  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="main-layout" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <main className="content" style={{ flex: 1 }}>
        <Outlet />
      </main>
      <footer className="footer" style={{ padding: '2rem 0', backgroundColor: 'var(--surface)', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <p className="text-muted">&copy; {new Date().getFullYear()} Lumina. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default MainLayout;
