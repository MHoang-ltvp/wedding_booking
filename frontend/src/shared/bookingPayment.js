/** Trạng thái thanh toán một lần (trọn gói) — dùng chung customer/vendor UI */

export function vendorAcceptedBooking(b) {
  return Boolean(b?.vendorAccepted);
}

export function paidInFullBooking(b) {
  return Boolean(b?.paidInFull);
}

export function canCustomerPayBooking(b) {
  return (
    b?.status === 'PENDING' &&
    vendorAcceptedBooking(b) &&
    !paidInFullBooking(b)
  );
}

export function amountDueFull(b) {
  const n = Number(b?.estimatedTotal);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
