/**
 * User Controller - Thành viên 1 (Trg Anh)
 * User Profile (Customer/Vendor) + Admin User Management
 *
 * Viết logic vào các hàm dưới đây. Route gọi qua user.routes.js.
 * Tạm thời chưa gắn middleware (auth/role/status).
 */

// GET /api/users/me - Lấy thông tin profile hiện tại
const getMe = async (req, res) => {
  // TODO: req.user được gắn từ authMiddleware khi bật middleware
  // Lấy user từ DB theo req.user.id (hoặc req.user._id), bỏ password, trả JSON
  res.json({ message: 'GET /api/users/me - Viết logic tại đây (user.controller.getMe)' });
};

// PUT /api/users/me - Cập nhật tên, SĐT, thông tin liên hệ
const updateMe = async (req, res) => {
  // TODO: Validate body (fullName, phone, ...), cập nhật user hiện tại, trả user đã cập nhật
  res.json({ message: 'PUT /api/users/me - Viết logic tại đây (user.controller.updateMe)' });
};

// GET /api/admin/users - Xem danh sách User (phân trang, lọc theo role)
const getAdminUsers = async (req, res) => {
  // TODO: Chỉ Admin. Query page, limit, role. Trả danh sách users (không password)
  res.json({ message: 'GET /api/admin/users - Viết logic tại đây (user.controller.getAdminUsers)' });
};

// PUT /api/admin/users/:id/status - Khóa/Mở khóa tài khoản
const updateUserStatus = async (req, res) => {
  // TODO: Chỉ Admin. Cập nhật status (ACTIVE | LOCKED) cho user :id
  res.json({ message: 'PUT /api/admin/users/:id/status - Viết logic tại đây (user.controller.updateUserStatus)' });
};

module.exports = {
  getMe,
  updateMe,
  getAdminUsers,
  updateUserStatus,
};
