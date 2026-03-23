import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchPublicAllHalls, fetchPublicRestaurants } from '../services/public.service';

/**
 * Trang chủ khách hàng: danh sách nhà hàng + sảnh gợi ý (CUSTOMER).
 */
function Home() {
  const { user, bootstrapping } = useAuth();

  const [list, setList] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState('');
  const [addressDraft, setAddressDraft] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedAddress, setAppliedAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [halls, setHalls] = useState([]);
  const [hallsLoading, setHallsLoading] = useState(true);
  const [hallsError, setHallsError] = useState('');

  const loadRestaurants = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const data = await fetchPublicRestaurants({
        page,
        limit: 9,
        search: appliedSearch.trim() || undefined,
        address: appliedAddress.trim() || undefined,
      });
      if (data.success) {
        setList(data.data || []);
        setPagination(data.pagination || null);
      } else {
        setError(data.message || 'Không tải được danh sách.');
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Lỗi mạng.');
    } finally {
      setLoading(false);
    }
  }, [page, appliedSearch, appliedAddress]);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setHallsError('');
      setHallsLoading(true);
      try {
        const res = await fetchPublicAllHalls({ limit: 12, page: 1 });
        if (!cancelled && res.success && Array.isArray(res.data)) {
          setHalls(res.data);
        } else if (!cancelled) {
          setHallsError(res.message || 'Không tải được sảnh gợi ý.');
        }
      } catch (e) {
        if (!cancelled) {
          setHallsError(e.response?.data?.message || e.message || 'Lỗi mạng.');
        }
      } finally {
        if (!cancelled) setHallsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applySearch = (e) => {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(searchDraft.trim());
    setAppliedAddress(addressDraft.trim());
  };

  if (bootstrapping) {
    return (
      <div className="customer-page">
        <p className="customer-muted">Đang tải…</p>
      </div>
    );
  }

  return (
    <div className="customer-page home-page">
      <header className="customer-page__head home-page__hero">
        <p className="home-demo__label" style={{ marginBottom: '0.5rem' }}>
          Xin chào{user?.fullName ? `, ${user.fullName}` : ''}
        </p>
        <h1 className="customer-page__title">Vows &amp; Venues</h1>
      </header>

      <div className="home-hub__grid home-page__shortcuts" style={{ marginBottom: '2rem' }}>
        <Link className="home-hub__card" to="/my-bookings">
          <span className="home-hub__card-title">Booking của tôi</span>
        </Link>
        <Link className="home-hub__card" to="/profile">
          <span className="home-hub__card-title">Hồ sơ</span>
        </Link>
      </div>

      <section className="home-page__section" aria-labelledby="home-restaurants-title">
        <h2 id="home-restaurants-title" className="customer-section-title">
          Nhà hàng tiệc cưới
        </h2>
        <form className="customer-filters" onSubmit={applySearch}>
          <input
            type="search"
            className="customer-input"
            placeholder="Tên nhà hàng…"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
          />
          <input
            type="text"
            className="customer-input"
            placeholder="Địa điểm / địa chỉ…"
            value={addressDraft}
            onChange={(e) => setAddressDraft(e.target.value)}
          />
          <button type="submit" className="customer-btn customer-btn--primary">
            Tìm
          </button>
        </form>

        {error && <p className="customer-alert customer-alert--error">{error}</p>}

        {loading ? (
          <p className="customer-muted">Đang tải nhà hàng…</p>
        ) : list.length === 0 ? (
          <p className="customer-muted">Không có nhà hàng phù hợp.</p>
        ) : (
          <>
            <div className="customer-grid">
              {list.map((r) => (
                <article key={r._id} className="customer-card">
                  <div
                    className="customer-card__img"
                    style={{
                      backgroundImage: r.images?.[0]?.url ? `url(${r.images[0].url})` : undefined,
                    }}
                  />
                  <div className="customer-card__body">
                    <h3 className="customer-card__title">{r.name}</h3>
                    <p className="customer-card__meta">{r.address}</p>
                    <p className="customer-card__meta">
                      {r.hallCount != null ? `${r.hallCount} sảnh` : ''}
                      {r.minPrice != null && (
                        <span> · từ {Number(r.minPrice).toLocaleString('vi-VN')} đ</span>
                      )}
                    </p>
                    <Link to={`/venues/${r._id}`} className="customer-link">
                      Xem chi tiết →
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {pagination && pagination.pages > 1 && (
              <div className="customer-pagination">
                <button
                  type="button"
                  className="customer-btn customer-btn--ghost"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Trước
                </button>
                <span className="customer-muted">
                  Trang {pagination.page} / {pagination.pages}
                </span>
                <button
                  type="button"
                  className="customer-btn customer-btn--ghost"
                  disabled={page >= (pagination.pages || 1)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <section className="home-halls home-page__section" aria-labelledby="home-halls-title">
        <h2 id="home-halls-title" className="home-halls__title">
          Sảnh gợi ý
        </h2>
        {hallsLoading && <p className="customer-muted">Đang tải…</p>}
        {hallsError && !hallsLoading && (
          <p className="home-halls__error" role="alert">
            {hallsError}
          </p>
        )}
        {!hallsLoading && !hallsError && halls.length === 0 && (
          <p className="customer-muted">Chưa có sảnh gợi ý.</p>
        )}
        {!hallsLoading && halls.length > 0 && (
          <ul className="home-halls__grid">
            {halls.map((h) => {
              const rid = String(h.restaurantId ?? '');
              const hid = String(h._id ?? '');
              const img = h.coverImage || h.images?.[0]?.url;
              return (
                <li key={hid} className="home-halls__card">
                  <div className="home-halls__media">
                    {img ? (
                      <img src={img} alt="" className="home-halls__img" loading="lazy" />
                    ) : (
                      <div className="home-halls__placeholder">Sảnh</div>
                    )}
                  </div>
                  <div className="home-halls__body">
                    <p className="home-halls__venue">{h.restaurantName || 'Nhà hàng'}</p>
                    <h3 className="home-halls__name">{h.name}</h3>
                    <p className="home-halls__meta">
                      {h.capacity != null && <span>{h.capacity} khách</span>}
                      {h.basePrice != null && (
                        <span>
                          {h.capacity != null ? ' · ' : ''}
                          {h.basePrice.toLocaleString('vi-VN')} đ
                        </span>
                      )}
                    </p>
                    <div className="home-halls__actions">
                      <Link className="home-halls__link" to={`/venues/${rid}`}>
                        Chi tiết
                      </Link>
                      <Link
                        className="home-halls__cta"
                        to={`/venues/${rid}/book?hallId=${encodeURIComponent(hid)}`}
                      >
                        Đặt tiệc
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

export default Home;
