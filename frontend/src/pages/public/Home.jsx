import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchPublicRestaurants } from '../../services/public.service';
import { Search, MapPin, Users, ArrowRight } from 'lucide-react';

const Home = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    capacity: '',
    location: ''
  });

  useEffect(() => {
    fetchRestaurants();
  }, []); // Initial load

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const { list } = await fetchPublicRestaurants({
        search: searchParams.keyword || undefined,
        address: searchParams.location || undefined,
        minCapacity: searchParams.capacity || undefined,
        limit: 50,
      });
      setRestaurants(list);
    } catch (error) {
      console.error('Failed to load restaurants', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRestaurants();
  };

  return (
    <div className="fade-in">
      {/* Hero Section */}
      <section style={{ 
        position: 'relative', 
        height: '600px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundImage: 'url("https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: 'white',
        textAlign: 'center'
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1 }} />
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <h1 style={{ fontSize: '4rem', color: 'var(--primary)', textShadow: '0 2px 4px rgba(0,0,0,0.5)', marginBottom: '1rem' }}>
            Tìm không gian tiệc trong mơ
          </h1>
          <p style={{ fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto 3rem auto', opacity: 0.9 }}>
            Khám phá và đặt những địa điểm cưới được chọn lọc, phục vụ trọn vẹn ngày trọng đại của bạn.
          </p>
          
          {/* Search Box */}
          <form onSubmit={handleSearch} className="card d-flex align-center gap-3" style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem', borderRadius: 'var(--radius-full)' }}>
            <div className="input-wrapper" style={{ flex: 1.5 }}>
              <Search className="input-icon" size={20} />
              <input type="text" className="input-field with-icon" placeholder="Tìm nhà hàng, địa điểm…" style={{ border: 'none', background: 'transparent' }} value={searchParams.keyword} onChange={e => setSearchParams({...searchParams, keyword: e.target.value})} />
            </div>
            <div style={{ width: '1px', height: '30px', backgroundColor: 'var(--border)' }}></div>
            <div className="input-wrapper" style={{ flex: 1 }}>
              <MapPin className="input-icon" size={20} />
              <input type="text" className="input-field with-icon" placeholder="Địa điểm / khu vực" style={{ border: 'none', background: 'transparent' }} value={searchParams.location} onChange={e => setSearchParams({...searchParams, location: e.target.value})} />
            </div>
            <div style={{ width: '1px', height: '30px', backgroundColor: 'var(--border)' }}></div>
            <div className="input-wrapper" style={{ flex: 1 }}>
              <Users className="input-icon" size={20} />
              <input type="number" className="input-field with-icon" placeholder="Số khách (sức chứa tối thiểu)" style={{ border: 'none', background: 'transparent' }} value={searchParams.capacity} onChange={e => setSearchParams({...searchParams, capacity: e.target.value})} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ borderRadius: 'var(--radius-full)', padding: '0.75rem 2rem' }}>
              Tìm kiếm
            </button>
          </form>
        </div>
      </section>

      {/* Featured Venues */}
      <section className="container" style={{ padding: 'var(--space-6) var(--space-4)' }}>
        <div className="text-center" style={{ marginBottom: 'var(--space-5)' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Địa điểm nổi bật</h2>
          <p className="text-muted text-center" style={{ maxWidth: '600px', margin: '0 auto' }}>
            Những nhà hàng được gợi ý, nổi bật với không gian và dịch vụ phù hợp tiệc cưới.
          </p>
        </div>

        {loading ? (
          <div className="text-center" style={{ padding: '3rem' }}>Đang tải danh sách địa điểm…</div>
        ) : (
          <div className="grid grid-cols-3 gap-4" style={{ alignItems: 'stretch' }}>
            {restaurants.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                Không tìm thấy địa điểm phù hợp. Hãy thử bộ lọc khác.
              </div>
            ) : (
              restaurants.map((rest) => (
                <Link
                  to={`/restaurant/${rest._id}`}
                  key={rest._id}
                  className="card"
                  style={{
                    padding: 0,
                    textDecoration: 'none',
                    transition: 'transform var(--transition-normal)',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    minHeight: 0,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      flexShrink: 0,
                      height: '200px',
                      backgroundColor: '#e5e7eb',
                      backgroundImage: `url(${(typeof rest.images?.[0] === 'string' ? rest.images[0] : rest.images?.[0]?.url) || 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80'})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderTopLeftRadius: 'var(--radius-lg)',
                      borderTopRightRadius: 'var(--radius-lg)',
                    }}
                  />
                  <div
                    style={{
                      padding: 'var(--space-4)',
                      display: 'flex',
                      flexDirection: 'column',
                      flex: 1,
                      minHeight: 0,
                    }}
                  >
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>{rest.name}</h3>
                    <div className="d-flex align-center text-muted gap-2" style={{ fontSize: '0.875rem', marginBottom: '0.75rem', flexShrink: 0 }}>
                      <MapPin size={16} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{rest.address}</span>
                    </div>
                    <p
                      style={{
                        color: 'var(--text-muted)',
                        fontSize: '0.9rem',
                        margin: 0,
                        flex: 1,
                        minHeight: '2.75em',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {rest.description || 'Không gian lý tưởng cho ngày trọng đại của bạn.'}
                    </p>
                    <div className="d-flex justify-between align-center" style={{ marginTop: 'auto', paddingTop: '1rem', flexShrink: 0 }}>
                      <span className="text-primary" style={{ fontWeight: 600 }}>
                        Xem chi tiết
                      </span>
                      <div className="btn btn-ghost" style={{ padding: 0, color: 'var(--primary)' }}>
                        <ArrowRight size={20} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
