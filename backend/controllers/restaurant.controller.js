/**
 * Restaurant Controller - Thành viên 2 (VHoang)
 * Vendor - Restaurant Management + Admin - Approval (danh sách nhà hàng)
 *
 * Viết logic vào các hàm dưới đây. Route gọi qua restaurant.routes.js.
 * Tạm thời chưa gắn middleware.
 */

// POST /api/vendor/restaurants - Tạo hồ sơ nhà hàng mới
const create = async (req, res) => {
  // TODO: Lấy vendorId từ req.user khi bật auth. Validate body (name, address, ...). Tạo Restaurant
  res.json({ message: 'POST /api/vendor/restaurants - Viết logic tại đây (restaurant.controller.create)' });
};

// PUT /api/vendor/restaurants/:id - Cập nhật thông tin nhà hàng
const update = async (req, res) => {
  // TODO: Chỉ vendor sở hữu. Validate body, update Restaurant
  res.json({ message: 'PUT /api/vendor/restaurants/:id - Viết logic tại đây (restaurant.controller.update)' });
};

// GET /api/vendor/restaurants/me - Lấy nhà hàng của Vendor đang đăng nhập
const getMyRestaurant = async (req, res) => {
  // TODO: req.user.id -> tìm Restaurant theo vendorId, trả 1 document hoặc 404
  res.json({ message: 'GET /api/vendor/restaurants/me - Viết logic tại đây (restaurant.controller.getMyRestaurant)' });
};

// GET /api/admin/restaurants - Danh sách toàn bộ nhà hàng, lọc theo trạng thái
const getAdminRestaurants = async (req, res) => {
  // TODO: Chỉ Admin. Query status (ACTIVE/HIDDEN), phân trang. Populate vendorId nếu cần
  res.json({ message: 'GET /api/admin/restaurants - Viết logic tại đây (restaurant.controller.getAdminRestaurants)' });
};

module.exports = {
  create,
  update,
  getMyRestaurant,
  getAdminRestaurants,
};
