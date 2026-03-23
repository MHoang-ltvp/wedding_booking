import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchPublicRestaurantById } from '../services/public.service';
import { hallStatusLabel, isHallBookable } from '../utils/hallStatus';

/** Dải tối đa 4 ảnh nhỏ + số ảnh còn lại */
function ThumbStrip({ images, label = '' }) {
  const list = Array.isArray(images) ? images.filter((i) => i?.url) : [];
  if (!list.length) {
    return <span className="customer-thumb-empty">Chưa có ảnh</span>;
  }
  return (
    <div className="customer-thumb-strip">
      {list.slice(0, 4).map((img, i) => (
        <img
          key={img.public_id || `${img.url}-${i}`}
          src={img.url}
          alt=""
          className="customer-thumb-strip__img"
          loading="lazy"
          title={label}
        />
      ))}
      {list.length > 4 && <span className="customer-thumb-more">+{list.length - 4}</span>}
    </div>
  );
}

function VenuePublicDetail() {
  const { restaurantId } = useParams();
  const { user } = useAuth();
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError('');
      setLoading(true);
      try {
        const data = await fetchPublicRestaurantById(restaurantId);
        if (!cancelled && data.success && data.data) {
          setPayload(data.data);
        } else if (!cancelled) {
          setError(data.message || 'Không tải được.');
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.response?.data?.message || e.message || 'Lỗi mạng.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  if (loading) {
    return (
      <div className="customer-page">
        <p className="customer-muted">Đang tải…</p>
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div className="customer-page">
        <p className="customer-alert customer-alert--error">{error || 'Không tìm thấy.'}</p>
        <Link to="/" className="customer-link">
          ← Danh sách nhà hàng
        </Link>
      </div>
    );
  }

  const canBook = user?.role === 'CUSTOMER';
  const halls = payload.halls || [];
  const hasBookableHall = halls.some(isHallBookable);

  return (
    <div className="customer-page">
      <Link to="/" className="customer-link" style={{ display: 'inline-block', marginBottom: '1rem' }}>
        ← Trang chủ
      </Link>

      <header className="customer-page__head">
        <h1 className="customer-page__title">{payload.name}</h1>
        <p className="customer-page__desc">{payload.address}</p>
        {payload.description && <p className="customer-muted">{payload.description}</p>}
      </header>

      {Array.isArray(payload.images) && payload.images.some((i) => i?.url) && (
        <div className="customer-venue-gallery" aria-label="Ảnh nhà hàng">
          {payload.images.filter((i) => i?.url).map((img, i) => (
            <img
              key={img.public_id || `${img.url}-${i}`}
              src={img.url}
              alt=""
              className="customer-venue-gallery__img"
              loading="lazy"
            />
          ))}
        </div>
      )}

      {canBook && hasBookableHall && (
        <div style={{ marginBottom: '1.5rem' }}>
          <Link to={`/venues/${restaurantId}/book`} className="customer-btn customer-btn--primary">
            Đặt tiệc tại đây
          </Link>
        </div>
      )}
      {canBook && !hasBookableHall && halls.length > 0 && (
        <p className="customer-alert customer-alert--error" role="alert" style={{ marginBottom: '1.5rem' }}>
          Hiện không có sảnh nào mở đặt (tất cả đang <strong>bảo trì</strong> hoặc <strong>khóa</strong>). Vui lòng
          quay lại sau hoặc liên hệ nhà hàng.
        </p>
      )}
      {canBook && !hasBookableHall && halls.length === 0 && (
        <p className="customer-muted" style={{ marginBottom: '1.5rem' }}>
          Nhà hàng chưa có sảnh để đặt trực tuyến.
        </p>
      )}
      {!canBook && user && (
        <p className="customer-muted" style={{ marginBottom: '1rem' }}>
          Chỉ tài khoản <strong>khách hàng</strong> mới đặt tiệc. Vui lòng đăng xuất và đăng nhập bằng tài khoản khách.
        </p>
      )}

      <h2 className="customer-section-title">Sảnh</h2>
      <div className="customer-table-wrap">
        <table className="customer-table">
          <thead>
            <tr>
              <th>Ảnh</th>
              <th>Tên</th>
              <th>Sức chứa</th>
              <th>Giá cơ bản</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {(payload.halls || []).map((h) => (
              <tr key={h._id}>
                <td style={{ width: 88 }}>
                  {(h.coverImage || h.images?.[0]?.url) ? (
                    <img
                      src={h.coverImage || h.images[0].url}
                      alt=""
                      style={{ width: 72, height: 48, objectFit: 'cover', borderRadius: 8 }}
                    />
                  ) : (
                    <span className="customer-muted">—</span>
                  )}
                </td>
                <td>{h.name}</td>
                <td>{h.capacity}</td>
                <td>{h.basePrice?.toLocaleString('vi-VN')} đ</td>
                <td>
                  <span title={h.status}>{hallStatusLabel(h.status)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="customer-section-title" style={{ marginTop: '1.5rem' }}>
        Gói dịch vụ
      </h2>
      <div className="customer-table-wrap">
        <table className="customer-table">
          <thead>
            <tr>
              <th>Ảnh</th>
              <th>Tên</th>
              <th>Loại</th>
              <th>Giá</th>
            </tr>
          </thead>
          <tbody>
            {(payload.services || []).map((s) => (
              <tr key={s._id}>
                <td className="customer-table__cell-thumb">
                  <ThumbStrip images={s.images} label={s.name} />
                </td>
                <td>{s.name}</td>
                <td>{s.type}</td>
                <td>{s.price?.toLocaleString('vi-VN')} đ</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default VenuePublicDetail;
