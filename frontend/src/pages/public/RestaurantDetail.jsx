import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  fetchPublicRestaurantBundle,
  fetchHallAvailabilitySlotBools,
} from '../../services/public.service';
import { MapPin, Users, CalendarDays, CheckCircle2, ChevronRight, LayoutTemplate } from 'lucide-react';

const RestaurantDetail = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [halls, setHalls] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('');
  const [availability, setAvailability] = useState({});

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

  const checkAvailability = async (e) => {
    e.preventDefault();
    if (!date) return;
    try {
      const availabilities = {};
      for (const hall of halls) {
        const slots = await fetchHallAvailabilitySlotBools(hall._id, date);
        if (slots) {
          availabilities[hall._id] = slots;
        }
      }
      setAvailability(availabilities);
      toast.success('Đã kiểm tra lịch trống.');
    } catch (error) {
      toast.error('Không kiểm tra được lịch. Thử lại.');
    }
  };

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
                  <div key={hall._id} className="card">
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{hall.name}</h3>
                    <div className="d-flex align-center gap-4 text-muted" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                      <span className="d-flex align-center gap-1">
                        <Users size={16} /> {hall.capacity} khách
                      </span>
                      <span className="d-flex align-center gap-1">
                        <LayoutTemplate size={16} /> {hall.area} m²
                      </span>
                    </div>
                    <p style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '1.1rem' }}>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(hall.basePrice)}
                    </p>

                    {availability[hall._id] && (
                      <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: '#f9fafb', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Lịch {date}:</div>
                        <div className="d-flex gap-2">
                          <span className={`status-badge ${availability[hall._id].MORNING ? 'active' : 'locked'}`}>Ca sáng</span>
                          <span className={`status-badge ${availability[hall._id].EVENING ? 'active' : 'locked'}`}>Ca tối</span>
                        </div>
                      </div>
                    )}
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
            <div className="card" style={{ position: 'sticky', top: '100px' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Đặt lịch</h3>

              <form onSubmit={checkAvailability} style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                <div className="input-group">
                  <label>Chọn ngày</label>
                  <div className="input-wrapper">
                    <CalendarDays className="input-icon" size={20} />
                    <input type="date" className="input-field with-icon" required value={date} onChange={(e) => setDate(e.target.value)} />
                  </div>
                </div>
                <button type="submit" className="btn btn-outline full-width">
                  Kiểm tra lịch trống
                </button>
              </form>

              <div style={{ marginBottom: '1.5rem' }}>
                <div className="d-flex align-center gap-2 mb-2" style={{ marginBottom: '0.5rem' }}>
                  <CheckCircle2 size={16} color="var(--primary)" /> <span style={{ fontSize: '0.9rem' }}>Chất lượng dịch vụ</span>
                </div>
                <div className="d-flex align-center gap-2 mb-2" style={{ marginBottom: '0.5rem' }}>
                  <CheckCircle2 size={16} color="var(--primary)" /> <span style={{ fontSize: '0.9rem' }}>Thực đơn linh hoạt</span>
                </div>
              </div>

              <Link to={`/book/${restaurant._id}`} className="btn btn-primary full-width" style={{ justifyContent: 'center' }}>
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
