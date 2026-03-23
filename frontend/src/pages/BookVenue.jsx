import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchPublicRestaurantById,
  fetchHallAvailabilityRange,
} from '../services/public.service';
import { createCustomerBooking } from '../services/customerBooking.service';
import { hallStatusLabel, isHallBookable } from '../utils/hallStatus';

function localYmd(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDaysToYmd(ymd, add) {
  const [y, mo, d] = ymd.split('-').map(Number);
  const dt = new Date(y, mo - 1, d);
  dt.setDate(dt.getDate() + add);
  return localYmd(dt);
}

const RANGE_DAYS = 14;

/** Nhãn ô lịch: tránh nhầm “Đã đặt” khi sảnh không mở đặt (bảo trì/khóa). */
function calendarCellLabel(hallBookable, shiftAvailable) {
  if (!hallBookable) return '—';
  return shiftAvailable ? 'Trống' : 'Đã đặt';
}

function BookVenue() {
  const { restaurantId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [hallId, setHallId] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [shift, setShift] = useState('EVENING');
  const [customerNote, setCustomerNote] = useState('');
  const [qtyByPackage, setQtyByPackage] = useState({});

  const [slots, setSlots] = useState([]);
  const [hallBookable, setHallBookable] = useState(true);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState('');

  /** Luôn tính theo ngày hiện tại (tránh treo tab qua đêm bị sai min/max) */
  const minDateStr = localYmd();
  const maxDateStr = addDaysToYmd(localYmd(), RANGE_DAYS - 1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError('');
      setLoading(true);
      try {
        const data = await fetchPublicRestaurantById(restaurantId);
        if (!cancelled && data.success && data.data) {
          setPayload(data.data);
          const halls = data.data.halls || [];
          const qHall = searchParams.get('hallId');
          const firstBookable = halls.find(isHallBookable);
          if (qHall && halls.some((h) => String(h._id) === qHall && isHallBookable(h))) {
            setHallId(qHall);
          } else if (firstBookable) {
            setHallId(String(firstBookable._id));
          } else {
            setHallId('');
          }
        } else if (!cancelled) {
          setError(data.message || 'Không tải được.');
        }
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.message || e.message || 'Lỗi mạng.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [restaurantId, searchParams]);

  const loadCalendar = useCallback(async (hid) => {
    if (!hid) {
      setSlots([]);
      return;
    }
    setCalendarError('');
    setCalendarLoading(true);
    try {
      const res = await fetchHallAvailabilityRange(hid, {
        from: localYmd(),
        days: RANGE_DAYS,
      });
      if (res.success && res.data?.slots) {
        setSlots(res.data.slots);
        setHallBookable(res.data.hallBookable !== false);
        const list = res.data.slots;
        const first = list.find(
          (s) => s.availability?.MORNING?.available || s.availability?.EVENING?.available,
        );
        if (first) {
          setBookingDate(first.date);
          if (first.availability.MORNING.available) setShift('MORNING');
          else setShift('EVENING');
        } else {
          setBookingDate('');
        }
      } else {
        setSlots([]);
        setCalendarError(res.message || 'Không tải được lịch.');
      }
    } catch (e) {
      setSlots([]);
      setCalendarError(e.response?.data?.message || e.message || 'Lỗi mạng.');
    } finally {
      setCalendarLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hallId) loadCalendar(hallId);
  }, [hallId, loadCalendar]);

  const halls = payload?.halls || [];
  const bookableHalls = useMemo(() => halls.filter(isHallBookable), [halls]);
  const selectedHall = useMemo(
    () => halls.find((h) => String(h._id) === hallId) || null,
    [halls, hallId],
  );
  const services = payload?.services || [];

  const pickSlot = (dateStr, shiftKey) => {
    const row = slots.find((s) => s.date === dateStr);
    const ok = row?.availability?.[shiftKey]?.available;
    if (!ok || !hallBookable) return;
    setBookingDate(dateStr);
    setShift(shiftKey);
  };

  const servicesPayload = useMemo(() => {
    return Object.entries(qtyByPackage)
      .filter(([, q]) => Number(q) > 0)
      .map(([packageId, quantity]) => ({ packageId, quantity: Number(quantity) }));
  }, [qtyByPackage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (user?.role !== 'CUSTOMER') {
      setError('Chỉ khách hàng được đặt.');
      return;
    }
    if (!bookableHalls.length) {
      setError('Không có sảnh nào đang mở đặt.');
      return;
    }
    if (!hallId || !isHallBookable(selectedHall)) {
      setError('Chọn sảnh đang hoạt động.');
      return;
    }
    if (!bookingDate) {
      setError('Chọn ngày và ca (dùng bảng lịch trống hoặc form).');
      return;
    }
    if (!hallBookable) {
      if (selectedHall?.status && selectedHall.status !== 'AVAILABLE') {
        setError(
          `Sảnh "${selectedHall.name}" đang ${hallStatusLabel(selectedHall.status).toLowerCase()} — không thể đặt.`,
        );
      } else {
        setError('Sảnh tạm không nhận đặt. Vui lòng tải lại trang hoặc thử sau.');
      }
      return;
    }
    setSaving(true);
    setError('');
    try {
      const data = await createCustomerBooking({
        restaurantId,
        hallId,
        bookingDate: new Date(`${bookingDate}T12:00:00`).toISOString(),
        shift,
        services: servicesPayload,
        customerNote: customerNote.trim(),
      });
      if (data.success && data.booking?._id) {
        navigate(`/bookings/${data.booking._id}`, { replace: true });
      } else {
        setError(data.message || 'Không tạo được booking.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi.');
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== 'CUSTOMER') {
    return (
      <div className="customer-page">
        <p className="customer-alert customer-alert--error">
          Chỉ tài khoản <strong>khách hàng</strong> mới đặt tiệc tại đây.
        </p>
        <Link to={`/venues/${restaurantId}`} className="customer-link">
          ← Chi tiết nhà hàng
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="customer-page">
        <p className="customer-muted">Đang tải…</p>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="customer-page">
        <p className="customer-alert customer-alert--error">{error || 'Không có dữ liệu.'}</p>
      </div>
    );
  }

  return (
    <div className="customer-page">
      <Link to={`/venues/${restaurantId}`} className="customer-link" style={{ display: 'inline-block', marginBottom: '1rem' }}>
        ← Chi tiết nhà hàng
      </Link>
      <header className="customer-page__head">
        <h1 className="customer-page__title">Đặt tiệc — {payload.name}</h1>
        <p className="customer-muted" style={{ marginTop: '0.35rem' }}>
          Chỉ đặt trong <strong>{RANGE_DAYS} ngày</strong> kể từ hôm nay (mỗi ngày 2 ca: sáng / tối).
        </p>
      </header>

      {error && <p className="customer-alert customer-alert--error">{error}</p>}

      {halls.length > 0 && bookableHalls.length === 0 && (
        <p className="customer-alert customer-alert--error" role="alert">
          Tất cả sảnh đang <strong>bảo trì</strong> hoặc <strong>khóa đặt</strong> — không thể đặt trực tuyến. Vui lòng
          liên hệ nhà hàng hoặc quay lại sau.
        </p>
      )}

      <form className="customer-form customer-form--booking" onSubmit={handleSubmit}>
        <label className="customer-label">
          Sảnh (chỉ sảnh đang hoạt động) *
          <select
            className="customer-input"
            value={hallId}
            onChange={(e) => {
              setHallId(e.target.value);
              setBookingDate('');
            }}
            required
            disabled={!bookableHalls.length}
          >
            {!bookableHalls.length ? (
              <option value="">— Không có sảnh mở đặt —</option>
            ) : (
              bookableHalls.map((h) => (
                <option key={h._id} value={h._id}>
                  {h.name} — {h.basePrice?.toLocaleString('vi-VN')} đ
                </option>
              ))
            )}
          </select>
        </label>

        <div className="customer-avail-block">
          <p className="customer-label" style={{ marginBottom: '0.5rem' }}>
            Lịch trống ({RANGE_DAYS} ngày)
          </p>
          {!hallBookable && selectedHall && (
            <p className="customer-alert customer-alert--error" role="alert">
              {selectedHall.status !== 'AVAILABLE' ? (
                <>
                  Sảnh <strong>{selectedHall.name}</strong> hiện không mở đặt (
                  {hallStatusLabel(selectedHall.status)}).
                </>
              ) : (
                <>
                  Sảnh <strong>{selectedHall.name}</strong> tạm không nhận đặt trên hệ thống. Vui lòng{' '}
                  <button
                    type="button"
                    className="customer-link"
                    style={{ display: 'inline', padding: 0, background: 'none', border: 'none', cursor: 'pointer' }}
                    onClick={() => hallId && loadCalendar(hallId)}
                  >
                    tải lại lịch
                  </button>{' '}
                  hoặc quay lại sau.
                </>
              )}
            </p>
          )}
          {calendarLoading && <p className="customer-muted">Đang tải lịch…</p>}
          {calendarError && !calendarLoading && (
            <p className="customer-alert customer-alert--error">{calendarError}</p>
          )}
          {!calendarLoading && !calendarError && slots.length > 0 && (
            <div className="customer-table-wrap customer-avail-wrap">
              <table className="customer-table customer-avail-table">
                <thead>
                  <tr>
                    <th>Ngày</th>
                    <th>Ca sáng</th>
                    <th>Ca tối</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.map((row) => (
                    <tr key={row.date}>
                      <td>
                        {new Date(row.date + 'T12:00:00').toLocaleDateString('vi-VN', {
                          weekday: 'short',
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`customer-avail-cell${bookingDate === row.date && shift === 'MORNING' ? ' customer-avail-cell--picked' : ''}`}
                          disabled={!hallBookable || !row.availability.MORNING.available}
                          onClick={() => pickSlot(row.date, 'MORNING')}
                        >
                          {!hallBookable
                            ? '—'
                            : row.availability.MORNING.available
                              ? 'Trống'
                              : 'Đã đặt'}
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`customer-avail-cell${bookingDate === row.date && shift === 'EVENING' ? ' customer-avail-cell--picked' : ''}`}
                          disabled={!hallBookable || !row.availability.EVENING.available}
                          onClick={() => pickSlot(row.date, 'EVENING')}
                        >
                          {calendarCellLabel(hallBookable, row.availability.EVENING.available)}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <label className="customer-label">
          Ngày tiệc *
          <input
            type="date"
            className="customer-input"
            value={bookingDate}
            min={minDateStr}
            max={maxDateStr}
            onChange={(e) => setBookingDate(e.target.value)}
            required
          />
        </label>

        <label className="customer-label">
          Ca *
          <select className="customer-input" value={shift} onChange={(e) => setShift(e.target.value)}>
            <option value="MORNING">Sáng</option>
            <option value="EVENING">Tối</option>
          </select>
        </label>

        <fieldset className="customer-fieldset">
          <legend className="customer-label">Gói dịch vụ (tùy chọn)</legend>
          {services.length === 0 ? (
            <p className="customer-muted">Chưa có gói.</p>
          ) : (
            services.map((s) => (
              <div key={s._id} className="customer-service-row">
                <span>
                  {s.name} — {s.price?.toLocaleString('vi-VN')} đ ({s.type})
                </span>
                <input
                  type="number"
                  min={0}
                  className="customer-input customer-input--narrow"
                  placeholder="SL"
                  value={qtyByPackage[s._id] ?? ''}
                  onChange={(e) =>
                    setQtyByPackage((prev) => ({
                      ...prev,
                      [s._id]: e.target.value,
                    }))
                  }
                />
              </div>
            ))
          )}
        </fieldset>

        <label className="customer-label">
          Ghi chú
          <textarea
            className="customer-input"
            rows={3}
            value={customerNote}
            onChange={(e) => setCustomerNote(e.target.value)}
          />
        </label>

        <button
          type="submit"
          className="customer-btn customer-btn--primary"
          disabled={
            saving ||
            !bookableHalls.length ||
            !hallId ||
            !bookingDate ||
            !hallBookable
          }
        >
          {saving ? 'Đang gửi…' : 'Gửi yêu cầu đặt chỗ'}
        </button>
      </form>
    </div>
  );
}

export default BookVenue;
