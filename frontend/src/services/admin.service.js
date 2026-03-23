import api from '../lib/api';

/** GET /api/admin/stats */
export async function fetchAdminStats() {
  const { data } = await api.get('/admin/stats');
  return data;
}

/** GET /api/admin/restaurants */
export async function fetchAdminRestaurants(params) {
  const { data } = await api.get('/admin/restaurants', { params });
  return data;
}

/** PUT /api/admin/restaurants/:id/approval */
export async function setRestaurantApproval(restaurantId, approvalStatus) {
  const { data } = await api.put(`/admin/restaurants/${restaurantId}/approval`, {
    approvalStatus,
  });
  return data;
}

/** GET /api/admin/users */
export async function fetchAdminUsers(params) {
  const { data } = await api.get('/admin/users', { params });
  return data;
}

/** PUT /api/admin/users/:id/status */
export async function updateAdminUserStatus(userId, status) {
  const { data } = await api.put(`/admin/users/${userId}/status`, { status });
  return data;
}

/** GET /api/admin/bookings */
export async function fetchAdminBookings(params) {
  const { data } = await api.get('/admin/bookings', { params });
  return data;
}
