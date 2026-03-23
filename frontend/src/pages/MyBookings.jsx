import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchMyBookings } from '../services/customerBooking.service';

const STATUS_VI = {
  PENDING: 'Chờ xử lý',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  REJECTED: 'Từ chối',
};

function MyBookings() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (user?.role !== 'CUSTOMER') return;
    setError('');
    setLoading(true);
    try {
      const data = await fetchMyBookings({ page, limit: 15 });
      if (data.success) {
        setItems(data.items || []);
        setTotal(data.total ?? 0);
      } else {
        setError(data.message || 'Không tải được.');
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Lỗi.');
    } finally {
      setLoading(false);
    }
  }, [page, user?.role]);

  useEffect(() => {
    load();
  }, [load]);

  if (user?.role !== 'CUSTOMER') {
    return (
      <div className="customer-page">
        <p className="customer-alert customer-alert--error">Chỉ tài khoản khách hàng mới xem được trang này.</p>
      </div>
    );
  }

  return (
    <div className="customer-page">
      <header className="customer-page__head">
        <h1 className="customer-page__title">Booking của tôi</h1>
      </header>

      {error && <p className="customer-alert customer-alert--error">{error}</p>}

      {loading ? (
        <p className="customer-muted">Đang tải…</p>
      ) : items.length === 0 ? (
        <p className="customer-muted">
          Chưa có booking.{' '}
          <Link to="/" className="customer-link">
            Trang chủ
          </Link>
        </p>
      ) : (
        <div className="customer-table-wrap">
          <table className="customer-table">
            <thead>
              <tr>
                <th>Nhà hàng</th>
                <th>Sảnh</th>
                <th>Ngày</th>
                <th>Ca</th>
                <th>TT</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((b) => (
                <tr key={b._id}>
                  <td>{b.restaurantId?.name || '—'}</td>
                  <td>{b.hallId?.name || '—'}</td>
                  <td>{b.bookingDate ? new Date(b.bookingDate).toLocaleDateString('vi-VN') : '—'}</td>
                  <td>{b.shift}</td>
                  <td>{STATUS_VI[b.status] || b.status}</td>
                  <td>
                    <Link to={`/bookings/${b._id}`} className="customer-link">
                      Chi tiết
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 15 && (
        <div className="customer-pagination">
          <button
            type="button"
            className="customer-btn customer-btn--ghost"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Trước
          </button>
          <span className="customer-muted">
            Trang {page} / {Math.max(1, Math.ceil(total / 15))}
          </span>
          <button
            type="button"
            className="customer-btn customer-btn--ghost"
            disabled={page * 15 >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}

export default MyBookings;
