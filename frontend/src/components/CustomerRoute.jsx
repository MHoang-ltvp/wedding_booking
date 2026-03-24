import { Navigate, Outlet } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export default function CustomerRoute() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>
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
  if (user?.role !== 'CUSTOMER') {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
