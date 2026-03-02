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
npm run dev
```

Frontend mặc định chạy tại: http://localhost:3000

## Lưu ý

- Cài dependency cho cả `backend` và `frontend` (mỗi thư mục có `package.json` riêng).

