const Booking = require('../models/Booking');

/** Trạng thái booking chiếm slot — khớp booking.controller create */
const BOOKING_STATUSES_BLOCKING = { $nin: ['CANCELLED', 'REJECTED'] };

function ymdLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayYmdLocal() {
  return ymdLocal(new Date());
}

function parseYmdLocal(ymd) {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [y, mo, d] = ymd.split('-').map(Number);
  return new Date(y, mo - 1, d, 0, 0, 0, 0);
}

/**
 * @param {object} opts
 * @param {string} opts.hallId
 * @param {{ status: string, isDeleted?: boolean }} opts.hall
 * @param {string} [opts.fromQ] YYYY-MM-DD
 * @param {string|number} [opts.daysQ]
 * @param {number} [opts.maxDays] giới hạn cổng public thường là 14
 */
async function computeHallAvailabilitySlots({ hallId, hall, fromQ, daysQ, maxDays = 31 }) {
  const days = Math.min(maxDays, Math.max(1, parseInt(daysQ, 10) || 14));
  const today = parseYmdLocal(todayYmdLocal());
  let start = fromQ && parseYmdLocal(fromQ) ? parseYmdLocal(fromQ) : today;
  if (start < today) start = today;

  const fromStr = ymdLocal(start);
  const endLast = new Date(start);
  endLast.setDate(endLast.getDate() + days - 1);
  const rangeEnd = new Date(
    endLast.getFullYear(),
    endLast.getMonth(),
    endLast.getDate(),
    23,
    59,
    59,
    999,
  );

  const bookings = await Booking.find({
    hallId,
    bookingDate: { $gte: start, $lte: rangeEnd },
    status: BOOKING_STATUSES_BLOCKING,
  })
    .select('bookingDate shift')
    .lean();

  const takenByDate = new Map();
  for (const b of bookings) {
    const key = ymdLocal(new Date(b.bookingDate));
    if (!takenByDate.has(key)) takenByDate.set(key, new Set());
    takenByDate.get(key).add(b.shift);
  }

  const hallOk = hall.status === 'AVAILABLE' && !hall.isDeleted;
  const slots = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dateStr = ymdLocal(d);
    const taken = takenByDate.get(dateStr) || new Set();
    slots.push({
      date: dateStr,
      availability: {
        MORNING: { available: hallOk && !taken.has('MORNING') },
        EVENING: { available: hallOk && !taken.has('EVENING') },
      },
    });
  }

  const toStr = slots.length ? slots[slots.length - 1].date : fromStr;

  return {
    from: fromStr,
    to: toStr,
    days,
    slots,
    hallBookable: hallOk,
  };
}

module.exports = {
  ymdLocal,
  todayYmdLocal,
  parseYmdLocal,
  computeHallAvailabilitySlots,
  BOOKING_STATUSES_BLOCKING,
};
