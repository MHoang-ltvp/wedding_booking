import { Link } from 'react-router-dom';
import '../../styles/auth.css';

/**
 * Khung trang đăng nhập / đăng ký: nền tối, căn giữa card.
 */
function AuthLayout({ children }) {
  return (
    <div className="auth-page">
      <div className="auth-bg" aria-hidden />
      <div className="auth-shell">
        <Link to="/" className="auth-brand">
          <span className="auth-brand__icon" aria-hidden>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span>Vows &amp; Venues</span>
        </Link>
        {children}
      </div>
    </div>
  );
}

export default AuthLayout;
