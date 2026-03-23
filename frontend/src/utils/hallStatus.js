/** Trạng thái sảnh — khớp backend `Hall.status` */
export const HALL_STATUS = {
  AVAILABLE: 'AVAILABLE',
  MAINTENANCE: 'MAINTENANCE',
  LOCKED: 'LOCKED',
};

/** Nhãn hiển thị cho khách hàng */
export const hallStatusLabel = (status) => {
  switch (status) {
    case HALL_STATUS.AVAILABLE:
      return 'Hoạt động';
    case HALL_STATUS.MAINTENANCE:
      return 'Bảo trì';
    case HALL_STATUS.LOCKED:
      return 'Khóa đặt';
    default:
      return status || '—';
  }
};

/** Chỉ sảnh AVAILABLE mới được đặt (khớp `public.controller` hallOk) */
export function isHallBookable(h) {
  return h?.status === HALL_STATUS.AVAILABLE;
}
