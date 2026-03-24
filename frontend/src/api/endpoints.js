/**
 * Đường dẫn REST khớp backend (mount tại /api qua axios baseURL).
 * @see backend/routes/index.js
 */
export const paths = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
  },
  users: {
    me: '/users/me',
  },
  address: {
    provinces: '/address/provinces',
    provinceDistricts: (provinceCode) =>
      `/address/provinces/${encodeURIComponent(provinceCode)}/districts`,
    districtWards: (districtCode) =>
      `/address/districts/${encodeURIComponent(districtCode)}/wards`,
  },
  public: {
    restaurants: '/public/restaurants',
    restaurant: (id) => `/public/restaurants/${id}`,
    restaurantServices: (id) => `/public/restaurants/${id}/services`,
    hallAvailability: (hallId) => `/public/halls/${hallId}/availability`,
    hallAvailabilityRange: (hallId) => `/public/halls/${hallId}/availability-range`,
  },
  upload: {
    image: '/upload/image',
    images: '/upload/images',
  },
  vendor: {
    stats: '/vendor/stats',
    /** POST — tạo nhà hàng */
    restaurants: '/vendor/restaurants',
    restaurantsMe: '/vendor/restaurants/me',
    restaurant: (id) => `/vendor/restaurants/${id}`,
    /** PUT — gửi DRAFT/REJECTED → PENDING (cần ≥1 sảnh + ≥1 menu FOOD) */
    restaurantSubmitApproval: (id) => `/vendor/restaurants/${id}/submit-approval`,
    /** PUT — PENDING → DRAFT (thu hồi để sửa hồ sơ) */
    restaurantWithdrawApproval: (id) => `/vendor/restaurants/${id}/withdraw-approval`,
    halls: '/vendor/halls',
    hall: (id) => `/vendor/halls/${id}`,
    hallImages: (id) => `/vendor/halls/${id}/images`,
    services: '/vendor/services',
    service: (id) => `/vendor/services/${id}`,
    bookings: '/vendor/bookings',
    bookingApprove: (id) => `/vendor/bookings/${id}/approve`,
    bookingReject: (id) => `/vendor/bookings/${id}/reject`,
    bookingStatus: (id) => `/vendor/bookings/${id}/status`,
  },
  bookings: {
    root: '/bookings',
    myBookings: '/bookings/my-bookings',
    detail: (id) => `/bookings/${id}`,
    cancel: (id) => `/bookings/${id}/cancel`,
    resubmit: (id) => `/bookings/${id}/resubmit`,
    confirmPayment: (id) => `/bookings/${id}/confirm-payment`,
  },
  admin: {
    users: '/admin/users',
    userStatus: (id) => `/admin/users/${id}/status`,
    restaurants: '/admin/restaurants',
    restaurant: (id) => `/admin/restaurants/${id}`,
    restaurantApproval: (id) => `/admin/restaurants/${id}/approval`,
    bookings: '/admin/bookings',
    stats: '/admin/stats',
  },
};
