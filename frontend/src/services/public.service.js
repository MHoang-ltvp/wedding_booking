import api from '../api/axiosInstance';
import { paths } from '../api/endpoints';

/** @param {Record<string, string|number|undefined>} params */
export async function fetchPublicRestaurants(params = {}) {
  const { data } = await api.get(paths.public.restaurants, { params });
  return {
    list: Array.isArray(data.data) ? data.data : [],
    pagination: data.pagination,
  };
}

export async function fetchPublicRestaurantBundle(restaurantId) {
  const { data } = await api.get(paths.public.restaurant(restaurantId));
  const payload = data.data;
  if (!payload) return null;
  const { halls = [], services = [], ...restaurant } = payload;
  return {
    restaurant,
    halls: Array.isArray(halls) ? halls : [],
    services: Array.isArray(services) ? services : [],
  };
}

export async function fetchPublicRestaurantServices(restaurantId) {
  const { data } = await api.get(paths.public.restaurantServices(restaurantId));
  const d = data.data;
  if (d && Array.isArray(d.food) && Array.isArray(d.decoration)) {
    return [...d.food, ...d.decoration];
  }
  return Array.isArray(d) ? d : [];
}

/** Lịch 14 ngày (2 ca / ngày: available true = trống) — khớp quy tắc đặt chỗ */
export async function fetchHallAvailabilityRange(hallId, params = {}) {
  const { data } = await api.get(paths.public.hallAvailabilityRange(hallId), {
    params: { days: 14, ...params },
  });
  if (!data.success || !data.data) return null;
  return data.data;
}

/** @returns {Promise<{ MORNING: boolean, EVENING: boolean } | null>} */
export async function fetchHallAvailabilitySlotBools(hallId, dateYmd) {
  const { data } = await api.get(paths.public.hallAvailability(hallId), {
    params: { date: dateYmd },
  });
  const av = data.data?.availability;
  if (!av) return null;
  return {
    MORNING: !!av.MORNING?.available,
    EVENING: !!av.EVENING?.available,
  };
}
