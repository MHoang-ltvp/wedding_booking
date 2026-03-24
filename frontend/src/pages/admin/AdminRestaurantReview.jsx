import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { paths } from '../../api/endpoints';
import { fetchAdminRestaurantDetail } from '../../services/admin.service';
import { toast } from 'react-toastify';
import { ArrowLeft, CheckCircle, XCircle, Images } from 'lucide-react';

const fmtMoney = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(n) || 0);

const AdminRestaurantReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState(null);
  const [halls, setHalls] = useState([]);
  const [services, setServices] = useState([]);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [acting, setActing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const bundle = await fetchAdminRestaurantDetail(id);
      setRestaurant(bundle.restaurant);
      setHalls(bundle.halls);
      setServices(bundle.services);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Không tải được hồ sơ.');
      setRestaurant(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const doApprove = async () => {
    if (!window.confirm('Duyệt nhà hàng này sau khi đã xem đủ hồ sơ?')) return;
    setActing(true);
    try {
      await api.put(paths.admin.restaurantApproval(id), { approvalStatus: 'APPROVED' });
      toast.success('Đã duyệt nhà hàng.');
      navigate('/admin/restaurants');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Duyệt thất bại.');
    } finally {
      setActing(false);
    }
  };

  const submitReject = async (e) => {
    e.preventDefault();
    setActing(true);
    try {
      await api.put(paths.admin.restaurantApproval(id), {
        approvalStatus: 'REJECTED',
        rejectionReason: rejectReason.trim(),
      });
      toast.success('Đã từ chối hồ sơ.');
      setRejectOpen(false);
      navigate('/admin/restaurants');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Từ chối thất bại.');
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <div className="fade-in" style={{ padding: '2rem', textAlign: 'center' }}>
        Đang tải hồ sơ…
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="fade-in" style={{ padding: '2rem' }}>
        <Link to="/admin/restaurants" className="btn btn-ghost d-inline-flex align-center gap-2" style={{ marginBottom: '1rem' }}>
          <ArrowLeft size={18} /> Về danh sách
        </Link>
        <p className="text-muted">Không có dữ liệu hoặc nhà hàng chưa gửi duyệt.</p>
      </div>
    );
  }

  const addr = restaurant.addressDetail || {};
  const addrLine = [
    [addr.street, addr.wardName].filter(Boolean).join(', '),
    addr.districtName,
    addr.provinceName,
  ]
    .filter(Boolean)
    .join(' — ');

  const canDecide = restaurant.approvalStatus === 'PENDING';
  const images = Array.isArray(restaurant.images) ? restaurant.images : [];

  return (
    <div className="fade-in">
      <div className="d-flex flex-wrap justify-between align-center gap-3" style={{ marginBottom: '1.25rem' }}>
        <div className="d-flex align-center gap-3 flex-wrap">
          <Link to="/admin/restaurants" className="btn btn-outline d-inline-flex align-center gap-2">
            <ArrowLeft size={18} /> Danh sách
          </Link>
          <div>
            <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>
              {restaurant.name}
            </h1>
            <span
              className={`status-badge ${
                restaurant.approvalStatus === 'APPROVED'
                  ? 'active'
                  : restaurant.approvalStatus === 'REJECTED'
                    ? 'locked'
                    : 'pending'
              }`}
            >
              {restaurant.approvalStatus}
            </span>
            {restaurant.approvalStatus === 'REJECTED' && restaurant.rejectionReason && (
              <p className="text-muted" style={{ marginTop: '0.5rem', maxWidth: '640px', fontSize: '0.9rem' }}>
                <strong>Lý do từ chối:</strong> {restaurant.rejectionReason}
              </p>
            )}
          </div>
        </div>
        {canDecide && (
          <div className="d-flex gap-2 flex-wrap">
            <button type="button" className="btn btn-primary" style={{ backgroundColor: '#10B981', borderColor: '#10B981' }} disabled={acting} onClick={doApprove}>
              <CheckCircle size={18} /> Duyệt
            </button>
            <button type="button" className="btn btn-outline" style={{ color: '#b91c1c', borderColor: '#ef4444' }} disabled={acting} onClick={() => setRejectOpen(true)}>
              <XCircle size={18} /> Từ chối
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <h2 style={{ fontSize: '1.05rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            Chủ nhà hàng
          </h2>
          <p>
            <strong>{restaurant.vendorId?.fullName || '—'}</strong>
          </p>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>
            {restaurant.vendorId?.email || '—'}
          </p>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>
            {restaurant.vendorId?.phone || '—'}
          </p>
        </div>
        <div className="card">
          <h2 style={{ fontSize: '1.05rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            Liên hệ hiển thị
          </h2>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>
            <strong>Điện thoại:</strong> {restaurant.contact?.phone || '—'}
          </p>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>
            <strong>Email:</strong> {restaurant.contact?.email || '—'}
          </p>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Trạng thái kênh: <strong>{restaurant.status}</strong>
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Địa chỉ & mô tả</h2>
        <p style={{ fontWeight: 500 }}>{restaurant.address}</p>
        {addrLine && <p className="text-muted" style={{ fontSize: '0.9rem' }}>{addrLine}</p>}
        {restaurant.description && (
          <p style={{ marginTop: '1rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{restaurant.description}</p>
        )}
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 className="d-flex align-center gap-2" style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>
          <Images size={20} /> Ảnh nhà hàng ({images.length})
        </h2>
        {images.length === 0 ? (
          <p className="text-muted">Chưa có ảnh.</p>
        ) : (
          <div className="d-flex flex-wrap gap-2">
            {images.map((img, i) => (
              <a key={i} href={img.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                <img src={img.url} alt="" style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }} />
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: 0, overflow: 'hidden' }}>
        <h2 style={{ fontSize: '1.05rem', padding: '1rem 1rem 0' }}>Sảnh ({halls.length})</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Tên</th>
                <th>Sức chứa</th>
                <th>Giá cơ bản</th>
                <th>Trạng thái</th>
                <th>Ảnh</th>
              </tr>
            </thead>
            <tbody>
              {halls.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted">
                    Chưa có sảnh
                  </td>
                </tr>
              ) : (
                halls.map((h) => (
                  <tr key={h._id}>
                    <td style={{ fontWeight: 500 }}>{h.name}</td>
                    <td>{h.capacity}</td>
                    <td>{fmtMoney(h.basePrice)}</td>
                    <td>{h.status}</td>
                    <td>{Array.isArray(h.images) ? h.images.length : 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem', padding: 0, overflow: 'hidden' }}>
        <h2 style={{ fontSize: '1.05rem', padding: '1rem 1rem 0' }}>Menu / dịch vụ ({services.length})</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Tên</th>
                <th>Loại</th>
                <th>Giá</th>
              </tr>
            </thead>
            <tbody>
              {services.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center text-muted">
                    Chưa có gói dịch vụ
                  </td>
                </tr>
              ) : (
                services.map((s) => (
                  <tr key={s._id}>
                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                    <td>{s.type}</td>
                    <td>{fmtMoney(s.price)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {canDecide && (
        <div className="card" style={{ backgroundColor: '#fffbeb', borderColor: '#fcd34d' }}>
          <p style={{ marginBottom: '0.75rem', fontWeight: 600 }}>Nghiệp vụ gợi ý</p>
          <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
            Chỉ duyệt sau khi đã đối chiếu ảnh, sảnh, menu và thông tin liên hệ. Hệ thống đã yêu cầu vendor có tối thiểu 1 sảnh và 1 menu FOOD trước khi gửi duyệt; admin vẫn nên xác minh chất lượng hồ sơ tại trang này.
          </p>
        </div>
      )}

      {rejectOpen && (
        <div
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => !acting && setRejectOpen(false)}
        >
          <div className="card" style={{ maxWidth: '480px', width: '100%' }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Từ chối hồ sơ</h2>
            <form onSubmit={submitReject}>
              <div className="input-group">
                <label htmlFor="admin-reject-reason">Lý do (gửi cho nhà hàng)</label>
                <textarea
                  id="admin-reject-reason"
                  className="input-field"
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  maxLength={2000}
                  placeholder="Nêu rõ phần cần chỉnh sửa…"
                />
              </div>
              <div className="d-flex gap-2 justify-end mt-3">
                <button type="button" className="btn btn-outline" disabled={acting} onClick={() => setRejectOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-outline" style={{ color: '#b91c1c', borderColor: '#ef4444' }} disabled={acting}>
                  {acting ? 'Đang gửi…' : 'Xác nhận từ chối'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRestaurantReview;
