import api from '../lib/api';

/** GET /api/public/restaurants */
export async function fetchPublicRestaurants(params) {
  const { data } = await api.get('/public/restaurants', { params });
  return data;
}

/** GET /api/public/restaurants/:id */
export async function fetchPublicRestaurantById(id) {
  const { data } = await api.get(`/public/restaurants/${id}`);
  return data;
}

/** GET /api/public/restaurants/:id/halls */
export async function fetchPublicHalls(restaurantId, params) {
  const { data } = await api.get(`/public/restaurants/${restaurantId}/halls`, { params });
  return data;
}

/** GET /api/public/halls — danh sách sảnh toàn hệ thống (nhà hàng ACTIVE) */
export async function fetchPublicAllHalls(params) {
  const { data } = await api.get('/public/halls', { params });
  return data;
}

/** GET /api/public/restaurants/:id/services */
export async function fetchPublicServices(restaurantId, params) {
  const { data } = await api.get(`/public/restaurants/${restaurantId}/services`, { params });
  return data;
}

/** GET /api/public/halls/:hallId/availability?date=YYYY-MM-DD */
export async function fetchHallAvailability(hallId, date) {
  const { data } = await api.get(`/public/halls/${hallId}/availability`, {
    params: { date },
  });
  return data;
}

/** GET /api/public/halls/:hallId/availability-range?from=&days=14 — lịch 2 ca / nhiều ngày */
export async function fetchHallAvailabilityRange(hallId, params) {
  const { data } = await api.get(`/public/halls/${hallId}/availability-range`, {
    params,
  });
  return data;
}

/** GET /api/public/locations/provinces */
export async function fetchPublicProvinces() {
  const { data } = await api.get('/public/locations/provinces');
  return data;
}

/** GET /api/public/locations/districts?provinceCode= */
export async function fetchPublicDistricts(provinceCode) {
  const { data } = await api.get('/public/locations/districts', {
    params: { provinceCode },
  });
  return data;
}

/** GET /api/public/locations/wards?districtCode= */
export async function fetchPublicWards(districtCode) {
  const { data } = await api.get('/public/locations/wards', {
    params: { districtCode },
  });
  return data;
}
