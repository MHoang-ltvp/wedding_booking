import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Plus, MapPin, PartyPopper, Utensils, Trash2, Send, Undo2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useVendorRestaurant } from '../../contexts/VendorRestaurantContext';
import {
  deleteVendorRestaurant,
  submitVendorRestaurantForApproval,
  withdrawVendorRestaurantApproval,
} from '../../services/vendor.service';
import VendorRestaurantEditor from './VendorRestaurantEditor';

function approvalLabel(s) {
  if (s === 'DRAFT') return { text: 'Nháp', className: 'pending' };
  if (s === 'APPROVED') return { text: 'Đã duyệt', className: 'active' };
  if (s === 'REJECTED') return { text: 'Từ chối', className: 'locked' };
  return { text: 'Chờ duyệt', className: 'pending' };
}

export default function VendorRestaurantList() {
  const navigate = useNavigate();
  const { restaurants, setSelectedRestaurantId, selectedRestaurantId, loading, refreshRestaurants } =
    useVendorRestaurant();
  const [profileModalId, setProfileModalId] = useState(null);
  const [approvalBusyId, setApprovalBusyId] = useState(null);

  useEffect(() => {
    if (!profileModalId) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [profileModalId]);

  const handleSubmitApproval = async (r) => {
    setApprovalBusyId(r._id);
    try {
      await submitVendorRestaurantForApproval(r._id);
      toast.success('Đã gửi hồ sơ chờ admin duyệt.');
      await refreshRestaurants();
    } catch (e) {
      const d = e.response?.data;
      const msg = d?.message || 'Không gửi được duyệt.';
      const req = d?.requirements;
      if (req && typeof req.hallCount === 'number') {
        toast.error(
          `${msg} (cần tối thiểu ${req.minHalls} sảnh, ${req.minMenus} menu — hiện: ${req.hallCount} sảnh, ${req.menuCount} menu).`
        );
      } else {
        toast.error(msg);
      }
    } finally {
      setApprovalBusyId(null);
    }
  };

  const handleWithdrawApproval = async (r) => {
    if (
      !window.confirm(
        `Thu hồi hồ sơ “${r.name}” khỏi hàng chờ duyệt? Bạn có thể sửa hồ sơ rồi gửi duyệt lại.`
      )
    ) {
      return;
    }
    setApprovalBusyId(r._id);
    try {
      await withdrawVendorRestaurantApproval(r._id);
      toast.success('Đã thu hồi hồ sơ.');
      await refreshRestaurants();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Không thu hồi được.');
    } finally {
      setApprovalBusyId(null);
    }
  };

  const handleDelete = async (r) => {
    if (
      !window.confirm(
        `Xóa nhà hàng “${r.name}”? Hành động không thể hoàn tác. Chỉ xóa được khi chưa có đặt chỗ nào.`
      )
    ) {
      return;
    }
    try {
      await deleteVendorRestaurant(r._id);
      toast.success('Đã xóa nhà hàng.');
      if (String(selectedRestaurantId) === String(r._id)) {
        setSelectedRestaurantId(null);
      }
      await refreshRestaurants();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Không xóa được nhà hàng.');
    }
  };

  if (loading) {
    return (
      <div className="fade-in" style={{ padding: '2rem', textAlign: 'center' }}>
        <p className="text-muted">Đang tải danh sách nhà hàng…</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header d-flex justify-between align-center flex-wrap gap-3">
        <div>
          <h1 className="page-title">Nhà hàng của bạn</h1>
          <p className="text-muted" style={{ marginTop: '0.35rem', maxWidth: '640px' }}>
            Một tài khoản có thể có nhiều nhà hàng. <strong>Gửi duyệt</strong> và <strong>Thu hồi duyệt</strong>{' '}
            thực hiện tại đây; chỉnh hồ sơ và ảnh qua nút “Hồ sơ & ảnh”. Chọn nhà hàng ở sidebar hoặc bấm
            “Chọn để quản lý” để vào sảnh và dịch vụ.
          </p>
        </div>
        <Link to="/vendor/restaurants/new" className="btn btn-primary d-inline-flex align-center gap-2">
          <Plus size={18} /> Thêm nhà hàng
        </Link>
      </div>

      {restaurants.length === 0 ? (
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <Building2 size={40} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
          <p className="text-muted" style={{ marginBottom: '1rem' }}>
            Bạn chưa có nhà hàng nào. Tạo nhà hàng đầu tiên để thêm sảnh và dịch vụ.
          </p>
          <Link to="/vendor/restaurants/new" className="btn btn-primary">
            Tạo nhà hàng
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {restaurants.map((r) => {
            const badge = approvalLabel(r.approvalStatus);
            const hallN = r.hallCount ?? 0;
            const menuN = r.menuCount ?? 0;
            return (
              <article key={r._id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="d-flex justify-between align-start gap-2 flex-wrap" style={{ marginBottom: '0.75rem' }}>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>{r.name}</h2>
                  <div className="d-flex gap-2 align-center flex-wrap">
                    {r.status === 'HIDDEN' && (
                      <span className="status-badge locked" title="Ẩn khỏi cổng khách">
                        Ẩn cổng
                      </span>
                    )}
                    <span className={`status-badge ${badge.className}`}>{badge.text}</span>
                  </div>
                </div>
                <p className="text-muted d-flex align-center gap-2" style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                  <MapPin size={16} /> <span style={{ lineHeight: 1.4 }}>{r.address}</span>
                </p>
                <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  <span className="d-inline-flex align-center gap-1">
                    <PartyPopper size={14} /> {hallN} sảnh
                  </span>
                  <span style={{ margin: '0 0.5rem' }}>·</span>
                  <span className="d-inline-flex align-center gap-1">
                    <Utensils size={14} /> {menuN} món/gói (ước lượng menu)
                  </span>
                </p>
                {r.approvalStatus === 'REJECTED' &&
                  r.rejectionReason &&
                  String(r.rejectionReason).trim() !== '' && (
                    <div
                      style={{
                        marginBottom: '0.75rem',
                        padding: '0.6rem 0.75rem',
                        fontSize: '0.8rem',
                        lineHeight: 1.45,
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '0.375rem',
                        color: '#7f1d1d',
                      }}
                    >
                      <strong>Lý do từ admin:</strong> {r.rejectionReason}
                    </div>
                  )}
                <div className="d-flex flex-wrap gap-2 align-stretch" style={{ marginTop: 'auto' }}>
                  {['DRAFT', 'REJECTED'].includes(r.approvalStatus) && (
                    <button
                      type="button"
                      className="btn btn-primary d-inline-flex align-center gap-2"
                      style={{
                        flex: '1 1 120px',
                        minWidth: 'min(100%, 120px)',
                        justifyContent: 'center',
                        backgroundColor: '#0d9488',
                        borderColor: '#0d9488',
                      }}
                      disabled={approvalBusyId === r._id}
                      onClick={() => handleSubmitApproval(r)}
                    >
                      <Send size={16} />
                      {approvalBusyId === r._id ? 'Đang gửi…' : 'Gửi duyệt'}
                    </button>
                  )}
                  {r.approvalStatus === 'PENDING' && (
                    <button
                      type="button"
                      className="btn btn-outline d-inline-flex align-center gap-2"
                      style={{
                        flex: '1 1 120px',
                        minWidth: 'min(100%, 120px)',
                        justifyContent: 'center',
                        borderColor: '#d97706',
                        color: '#92400e',
                      }}
                      disabled={approvalBusyId === r._id}
                      onClick={() => handleWithdrawApproval(r)}
                    >
                      <Undo2 size={16} />
                      {approvalBusyId === r._id ? 'Đang thu hồi…' : 'Thu hồi duyệt'}
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ flex: '1 1 120px', minWidth: 'min(100%, 120px)' }}
                    onClick={() => {
                      setSelectedRestaurantId(r._id);
                      navigate('/vendor/halls');
                    }}
                  >
                    Chọn để quản lý
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ flex: '1 1 120px', minWidth: 'min(100%, 120px)', justifyContent: 'center' }}
                    onClick={() => setProfileModalId(r._id)}
                  >
                    Hồ sơ & ảnh
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ color: 'var(--error)', padding: '0.5rem 0.75rem', flex: '0 0 auto' }}
                    title="Xóa nhà hàng"
                    onClick={() => handleDelete(r)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {profileModalId &&
        createPortal(
          <div
            role="presentation"
            style={{
              position: 'fixed',
              inset: 0,
              width: '100vw',
              height: '100%',
              minHeight: '100dvh',
              boxSizing: 'border-box',
              background: 'rgba(0,0,0,0.45)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding:
                'max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left))',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
            }}
            onClick={() => setProfileModalId(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Chỉnh sửa hồ sơ và ảnh nhà hàng"
              className="card"
              style={{
                width: '100%',
                maxWidth: '640px',
                margin: 'auto',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: 'min(calc(100dvh - 24px), calc(100vh - 24px), 880px)',
                overflow: 'hidden',
                boxSizing: 'border-box',
                flexShrink: 0,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  flex: '1 1 auto',
                  minHeight: 0,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  WebkitOverflowScrolling: 'touch',
                  padding: 'clamp(0.75rem, 2vw, 1.25rem)',
                }}
              >
                <VendorRestaurantEditor
                  restaurantId={profileModalId}
                  isNew={false}
                  variant="modal"
                  onRequestClose={() => setProfileModalId(null)}
                  onSaved={() => refreshRestaurants()}
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
