import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/vendor.css';
import '../styles/role-shell.css';

function IconHome() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 11L12 4l8 7M6 10v10h12V10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

function IconUser() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 20v-1a7 7 0 0114 0v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const NAV = [
  {
    to: '/',
    label: 'Trang chủ',
    icon: IconHome,
    active: (p) => p === '/' || p === '',
  },
  {
    to: '/my-bookings',
    label: 'Booking của tôi',
    icon: IconCalendar,
    active: (p) => p.startsWith('/my-bookings') || p.startsWith('/bookings'),
  },
  {
    to: '/profile',
    label: 'Hồ sơ',
    icon: IconUser,
    active: (p) => p.startsWith('/profile'),
  },
];

function CustomerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="vendor-app customer-app">
      <aside className="vendor-sidebar customer-sidebar">
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
              <div className="vendor-sidebar__title">Vows &amp; Venues</div>
              <div className="vendor-sidebar__tagline vendor-sidebar__tagline--caps">Khu khách hàng</div>
            </div>
          </div>

          <div className="role-badge role-badge--customer">Khách hàng</div>

          <div className="vendor-sidebar__user">
            <div className="vendor-sidebar__avatar customer-sidebar__avatar" aria-hidden>
              {(user?.fullName || user?.email || '?').charAt(0).toUpperCase()}
            </div>
            <div className="vendor-sidebar__user-text">
              <span className="vendor-sidebar__user-name">{user?.fullName || 'Khách'}</span>
              <span className="vendor-sidebar__user-role">{user?.email}</span>
            </div>
          </div>
        </div>

        <nav className="vendor-sidebar__nav" aria-label="Menu khách hàng">
          {NAV.map(({ to, label, icon: Icon, active }) => {
            const isActive = active(path);
            return (
              <Link
                key={to}
                to={to}
                className={`vendor-nav-link${isActive ? ' vendor-nav-link--active customer-nav-link--active' : ''}`}
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

      <div className="vendor-main customer-main">
        <Outlet />
      </div>
    </div>
  );
}

export default CustomerLayout;
