import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fetchPublicRestaurantBundle, fetchHallAvailabilityRange } from '../../services/public.service';
import { MapPin, Users, CheckCircle2, ChevronRight, LayoutTemplate, CalendarDays } from 'lucide-react';
import HallShiftCalendar from '../../shared/components/HallShiftCalendar';
import { getHallCoverSrcOrPlaceholder } from '../../shared/hallCover';

const RestaurantDetail = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [halls, setHalls] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarHallId, setSidebarHallId] = useState('');
  const [pick, setPick] = useState({ date: '', shift: 'MORNING' });

  const bookingHalls = useMemo(
    () => (halls || []).filter((h) => h.status === 'AVAILABLE'),
    [halls],
  );

  const sidebarHall = useMemo(
    () => bookingHalls.find((x) => String(x._id) === String(sidebarHallId)),
    [bookingHalls, sidebarHallId],
  );

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const bundle = await fetchPublicRestaurantBundle(id);
      if (!bundle) {
        toast.error('Không tìm thấy nhà hàng.');
        setRestaurant(null);
        return;
      }
      setRestaurant(bundle.restaurant);
      setHalls(bundle.halls);
      setServices(bundle.services);
    } catch (error) {
      toast.error('Không tải được chi tiết nhà hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bookingHalls.length === 0) {
      setSidebarHallId('');
      return;
    }
    setSidebarHallId((prev) => {
      if (prev && bookingHalls.some((h) => String(h._id) === prev)) return prev;
      return String(bookingHalls[0]._id);
    });
  }, [bookingHalls]);

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Đang tải...</div>;
  if (!restaurant) return <div style={{ padding: '4rem', textAlign: 'center' }}>Không tìm thấy địa điểm.</div>;

  const cover =
    (typeof restaurant.images?.[0] === 'string' ? restaurant.images[0] : restaurant.images?.[0]?.url) ||
    'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80';

  const foodServices = services.filter((s) => s.type === 'FOOD');
  const decorServices = services.filter((s) => s.type === 'DECORATION');

  return (
    <div className="fade-in">
      <div
        style={{
          height: '400px',
          backgroundColor: '#e5e7eb',
          backgroundImage: `url(${cover})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }} />
        <div className="container" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 'var(--space-5)', color: 'white' }}>
          <h1 style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '0.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{restaurant.name}</h1>
          <div className="d-flex align-center gap-2" style={{ fontSize: '1.1rem', opacity: 0.9 }}>
            <MapPin size={20} /> {restaurant.address}
          </div>
        </div>
      </div>

      <div className="container" style={{ margin: 'var(--space-5) auto' }}>
        <div className="grid grid-cols-3 gap-5">
          <div style={{ gridColumn: 'span 2' }}>
            <section style={{ marginBottom: 'var(--space-6)' }}>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', display: 'inline-block' }}>Giới thiệu</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.8 }}>{restaurant.description}</p>
            </section>

            <section style={{ marginBottom: 'var(--space-6)' }}>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>Sảnh tiệc</h2>
              <div className="grid grid-cols-2 gap-4">
                {halls.map((hall) => (
                  <div
                    key={hall._id}
                    className="card"
                    style={{
                      padding: 0,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div
                      style={{
                        height: '168px',
                        flexShrink: 0,
                        backgroundColor: '#e5e7eb',
                        backgroundImage: `url(${getHallCoverSrcOrPlaceholder(hall)})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                    <div style={{ padding: 'var(--space-4)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{hall.name}</h3>
                      <div className="d-flex align-center gap-4 text-muted" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                        <span className="d-flex align-center gap-1">
                          <Users size={16} /> {hall.capacity} khách
                        </span>
                        <span className="d-flex align-center gap-1">
                          <LayoutTemplate size={16} /> {hall.area != null ? `${hall.area} m²` : '—'}
                        </span>
                      </div>
                      <p style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '1.1rem', margin: 0 }}>
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(hall.basePrice)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>Dịch vụ</h2>
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>Ẩm thực</h3>
                {foodServices.map((svc) => (
                  <div key={svc._id} className="d-flex justify-between align-center" style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{svc.name}</div>
                      <div className="text-muted" style={{ fontSize: '0.9rem' }}>{Array.isArray(svc.items) ? svc.items.join(' • ') : ''}</div>
                    </div>
                    <div style={{ color: 'var(--primary)', fontWeight: 500 }}>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(svc.price)} / {svc.unit === 'TABLE' ? 'bàn' : 'gói'}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>Trang trí</h3>
                {decorServices.map((svc) => (
                  <div key={svc._id} className="d-flex justify-between align-center" style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{svc.name}</div>
                    </div>
                    <div style={{ color: 'var(--primary)', fontWeight: 500 }}>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(svc.price)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div>
            <div
              className="card"
              style={{ position: 'sticky', top: '100px', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}
            >
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>Đặt lịch</h3>
              <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '1rem', lineHeight: 1.45 }}>
                Lịch 14 ngày tới hiển thị sẵn: xanh = còn trống, đỏ = đã hết chỗ cho ca đó.
              </p>

              {bookingHalls.length === 0 ? (
                <p className="text-muted" style={{ fontSize: '0.9rem' }}>Hiện chưa có sảnh mở đặt chỗ.</p>
              ) : (
                <>
                  <div className="input-group" style={{ marginBottom: '1rem' }}>
                    <label>Chọn sảnh</label>
                    <select
                      className="input-field"
                      value={sidebarHallId}
                      onChange={(e) => {
                        setSidebarHallId(e.target.value);
                        setPick({ date: '', shift: 'MORNING' });
                      }}
                    >
                      {bookingHalls.map((h) => (
                        <option key={h._id} value={h._id}>
                          {h.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: '1rem', maxWidth: '100%', overflowX: 'auto' }}>
                    <HallShiftCalendar
                      hallId={sidebarHallId}
                      loadRange={fetchHallAvailabilityRange}
                      value={pick}
                      onChange={setPick}
                      mode="customer"
                    />
                  </div>

                  {sidebarHall && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div className="text-muted" style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.04em' }}>
                        GIÁ NIÊM YẾT (sảnh đã chọn)
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '0.25rem' }}>
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(sidebarHall.basePrice)}
                        <span className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 500 }}> / ca</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div style={{ marginBottom: '1.5rem' }}>
                <div className="d-flex align-center gap-2 mb-2" style={{ marginBottom: '0.5rem' }}>
                  <CheckCircle2 size={16} color="var(--primary)" /> <span style={{ fontSize: '0.9rem' }}>Chất lượng dịch vụ</span>
                </div>
                <div className="d-flex align-center gap-2 mb-2" style={{ marginBottom: '0.5rem' }}>
                  <CheckCircle2 size={16} color="var(--primary)" /> <span style={{ fontSize: '0.9rem' }}>Thực đơn linh hoạt</span>
                </div>
              </div>

              <Link
                to={`/book/${restaurant._id}`}
                state={{
                  fromRestaurant: {
                    hallId: sidebarHallId,
                    bookingDate: pick.date,
                    shift: pick.shift,
                  },
                }}
                className="btn btn-primary full-width"
                style={{ justifyContent: 'center' }}
                onClick={(e) => {
                  if (!pick.date || !sidebarHallId) {
                    e.preventDefault();
                    toast.info('Vui lòng chọn ngày và ca còn trống trên lịch.');
                  }
                }}
              >
                <CalendarDays size={18} style={{ marginRight: '0.35rem' }} />
                Đặt chỗ <ChevronRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetail;
