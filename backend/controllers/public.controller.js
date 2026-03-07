/**
 * Public Controller - Thành viên 4 (Tdung)
 * API hiển thị ra ngoài cho Guest/Customer: tìm kiếm, chi tiết nhà hàng, sảnh, dịch vụ, kiểm tra lịch trống
 *
 * Viết logic vào các hàm dưới đây. Route gọi qua public.routes.js.
 * Không cần auth - public.
 */

// GET /api/public/restaurants - Tìm kiếm, phân trang, lọc (sức chứa, giá, khu vực)
const getRestaurants = async (req, res) => {
  // TODO: Query page, limit, capacity, minPrice, maxPrice, area (address?). Chỉ restaurant status ACTIVE. Trả list + total
  res.json({ message: 'GET /api/public/restaurants - Viết logic tại đây (public.controller.getRestaurants)' });
};

// GET /api/public/restaurants/:id - Chi tiết 1 nhà hàng
const getRestaurantById = async (req, res) => {
  // TODO: Find Restaurant by id, status ACTIVE. Populate hoặc join cần thiết
  res.json({ message: 'GET /api/public/restaurants/:id - Viết logic tại đây (public.controller.getRestaurantById)' });
};

// GET /api/public/restaurants/:id/halls - Danh sách sảnh của nhà hàng
const getHallsByRestaurant = async (req, res) => {
  // TODO: Find Halls where restaurantId = :id, isDeleted: false, status AVAILABLE (hoặc tất cả tùy nghiệp vụ)
  res.json({ message: 'GET /api/public/restaurants/:id/halls - Viết logic tại đây (public.controller.getHallsByRestaurant)' });
};

// GET /api/public/restaurants/:id/services - Danh sách menu/trang trí của nhà hàng
const getServicesByRestaurant = async (req, res) => {
  // TODO: Find ServicePackages where restaurantId = :id, isDeleted: false
  res.json({ message: 'GET /api/public/restaurants/:id/services - Viết logic tại đây (public.controller.getServicesByRestaurant)' });
};

// GET /api/public/halls/:id/availability?date=YYYY-MM-DD - Kiểm tra ca MORNING/EVENING đã bị đặt chưa
const getHallAvailability = async (req, res) => {
  // TODO: Query Booking: hallId, bookingDate = date, status in [PENDING, COMPLETED hoặc trạng thái đã cọc]. Trả về ca nào đã khóa (MORNING/EVENING)
  res.json({ message: 'GET /api/public/halls/:id/availability - Viết logic tại đây (public.controller.getHallAvailability)' });
};

module.exports = {
  getRestaurants,
  getRestaurantById,
  getHallsByRestaurant,
  getServicesByRestaurant,
  getHallAvailability,
};
