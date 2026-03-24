import React, { useState, useEffect } from 'react';
import {
  fetchMyBookings,
  cancelBooking,
  confirmBookingPayment,
  resubmitBooking,
} from '../../services/customer.service';
import { toast } from 'react-toastify';
import { Eye, XCircle, CreditCard, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  canCustomerPayBooking,
  paidInFullBooking,
  vendorAcceptedBooking,
  amountDueFull,
} from '../../shared/bookingPayment';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { items } = await fetchMyBookings({ limit: 50 });
      setBookings(items);
    } catch (error) {
      toast.error('Không tải được danh sách đặt chỗ.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Hủy yêu cầu đặt chỗ này?')) return;
    try {
      await cancelBooking(id, 'Khách hàng hủy');
      toast.success('Đã hủy đặt chỗ.');
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không hủy được.');
    }
  };

  const handleConfirmPayment = async (id) => {
    if (
      !window.confirm(
        'Xác nhận bạn đã thanh toán đủ một lần (trọn gói) theo tổng tiền đặt chỗ?'
      )
    )
      return;
    try {
      await confirmBookingPayment(id);
      toast.success('Đã ghi nhận thanh toán trọn gói.');
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không xác nhận được thanh toán.');
    }
  };

  const handleResubmit = async (id) => {
    if (!window.confirm('Gửi lại yêu cầu đặt chỗ?')) return;
    try {
      await resubmitBooking(id);
      toast.success('Đã gửi lại.');
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gửi lại thất bại.');
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
    <div className="container fade-in" style={{ padding: 'var(--space-6) var(--space-4)' }}>
      <div className="page-header d-flex justify-between align-center">
        <h1 className="page-title">My Bookings</h1>
        <Link to="/" className="btn btn-primary">Discover Venues</Link>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>Loading your events...</div>
        ) : bookings.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            You haven't made any bookings yet.<br/><br/>
            <Link to="/" className="btn btn-outline mt-4">Browse Venues</Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Booking Reference</th>
                  <th>Venue & Hall</th>
                  <th>Date & Shift</th>
                  <th>Total (Est/Final)</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b._id}>
                    <td>
                      <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>#{b._id.slice(-6).toUpperCase()}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{b.restaurantId?.name || 'Unknown Venue'}</div>
                      <div className="text-muted" style={{ fontSize: '0.85rem' }}>{b.hallId?.name || 'Unknown Hall'}</div>
                    </td>
                    <td>
                      <div>{new Date(b.bookingDate).toLocaleDateString('en-GB')}</div>
                      <div className="text-muted" style={{ fontSize: '0.85rem' }}>{b.shift}</div>
                    </td>
                    <td style={{ color: 'var(--primary)', fontWeight: 600 }}>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(b.finalAmount || b.estimatedTotal)}
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusColor(b.status)}`}>
                        {b.status.replace('_', ' ')}
                      </span>
                      {b.status === 'PENDING' && !vendorAcceptedBooking(b) && (
                        <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#92400e', fontWeight: 600 }}>
                          Chờ nhà hàng chấp nhận
                        </div>
                      )}
                      {b.status === 'PENDING' && vendorAcceptedBooking(b) && !paidInFullBooking(b) && (
                        <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#92400e', fontWeight: 600 }}>
                          Cần thanh toán: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amountDueFull(b))}
                        </div>
                      )}
                      {b.status === 'PENDING' && paidInFullBooking(b) && (
                        <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#10B981', fontWeight: 600 }}>
                          Đã thanh toán đủ
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="d-flex gap-2 justify-end" style={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <Link to={`/profile/bookings/${b._id}`} className="btn btn-ghost" style={{ padding: '0.25rem', color: 'var(--text-muted)' }} title="View Details">
                           <Eye size={18} />
                        </Link>
                        {canCustomerPayBooking(b) && (
                          <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleConfirmPayment(b._id)}>
                            <CreditCard size={14} /> Thanh toán trọn gói
                          </button>
                        )}
                        {b.status === 'PENDING' && !paidInFullBooking(b) && (
                          <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', color: 'var(--error)', borderColor: 'var(--error)' }} onClick={() => handleCancel(b._id)}>
                            <XCircle size={14} /> Cancel
                          </button>
                        )}
                        {(b.status === 'CANCELLED' || b.status === 'REJECTED') && (
                          <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', color: 'var(--primary)', borderColor: 'var(--primary)' }} onClick={() => handleResubmit(b._id)}>
                            <RefreshCw size={14} /> Resubmit
                          </button>
                        )}
                      </div>
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

export default MyBookings;
