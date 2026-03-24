import React, { useContext } from 'react';
import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { VendorRestaurantProvider, useVendorRestaurant } from '../contexts/VendorRestaurantContext';
import { Building2, Utensils, ClipboardList, LogOut, BarChart3, PartyPopper } from 'lucide-react';
import '../styles/role-shell.css';

function VendorShell() {
  const { pathname } = useLocation();
  const { user, logout } = useContext(AuthContext);
  const { restaurants, selectedRestaurantId, selectedRestaurant, setSelectedRestaurantId, loading } =
    useVendorRestaurant();

  const navItems = [
    { name: 'Tổng quan', path: '/vendor/dashboard', icon: <BarChart3 size={20} /> },
    { name: 'Nhà hàng', path: '/vendor/restaurants', icon: <Building2 size={20} /> },
    { name: 'Sảnh', path: '/vendor/halls', icon: <PartyPopper size={20} /> },
    { name: 'Dịch vụ & menu', path: '/vendor/services', icon: <Utensils size={20} /> },
    { name: 'Đặt chỗ', path: '/vendor/bookings', icon: <ClipboardList size={20} /> },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2>
            Lumina
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginLeft: '10px' }}>VENDOR</span>
          </h2>
        </div>

        {!loading && restaurants.length > 0 && (
          <div style={{ padding: '0 1rem 1rem', borderBottom: '1px solid var(--border, #eee)' }}>
            <label
              className="text-muted"
              style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.35rem', fontWeight: 600 }}
            >
      Nhà hàng đang quản lý
            </label>
            <select
              className="input-field"
              style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem' }}
              value={selectedRestaurantId || ''}
              onChange={(e) => setSelectedRestaurantId(e.target.value || null)}
            >
              {restaurants.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name}
                </option>
              ))}
            </select>
            {selectedRestaurant && (
              <p className="text-muted" style={{ fontSize: '0.72rem', marginTop: '0.5rem', lineHeight: 1.35 }}>
                Sảnh, thực đơn/trang trí và đặt chỗ lọc theo nhà hàng này.
              </p>
            )}
          </div>
        )}

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => {
                const restaurantsSection =
                  item.path === '/vendor/restaurants' &&
                  (pathname === '/vendor/restaurants' || pathname.startsWith('/vendor/restaurants/'));
                const active = isActive || restaurantsSection;
                return `nav-item ${active ? 'active' : ''}`;
              }}
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-mini-profile mb-3" style={{ marginBottom: '1rem' }}>
            <div className="avatar-placeholder">{user.fullName.charAt(0)}</div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user.fullName}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Vendor</div>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="btn btn-ghost full-width"
            style={{ justifyContent: 'flex-start', padding: '0.5rem' }}
          >
            <LogOut size={18} /> Đăng xuất
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

const VendorLayout = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p className="text-muted">Đang tải…</p>
      </div>
    );
  }
  if (!user || user.role !== 'VENDOR') {
    return <Navigate to="/login" replace />;
  }

  return (
    <VendorRestaurantProvider>
      <VendorShell />
    </VendorRestaurantProvider>
  );
};

export default VendorLayout;
