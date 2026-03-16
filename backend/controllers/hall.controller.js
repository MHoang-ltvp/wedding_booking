/**
 * Hall Controller - Thành viên 3 (NDung)
 * CRUD Sảnh (Thêm/Sửa/Xóa mềm/Xem) - Kiểm tra booking tương lai trước khi xóa
 *
 * Viết logic vào các hàm dưới đây. Route gọi qua hall.routes.js.
 * Tạm thời chưa gắn middleware.
 */

// POST /api/vendor/halls - Thêm sảnh mới
const create = async (req, res) => {
  // TODO: Lấy restaurantId từ nhà hàng của vendor (hoặc body). Validate name, capacity, basePrice, ... Tạo Hall
  res.json({ message: 'POST /api/vendor/halls - Viết logic tại đây (hall.controller.create)' });
};

// GET /api/vendor/halls - Danh sách sảnh của nhà hàng
const list = async (req, res) => {
  // TODO: Lấy restaurantId (từ vendor's restaurant hoặc query). Find Halls, isDeleted: false
  res.json({ message: 'GET /api/vendor/halls - Viết logic tại đây (hall.controller.list)' });
};

// PUT /api/vendor/halls/:id - Sửa thông tin sảnh
const update = async (req, res) => {
  // TODO: Chỉ sửa sảnh thuộc nhà hàng của vendor. Validate body, update Hall
  res.json({ message: 'PUT /api/vendor/halls/:id - Viết logic tại đây (hall.controller.update)' });
};

// DELETE /api/vendor/halls/:id - Xóa mềm (isDeleted = true). Kiểm tra booking tương lai
const remove = async (req, res) => {
  // TODO: Nếu có Booking tương lai (bookingDate >= today, status không CANCELLED/REJECTED) thì không cho xóa. Còn lại set isDeleted: true
  res.json({ message: 'DELETE /api/vendor/halls/:id - Viết logic tại đây (hall.controller.remove)' });
};

module.exports = {
  create,
  list,
  update,
  remove,
};
