import api from '../lib/api';

/** POST /api/bookings */
export async function createCustomerBooking(body) {
  const { data } = await api.post('/bookings', body);
  return data;
}

/** GET /api/bookings/my-bookings */
export async function fetchMyBookings(params) {
  const { data } = await api.get('/bookings/my-bookings', { params });
  return data;
}

/** GET /api/bookings/:id */
export async function fetchCustomerBooking(id) {
  const { data } = await api.get(`/bookings/${id}`);
  return data;
}

/** PUT /api/bookings/:id/cancel */
export async function cancelCustomerBooking(id, cancelReason) {
  const { data } = await api.put(`/bookings/${id}/cancel`, { cancelReason });
  return data;
}

/** PUT /api/bookings/:id/resubmit */
export async function resubmitCustomerBooking(id, body) {
  const { data } = await api.put(`/bookings/${id}/resubmit`, body);
  return data;
}

/** POST /api/bookings/:id/confirm-payment — Khách xác nhận đã thanh toán cọc (một bước) */
export async function confirmCustomerPayment(id) {
  const { data } = await api.post(`/bookings/${id}/confirm-payment`);
  return data;
}
