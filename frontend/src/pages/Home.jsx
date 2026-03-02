import { Link } from 'react-router-dom';

/**
 * Trang chủ tối giản: 1 tiêu đề, 1 mô tả, 1 link Đăng nhập.
 * Không hero/banner phức tạp để tập trung nối API sau.
 */
function Home() {
  return (
    <div>
      <h1>Wedding Booking</h1>
      <p>Đặt tiệc cưới đơn giản. Đăng nhập để xem sảnh và đặt tiệc.</p>
      <p>
        <Link to="/login">Đăng nhập</Link>
      </p>
    </div>
  );
}

export default Home;
