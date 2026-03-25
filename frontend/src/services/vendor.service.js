import api from '../api/axiosInstance';
import { paths } from '../api/endpoints';

const STORAGE_KEY = 'vendorRestaurantId';

/** @deprecated Dùng VendorRestaurantContext; hàm này chỉ gán nhà hàng đầu tiên nếu cần tương thích cũ */
export async function syncVendorRestaurantId() {
  const { data } = await api.get(paths.vendor.restaurantsMe);
  const list = data.restaurants || [];
  if (list.length === 0) {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
  const id = String(list[0]._id);
  localStorage.setItem(STORAGE_KEY, id);
  return id;
}

export function getStoredVendorRestaurantId() {
  return localStorage.getItem(STORAGE_KEY);
}

export async function fetchVendorRestaurantsMe() {
  const { data } = await api.get(paths.vendor.restaurantsMe);
  return Array.isArray(data.restaurants) ? data.restaurants : [];
}

export async function deleteVendorRestaurant(restaurantId) {
  const { data } = await api.delete(paths.vendor.restaurant(restaurantId));
  return data;
}

/** PUT /vendor/restaurants/:id/submit-approval */
export async function submitVendorRestaurantForApproval(restaurantId) {
  const { data } = await api.put(paths.vendor.restaurantSubmitApproval(restaurantId), {});
  return data;
}

/** PUT /vendor/restaurants/:id/withdraw-approval — PENDING → DRAFT */
export async function withdrawVendorRestaurantApproval(restaurantId) {
  const { data } = await api.put(paths.vendor.restaurantWithdrawApproval(restaurantId), {});
  return data;
}

export async function fetchVendorHalls(restaurantId) {
  const { data } = await api.get(paths.vendor.halls, { params: { restaurantId } });
  return Array.isArray(data.halls) ? data.halls : [];
}

/** Lịch sảnh (đối tác): cùng payload với cổng public, tối đa 14 ngày */
export async function fetchVendorHallAvailabilityRange(hallId, params = {}) {
  const { data } = await api.get(paths.vendor.hallAvailabilityRange(hallId), {
    params: { days: 14, ...params },
  });
  if (!data.success || !data.data) return null;
  return data.data;
}

export async function fetchVendorServices(restaurantId) {
  const { data } = await api.get(paths.vendor.services, { params: { restaurantId } });
  return Array.isArray(data.services) ? data.services : [];
}

export async function fetchVendorBookings(params = {}) {
  const { data } = await api.get(paths.vendor.bookings, { params });
  return {
    items: Array.isArray(data.items) ? data.items : [],
    total: data.total ?? 0,
  };
}
