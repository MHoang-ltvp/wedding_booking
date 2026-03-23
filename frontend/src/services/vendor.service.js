import api from '../lib/api';

export async function fetchMyRestaurants() {
  const { data } = await api.get('/vendor/restaurants/me');
  return data;
}

export async function fetchRestaurant(restaurantId) {
  const { data } = await api.get(`/vendor/restaurants/${restaurantId}`);
  return data;
}

export async function createRestaurant(body) {
  const { data } = await api.post('/vendor/restaurants', body);
  return data;
}

export async function fetchHalls(restaurantId) {
  const { data } = await api.get('/vendor/halls', {
    params: { restaurantId },
  });
  return data;
}

export async function fetchServices(restaurantId) {
  const { data } = await api.get('/vendor/services', {
    params: { restaurantId },
  });
  return data;
}

export async function createHall(body) {
  const { data } = await api.post('/vendor/halls', body);
  return data;
}

export async function updateHall(hallId, body) {
  const { data } = await api.put(`/vendor/halls/${hallId}`, body);
  return data;
}

export async function deleteHall(hallId) {
  const { data } = await api.delete(`/vendor/halls/${hallId}`);
  return data;
}

/**
 * POST /api/vendor/halls/:id/images — multipart field "images" (Cloudinary, gắn vào sảnh).
 * @param {string} hallId
 * @param {File[]} files
 */
export async function uploadHallImages(hallId, files) {
  if (!files?.length) {
    return { success: true, hall: null, added: [] };
  }
  const fd = new FormData();
  for (const file of files) {
    fd.append('images', file);
  }
  const { data } = await api.post(`/vendor/halls/${hallId}/images`, fd, {
    timeout: 120000,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });
  return data;
}

/** ServicePackage — theo restaurantId */
export async function createServicePackage(body) {
  const { data } = await api.post('/vendor/services', body);
  return data;
}

export async function updateServicePackage(serviceId, body) {
  const { data } = await api.put(`/vendor/services/${serviceId}`, body);
  return data;
}

export async function deleteServicePackage(serviceId) {
  const { data } = await api.delete(`/vendor/services/${serviceId}`);
  return data;
}

/** GET /api/vendor/bookings */
export async function fetchVendorBookings(params) {
  const { data } = await api.get('/vendor/bookings', { params });
  return data;
}

export async function approveVendorBooking(bookingId, depositRequired) {
  const { data } = await api.put(`/vendor/bookings/${bookingId}/approve`, {
    depositRequired,
  });
  return data;
}

export async function rejectVendorBooking(bookingId, rejectReason) {
  const { data } = await api.put(`/vendor/bookings/${bookingId}/reject`, {
    rejectReason,
  });
  return data;
}

export async function completeVendorBooking(bookingId) {
  const { data } = await api.put(`/vendor/bookings/${bookingId}/status`, {
    status: 'COMPLETED',
  });
  return data;
}

/** GET /api/vendor/stats */
export async function fetchVendorStats() {
  const { data } = await api.get('/vendor/stats');
  return data;
}
