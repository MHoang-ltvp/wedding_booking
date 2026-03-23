import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Chỉ **CUSTOMER** — vendor/admin được chuyển về khu quản trị tương ứng.
 */
function CustomerRoute() {
  const { user, bootstrapping } = useAuth();

  if (bootstrapping) {
    return (
      <div className="vendor-app vendor-app--loading customer-app">
        <p className="vendor-muted">Đang tải…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'VENDOR') {
    return <Navigate to="/vendor/venues" replace />;
  }

  if (user.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (user.role !== 'CUSTOMER') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default CustomerRoute;
