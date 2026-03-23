import { Outlet } from 'react-router-dom';
import Header from './Header';

/**
 * Layout sau đăng nhập: Header + nội dung trang.
 */
function Layout() {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-main container">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
