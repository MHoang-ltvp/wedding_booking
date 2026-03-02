import { Outlet } from 'react-router-dom';
import Header from './Header';

/**
 * Layout chung: Header + Outlet (nội dung trang con theo route).
 * Outlet = nơi React Router render component tương ứng path (Home, Login, ...).
 */
function Layout() {
  return (
    <>
      <Header />
      <main className="container" style={{ paddingTop: '1rem', paddingBottom: '1rem' }}>
        <Outlet />
      </main>
    </>
  );
}

export default Layout;
