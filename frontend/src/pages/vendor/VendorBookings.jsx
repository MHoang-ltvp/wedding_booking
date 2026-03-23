import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  approveVendorBooking,
  completeVendorBooking,
  fetchMyRestaurants,
  fetchVendorBookings,
  rejectVendorBooking,
} from '../../services/vendor.service';
import '../../styles/vendor.css';
import '../../styles/admin.css';

const STATUS_VI = {
  PENDING: 'Chờ xử lý',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  REJECTED: 'Từ chối',
};

function VendorBookings() {
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantId, setRestaurantId] = useState('');
  const [status, setStatus] = useState('');
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchMyRestaurants();
        if (data.success && Array.isArray(data.restaurants)) {
          setRestaurants(data.restaurants);
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (status) params.status = status;
      if (restaurantId) params.restaurantId = restaurantId;
      const data = await fetchVendorBookings(params);
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
  }, [page, status, restaurantId]);

  useEffect(() => {
    load();
  }, [load]);

  const doApprove = async (id) => {
    const raw = window.prompt('Số tiền cọc yêu cầu (VNĐ)?', '5000000');
    if (raw === null) return;
    const depositRequired = Number(raw);
    if (Number.isNaN(depositRequired) || depositRequired < 0) {
      setError('Số không hợp lệ.');
      return;
    }
    setBusyId(id);
    setError('');
    try {
      const data = await approveVendorBooking(id, depositRequired);
      if (data.success) await load();
      else setError(data.message || 'Lỗi.');
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Lỗi.');
    } finally {
      setBusyId(null);
    }
  };

  const doReject = async (id) => {
    const reason = window.prompt('Lý do từ chối?');
    if (reason === null) return;
    setBusyId(id);
    setError('');
    try {
      const data = await rejectVendorBooking(id, reason);
      if (data.success) await load();
      else setError(data.message || 'Lỗi.');
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Lỗi.');
    } finally {
      setBusyId(null);
    }
  };

  const doComplete = async (id) => {
    if (!window.confirm('Đánh dấu hoàn thành tiệc?')) return;
    setBusyId(id);
    setError('');
    try {
      const data = await completeVendorBooking(id);
      if (data.success) await load();
      else setError(data.message || 'Lỗi.');
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Lỗi.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="vendor-page-header">
        <p className="vendor-kicker">Đặt chỗ</p>
        <h1 className="vendor-page-title">Quản lý booking</h1>
      </div>

      {error && (
        <div className="vendor-alert vendor-alert--error" role="alert">
          {error}
        </div>
      )}

      <div className="admin-toolbar" style={{ marginBottom: '1rem' }}>
        <label>
          Nhà hàng
          <select
            className="vendor-field__input"
            style={{ minWidth: 200 }}
            value={restaurantId}
            onChange={(e) => {
              setPage(1);
              setRestaurantId(e.target.value);
            }}
          >
            <option value="">Tất cả</option>
            {restaurants.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Trạng thái
          <select
            className="vendor-field__input"
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
                  <th>Khách</th>
                  <th>Nhà hàng</th>
                  <th>Sảnh</th>
                  <th>Ngày</th>
                  <th>TT</th>
                  <th>Cọc</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((b) => (
                  <tr key={b._id}>
                    <td>
                      {b.customerId?.email}
                      <br />
                      <span className="vendor-muted" style={{ fontSize: '0.8rem' }}>
                        {b.customerId?.fullName}
                      </span>
                    </td>
                    <td>{b.restaurantId?.name}</td>
                    <td>{b.hallId?.name}</td>
                    <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {b.bookingDate ? new Date(b.bookingDate).toLocaleString('vi-VN') : '—'}
                    </td>
                    <td>{STATUS_VI[b.status] || b.status}</td>
                    <td style={{ textAlign: 'right' }}>
                      {b.depositRequired != null ? (
                        <>
                          {b.depositRequired.toLocaleString('vi-VN')}
                          {b.depositPaid && (
                            <span className="vendor-muted" title="Khách đã xác nhận thanh toán"> ✓</span>
                          )}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {b.status === 'PENDING' && (
                        <>
                          <button
                            type="button"
                            className="vendor-btn-primary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', marginRight: 4 }}
                            disabled={busyId === b._id}
                            onClick={() => doApprove(b._id)}
                          >
                            Cọc
                          </button>
                          <button
                            type="button"
                            className="vendor-btn-ghost vendor-btn-ghost--danger"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', marginRight: 4 }}
                            disabled={busyId === b._id}
                            onClick={() => doReject(b._id)}
                          >
                            Từ chối
                          </button>
                          <button
                            type="button"
                            className="vendor-btn-ghost"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                            disabled={busyId === b._id}
                            onClick={() => doComplete(b._id)}
                          >
                            Xong
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="vendor-muted" style={{ marginTop: '0.75rem' }}>
            Tổng {total} booking — trang {page}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="vendor-btn-ghost"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Trước
            </button>
            <button type="button" className="vendor-btn-ghost" onClick={() => setPage((p) => p + 1)}>
              Sau
            </button>
          </div>
        </>
      )}

      <p style={{ marginTop: '1.5rem' }}>
        <Link to="/vendor/venues" style={{ color: '#38bdf8' }}>
          ← Nhà hàng
        </Link>
      </p>
    </div>
  );
}

export default VendorBookings;
