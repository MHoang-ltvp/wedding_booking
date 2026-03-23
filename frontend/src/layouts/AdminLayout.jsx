import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/vendor.css';
import '../styles/role-shell.css';

function IconDash() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconVenues() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 21V10M4 21h16M4 21H2M4 10l8-7 8 7M9 21v-6h6v6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 20v-1a5 5 0 0110 0v1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M17 11h4M19 9v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 3v4M8 3v4M3 11h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const NAV = [
  { to: '/admin/dashboard', label: 'Tổng quan', icon: IconDash, active: (p) => p === '/admin/dashboard' },
  {
    to: '/admin/restaurants',
    label: 'Nhà hàng',
    icon: IconVenues,
    active: (p) => p.startsWith('/admin/restaurants'),
  },
  { to: '/admin/users', label: 'Người dùng', icon: IconUsers, active: (p) => p.startsWith('/admin/users') },
  {
    to: '/admin/bookings',
    label: 'Đặt chỗ',
    icon: IconCalendar,
    active: (p) => p.startsWith('/admin/bookings'),
  },
];

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="vendor-app role-shell role-shell--admin">
      <aside className="vendor-sidebar">
        <div className="vendor-sidebar__top">
          <div className="vendor-sidebar__brand">
            <span className="vendor-sidebar__logo" aria-hidden>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div>
              <div className="vendor-sidebar__title">Admin</div>
              <div className="vendor-sidebar__tagline vendor-sidebar__tagline--caps">Vows &amp; Venues</div>
            </div>
          </div>

          <div className="role-badge role-badge--admin">Quản trị</div>

          <div className="vendor-sidebar__user">
            <div
              className="vendor-sidebar__avatar"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)' }}
              aria-hidden
            >
              {(user?.fullName || user?.email || '?').charAt(0).toUpperCase()}
            </div>
            <div className="vendor-sidebar__user-text">
              <span className="vendor-sidebar__user-name">{user?.fullName || 'Admin'}</span>
              <span className="vendor-sidebar__user-role">Quản trị viên</span>
            </div>
          </div>
        </div>

        <nav className="vendor-sidebar__nav" aria-label="Menu admin">
          {NAV.map(({ to, label, icon: Icon, active }) => {
            const isActive = active(path);
            return (
              <Link
                key={to}
                to={to}
                className={`vendor-nav-link${isActive ? ' vendor-nav-link--active' : ''}`}
              >
                <Icon />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="vendor-sidebar__footer">
          <button type="button" className="vendor-logout" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="vendor-main">
        <Outlet />
      </div>
    </div>
  );
}

export default AdminLayout;
