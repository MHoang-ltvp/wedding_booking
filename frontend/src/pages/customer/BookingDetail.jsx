import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchBookingDetail, confirmBookingPayment } from '../../services/customer.service';
import { toast } from 'react-toastify';
import { ArrowLeft, CheckCircle2, Clock, MapPin, XCircle, LayoutTemplate, CreditCard } from 'lucide-react';
import {
  canCustomerPayBooking,
  paidInFullBooking,
  vendorAcceptedBooking,
  amountDueFull,
} from '../../shared/bookingPayment';

const BookingDetail = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const reload = async () => {
    const b = await fetchBookingDetail(id);
    setBooking(b);
  };

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        await reload();
      } catch (error) {
        toast.error('Không tải được chi tiết đặt chỗ.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handlePayFull = async () => {
    if (
      !window.confirm(
        'Xác nhận đã thanh toán đủ một lần (trọn gói) theo tổng tiền dưới đây?'
      )
    )
      return;
    setPaying(true);
    try {
      await confirmBookingPayment(id);
      toast.success('Đã ghi nhận thanh toán trọn gói.');
      await reload();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không xác nhận được thanh toán.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading details...</div>;
  if (!booking) return <div style={{ padding: '4rem', textAlign: 'center' }}>Booking not found.</div>;

  return (
    <div className="container fade-in" style={{ padding: 'var(--space-6) var(--space-4)', maxWidth: '900px' }}>
      <Link to="/profile/bookings" className="btn btn-ghost mb-4 d-inline-flex" style={{ padding: 0 }}><ArrowLeft size={18} /> Back to My Bookings</Link>
      
      <div className="page-header d-flex justify-between align-center">
        <h1 className="page-title">Booking #{booking._id.slice(-6).toUpperCase()}</h1>
        <span className={`status-badge ${booking.status === 'PENDING' ? 'pending' : booking.status === 'COMPLETED' ? 'active' : 'locked'}`} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
          {booking.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Venue Information</h2>
          <div className="d-flex align-center gap-2 mb-2"><MapPin size={18} className="text-muted"/> <span style={{ fontWeight: 600 }}>{booking.restaurantId?.name}</span></div>
          <div className="text-muted mb-4" style={{ paddingLeft: '26px' }}>{booking.restaurantId?.address}</div>
          
          <div className="d-flex align-center gap-2 mb-2"><LayoutTemplate size={18} className="text-muted"/> <span>Hall: <strong style={{color: 'var(--primary)'}}>{booking.hallId?.name}</strong></span></div>
          <div className="d-flex align-center gap-2 mb-2"><Clock size={18} className="text-muted"/> <span>Date: <strong>{new Date(booking.bookingDate).toLocaleDateString()} ({booking.shift})</strong></span></div>
          
          {booking.customerNote && (
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: 'var(--radius-md)' }}>
              <strong>Your Note:</strong> <p className="text-muted mt-1">{booking.customerNote}</p>
            </div>
          )}
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Financial Overview</h2>
          <div className="d-flex justify-between mb-2">
            <span>Hall Base Price:</span>
            <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.hallId?.basePrice || 0)}</span>
          </div>
          
          <div className="mt-3 mb-2" style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Selected Services:</div>
          {booking.services?.map((svc, idx) => (
            <div key={idx} className="d-flex justify-between mb-2" style={{ fontSize: '0.9rem' }}>
              <span>{svc.type} x{svc.quantity}</span>
              <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(svc.snapshotPrice * svc.quantity)}</span>
            </div>
          ))}

          <div className="d-flex justify-between mt-4" style={{ borderTop: '2px dashed var(--border)', paddingTop: '1rem', fontWeight: 600, fontSize: '1.2rem', color: 'var(--primary)' }}>
            <span>Estimated Total:</span>
            <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.estimatedTotal)}</span>
          </div>

          {booking.status === 'PENDING' && (
            <div
              style={{
                marginTop: '1.5rem',
                padding: '1rem',
                backgroundColor: paidInFullBooking(booking) ? '#ecfdf5' : '#fffbeb',
                border: `1px solid ${paidInFullBooking(booking) ? '#10b981' : '#f59e0b'}`,
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div
                className="d-flex justify-between"
                style={{
                  fontWeight: 600,
                  color: paidInFullBooking(booking) ? '#065f46' : '#b45309',
                }}
              >
                <span>Thanh toán trọn gói (một lần):</span>
                <span>
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                  }).format(amountDueFull(booking))}
                </span>
              </div>
              <div
                className="d-flex align-center mt-2 gap-2"
                style={{
                  color: paidInFullBooking(booking) ? '#10b981' : '#f59e0b',
                  fontSize: '0.9rem',
                }}
              >
                {paidInFullBooking(booking) ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                {!vendorAcceptedBooking(booking) && 'Chờ nhà hàng chấp nhận đặt chỗ.'}
                {vendorAcceptedBooking(booking) && !paidInFullBooking(booking) && 'Nhà hàng đã chấp nhận — vui lòng hoàn tất thanh toán.'}
                {paidInFullBooking(booking) && 'Đã ghi nhận thanh toán đủ.'}
              </div>
              {canCustomerPayBooking(booking) && (
                <button
                  type="button"
                  className="btn btn-primary mt-3 d-inline-flex align-center gap-2"
                  disabled={paying}
                  onClick={handlePayFull}
                >
                  <CreditCard size={18} />
                  {paying ? 'Đang xử lý…' : 'Xác nhận đã thanh toán trọn gói'}
                </button>
              )}
            </div>
          )}
          
          {(booking.cancelReason || booking.rejectReason) && (
             <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#fef2f2', border: '1px solid #ef4444', borderRadius: 'var(--radius-md)', color: '#991b1b' }}>
               <div className="d-flex align-center gap-2 mb-1" style={{ fontWeight: 600 }}><XCircle size={16}/> Reason:</div>
               <div>{booking.cancelReason || booking.rejectReason}</div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingDetail;
