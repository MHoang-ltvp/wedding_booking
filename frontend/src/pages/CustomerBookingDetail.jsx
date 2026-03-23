import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  cancelCustomerBooking,
  confirmCustomerPayment,
  fetchCustomerBooking,
} from '../services/customerBooking.service';

const STATUS_VI = {
  PENDING: 'Chờ xử lý',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  REJECTED: 'Từ chối',
};

function CustomerBookingDetail() {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [payBusy, setPayBusy] = useState(false);

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const data = await fetchCustomerBooking(bookingId);
      if (data.success && data.booking) {
        setBooking(data.booking);
      } else {
        setError(data.message || 'Không tìm thấy.');
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Lỗi.');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (user?.role === 'CUSTOMER') {
      load();
    }
  }, [user?.role, load]);

  const handleCancel = async () => {
    if (!window.confirm('Hủy booking này?')) return;
    try {
      const data = await cancelCustomerBooking(bookingId, 'Khách hàng hủy');
      if (data.success) await load();
      else setError(data.message || 'Không hủy được.');
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Lỗi.');
    }
  };

  const handlePayDeposit = async () => {
    const amount = booking?.depositRequired;
    if (amount == null || Number(amount) <= 0) {
      setError('Nhà hàng chưa nhập số tiền cọc.');
      return;
    }
    if (!window.confirm(`Xác nhận đã thanh toán cọc ${Number(amount).toLocaleString('vi-VN')} đ?`)) return;
    setPayBusy(true);
    setError('');
    try {
      const data = await confirmCustomerPayment(bookingId);
      if (data.success) {
        await load();
      } else {
        setError(data.message || 'Không ghi nhận được thanh toán.');
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Lỗi.');
    } finally {
      setPayBusy(false);
    }
  };

  if (user?.role !== 'CUSTOMER') {
    return (
      <div className="customer-page">
        <p className="customer-alert customer-alert--error">Chỉ khách hàng xem được.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="customer-page">
        <p className="customer-muted">Đang tải…</p>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="customer-page">
        <p className="customer-alert customer-alert--error">{error}</p>
        <Link to="/my-bookings" className="customer-link">
          ← Booking của tôi
        </Link>
      </div>
    );
  }

  const b = booking;

  return (
    <div className="customer-page">
      <Link to="/my-bookings" className="customer-link" style={{ display: 'inline-block', marginBottom: '1rem' }}>
        ← Booking của tôi
      </Link>

      <h1 className="customer-page__title">Chi tiết booking</h1>

      {error && <p className="customer-alert customer-alert--error">{error}</p>}

      <div className="customer-detail">
        <p>
          <strong>Trạng thái:</strong> {STATUS_VI[b.status] || b.status}
        </p>
        <p>
          <strong>Nhà hàng:</strong> {b.restaurantId?.name}
        </p>
        <p>
          <strong>Sảnh:</strong> {b.hallId?.name}
        </p>
        <p>
          <strong>Ngày:</strong> {b.bookingDate ? new Date(b.bookingDate).toLocaleString('vi-VN') : '—'}
        </p>
        <p>
          <strong>Ca:</strong> {b.shift}
        </p>
        <p>
          <strong>Tổng dự kiến:</strong> {b.estimatedTotal?.toLocaleString('vi-VN')} đ
        </p>
        <p>
          <strong>Cọc yêu cầu:</strong>{' '}
          {b.depositRequired != null ? `${b.depositRequired.toLocaleString('vi-VN')} đ` : '—'}
        </p>
        {b.rejectReason && (
          <p>
            <strong>Lý do từ chối:</strong> {b.rejectReason}
          </p>
        )}
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {b.status === 'PENDING' && (
          <>
            <button type="button" className="customer-btn customer-btn--ghost" onClick={handleCancel}>
              Hủy booking
            </button>
            {b.depositRequired != null &&
              Number(b.depositRequired) > 0 &&
              !b.depositPaid && (
              <button
                type="button"
                className="customer-btn customer-btn--primary"
                disabled={payBusy}
                onClick={handlePayDeposit}
              >
                {payBusy ? 'Đang xử lý…' : 'Xác nhận đã thanh toán cọc'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default CustomerBookingDetail;
