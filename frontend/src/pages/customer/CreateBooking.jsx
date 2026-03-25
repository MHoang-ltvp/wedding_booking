import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { fetchPublicRestaurantBundle, fetchHallAvailabilityRange, fetchHallAvailabilitySlotBools } from '../../services/public.service';
import { createBooking } from '../../services/customer.service';
import { toast } from 'react-toastify';
import { ArrowRight } from 'lucide-react';
import HallShiftCalendar from '../../shared/components/HallShiftCalendar';

const formatVnd = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(n) || 0);

const CreateBooking = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [restaurant, setRestaurant] = useState(null);
  const [halls, setHalls] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    hallId: '',
    bookingDate: '',
    shift: 'MORNING', // MORNING, EVENING
    tables: 1,
    selectedFood: '', // packageId
    selectedDecorIds: [], // packageIds — gói trang trí chọn nhiều
    customerNote: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [checkingSlot, setCheckingSlot] = useState(false);

  useEffect(() => {
    fetchData();
  }, [restaurantId]);

  /** Điền sẵn từ trang nhà hàng (sidebar đặt lịch; có thể chỉ có hallId) */
  useEffect(() => {
    const fr = location.state?.fromRestaurant;
    if (!fr?.hallId) return;
    setBookingData((prev) => ({
      ...prev,
      hallId: String(fr.hallId),
      ...(fr.bookingDate
        ? {
            bookingDate: fr.bookingDate,
            shift: fr.shift === 'EVENING' ? 'EVENING' : 'MORNING',
          }
        : {}),
    }));
  }, [location.state]);

  const fetchData = async () => {
    try {
      const bundle = await fetchPublicRestaurantBundle(restaurantId);
      if (!bundle) {
        toast.error('Không tìm thấy nhà hàng.');
        setRestaurant(null);
        return;
      }
      setRestaurant(bundle.restaurant);
      setHalls((bundle.halls || []).filter((h) => h.status === 'AVAILABLE'));
      setServices(bundle.services || []);
    } catch (error) {
      toast.error('Không tải được dữ liệu đặt chỗ.');
    } finally {
      setLoading(false);
    }
  };

  const calculateEstimate = () => {
    let total = 0;
    const hall = halls.find(h => h._id === bookingData.hallId);
    if (hall) total += hall.basePrice;

    const food = services.find(s => s._id === bookingData.selectedFood);
    if (food) {
      total += food.unit === 'TABLE' ? food.price * bookingData.tables : food.price;
    }

    for (const decorId of bookingData.selectedDecorIds) {
      const decor = services.find((s) => String(s._id) === String(decorId));
      if (decor) {
        total += decor.price;
      }
    }

    return total;
  };

  const hallLinePrice = () => {
    const hall = halls.find((h) => h._id === bookingData.hallId);
    return hall ? hall.basePrice : 0;
  };

  const foodLinePrice = () => {
    const food = services.find((s) => s._id === bookingData.selectedFood);
    if (!food) return 0;
    return food.unit === 'TABLE' ? food.price * bookingData.tables : food.price;
  };

  const decorLinePrice = (decorId) => {
    const d = services.find((s) => String(s._id) === String(decorId));
    return d ? d.price : 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const selectedServices = [];
      if (bookingData.selectedFood) {
        const food = services.find((s) => s._id === bookingData.selectedFood);
        selectedServices.push({
          packageId: food._id,
          quantity: food.unit === 'TABLE' ? bookingData.tables : 1,
        });
      }
      for (const decorId of bookingData.selectedDecorIds) {
        const decor = services.find((s) => String(s._id) === String(decorId));
        if (decor) {
          selectedServices.push({
            packageId: decor._id,
            quantity: 1,
          });
        }
      }

      const payload = {
        restaurantId,
        hallId: bookingData.hallId,
        bookingDate: new Date(`${bookingData.bookingDate}T12:00:00`).toISOString(),
        shift: bookingData.shift,
        services: selectedServices,
        customerNote: bookingData.customerNote,
      };

      const booking = await createBooking(payload);
      toast.success('Đặt chỗ hoàn tất — đã thanh toán, trạng thái: Hoàn thành.');
      navigate('/profile/bookings');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gửi đặt chỗ thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Đang tải...</div>;
  if (!restaurant) return <div style={{ padding: '4rem', textAlign: 'center' }}>Không tìm thấy nhà hàng.</div>;

  const foodServices = services.filter(s => s.type === 'FOOD');
  const decorServices = services.filter(s => s.type === 'DECORATION');

  return (
    <div className="container fade-in" style={{ padding: 'var(--space-6) var(--space-4)', maxWidth: '900px' }}>
      <div className="text-center" style={{ marginBottom: 'var(--space-5)' }}>
        <h1 className="page-title">Đặt chỗ — {restaurant.name}</h1>
        <p className="text-muted">Hoàn tất các bước dưới đây để gửi yêu cầu đặt chỗ.</p>
      </div>

      <div className="card">
        <div className="d-flex justify-between" style={{ borderBottom: '1px solid var(--border)', marginBottom: 'var(--space-5)', paddingBottom: 'var(--space-3)' }}>
          <div style={{ fontWeight: 600, color: step === 1 ? 'var(--primary)' : 'var(--text-muted)' }}>1. Sảnh & ngày</div>
          <div style={{ fontWeight: 600, color: step === 2 ? 'var(--primary)' : 'var(--text-muted)' }}>2. Dịch vụ</div>
          <div style={{ fontWeight: 600, color: step === 3 ? 'var(--primary)' : 'var(--text-muted)' }}>3. Tóm tắt</div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if(step < 3) setStep(step + 1); else handleSubmit(e); }}>
          
          {step === 1 && (
            <div className="fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label>Chọn sảnh</label>
                  <select
                    className="input-field"
                    required
                    value={bookingData.hallId}
                    onChange={(e) =>
                      setBookingData({
                        ...bookingData,
                        hallId: e.target.value,
                        bookingDate: '',
                        shift: 'MORNING',
                      })
                    }
                  >
                    <option value="" disabled>— Chọn sảnh —</option>
                    {halls.map(h => (
                      <option key={h._id} value={h._id}>{h.name} — tối đa {h.capacity} khách ({new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(h.basePrice)})</option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label>Số bàn dự kiến</label>
                  <input type="number" className="input-field" required min="1" value={bookingData.tables} onChange={e => setBookingData({...bookingData, tables: parseInt(e.target.value)})} />
                </div>
              </div>

              <div className="input-group" style={{ marginTop: '0.5rem' }}>
                <label>Ngày &amp; ca tiệc</label>
                <p className="text-muted" style={{ fontSize: '0.85rem', margin: '0 0 0.75rem' }}>
                  Chọn trong 14 ngày tới (không được đặt ngày quá khứ). Chấm xanh: còn trống, đỏ: đã hết chỗ.
                </p>
                <HallShiftCalendar
                  hallId={bookingData.hallId}
                  loadRange={fetchHallAvailabilityRange}
                  value={{ date: bookingData.bookingDate, shift: bookingData.shift }}
                  onChange={(v) => setBookingData({ ...bookingData, bookingDate: v.date, shift: v.shift })}
                  mode="customer"
                />
              </div>

              <div className="d-flex justify-end mt-4">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!bookingData.hallId || !bookingData.bookingDate || checkingSlot}
                  onClick={async () => {
                    if (!bookingData.hallId || !bookingData.bookingDate) return;
                    setCheckingSlot(true);
                    try {
                      const slot = await fetchHallAvailabilitySlotBools(
                        bookingData.hallId,
                        bookingData.bookingDate,
                      );
                      if (!slot || !slot[bookingData.shift]) {
                        toast.error('Ca này đã hết hoặc không còn trống. Chọn ngày/ca khác.');
                        return;
                      }
                      setStep(2);
                    } catch {
                      toast.error('Không kiểm tra được lịch. Thử lại.');
                    } finally {
                      setCheckingSlot(false);
                    }
                  }}
                >
                  Bước tiếp <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="fade-in">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Gói ẩm thực</h3>
                  {foodServices.map(s => (
                    <label key={s._id} className={`card ${bookingData.selectedFood === s._id ? 'selected' : ''}`} style={{ display: 'block', cursor: 'pointer', marginBottom: '1rem', border: bookingData.selectedFood === s._id ? '2px solid var(--primary)' : '1px solid var(--border)', boxShadow: 'none' }}>
                      <div className="d-flex align-center gap-3">
                        <input type="radio" name="food" value={s._id} checked={bookingData.selectedFood === s._id} onChange={() => setBookingData({...bookingData, selectedFood: s._id})} />
                        <div>
                          <div style={{ fontWeight: 600 }}>{s.name}</div>
                          <div style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(s.price)} / {s.unit === 'TABLE' ? 'bàn' : 'gói'}</div>
                        </div>
                      </div>
                    </label>
                  ))}
                  {foodServices.length === 0 && <p className="text-muted">Chưa có gói món.</p>}
                  <button type="button" className="btn btn-ghost text-muted" style={{ padding: 0 }} onClick={() => setBookingData({...bookingData, selectedFood: ''})}>Bỏ chọn</button>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Gói trang trí</h3>
                  {decorServices.map(s => {
                    const decorSelected = bookingData.selectedDecorIds.some((id) => String(id) === String(s._id));
                    return (
                      <label key={s._id} className={`card ${decorSelected ? 'selected' : ''}`} style={{ display: 'block', cursor: 'pointer', marginBottom: '1rem', border: decorSelected ? '2px solid var(--primary)' : '1px solid var(--border)', boxShadow: 'none' }}>
                        <div className="d-flex align-center gap-3">
                          <input
                            type="checkbox"
                            name={`decor-${s._id}`}
                            checked={decorSelected}
                            onChange={() => {
                              const key = String(s._id);
                              setBookingData((prev) => {
                                const has = prev.selectedDecorIds.some((id) => String(id) === key);
                                if (has) {
                                  return { ...prev, selectedDecorIds: prev.selectedDecorIds.filter((id) => String(id) !== key) };
                                }
                                return { ...prev, selectedDecorIds: [...prev.selectedDecorIds, s._id] };
                              });
                            }}
                          />
                          <div>
                            <div style={{ fontWeight: 600 }}>{s.name}</div>
                            <div style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(s.price)} / gói</div>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                  {decorServices.length === 0 && <p className="text-muted">Chưa có gói trang trí.</p>}
                  <button type="button" className="btn btn-ghost text-muted" style={{ padding: 0 }} onClick={() => setBookingData((prev) => ({ ...prev, selectedDecorIds: [] }))}>Bỏ chọn</button>
                </div>
              </div>

              <div className="d-flex justify-between mt-4">
                <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>Quay lại</button>
                <button type="button" className="btn btn-primary" onClick={() => setStep(3)}>Bước tiếp <ArrowRight size={18} /></button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="fade-in">
              <div style={{ backgroundColor: '#f9fafb', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.2rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Tóm tắt đặt chỗ</h3>
                
                <div className="d-flex justify-between" style={{ marginBottom: '0.5rem' }}>
                  <span>Nhà hàng:</span>
                  <span style={{ fontWeight: 600 }}>{restaurant.name}</span>
                </div>
                <div className="d-flex justify-between" style={{ marginBottom: '0.5rem' }}>
                  <span>Sảnh:</span>
                  <span style={{ fontWeight: 600 }}>{halls.find(h => h._id === bookingData.hallId)?.name}</span>
                </div>
                <div className="d-flex justify-between" style={{ marginBottom: '0.5rem' }}>
                  <span>Ngày & ca:</span>
                  <span style={{ fontWeight: 600 }}>{bookingData.bookingDate} ({bookingData.shift === 'MORNING' ? 'Ca sáng' : bookingData.shift === 'EVENING' ? 'Ca tối' : bookingData.shift})</span>
                </div>
                <div className="d-flex justify-between" style={{ marginBottom: '1.5rem' }}>
                  <span>Số bàn dự kiến:</span>
                  <span style={{ fontWeight: 600 }}>{bookingData.tables} bàn</span>
                </div>

                <div className="d-flex justify-between" style={{ marginBottom: '0.5rem' }}>
                  <span>Giá cơ bản sảnh:</span>
                  <span style={{ fontWeight: 600 }}>{formatVnd(hallLinePrice())}</span>
                </div>
                {bookingData.selectedFood && (() => {
                  const food = services.find((s) => s._id === bookingData.selectedFood);
                  if (!food) return null;
                  const sub =
                    food.unit === 'TABLE'
                      ? `${bookingData.tables} bàn × ${formatVnd(food.price)}/bàn`
                      : 'Theo gói';
                  return (
                    <div key="food-line" style={{ marginBottom: '0.5rem' }}>
                      <div className="d-flex justify-between align-start">
                        <span>
                          Ẩm thực ({food.name})
                          <span className="text-muted" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 400 }}>
                            {sub}
                          </span>
                        </span>
                        <span style={{ fontWeight: 600, whiteSpace: 'nowrap', marginLeft: '0.75rem' }}>{formatVnd(foodLinePrice())}</span>
                      </div>
                    </div>
                  );
                })()}
                {bookingData.selectedDecorIds.map((decorId) => {
                  const d = services.find((s) => String(s._id) === String(decorId));
                  if (!d) return null;
                  return (
                    <div key={String(decorId)} className="d-flex justify-between align-start" style={{ marginBottom: '0.5rem' }}>
                      <span>
                        Trang trí ({d.name})
                        <span className="text-muted" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 400 }}>
                          1 gói × {formatVnd(d.price)}
                        </span>
                      </span>
                      <span style={{ fontWeight: 600, whiteSpace: 'nowrap', marginLeft: '0.75rem' }}>{formatVnd(decorLinePrice(decorId))}</span>
                    </div>
                  );
                })}

                <div className="d-flex justify-between" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '2px dashed var(--border)', fontSize: '1.2rem', fontWeight: 700 }}>
                  <span>Tổng cộng:</span>
                  <span style={{ color: 'var(--primary)' }}>{formatVnd(calculateEstimate())}</span>
                </div>
                <small className="text-muted text-center" style={{ display: 'block', marginTop: '0.5rem' }}>
                  * Thanh toán được ghi nhận ngay khi xác nhận; lịch sảnh đã được giữ. Chi tiết có thể thống nhất thêm với nhà hàng.
                </small>
              </div>

              <div className="input-group">
                <label>Ghi chú / yêu cầu đặc biệt</label>
                <textarea className="input-field" rows="3" value={bookingData.customerNote} onChange={e => setBookingData({...bookingData, customerNote: e.target.value})} placeholder="Thực đơn chay, trang trí tông màu…" />
              </div>

              <div className="d-flex justify-between mt-4">
                <button type="button" className="btn btn-outline" onClick={() => setStep(2)}>Quay lại</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang xử lý…' : 'Xác nhận đặt chỗ'}
                </button>
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
};

export default CreateBooking;
