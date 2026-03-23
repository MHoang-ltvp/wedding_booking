import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAdminStats } from '../../services/admin.service';
import '../../styles/vendor.css';
import '../../styles/admin.css';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError('');
      setLoading(true);
      try {
        const data = await fetchAdminStats();
        if (!cancelled && data.success && data.stats) {
          setStats(data.stats);
        } else if (!cancelled) {
          setError(data.message || 'Không tải được thống kê.');
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.response?.data?.message || e.message || 'Lỗi mạng.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const by = stats?.bookingsByStatus || {};

  return (
    <div>
      <div className="vendor-page-header">
        <p className="admin-kicker">Bảng điều khiển</p>
        <h1 className="vendor-page-title">Tổng quan hệ thống</h1>
      </div>

      {error && (
        <div className="vendor-alert vendor-alert--error" role="alert">
          {error}
        </div>
      )}

      {loading && <p className="vendor-muted">Đang tải thống kê…</p>}

      {!loading && stats && (
        <>
          <div className="admin-stat-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-card__label">Người dùng</div>
              <div className="admin-stat-card__value">{stats.usersTotal ?? 0}</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-card__label">Vendor</div>
              <div className="admin-stat-card__value">{stats.vendors ?? 0}</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-card__label">Khách hàng</div>
              <div className="admin-stat-card__value">{stats.customers ?? 0}</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-card__label">Admin</div>
              <div className="admin-stat-card__value">{stats.admins ?? 0}</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-card__label">Nhà hàng</div>
              <div className="admin-stat-card__value">{stats.restaurantsTotal ?? 0}</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-card__label">Chờ duyệt NH</div>
              <div className="admin-stat-card__value">{stats.pendingRestaurantApprovals ?? 0}</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-card__label">Tổng đặt chỗ</div>
              <div className="admin-stat-card__value">{stats.bookingsTotal ?? 0}</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-card__label">Booking — Chờ xử lý</div>
              <div className="admin-stat-card__value">{by.PENDING ?? 0}</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-card__label">Booking — Hoàn thành</div>
              <div className="admin-stat-card__value">{by.COMPLETED ?? 0}</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-card__label">Booking — Hủy</div>
              <div className="admin-stat-card__value">{by.CANCELLED ?? 0}</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-card__label">Booking — Từ chối</div>
              <div className="admin-stat-card__value">{by.REJECTED ?? 0}</div>
            </div>
          </div>

          <p className="vendor-muted" style={{ marginBottom: '0.75rem' }}>
            Truy cập nhanh:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <Link to="/admin/restaurants" className="vendor-btn-primary" style={{ textDecoration: 'none' }}>
              Duyệt nhà hàng
            </Link>
            <Link to="/admin/users" className="vendor-btn-ghost" style={{ textDecoration: 'none' }}>
              Quản lý người dùng
            </Link>
            <Link to="/admin/bookings" className="vendor-btn-ghost" style={{ textDecoration: 'none' }}>
              Xem đặt chỗ
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminDashboard;
