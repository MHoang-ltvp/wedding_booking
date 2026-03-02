# Mock data – Wedding Booking System

Dữ liệu mẫu để import vào MongoDB (database: `wedding_booking`) qua MongoDB Compass.

## Cách import trong MongoDB Compass

1. Mở MongoDB Compass, kết nối tới server (vd: `mongodb://127.0.0.1:27017`).
2. Chọn hoặc tạo database `wedding_booking`.
3. Với mỗi collection bên dưới:
   - Nếu chưa có collection: **Create Collection** (tên đúng như bảng).
   - Vào collection → **Add Data** → **Import File** → chọn file JSON tương ứng.
4. **Lưu ý**: Chọn format **JSON**; Compass hỗ trợ Extended JSON (ví dụ `{"$oid": "..."}`).

## Collections và file tương ứng

| Collection | File | Mô tả |
|------------|------|--------|
| `users` | `users.json` | User đăng nhập, phân quyền (Admin/Vendor/Customer), status (Active/Inactive). |
| `vendors` | `vendors.json` | 1 Vendor Active, 1 Pending, 1 Rejected. |
| `halls` | `halls.json` | Sảnh của Vendor Active: `isVisible: true`; Vendor Pending: `isVisible: false`. |
| `servicepackages` | `servicepackages.json` | Gói Menu và Decor theo vendor. |
| `bookings` | `bookings.json` | Đơn Pending approval, Confirmed, Pending payment, Canceled; có cặp trùng lịch để test double booking. |

## Test cases được phủ bởi mock data

- **Đăng nhập & RBAC**: User `admin` (Admin), `vendor_active` / `vendor_pending` (Vendor), `customer1` / `customer2` (Customer). Password mẫu (giả lập hash) giống nhau cho tất cả.
- **Duyệt Vendor**: Vendor "Tiệc cưới Hoàng Gia" → **Active**; "Sảnh cưới Mai Vàng" → **Pending**; "Nhà hàng bị từ chối" → **Rejected** (có `rejectionReason`).
- **Hiển thị sảnh**: Sảnh thuộc Vendor Active (Hoàng Gia) có `isVisible: true`; sảnh thuộc Vendor Pending (Mai Vàng) có `isVisible: false`.
- **Double booking**: `hallId` = `507f1f77bcf86cd799439021`, `weddingDate` = `2025-12-25`, `session` = `Evening` có 2 booking: một **Pending approval** (id `...041`), một **Confirmed** (id `...042`) — dùng để test chặn đặt trùng.

## Ghi chú

- **Password**: Toàn bộ user dùng cùng một chuỗi hash mẫu (giả lập). Trong production cần hash thật (vd: bcrypt).
- **ObjectId**: Các file dùng Extended JSON (`{"$oid": "..."}`) để import đúng kiểu ObjectId trong Compass.
