import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Header app (sau đăng nhập): logo + tên + đăng xuất.
 */
function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="app-header">
      <div className="container app-header__inner">
        <Link to="/" className="app-header__brand">
          <span className="app-header__brand-icon" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          Vows &amp; Venues
        </Link>
        <nav className="app-header__nav">
          {user && (
            <>
              {user.role === 'VENDOR' && (
                <Link
                  to="/vendor/venues"
                  style={{ marginRight: '0.75rem', fontSize: '0.9rem', color: '#38bdf8' }}
                >
                  Khu vendor
                </Link>
              )}
              {user.role === 'CUSTOMER' && (
                <>
                  <Link
                    to="/"
                    style={{ marginRight: '0.65rem', fontSize: '0.9rem', color: '#7dd3fc' }}
                  >
                    Trang chủ
                  </Link>
                  <Link
                    to="/my-bookings"
                    style={{ marginRight: '0.65rem', fontSize: '0.9rem', color: '#7dd3fc' }}
                  >
                    Booking
                  </Link>
                  <Link
                    to="/profile"
                    style={{ marginRight: '0.75rem', fontSize: '0.9rem', color: '#7dd3fc' }}
                  >
                    Hồ sơ
                  </Link>
                </>
              )}
              {user.role === 'ADMIN' && (
                <Link
                  to="/admin/dashboard"
                  style={{ marginRight: '0.75rem', fontSize: '0.9rem', color: '#a78bfa' }}
                >
                  Admin
                </Link>
              )}
              <span className="app-header__user">
                {user.fullName || user.email}
              </span>
              <button type="button" className="app-header__logout" onClick={handleLogout}>
                Đăng xuất
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
