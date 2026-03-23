import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchVendorStats } from '../../services/vendor.service';
import '../../styles/vendor.css';
import '../../styles/admin.css';

function VendorAnalytics() {
  const [stats, setStats] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError('');
      setLoading(true);
      try {
        const data = await fetchVendorStats();
        if (!cancelled && data.success) {
          setStats(data.stats || null);
          setRestaurants(data.restaurants || []);
        } else if (!cancelled) {
          setError(data.message || 'Không tải được thống kê.');
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.response?.data?.message || e.message || 'Lỗi.');
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
        <p className="vendor-kicker">Thống kê</p>
        <h1 className="vendor-page-title">Tổng quan</h1>
      </div>

      {error && (
        <div className="vendor-alert vendor-alert--error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <p className="vendor-muted">Đang tải…</p>
      ) : stats ? (
        <>
          <div className="admin-stat-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-card__label">Nhà hàng</div>
              <div className="admin-stat-card__value">{stats.restaurantCount ?? 0}</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-card__label">Tổng booking</div>
              <div className="admin-stat-card__value">{stats.bookingTotal ?? 0}</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-card__label">Doanh thu cọc (đã thu)</div>
              <div className="admin-stat-card__value">
                {(stats.depositRevenue ?? 0).toLocaleString('vi-VN')}
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-card__label">PENDING</div>
              <div className="admin-stat-card__value">{by.PENDING ?? 0}</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-card__label">COMPLETED</div>
              <div className="admin-stat-card__value">{by.COMPLETED ?? 0}</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-card__label">CANCELLED</div>
              <div className="admin-stat-card__value">{by.CANCELLED ?? 0}</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-card__label">REJECTED</div>
              <div className="admin-stat-card__value">{by.REJECTED ?? 0}</div>
            </div>
          </div>

          {restaurants.length > 0 && (
            <>
              <h3 className="vendor-section-sub">Nhà hàng của bạn</h3>
              <ul className="vendor-muted" style={{ paddingLeft: '1.2rem' }}>
                {restaurants.map((r) => (
                  <li key={r._id}>{r.name}</li>
                ))}
              </ul>
            </>
          )}
        </>
      ) : null}

      <p style={{ marginTop: '1.5rem' }}>
        <Link to="/vendor/venues" style={{ color: '#38bdf8' }}>
          ← Nhà hàng
        </Link>
      </p>
    </div>
  );
}

export default VendorAnalytics;
