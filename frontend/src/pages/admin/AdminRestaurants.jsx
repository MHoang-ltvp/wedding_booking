import { useCallback, useEffect, useState } from 'react';
import {
  fetchAdminRestaurantById,
  fetchAdminRestaurants,
  setRestaurantApproval,
} from '../../services/admin.service';
import '../../styles/vendor.css';
import '../../styles/admin.css';

const APPROVAL_LABEL = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
};

function badgeClass(s) {
  if (s === 'APPROVED') return 'admin-badge admin-badge--approved';
  if (s === 'REJECTED') return 'admin-badge admin-badge--rejected';
  return 'admin-badge admin-badge--pending';
}

function AdminRestaurants() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [approvalStatus, setApprovalStatus] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [detailData, setDetailData] = useState(null);

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const params = { page, limit };
      if (approvalStatus) params.approvalStatus = approvalStatus;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const data = await fetchAdminRestaurants(params);
      if (data.success) {
        setItems(data.items || []);
        setTotal(data.total ?? 0);
      } else {
        setError(data.message || 'Không tải được danh sách.');
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Lỗi mạng.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, approvalStatus, searchQuery]);

  useEffect(() => {
    load();
  }, [load]);

  const handleApproval = async (id, next) => {
    if (!window.confirm(`Đặt trạng thái duyệt: ${APPROVAL_LABEL[next] || next}?`)) return;
    setBusyId(id);
    setError('');
    try {
      const data = await setRestaurantApproval(id, next);
      if (data.success) await load();
      else setError(data.message || 'Không cập nhật được.');
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Lỗi.');
    } finally {
      setBusyId(null);
    }
  };

  const openDetail = async (id) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError('');
    setDetailData(null);
    try {
      const data = await fetchAdminRestaurantById(id);
      if (data.success) {
        setDetailData(data);
      } else {
        setDetailError(data.message || 'Không tải được chi tiết nhà hàng.');
      }
    } catch (e) {
      setDetailError(e.response?.data?.message || e.message || 'Lỗi tải chi tiết nhà hàng.');
    } finally {
      setDetailLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <div className="vendor-page-header">
        <p className="admin-kicker">Quản trị</p>
        <h1 className="vendor-page-title">Nhà hàng</h1>
      </div>

      {error && (
        <div className="vendor-alert vendor-alert--error" role="alert">
          {error}
        </div>
      )}

      <div className="admin-toolbar">
        <label>
          Trạng thái duyệt
          <select
            value={approvalStatus}
            onChange={(e) => {
              setPage(1);
              setApprovalStatus(e.target.value);
            }}
          >
            <option value="">Tất cả (không gồm nháp)</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="REJECTED">Từ chối</option>
          </select>
        </label>
        <label>
          Tìm
          <input
            type="search"
            placeholder="Tên, địa chỉ…"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPage(1);
                setSearchQuery(searchDraft.trim());
              }
            }}
          />
        </label>
        <button
          type="button"
          className="vendor-btn-ghost"
          onClick={() => {
            setPage(1);
            setSearchQuery(searchDraft.trim());
          }}
        >
          Lọc
        </button>
      </div>
      <p className="vendor-muted" style={{ marginTop: '-0.5rem', marginBottom: '0.9rem' }}>
        Ghi chú: Nhà hàng ở trạng thái <strong>DRAFT</strong> chỉ hiển thị cho Vendor, Admin không xem được.
      </p>

      {loading ? (
        <p className="vendor-muted">Đang tải…</p>
      ) : items.length === 0 ? (
        <p className="vendor-muted">Không có nhà hàng.</p>
      ) : (
        <>
          <div className="vendor-table-wrap">
            <table className="vendor-table">
              <thead>
                <tr>
                  <th>Tên</th>
                  <th>Địa chỉ</th>
                  <th>Vendor</th>
                  <th>Duyệt</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r._id}>
                    <td>{r.name}</td>
                    <td style={{ maxWidth: 220 }}>{r.address}</td>
                    <td>
                      {r.vendorId?.email || '—'}
                      <br />
                      <span className="vendor-muted" style={{ fontSize: '0.8rem' }}>
                        {r.vendorId?.fullName}
                      </span>
                    </td>
                    <td>
                      <span className={badgeClass(r.approvalStatus)}>{APPROVAL_LABEL[r.approvalStatus]}</span>
                    </td>
                    <td>
                      <div className="admin-btn-row">
                        {r.approvalStatus !== 'APPROVED' && (
                          <button
                            type="button"
                            className="vendor-btn-primary"
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                            disabled={busyId === r._id}
                            onClick={() => handleApproval(r._id, 'APPROVED')}
                          >
                            Duyệt
                          </button>
                        )}
                        {r.approvalStatus !== 'REJECTED' && (
                          <button
                            type="button"
                            className="vendor-btn-ghost vendor-btn-ghost--danger"
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                            disabled={busyId === r._id}
                            onClick={() => handleApproval(r._id, 'REJECTED')}
                          >
                            Từ chối
                          </button>
                        )}
                        <button
                          type="button"
                          className="vendor-btn-ghost"
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                          onClick={() => openDetail(r._id)}
                        >
                          Xem chi tiết
                        </button>
                      </div>
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

      {detailOpen && (
        <div
          className="vendor-modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDetailOpen(false);
          }}
        >
          <div className="vendor-modal" role="dialog" aria-modal="true" aria-labelledby="admin-restaurant-detail">
            <h3 id="admin-restaurant-detail" className="vendor-modal__title">
              Chi tiết nhà hàng
            </h3>

            {detailLoading ? (
              <p className="vendor-muted">Đang tải chi tiết…</p>
            ) : detailError ? (
              <p className="vendor-alert vendor-alert--error">{detailError}</p>
            ) : detailData?.restaurant ? (
              <div style={{ display: 'grid', gap: '0.65rem' }}>
                <div>
                  <p><strong>Tên:</strong> {detailData.restaurant.name}</p>
                  <p><strong>Địa chỉ:</strong> {detailData.restaurant.address}</p>
                  <p><strong>Mô tả:</strong> {detailData.restaurant.description || '—'}</p>
                  <p>
                    <strong>Vendor:</strong> {detailData.restaurant.vendorId?.fullName || '—'} (
                    {detailData.restaurant.vendorId?.email || '—'})
                  </p>
                </div>

                <div>
                  <h4 style={{ marginBottom: '0.35rem' }}>Sảnh ({detailData.halls?.length || 0})</h4>
                  {detailData.halls?.length ? (
                    <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
                      {detailData.halls.map((h) => (
                        <li key={h._id}>
                          {h.name} — {h.capacity} khách — {h.basePrice?.toLocaleString('vi-VN')} đ — {h.status}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="vendor-muted">Chưa có sảnh.</p>
                  )}
                </div>

                <div>
                  <h4 style={{ marginBottom: '0.35rem' }}>Menu/Gói ({detailData.services?.length || 0})</h4>
                  {detailData.services?.length ? (
                    <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
                      {detailData.services.map((s) => (
                        <li key={s._id}>
                          [{s.type}] {s.name} — {s.price?.toLocaleString('vi-VN')} đ
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="vendor-muted">Chưa có menu/gói dịch vụ.</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="vendor-muted">Không có dữ liệu.</p>
            )}

            <div className="vendor-modal__actions" style={{ marginTop: '1rem' }}>
              <button type="button" className="vendor-btn-ghost" onClick={() => setDetailOpen(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminRestaurants;
