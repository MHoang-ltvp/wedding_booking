import api from '../api/axiosInstance';
import { paths } from '../api/endpoints';

export async function createBooking(body) {
  const { data } = await api.post(paths.bookings.root, body);
  return data.booking || null;
}

export async function fetchMyBookings(params = {}) {
  const { data } = await api.get(paths.bookings.myBookings, { params });
  return {
    items: Array.isArray(data.items) ? data.items : [],
    total: data.total ?? 0,
    page: data.page,
    limit: data.limit,
  };
}

export async function fetchBookingDetail(id) {
  const { data } = await api.get(paths.bookings.detail(id));
  return data.booking || null;
}

export async function cancelBooking(id, cancelReason) {
  const { data } = await api.put(paths.bookings.cancel(id), { cancelReason });
  return data.booking;
}

export async function resubmitBooking(id) {
  const { data } = await api.put(paths.bookings.resubmit(id), {});
  return data.booking;
}

export async function confirmBookingPayment(id) {
  const { data } = await api.post(paths.bookings.confirmPayment(id), {});
  return data.booking;
}
