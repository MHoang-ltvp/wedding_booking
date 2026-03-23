# Tổ chức thư mục Frontend (React + Vite)

Mục tiêu: **gọi API có luồng dữ liệu ngay ngắn**, code dễ đọc, dễ mở rộng khi UI phức tạp hơn.

---

## 1. Luồng dữ liệu (1 chiều, dễ trace)

```
Trang / Component
       ↓ gọi
Hooks (useAuth, useBookings, …)  ← ưu tiên: logic + cache + loading/error
       ↓ gọi
Services (auth.service.js, …)    ← 1 file / domain API, chỉ HTTP + map response
       ↓ dùng
API client (axios instance)      ← baseURL, header Authorization, interceptor
```

- **Không** gọi `axios` trực tiếp trong component (trừ prototype rất nhỏ).
- **Component** chỉ: UI + gọi hook hoặc nhận props.

---

## 2. Cấu trúc thư mục đề xuất

```
frontend/src/
├── main.jsx
├── App.jsx
├── index.css
│
├── assets/                    # ảnh, font tĩnh (tùy nhu cầu)
│
├── components/                # UI tái sử dụng, không gắn domain nặng
│   ├── layout/
│   │   ├── Layout.jsx
│   │   └── Header.jsx
│   └── ui/                    # (tùy chọn) Button, Input, Modal…
│
├── pages/                     # 1 file ≈ 1 route / màn hình lớn
│   ├── Home.jsx
│   ├── Login.jsx
│   └── Register.jsx
│
├── routes/                    # (tùy chọn khi route nhiều)
│   └── index.jsx              # định nghĩa <Routes>, bảo vệ route theo role
│
├── lib/                       # cấu hình “khung”
│   └── api.js                 # axios.create({ baseURL }), interceptors
│
├── services/                  # gọi API theo domain (khớp backend)
│   ├── auth.service.js        # login, register, refresh…
│   ├── booking.service.js
│   ├── hall.service.js
│   └── index.js               # (tùy) re-export cho import gọn
│
├── hooks/                     # logic tái sử dụng + bọc service
│   ├── useAuth.js             # user, login, logout, token
│   └── useBookings.js
│
├── contexts/                  # (khi cần) AuthContext, Theme…
│   └── AuthContext.jsx
│
└── utils/                     # format ngày, parse lỗi API, constants
    ├── format.js
    └── apiError.js
```

**Mapping nhanh với backend:** mỗi nhóm `routes/*.routes.js` + `*.controller.js` → một `services/*.service.js` (và hook tương ứng nếu có state dùng chung).

---

## 3. Quy ước file

| Thư mục      | Trách nhiệm |
|-------------|-------------|
| `lib/api.js` | `baseURL` từ `import.meta.env.VITE_API_URL`, gắn `Authorization`, xử lý 401 (logout / refresh sau này). |
| `services/*` | Hàm async: `getX`, `createX`, `updateX` — trả dữ liệu đã “gọn” hoặc throw lỗi đã chuẩn hóa. |
| `hooks/*`    | `useState` loading/error/data, gọi service; có thể bọc `useContext` cho auth. |
| `pages/*`    | Chủ yếu layout + compose component; ít logic nghiệp vụ. |
| `components/*` | Presentational + event; nhận callback từ page/hook. |

---

## 4. Chuẩn response API (khớp `docs/CODE_ORGANIZATION.md`)

Backend nên trả thống nhất `{ success, data, message }`. Ở **service**, có thể:

- Trả `data` cho caller, hoặc
- Throw khi `success === false` để hook xử lý `message` một chỗ.

---

## 5. Biến môi trường

File `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Chỉ dùng prefix `VITE_` để Vite expose ra client.

---

## 6. Lộ trình áp dụng (không cần làm hết một lúc)

1. Thêm `lib/api.js` + `services/auth.service.js`, refactor Login/Register dùng service.
2. Thêm `hooks/useAuth.js` + `contexts/AuthContext.jsx` khi có nhiều trang cần user.
3. Mỗi feature mới: service → hook (nếu cần) → page.

---

## 7. So sánh ngắn

| Cách | Ưu điểm |
|------|---------|
| **Feature folders** (`features/booking/…`) | Gom mọi thứ theo tính năng; hợp team lớn. |
| **Layer như trên** (`services` + `hooks` + `pages`) | Dễ khớp backend, import rõ “API ở đâu”. |

Với dự án vừa phải và API đã chia domain sẵn ở backend, **layer `services` + `hooks`** thường đủ gọn và dễ đọc.
