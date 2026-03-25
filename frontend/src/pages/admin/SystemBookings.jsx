import React, { useState, useEffect } from 'react';
import { fetchAdminBookings } from '../../services/admin.service';
import { toast } from 'react-toastify';

function labelBookingStatus(status) {
  const m = {
    PENDING: 'Chờ xử lý',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
    REJECTED: 'Từ chối',
  };
  return m[status] || status;
}

function labelShift(shift) {
  if (shift === 'MORNING') return 'Ca sáng';
  if (shift === 'EVENING') return 'Ca tối';
  return shift;
}

const SystemBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { items } = await fetchAdminBookings({ limit: 100 });
      setBookings(items);
    } catch (error) {
      toast.error('Không tải được đặt chỗ hệ thống.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'PENDING': return 'pending';
      case 'COMPLETED': return 'active';
      case 'CANCELLED': return 'locked';
      case 'REJECTED': return 'locked';
      default: return 'pending';
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header d-flex justify-between align-center">
        <h1 className="page-title">System Bookings</h1>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>Đang tải dữ liệu đặt chỗ…</div>
        ) : bookings.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có đặt chỗ nào trên hệ thống.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã đặt chỗ</th>
                  <th>Nhà hàng & sảnh</th>
                  <th>Khách</th>
                  <th>Ngày & ca</th>
                  <th>Số tiền</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b._id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>#{b._id.slice(-6).toUpperCase()}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{b.restaurantId?.name || '—'}</div>
                      <div className="text-muted" style={{ fontSize: '0.85rem' }}>{b.hallId?.name || '—'}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{b.customerId?.fullName || '—'}</div>
                      <div className="text-muted" style={{ fontSize: '0.85rem' }}>{b.customerId?.phone || '—'}</div>
                    </td>
                    <td>
                      <div>{new Date(b.bookingDate).toLocaleDateString('vi-VN')}</div>
                      <div className="text-muted" style={{ fontSize: '0.85rem' }}>{labelShift(b.shift)}</div>
                    </td>
                    <td>
                      <div style={{ color: 'var(--primary)', fontWeight: 600 }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(b.estimatedTotal)}</div>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusColor(b.status)}`}>{labelBookingStatus(b.status)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemBookings;
