import { useCallback, useEffect, useState } from 'react';
import { fetchAdminBookings } from '../../services/admin.service';
import '../../styles/vendor.css';
import '../../styles/admin.css';

const STATUS_VI = {
  PENDING: 'Chờ xử lý',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  REJECTED: 'Từ chối',
};

function AdminBookings() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const params = { page, limit };
      if (status) params.status = status;
      const data = await fetchAdminBookings(params);
      if (data.success) {
        setItems(data.items || []);
        setTotal(data.total ?? 0);
      } else {
        setError(data.message || 'Không tải được.');
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Lỗi mạng.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, status]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const formatDate = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleString('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
    } catch {
      return String(d);
    }
  };

  return (
    <div>
      <div className="vendor-page-header">
        <p className="admin-kicker">Quản trị</p>
        <h1 className="vendor-page-title">Đặt chỗ</h1>
      </div>

      {error && (
        <div className="vendor-alert vendor-alert--error" role="alert">
          {error}
        </div>
      )}

      <div className="admin-toolbar">
        <label>
          Trạng thái
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            <option value="">Tất cả</option>
            <option value="PENDING">PENDING</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </label>
        <button type="button" className="vendor-btn-ghost" onClick={() => load()}>
          Làm mới
        </button>
      </div>

      {loading ? (
        <p className="vendor-muted">Đang tải…</p>
      ) : items.length === 0 ? (
        <p className="vendor-muted">Chưa có booking.</p>
      ) : (
        <>
          <div className="vendor-table-wrap">
            <table className="vendor-table">
              <thead>
                <tr>
                  <th>Ngày tạo</th>
                  <th>Khách</th>
                  <th>Nhà hàng</th>
                  <th>Sảnh</th>
                  <th>Ngày tiệc</th>
                  <th>TT</th>
                  <th>Tổng (đ)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((b) => (
                  <tr key={b._id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{formatDate(b.createdAt)}</td>
                    <td>
                      {b.customerId?.email || '—'}
                      <br />
                      <span className="vendor-muted" style={{ fontSize: '0.75rem' }}>
                        {b.customerId?.fullName}
                      </span>
                    </td>
                    <td style={{ maxWidth: 160 }}>{b.restaurantId?.name || '—'}</td>
                    <td>{b.hallId?.name || '—'}</td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{formatDate(b.bookingDate)}</td>
                    <td>{STATUS_VI[b.status] || b.status}</td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {b.estimatedTotal != null ? b.estimatedTotal.toLocaleString('vi-VN') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
            <p className="vendor-muted" style={{ margin: 0 }}>
              Trang {page} / {totalPages} — {total} bản ghi
            </p>
            <button
              type="button"
              className="vendor-btn-ghost"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Trước
            </button>
            <button
              type="button"
              className="vendor-btn-ghost"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Sau
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminBookings;
