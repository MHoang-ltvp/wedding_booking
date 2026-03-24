# Wedding Booking

Hướng dẫn chạy dự án (Monorepo: Frontend + Backend trong cùng thư mục).

## Cấu trúc

- **backend/** — Toàn bộ code Node.js/Express (models, routes, middlewares, server.js)
- **frontend/** — Toàn bộ code React (src, public)

## Chạy Backend

```bash
cd backend
npm install
# Tạo file .env từ .env.example (nếu có) và chỉnh PORT, DB, ...
npm start
```

Backend mặc định chạy tại: http://localhost:9999

## Chạy Frontend

```bash
cd frontend
npm install
# Copy .env.example thành .env và chỉnh VITE_API_URL nếu backend khác cổng
npm run dev
```

Frontend mặc định chạy tại: http://localhost:3000

Biến `VITE_API_URL` (ví dụ `http://localhost:9999/api`) dùng cho axios — xem `frontend/.env.example`.

## Frontend (Hard Reset) — Vai trò & tuyến chính

- **Guest**
  - `/login`, `/register`
  - `/` (xem + tìm kiếm nhà hàng)
  - `/venues/:restaurantId` (chi tiết)
- **Customer**
  - `/venues/:restaurantId/book`
  - `/my-bookings`, `/bookings/:bookingId`
  - `/profile`
- **Vendor**
  - `/vendor/venues`, `/vendor/venues/:restaurantId`
  - `/vendor/bookings`
  - `/vendor/availability` (lịch trống theo sảnh/ngày)
  - `/vendor/payments` (bảng theo dõi cọc/thanh toán)
  - `/vendor/analytics`, `/vendor/profile`
- **Admin**
  - `/admin/dashboard`
  - `/admin/users`
  - `/admin/restaurants` (kèm xem chi tiết nhà hàng/sảnh/menu)
  - `/admin/bookings`

## Smoke test nhanh

1. Đăng nhập đủ 3 vai trò `CUSTOMER`, `VENDOR`, `ADMIN`.
2. Vendor tạo/sửa nhà hàng, thêm sảnh, thêm menu/gói, gửi duyệt.
3. Admin vào danh sách nhà hàng duyệt/từ chối và xem chi tiết.
4. Customer tìm nhà hàng, tạo booking, xác nhận cọc (flow mock).
5. Kiểm tra build frontend:

```bash
cd frontend
npm run build
```

## Lưu ý

- Cài dependency cho cả `backend` và `frontend` (mỗi thư mục có `package.json` riêng).

