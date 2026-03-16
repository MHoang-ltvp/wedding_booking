# Tổ chức code & Quy ước viết code – Wedding Booking

Tài liệu này giúp mọi người hiểu cấu trúc backend, cách viết logic và chuẩn bị cho việc gắn middleware phân quyền sau.

---

## 1. Cấu trúc thư mục Backend

```
backend/
├── config/
│   └── database.js          # Kết nối MongoDB (URI, DB_NAME từ .env)
├── controllers/             # Logic xử lý request (thành viên tương ứng)
│   ├── user.controller.js
│   ├── restaurant.controller.js
│   ├── hall.controller.js
│   ├── service.controller.js
│   ├── public.controller.js
│   ├── auth.controller.js
│   ├── booking.controller.js
│   ├── upload.controller.js
│   └── payment.controller.js
├── middleware/              # Auth, role, status (sẽ gắn vào route sau)
│   ├── authMiddleware.js
│   ├── roleMiddleware.js
│   └── statusMiddleware.js
├── models/                  # Mongoose schema (User, Restaurant, Hall, ...)
├── routes/                  # Định tuyến → gọi controller
│   ├── index.js             # File DUY NHẤT mount tất cả route (cả nhóm dùng chung)
│   ├── user.routes.js
│   ├── restaurant.routes.js
│   ├── hall.routes.js
│   ├── service.routes.js
│   ├── public.routes.js
│   ├── auth.routes.js
│   ├── booking.routes.js
│   └── integration.routes.js
└── server.js                # Express app, app.use('/api', routes)
```

---

## 2. Nguyên tắc: Route → Controller

- **Route** chỉ làm việc: nhận HTTP method + path, gọi **một hàm trong controller**.
- **Controller** chứa toàn bộ logic: validate body/query, gọi Model, trả `res.json()` hoặc `res.status(x).json()`.
- **Không** viết logic nghiệp vụ trực tiếp trong file route.

**Ví dụ trong route:**

```js
// hall.routes.js
router.post('/', hallController.create);
router.get('/', hallController.list);
router.put('/:id', hallController.update);
router.delete('/:id', hallController.remove);
```

**Ví dụ trong controller:**

```js
// hall.controller.js
const create = async (req, res) => {
  try {
    const { name, capacity, basePrice, restaurantId, ... } = req.body;
    // validate, kiểm tra quyền (sau khi gắn middleware thì req.user có sẵn)
    const hall = await Hall.create({ ... });
    return res.status(201).json({ success: true, data: hall });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
```

---

## 3. Chuẩn response API

Để FE và middleware xử lý thống nhất, nên dùng chung format:

- **Thành công:**  
  `{ success: true, data?: ..., message?: "..." }`
- **Lỗi (4xx/5xx):**  
  `{ success: false, message: "..." }`  
  (có thể thêm `code` hoặc `errors` nếu cần)

---

## 4. Prefix API và phân vai

| Prefix | Đối tượng | Ghi chú |
|--------|-----------|--------|
| `POST/GET /api/auth/*` | Guest | Đăng ký, đăng nhập (public) |
| `GET /api/public/*` | Guest/Customer | Xem nhà hàng, sảnh, dịch vụ, availability |
| `GET|PUT /api/users/me` | User đã đăng nhập | Profile (Customer/Vendor) |
| `GET /api/admin/users`, `PUT /api/admin/users/:id/status` | Admin | Quản lý user |
| `GET /api/admin/restaurants`, `GET /api/admin/bookings`, `GET /api/admin/stats` | Admin | Xem nhà hàng, booking, thống kê |
| `POST|PUT|GET /api/vendor/restaurants/*`, `.../halls`, `.../services`, `.../bookings`, `GET /api/vendor/stats` | Vendor | CRUD nhà hàng, sảnh, dịch vụ, duyệt booking, thống kê |
| `POST|GET|PUT /api/bookings/*` (my-bookings, :id, cancel, resubmit) | Customer | Đặt tiệc, xem/hủy/sửa booking |
| `POST|DELETE /api/upload/*`, `POST /api/payments/*` | Tùy nghiệp vụ | Upload ảnh, thanh toán (mock) |

---

## 5. Middleware phân quyền (sẽ gắn sau)

Hiện tại **chưa** gắn middleware vào route để dễ test. Khi bật:

1. **authMiddleware** – Kiểm tra JWT, gắn `req.user` (id, email, fullName, role, status). Route cần đăng nhập sẽ dùng middleware này.
2. **roleMiddleware(['ADMIN'])** (hoặc VENDOR, CUSTOMER) – Chỉ cho phép role tương ứng.
3. **statusMiddleware** – Chặn nếu `req.user.status === 'LOCKED'`.

**Cách gắn (ví dụ):**

```js
// user.routes.js
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

userRouter.get('/me', authMiddleware, userController.getMe);
userRouter.put('/me', authMiddleware, userController.updateMe);

adminUserRouter.get('/', authMiddleware, roleMiddleware(['ADMIN']), userController.getAdminUsers);
adminUserRouter.put('/:id/status', authMiddleware, roleMiddleware(['ADMIN']), userController.updateUserStatus);
```

Logic trong controller khi đó có thể dùng `req.user.id` (hoặc `req.user._id`) cho customerId/vendorId, không cần nhận từ body.

---

## 6. Models và tham chiếu

- **User** – role: ADMIN | VENDOR | CUSTOMER; status: ACTIVE | LOCKED.
- **Restaurant** – vendorId → User (Vendor). Một Vendor có một Restaurant (1-1).
- **Hall, ServicePackage** – restaurantId → Restaurant.
- **Booking** – customerId → User, restaurantId → Restaurant, hallId → Hall; status: PENDING | COMPLETED | CANCELLED | REJECTED.
- **Transaction** – bookingId → Booking, userId → User; type: DEPOSIT | FINAL_PAYMENT.

Khi viết controller: validate `ObjectId`, kiểm tra quyền (booking thuộc customer/vendor, hall/service thuộc restaurant của vendor, v.v.).

---

## 7. File mock data (db/)

Thư mục `db/` chứa các file JSON (users, restaurants, halls, servicepackages, bookings, transactions) để import vào MongoDB Compass. Schema JSON tương ứng với Mongoose model; khi đổi model thì cập nhật cả mock và tài liệu này nếu cần.

---

## 8. Tóm tắt cho từng thành viên

- **Thành viên 1 (User):** `user.controller.js` + `user.routes.js` → GET/PUT /users/me, GET/PUT /admin/users(/:id/status).
- **Thành viên 2 (Restaurant):** `restaurant.controller.js` + `restaurant.routes.js` → vendor restaurants CRUD + GET /admin/restaurants.
- **Thành viên 3 (Hall + Service):** `hall.controller.js`, `service.controller.js` + routes tương ứng → CRUD sảnh, CRUD gói dịch vụ (soft delete, kiểm tra ràng buộc).
- **Thành viên 4 (Public):** `public.controller.js` + `public.routes.js` → tìm kiếm, chi tiết nhà hàng, sảnh, dịch vụ, availability.
- **Thành viên 5 (Auth + Booking):** `auth.controller.js`, `booking.controller.js` + auth.routes, booking.routes → register, login, tạo/hủy/resubmit booking (Customer), duyệt/từ chối/trạng thái (Vendor), xem toàn bộ (Admin).
- **Thành viên 6 (Upload + Payment + Stats):** `upload.controller.js`, `payment.controller.js` + `integration.routes.js` → upload ảnh, create-url/webhook thanh toán, GET /vendor/stats, GET /admin/stats.

Sau khi implement xong logic, sẽ thống nhất gắn middleware phân quyền vào từng route theo bảng prefix và role ở trên.
