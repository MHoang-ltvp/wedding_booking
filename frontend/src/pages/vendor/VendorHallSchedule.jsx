import React, { useState, useEffect } from 'react';
import { useVendorRestaurant } from '../../contexts/VendorRestaurantContext';
import { fetchVendorHalls, fetchVendorHallAvailabilityRange } from '../../services/vendor.service';
import HallShiftCalendar from '../../shared/components/HallShiftCalendar';

const VendorHallSchedule = () => {
  const { selectedRestaurantId, loading: vrLoading } = useVendorRestaurant();
  const [halls, setHalls] = useState([]);
  const [hallId, setHallId] = useState('');
  const [pick, setPick] = useState({ date: '', shift: 'MORNING' });

  useEffect(() => {
    if (vrLoading || !selectedRestaurantId) {
      if (!vrLoading && !selectedRestaurantId) {
        setHalls([]);
        setHallId('');
      }
      return;
    }
    let cancelled = false;
    fetchVendorHalls(selectedRestaurantId).then((list) => {
      if (cancelled) return;
      setHalls(list);
      setHallId((prev) => {
        if (prev && list.some((h) => String(h._id) === String(prev))) return prev;
        return list[0]?._id ? String(list[0]._id) : '';
      });
    });
    return () => {
      cancelled = true;
    };
  }, [selectedRestaurantId, vrLoading]);

  return (
    <div className="container fade-in" style={{ padding: 'var(--space-5) var(--space-4)', maxWidth: '640px' }}>
      <h1 className="page-title">Lịch sảnh</h1>
      <p className="text-muted">
        Theo dõi trống / hết theo từng ngày và ca — cùng cửa 14 ngày với khách đặt trên cổng công khai.
      </p>

      {!selectedRestaurantId && !vrLoading && (
        <p className="text-muted">Hãy tạo hoặc chọn nhà hàng trong sidebar trước.</p>
      )}

      {selectedRestaurantId && (
        <div className="input-group" style={{ marginBottom: '1rem' }}>
          <label>Sảnh</label>
          <select
            className="input-field"
            value={hallId}
            onChange={(e) => {
              setHallId(e.target.value);
              setPick({ date: '', shift: 'MORNING' });
            }}
          >
            {halls.length === 0 && <option value="">— Chưa có sảnh —</option>}
            {halls.map((h) => (
              <option key={h._id} value={h._id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {hallId && (
        <div className="card">
          <HallShiftCalendar
            hallId={hallId}
            loadRange={fetchVendorHallAvailabilityRange}
            value={pick}
            onChange={setPick}
            mode="vendor"
          />
        </div>
      )}
    </div>
  );
};

export default VendorHallSchedule;
