/**
 * Service (ServicePackage) Controller - Thành viên 3 (NDung)
 * CRUD Gói dịch vụ (FOOD / DECORATION). Xóa mềm, kiểm tra ràng buộc
 *
 * Viết logic vào các hàm dưới đây. Route gọi qua service.routes.js.
 * Tạm thời chưa gắn middleware.
 */

// POST /api/vendor/services - Tạo gói mới (type=FOOD hoặc type=DECORATION)
const create = async (req, res) => {
  // TODO: Validate body (name, type, unit, price, items, ...). Tạo ServicePackage theo restaurantId của vendor
  res.json({ message: 'POST /api/vendor/services - Viết logic tại đây (service.controller.create)' });
};

// GET /api/vendor/services - Danh sách gói dịch vụ
const list = async (req, res) => {
  // TODO: Lấy restaurantId, find ServicePackages, isDeleted: false
  res.json({ message: 'GET /api/vendor/services - Viết logic tại đây (service.controller.list)' });
};

// PUT /api/vendor/services/:id - Cập nhật gói
const update = async (req, res) => {
  // TODO: Chỉ gói thuộc nhà hàng của vendor. Validate, update
  res.json({ message: 'PUT /api/vendor/services/:id - Viết logic tại đây (service.controller.update)' });
};

// DELETE /api/vendor/services/:id - Xóa mềm (isDeleted = true). Kiểm tra ràng buộc booking
const remove = async (req, res) => {
  // TODO: Kiểm tra có Booking nào đang dùng package này không (trong services[].packageId). Nếu có thì không xóa hoặc chỉ đánh dấu isDeleted
  res.json({ message: 'DELETE /api/vendor/services/:id - Viết logic tại đây (service.controller.remove)' });
};

module.exports = {
  create,
  list,
  update,
  remove,
};
