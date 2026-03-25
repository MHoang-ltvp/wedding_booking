import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { paths } from '../../api/endpoints';
import { fetchAdminRestaurants } from '../../services/admin.service';
import { toast } from 'react-toastify';
import { CheckCircle, XCircle, Eye } from 'lucide-react';

function labelApprovalStatus(s) {
  if (s === 'PENDING') return 'Chờ duyệt';
  if (s === 'APPROVED') return 'Đã duyệt';
  if (s === 'REJECTED') return 'Từ chối';
  return s || '—';
}

const RestaurantApproval = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRestaurants();
  }, [filter]);

  const fetchRestaurants = async () => {
    try {
      const { items } = await fetchAdminRestaurants({ limit: 100 });
      let data = items;
      if (filter !== 'ALL') {
        data = data.filter((r) => r.approvalStatus === filter);
      }
      setRestaurants(data);
    } catch (error) {
      toast.error('Không tải được nhà hàng.');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus, body = {}) => {
    try {
      await api.put(paths.admin.restaurantApproval(id), {
        approvalStatus: newStatus,
        ...body,
      });
      toast.success(
        newStatus === 'APPROVED'
          ? 'Đã duyệt nhà hàng.'
          : newStatus === 'REJECTED'
            ? 'Đã từ chối hồ sơ.'
            : 'Đã cập nhật trạng thái.'
      );
      fetchRestaurants();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cập nhật thất bại.');
    }
  };

  const openRejectModal = (r) => {
    setRejectModal(r);
    setRejectReason('');
  };

  const closeRejectModal = () => {
    setRejectModal(null);
    setRejectReason('');
  };

  const submitReject = async (e) => {
    e.preventDefault();
    if (!rejectModal) return;
    setSubmitting(true);
    try {
      await api.put(paths.admin.restaurantApproval(rejectModal._id), {
        approvalStatus: 'REJECTED',
        rejectionReason: rejectReason.trim(),
      });
      toast.success('Đã từ chối hồ sơ.');
      setRejectModal(null);
      setRejectReason('');
      fetchRestaurants();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Từ chối thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Duyệt hồ sơ nhà hàng</h1>
        <div className="input-group" style={{ marginBottom: 0 }}>
          <select
            className="input-field"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ width: '200px', height: '40px' }}
          >
            <option value="ALL">Tất cả trạng thái duyệt</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="REJECTED">Đã từ chối</option>
          </select>
        </div>
      </div>

      {rejectModal && (
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
          onClick={() => !submitting && closeRejectModal()}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-modal-title"
            className="card"
            style={{ maxWidth: '480px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="reject-modal-title" style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>
              Từ chối: {rejectModal.name}
            </h2>
            <form onSubmit={submitReject}>
              <div className="input-group">
                <label htmlFor="reject-reason">Lý do từ chối (gửi cho nhà hàng)</label>
                <textarea
                  id="reject-reason"
                  className="input-field"
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ví dụ: Thiếu ảnh sảnh, địa chỉ chưa khớp…"
                  maxLength={2000}
                />
                <small className="text-muted">{rejectReason.length}/2000</small>
              </div>
              <div className="d-flex gap-2 justify-end mt-3">
                <button type="button" className="btn btn-outline" onClick={closeRejectModal} disabled={submitting}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-outline" style={{ color: '#b91c1c', borderColor: '#ef4444' }} disabled={submitting}>
                  {submitting ? 'Đang gửi…' : 'Xác nhận từ chối'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Đang tải…</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tên nhà hàng</th>
                  <th>Chủ nhà hàng</th>
                  <th>Địa chỉ</th>
                  <th>Trạng thái duyệt</th>
                  <th>Lý do từ chối</th>
                  <th>Hồ sơ</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center">
                      Không có nhà hàng nào
                    </td>
                  </tr>
                ) : (
                  restaurants.map((r) => (
                    <tr key={r._id}>
                      <td style={{ fontWeight: 500 }}>{r.name}</td>
                      <td>{r.vendorId?.fullName || r.vendorId}</td>
                      <td
                        className="text-muted"
                        style={{
                          fontSize: '0.85rem',
                          maxWidth: '240px',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                        }}
                        title={r.address}
                      >
                        {r.address}
                      </td>
                      <td>
                        <span
                          className={`status-badge ${
                            r.approvalStatus?.toLowerCase() === 'approved'
                              ? 'active'
                              : r.approvalStatus?.toLowerCase() === 'rejected'
                                ? 'locked'
                                : 'pending'
                          }`}
                        >
                          {labelApprovalStatus(r.approvalStatus)}
                        </span>
                      </td>
                      <td
                        className="text-muted"
                        style={{
                          fontSize: '0.8rem',
                          maxWidth: '200px',
                          verticalAlign: 'top',
                        }}
                        title={r.rejectionReason || ''}
                      >
                        {r.approvalStatus === 'REJECTED' && r.rejectionReason
                          ? r.rejectionReason
                          : '—'}
                      </td>
                      <td>
                        <Link
                          to={`/admin/restaurants/${r._id}`}
                          className="btn btn-ghost d-inline-flex align-center gap-1"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                          title="Xem đầy đủ: ảnh, sảnh, menu, liên hệ"
                        >
                          <Eye size={16} /> Xem hồ sơ
                        </Link>
                      </td>
                      <td>
                        {r.approvalStatus === 'PENDING' ? (
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-primary"
                              style={{
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.85rem',
                                backgroundColor: '#10B981',
                                borderColor: '#10B981',
                              }}
                              type="button"
                              onClick={() => updateStatus(r._id, 'APPROVED')}
                            >
                              <CheckCircle size={14} /> Duyệt
                            </button>
                            <button
                              className="btn btn-outline"
                              style={{
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.85rem',
                                color: '#EF4444',
                                borderColor: '#EF4444',
                              }}
                              type="button"
                              onClick={() => openRejectModal(r)}
                            >
                              <XCircle size={14} /> Từ chối
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantApproval;
