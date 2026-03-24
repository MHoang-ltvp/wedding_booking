import api from '../api/axiosInstance';
import { paths } from '../api/endpoints';

export async function fetchAdminUsers(params = {}) {
  const { data } = await api.get(paths.admin.users, { params });
  return {
    users: Array.isArray(data.users) ? data.users : [],
    total: data.total ?? 0,
    page: data.page,
    limit: data.limit,
  };
}

export async function fetchAdminRestaurants(params = {}) {
  const { data } = await api.get(paths.admin.restaurants, { params });
  return {
    items: Array.isArray(data.items) ? data.items : [],
    total: data.total ?? 0,
  };
}

/** Chi tiết hồ sơ nhà hàng cho admin: restaurant + halls + services */
export async function fetchAdminRestaurantDetail(id) {
  const { data } = await api.get(paths.admin.restaurant(id));
  return {
    restaurant: data.restaurant || null,
    halls: Array.isArray(data.halls) ? data.halls : [],
    services: Array.isArray(data.services) ? data.services : [],
  };
}

export async function fetchAdminBookings(params = {}) {
  const { data } = await api.get(paths.admin.bookings, { params });
  return {
    items: Array.isArray(data.items) ? data.items : [],
    total: data.total ?? 0,
  };
}
