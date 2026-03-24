import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyRestaurants } from '../../services/vendor.service';
import RestaurantCreateModal from '../../components/vendor/RestaurantCreateModal';
import ImageCarousel from '../../components/vendor/ImageCarousel';
import '../../styles/vendor.css';

function approvalLabel(s) {
  if (s === 'DRAFT') return { text: 'Nháp', className: '' };
  if (s === 'APPROVED') return { text: 'Đã duyệt', className: 'vendor-card__badge--approved' };
  if (s === 'REJECTED') return { text: 'Từ chối', className: '' };
  return { text: 'Chờ duyệt', className: '' };
}

function VendorVenues() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const load = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await fetchMyRestaurants();
      if (data.success && Array.isArray(data.restaurants)) {
        setRestaurants(data.restaurants);
      } else {
        setError(data.message || 'Không tải được danh sách.');
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Lỗi mạng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="vendor-page-actions">
        <div>
          <p className="vendor-kicker">Danh mục nhà hàng</p>
          <h1 className="vendor-page-title">Nhà hàng của bạn</h1>
        </div>
        <button type="button" className="vendor-btn-primary" onClick={() => setModalOpen(true)}>
          + Thêm nhà hàng
        </button>
      </div>

      {error && (
        <div className="vendor-alert vendor-alert--error" role="alert">
          {error}
        </div>
      )}

      <RestaurantCreateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={load}
      />

      {loading ? (
        <p className="vendor-muted">Đang tải danh sách…</p>
      ) : restaurants.length === 0 ? (
        <div className="vendor-placeholder">Chưa có nhà hàng. Nhấn &quot;Thêm nhà hàng&quot; để bắt đầu.</div>
      ) : (
        <div className="vendor-grid">
          {restaurants.map((r) => {
            const badge = approvalLabel(r.approvalStatus);
            const hallN = r.hallCount ?? 0;
            return (
              <article key={r._id} className="vendor-card">
                <div className="vendor-card__img">
                  <ImageCarousel images={r.images || []} emptyLabel={r.name || 'Nhà hàng'} />
                  <span className={`vendor-card__badge ${badge.className}`}>{badge.text}</span>
                </div>
                <div className="vendor-card__body">
                  <h2 className="vendor-card__title">{r.name}</h2>
                  <p className="vendor-card__meta">
                    <span aria-hidden>📍</span> {r.address}
                  </p>
                  <p className="vendor-card__stats">
                    {hallN === 0 ? 'Chưa có sảnh' : `${hallN} sảnh`}
                  </p>
                  <Link className="vendor-card__link" to={`/vendor/venues/${r._id}`}>
                    Quản lý nhà hàng →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default VendorVenues;
