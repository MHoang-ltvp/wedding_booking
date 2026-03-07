/**
 * Payment & Statistics Controller - Thành viên 6 (Minh Công / Triệu Hoàng)
 * Payment: tạo link thanh toán mock, webhook giả lập -> cập nhật Booking + Transaction.
 * Stats: Vendor stats, Admin stats.
 *
 * Viết logic vào các hàm dưới đây. Route gọi qua integration.routes.js.
 * Tạm thời chưa gắn middleware.
 */

// POST /api/payments/create-url - Tạo link thanh toán Mock cho số tiền cọc
const createPaymentUrl = async (req, res) => {
  // TODO: Body bookingId, amount. Trả về URL giả lập (hoặc mã giao dịch) để FE redirect
  res.json({ message: 'POST /api/payments/create-url - Viết logic tại đây (payment.controller.createPaymentUrl)' });
};

// POST /api/payments/webhook - Giả lập thanh toán thành công -> cập nhật Booking (DEPOSITED), tạo Transaction
const webhook = async (req, res) => {
  // TODO: Nhận bookingId/transactionCode. Cập nhật Booking trạng thái, tạo Transaction status PAID
  res.json({ message: 'POST /api/payments/webhook - Viết logic tại đây (payment.controller.webhook)' });
};

// GET /api/vendor/stats - Tổng booking, doanh thu cọc, top sảnh/dịch vụ
const getVendorStats = async (req, res) => {
  // TODO: Lấy restaurantId từ vendor. Aggregate Bookings, Transactions. Trả số liệu
  res.json({ message: 'GET /api/vendor/stats - Viết logic tại đây (payment.controller.getVendorStats)' });
};

// GET /api/admin/stats - Tổng User, Vendor, Booking, tỉ lệ chuyển đổi
const getAdminStats = async (req, res) => {
  // TODO: Đếm User (theo role), Restaurant, Booking (theo status). Tính tỉ lệ
  res.json({ message: 'GET /api/admin/stats - Viết logic tại đây (payment.controller.getAdminStats)' });
};

module.exports = {
  createPaymentUrl,
  webhook,
  getVendorStats,
  getAdminStats,
};
