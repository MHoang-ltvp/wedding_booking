import { Link } from 'react-router-dom';

/**
 * Header tối giản: tên app (về trang chủ) + Đăng nhập hoặc (tên user + Đăng xuất).
 * Dùng Link để SPA không reload; trạng thái đăng nhập đọc từ localStorage (key: user).
 */
function Header() {
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/'; // reload để toàn app cập nhật trạng thái
  };

  return (
    <header style={{ borderBottom: '1px solid #eee', padding: '0.75rem 0' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit', fontWeight: 'bold' }}>
          Wedding Booking
        </Link>
        <nav>
          {user ? (
            <>
              <span style={{ marginRight: '0.5rem' }}>{user.fullName || user.email}</span>
              <button type="button" onClick={handleLogout}>
                Đăng xuất
              </button>
            </>
          ) : (
            <Link to="/login">Đăng nhập</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
