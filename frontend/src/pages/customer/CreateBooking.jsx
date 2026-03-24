import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchPublicRestaurantBundle } from '../../services/public.service';
import { createBooking } from '../../services/customer.service';
import { toast } from 'react-toastify';
import { CalendarDays, Clock, ArrowRight } from 'lucide-react';

const CreateBooking = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();

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
    selectedDecor: '', // packageId
    customerNote: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [restaurantId]);

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

    const decor = services.find(s => s._id === bookingData.selectedDecor);
    if (decor) {
      total += decor.unit === 'TABLE' ? decor.price * bookingData.tables : decor.price;
    }

    return total;
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
      if (bookingData.selectedDecor) {
        const decor = services.find((s) => s._id === bookingData.selectedDecor);
        selectedServices.push({
          packageId: decor._id,
          quantity: decor.unit === 'TABLE' ? bookingData.tables : 1,
        });
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
      toast.success('Đã gửi yêu cầu đặt chỗ!');
      navigate(booking?._id ? `/profile/bookings/${booking._id}` : '/profile/bookings');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit booking');
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
        <h1 className="page-title">Book {restaurant.name}</h1>
        <p className="text-muted">Complete the simple steps below to request your booking.</p>
      </div>

      <div className="card">
        <div className="d-flex justify-between" style={{ borderBottom: '1px solid var(--border)', marginBottom: 'var(--space-5)', paddingBottom: 'var(--space-3)' }}>
          <div style={{ fontWeight: 600, color: step === 1 ? 'var(--primary)' : 'var(--text-muted)' }}>1. Hall & Date</div>
          <div style={{ fontWeight: 600, color: step === 2 ? 'var(--primary)' : 'var(--text-muted)' }}>2. Services</div>
          <div style={{ fontWeight: 600, color: step === 3 ? 'var(--primary)' : 'var(--text-muted)' }}>3. Summary</div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if(step < 3) setStep(step + 1); else handleSubmit(e); }}>
          
          {step === 1 && (
            <div className="fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label>Select Hall</label>
                  <select className="input-field" required value={bookingData.hallId} onChange={e => setBookingData({...bookingData, hallId: e.target.value})}>
                    <option value="" disabled>Choose a hall...</option>
                    {halls.map(h => (
                      <option key={h._id} value={h._id}>{h.name} - max {h.capacity} pax ({new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(h.basePrice)})</option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label>Number of Tables (Expected)</label>
                  <input type="number" className="input-field" required min="1" value={bookingData.tables} onChange={e => setBookingData({...bookingData, tables: parseInt(e.target.value)})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label>Event Date</label>
                  <div className="input-wrapper">
                    <CalendarDays className="input-icon" size={20} />
                    <input type="date" className="input-field with-icon" required value={bookingData.bookingDate} onChange={e => setBookingData({...bookingData, bookingDate: e.target.value})} />
                  </div>
                </div>
                <div className="input-group">
                  <label>Shift</label>
                  <div className="input-wrapper">
                    <Clock className="input-icon" size={20} />
                    <select className="input-field with-icon" value={bookingData.shift} onChange={e => setBookingData({...bookingData, shift: e.target.value})}>
                      <option value="MORNING">Morning (09:00 - 14:00)</option>
                      <option value="EVENING">Evening (16:00 - 22:00)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-end mt-4">
                <button type="button" className="btn btn-primary" disabled={!bookingData.hallId || !bookingData.bookingDate} onClick={() => setStep(2)}>
                  Next Step <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="fade-in">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Food Package</h3>
                  {foodServices.map(s => (
                    <label key={s._id} className={`card ${bookingData.selectedFood === s._id ? 'selected' : ''}`} style={{ display: 'block', cursor: 'pointer', marginBottom: '1rem', border: bookingData.selectedFood === s._id ? '2px solid var(--primary)' : '1px solid var(--border)', boxShadow: 'none' }}>
                      <div className="d-flex align-center gap-3">
                        <input type="radio" name="food" value={s._id} checked={bookingData.selectedFood === s._id} onChange={() => setBookingData({...bookingData, selectedFood: s._id})} />
                        <div>
                          <div style={{ fontWeight: 600 }}>{s.name}</div>
                          <div style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(s.price)} / {s.unit}</div>
                        </div>
                      </div>
                    </label>
                  ))}
                  {foodServices.length === 0 && <p className="text-muted">No food packages available.</p>}
                  <button type="button" className="btn btn-ghost text-muted" style={{ padding: 0 }} onClick={() => setBookingData({...bookingData, selectedFood: ''})}>Clear Selection</button>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Decoration Package</h3>
                  {decorServices.map(s => (
                    <label key={s._id} className={`card ${bookingData.selectedDecor === s._id ? 'selected' : ''}`} style={{ display: 'block', cursor: 'pointer', marginBottom: '1rem', border: bookingData.selectedDecor === s._id ? '2px solid var(--primary)' : '1px solid var(--border)', boxShadow: 'none' }}>
                      <div className="d-flex align-center gap-3">
                        <input type="radio" name="decor" value={s._id} checked={bookingData.selectedDecor === s._id} onChange={() => setBookingData({...bookingData, selectedDecor: s._id})} />
                        <div>
                          <div style={{ fontWeight: 600 }}>{s.name}</div>
                          <div style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(s.price)} / {s.unit}</div>
                        </div>
                      </div>
                    </label>
                  ))}
                  {decorServices.length === 0 && <p className="text-muted">No decoration packages available.</p>}
                  <button type="button" className="btn btn-ghost text-muted" style={{ padding: 0 }} onClick={() => setBookingData({...bookingData, selectedDecor: ''})}>Clear Selection</button>
                </div>
              </div>

              <div className="d-flex justify-between mt-4">
                <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>Back</button>
                <button type="button" className="btn btn-primary" onClick={() => setStep(3)}>Next Step <ArrowRight size={18} /></button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="fade-in">
              <div style={{ backgroundColor: '#f9fafb', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.2rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Booking Summary</h3>
                
                <div className="d-flex justify-between" style={{ marginBottom: '0.5rem' }}>
                  <span>Venue:</span>
                  <span style={{ fontWeight: 600 }}>{restaurant.name}</span>
                </div>
                <div className="d-flex justify-between" style={{ marginBottom: '0.5rem' }}>
                  <span>Hall:</span>
                  <span style={{ fontWeight: 600 }}>{halls.find(h => h._id === bookingData.hallId)?.name}</span>
                </div>
                <div className="d-flex justify-between" style={{ marginBottom: '0.5rem' }}>
                  <span>Date & Time:</span>
                  <span style={{ fontWeight: 600 }}>{bookingData.bookingDate} ({bookingData.shift})</span>
                </div>
                <div className="d-flex justify-between" style={{ marginBottom: '1.5rem' }}>
                  <span>Expected Tables:</span>
                  <span style={{ fontWeight: 600 }}>{bookingData.tables} tables</span>
                </div>

                <div className="d-flex justify-between" style={{ marginBottom: '0.5rem' }}>
                  <span>Hall Base Price:</span>
                  <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(halls.find(h => h._id === bookingData.hallId)?.basePrice || 0)}</span>
                </div>
                {bookingData.selectedFood && (
                  <div className="d-flex justify-between" style={{ marginBottom: '0.5rem' }}>
                    <span>Food ({services.find(s => s._id === bookingData.selectedFood)?.name}):</span>
                    <span>Computed based on {services.find(s => s._id === bookingData.selectedFood)?.unit} x Price</span>
                  </div>
                )}
                {bookingData.selectedDecor && (
                  <div className="d-flex justify-between" style={{ marginBottom: '0.5rem' }}>
                    <span>Decor ({services.find(s => s._id === bookingData.selectedDecor)?.name}):</span>
                    <span>Computed based on {services.find(s => s._id === bookingData.selectedDecor)?.unit} x Price</span>
                  </div>
                )}

                <div className="d-flex justify-between" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '2px dashed var(--border)', fontSize: '1.2rem', fontWeight: 700 }}>
                  <span>Estimated Total:</span>
                  <span style={{ color: 'var(--primary)' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(calculateEstimate())}</span>
                </div>
                <small className="text-muted text-center" style={{ display: 'block', marginTop: '0.5rem' }}>* Exact total may vary based on vendor confirmation.</small>
              </div>

              <div className="input-group">
                <label>Special Requests / Notes</label>
                <textarea className="input-field" rows="3" value={bookingData.customerNote} onChange={e => setBookingData({...bookingData, customerNote: e.target.value})} placeholder="Any special requirements..." />
              </div>

              <div className="d-flex justify-between mt-4">
                <button type="button" className="btn btn-outline" onClick={() => setStep(2)}>Back</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Confirm Request'}
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
