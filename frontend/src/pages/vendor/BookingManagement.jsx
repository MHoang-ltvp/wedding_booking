import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { paths } from '../../api/endpoints';
import { fetchVendorBookings } from '../../services/vendor.service';
import { useVendorRestaurant } from '../../contexts/VendorRestaurantContext';
import { toast } from 'react-toastify';
import { CheckCircle, XCircle, CalendarCheck } from 'lucide-react';
import {
  paidInFullBooking,
  vendorAcceptedBooking,
} from '../../shared/bookingPayment';

const BookingManagement = () => {
  const { selectedRestaurantId, selectedRestaurant, loading: vrLoading, restaurants } =
    useVendorRestaurant();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  
  // Modal State for Approval
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Modal State for Reject
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (vrLoading) return;
    fetchBookings();
  }, [filter, selectedRestaurantId, vrLoading]);

  const fetchBookings = async () => {
    try {
      if (!selectedRestaurantId) {
        setBookings([]);
        setLoading(false);
        return;
      }
      const { items } = await fetchVendorBookings({
        limit: 100,
        restaurantId: selectedRestaurantId,
      });
      let data = items;
      if (filter === 'PENDING_AWAIT_VENDOR') {
        data = items.filter(
          (b) => b.status === 'PENDING' && !vendorAcceptedBooking(b)
        );
      } else if (filter === 'PENDING_AWAIT_PAY') {
        data = items.filter(
          (b) =>
            b.status === 'PENDING' &&
            vendorAcceptedBooking(b) &&
            !paidInFullBooking(b)
        );
      } else if (filter === 'PENDING_PAID') {
        data = items.filter(
          (b) => b.status === 'PENDING' && paidInFullBooking(b)
        );
      } else if (filter !== 'ALL') {
        data = items.filter((b) => b.status === filter);
      }
      setBookings(data);
    } catch (error) {
      toast.error('Không tải được đặt chỗ.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    try {
      await api.put(paths.vendor.bookingApprove(selectedBooking._id), {});
      toast.success('Đã chấp nhận. Khách sẽ thanh toán trọn gói một lần.');
      setShowApproveModal(false);
      setSelectedBooking(null);
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không chấp nhận được.');
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectReason) {
      toast.error('Please provide a reason');
      return;
    }
    try {
      await api.put(paths.vendor.bookingReject(selectedBooking._id), { rejectReason });
      toast.success('Booking rejected.');
      setShowRejectModal(false);
      setSelectedBooking(null);
      setRejectReason('');
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Rejection failed');
    }
  };

  const markCompleted = async (id) => {
    if(!window.confirm('Mark this event as strictly completed?')) return;
    try {
      // Assuming vendor status endpoint accepts COMPLETED 
      await api.put(paths.vendor.bookingStatus(id), { status: 'COMPLETED' });
      toast.success('Event marked as completed.');
      fetchBookings();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'pending';
      case 'COMPLETED':
        return 'active';
      case 'CANCELLED':
      case 'REJECTED':
        return 'locked';
      default:
        return 'pending';
    }
  };

  if (vrLoading) {
    return (
      <div className="fade-in" style={{ padding: '2rem', textAlign: 'center' }}>
        <p className="text-muted">Đang tải…</p>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="fade-in" style={{ padding: '2rem', textAlign: 'center' }}>
        <p className="text-muted" style={{ marginBottom: '1rem' }}>
          Bạn chưa có nhà hàng. Thêm nhà hàng để nhận đặt chỗ.
        </p>
        <Link to="/vendor/restaurants/new" className="btn btn-primary">
          Thêm nhà hàng
        </Link>
      </div>
    );
  }

  if (!selectedRestaurantId) {
    return (
      <div className="fade-in" style={{ padding: '2rem', textAlign: 'center' }}>
        <p className="text-muted">Chọn nhà hàng ở ô phía trên sidebar để xem đặt chỗ đúng địa điểm.</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header d-flex justify-between align-center flex-wrap gap-2">
        <div>
          <h1 className="page-title">Đặt chỗ</h1>
          {selectedRestaurant && (
            <p className="text-muted" style={{ marginTop: '0.35rem', fontSize: '0.9rem' }}>
              Chỉ hiển thị booking cho nhà hàng: <strong>{selectedRestaurant.name}</strong>
            </p>
          )}
        </div>
        <div className="input-group" style={{ marginBottom: 0 }}>
          <select className="input-field" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: '240px', height: '40px' }}>
            <option value="ALL">Tất cả</option>
            <option value="PENDING">Đang chờ xử lý</option>
            <option value="PENDING_AWAIT_VENDOR">Chờ nhà hàng chấp nhận</option>
            <option value="PENDING_AWAIT_PAY">Đã chấp nhận — chờ khách thanh toán</option>
            <option value="PENDING_PAID">Đã thanh toán (chờ hoàn tất sự kiện)</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="CANCELLED">Đã hủy</option>
            <option value="REJECTED">Từ chối</option>
          </select>
        </div>
      </div>

      {showApproveModal && (
        <div className="card fade-in" style={{ marginBottom: 'var(--space-5)', border: '1px solid #10B981', backgroundColor: '#ecfdf5' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#065f46' }}>Chấp nhận đặt chỗ #{selectedBooking._id.slice(-6).toUpperCase()}</h2>
          <form onSubmit={handleApprove}>
            <p className="text-muted" style={{ marginBottom: '1rem', lineHeight: 1.6 }}>
              Sau khi chấp nhận, khách sẽ thanh toán <strong>một lần đủ</strong> theo tổng ước tính dưới đây (không còn bước cọc riêng).
            </p>
            <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '1.1rem' }}>
              Tổng thanh toán: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedBooking.estimatedTotal)}
            </div>
            <div className="d-flex justify-end gap-3 mt-4">
              <button type="button" className="btn btn-outline" style={{ borderColor: '#059669', color: '#065f46' }} onClick={() => setShowApproveModal(false)}>Hủy</button>
              <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#10B981', borderColor: '#10B981' }}>Xác nhận chấp nhận</button>
            </div>
          </form>
        </div>
      )}

      {showRejectModal && (
        <div className="card fade-in" style={{ marginBottom: 'var(--space-5)', border: '1px solid #EF4444', backgroundColor: '#fef2f2' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#991b1b' }}>Reject Booking #{selectedBooking._id.slice(-6).toUpperCase()}</h2>
          <form onSubmit={handleReject}>
            <div className="input-group">
              <label>Reason for Rejection</label>
              <textarea className="input-field" rows="3" value={rejectReason} onChange={e => setRejectReason(e.target.value)} required placeholder="e.g. Hall fully booked on this date" />
            </div>
            <div className="d-flex justify-end gap-3 mt-4">
              <button type="button" className="btn btn-outline" style={{ borderColor: '#DC2626', color: '#991b1b' }} onClick={() => setShowRejectModal(false)}>Cancel</button>
              <button type="submit" className="btn" style={{ backgroundColor: '#EF4444', color: 'white' }}>Confirm Rejection</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>No bookings found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Customer Info</th>
                  <th>Event Details</th>
                  <th>Financials</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b._id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>#{b._id.slice(-6).toUpperCase()}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{b.customerId?.fullName || 'Ext User'}</div>
                      <div className="text-muted" style={{ fontSize: '0.85rem' }}>{b.customerId?.phone || 'N/A'}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{b.hallId?.name || 'Hall'}</div>
                      <div className="text-muted" style={{ fontSize: '0.85rem' }}>{new Date(b.bookingDate).toLocaleDateString('en-GB')} ({b.shift})</div>
                    </td>
                    <td>
                      <div style={{ color: 'var(--primary)', fontWeight: 600 }}>Est: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(b.estimatedTotal)}</div>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusColor(b.status)}`}>{b.status.replace('_', ' ')}</span>
                      {b.status === 'PENDING' && !vendorAcceptedBooking(b) && (
                        <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Chờ chấp nhận</div>
                      )}
                      {b.status === 'PENDING' && vendorAcceptedBooking(b) && !paidInFullBooking(b) && (
                        <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Chờ thanh toán</div>
                      )}
                      {b.status === 'PENDING' && paidInFullBooking(b) && (
                        <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Đã thanh toán đủ</div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="d-flex gap-2 justify-end">
                        {b.status === 'PENDING' && !vendorAcceptedBooking(b) && (
                          <>
                            <button className="btn btn-ghost" style={{ padding: '0.25rem', color: '#10B981' }} onClick={() => { setSelectedBooking(b); setShowApproveModal(true); setShowRejectModal(false); }} title="Chấp nhận">
                              <CheckCircle size={18} />
                            </button>
                            <button className="btn btn-ghost" style={{ padding: '0.25rem', color: '#EF4444' }} onClick={() => { setSelectedBooking(b); setShowRejectModal(true); setShowApproveModal(false); }} title="Từ chối">
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                        {b.status === 'PENDING' && paidInFullBooking(b) && (
                          <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => markCompleted(b._id)}>
                            <CalendarCheck size={14}/> Hoàn tất sự kiện
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

export default BookingManagement;
