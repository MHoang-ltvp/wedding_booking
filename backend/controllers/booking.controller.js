/**
 * Booking Controller - Thành viên 5 (Triệu Hoàng)
 * Customer: tạo booking, my-bookings, chi tiết, cancel, resubmit.
 * Vendor: danh sách booking, approve (nhập cọc), reject, chuyển trạng thái.
 * Admin: xem toàn bộ booking.
 *
 * Viết logic vào các hàm dưới đây. Route gọi qua booking.routes.js.
 * Tạm thời chưa gắn middleware.
 */

// ---- Customer ----
// POST /api/bookings - Tạo yêu cầu đặt tiệc (validate sảnh trống)
const create = async (req, res) => {
  // TODO: Lấy customerId từ req.user. Validate hallId, bookingDate, shift, services. Check trùng lịch. Tạo Booking (status PENDING)
  res.json({ message: 'POST /api/bookings - Viết logic tại đây (booking.controller.create)' });
};

// GET /api/bookings/my-bookings - Danh sách booking của tôi
const getMyBookings = async (req, res) => {
  // TODO: customerId = req.user.id. Find Bookings, sort mới nhất
  res.json({ message: 'GET /api/bookings/my-bookings - Viết logic tại đây (booking.controller.getMyBookings)' });
};

// GET /api/bookings/:id - Chi tiết booking (chỉ của tôi)
const getById = async (req, res) => {
  // TODO: Chỉ trả về nếu booking.customerId = req.user.id (khi bật auth)
  res.json({ message: 'GET /api/bookings/:id - Viết logic tại đây (booking.controller.getById)' });
};

// PUT /api/bookings/:id/cancel - Hủy booking (khi đang chờ duyệt/chờ cọc)
const cancel = async (req, res) => {
  // TODO: Chỉ customer sở hữu. Chỉ hủy được khi status PENDING (hoặc WAITING_DEPOSIT nếu có). Cập nhật status CANCELLED, cancelReason
  res.json({ message: 'PUT /api/bookings/:id/cancel - Viết logic tại đây (booking.controller.cancel)' });
};

// PUT /api/bookings/:id/resubmit - Sửa booking và gửi lại từ đầu
const resubmit = async (req, res) => {
  // TODO: Chỉ khi PENDING/CANCELLED. Cập nhật thông tin từ body, set lại status PENDING
  res.json({ message: 'PUT /api/bookings/:id/resubmit - Viết logic tại đây (booking.controller.resubmit)' });
};

// ---- Vendor ----
// GET /api/vendor/bookings - Danh sách booking của nhà hàng (lọc theo trạng thái)
const getVendorBookings = async (req, res) => {
  // TODO: Lấy restaurantId từ vendor's restaurant. Find Bookings theo restaurantId. Query status
  res.json({ message: 'GET /api/vendor/bookings - Viết logic tại đây (booking.controller.getVendorBookings)' });
};

// PUT /api/vendor/bookings/:id/approve - Duyệt booking -> nhập số tiền cọc
const approve = async (req, res) => {
  // TODO: Chỉ booking thuộc nhà hàng của vendor. Cập nhật depositRequired, chuyển trạng thái (ví dụ sang WAITING_DEPOSIT nếu có trong enum, hoặc giữ PENDING chờ thanh toán)
  res.json({ message: 'PUT /api/vendor/bookings/:id/approve - Viết logic tại đây (booking.controller.approve)' });
};

// PUT /api/vendor/bookings/:id/reject - Từ chối + lý do
const reject = async (req, res) => {
  // TODO: Cập nhật status REJECTED, rejectReason
  res.json({ message: 'PUT /api/vendor/bookings/:id/reject - Viết logic tại đây (booking.controller.reject)' });
};

// PUT /api/vendor/bookings/:id/status - Vendor chuyển trạng thái (Đã cọc -> Hoàn thành)
const updateVendorStatus = async (req, res) => {
  // TODO: Body status. Chỉ cho phép chuyển sang COMPLETED hoặc trạng thái hợp lệ theo state machine
  res.json({ message: 'PUT /api/vendor/bookings/:id/status - Viết logic tại đây (booking.controller.updateVendorStatus)' });
};

// ---- Admin ----
// GET /api/admin/bookings - Xem toàn bộ booking hệ thống
const getAdminBookings = async (req, res) => {
  // TODO: Find tất cả Bookings, phân trang, lọc. Populate customerId, restaurantId, hallId
  res.json({ message: 'GET /api/admin/bookings - Viết logic tại đây (booking.controller.getAdminBookings)' });
};

module.exports = {
  create,
  getMyBookings,
  getById,
  cancel,
  resubmit,
  getVendorBookings,
  approve,
  reject,
  updateVendorStatus,
  getAdminBookings,
};
