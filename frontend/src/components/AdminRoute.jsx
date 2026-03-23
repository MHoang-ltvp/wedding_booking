import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/** Chỉ role ADMIN */
function AdminRoute() {
  const { user, bootstrapping } = useAuth();

  if (bootstrapping) {
    return (
      <div className="vendor-app vendor-app--loading">
        <p className="vendor-muted">Đang tải…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default AdminRoute;
