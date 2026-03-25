import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const WEEK_HEADERS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

/** @param {Date} d */
export function ymdFromLocalDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** @param {string} ymd */
function parseYmd(ymd) {
  const [y, mo, da] = ymd.split('-').map(Number);
  return new Date(y, mo - 1, da);
}

function buildCells(viewYear, viewMonth0) {
  const first = new Date(viewYear, viewMonth0, 1);
  const pad = first.getDay();
  const lastDay = new Date(viewYear, viewMonth0 + 1, 0).getDate();
  const prevMonthLast = new Date(viewYear, viewMonth0, 0).getDate();
  const out = [];
  for (let i = pad - 1; i >= 0; i--) {
    const dayNum = prevMonthLast - i;
    out.push({ ymd: ymdFromLocalDate(new Date(viewYear, viewMonth0 - 1, dayNum)), inMonth: false });
  }
  for (let d = 1; d <= lastDay; d += 1) {
    out.push({ ymd: ymdFromLocalDate(new Date(viewYear, viewMonth0, d)), inMonth: true });
  }
  while (out.length % 7 !== 0) {
    const last = parseYmd(out[out.length - 1].ymd);
    last.setDate(last.getDate() + 1);
    out.push({ ymd: ymdFromLocalDate(last), inMonth: false });
  }
  return out;
}

const SHIFT_META = {
  MORNING: { label: 'Ca sáng', time: '09:00 – 14:00' },
  EVENING: { label: 'Ca tối', time: '16:00 – 22:00' },
};

/**
 * Lịch chọn ngày + ca (trống = xanh, hết = đỏ). Cửa đặt: 14 ngày do API quy định.
 *
 * @param {object} props
 * @param {string} props.hallId
 * @param {(id: string) => Promise<{
 *   from: string, to: string, slots: Array<{ date: string, availability: Record<string, { available: boolean }> }>,
 *   hallBookable?: boolean,
 * } | null>} props.loadRange
 * @param {{ date: string, shift: string }} props.value
 * @param {(v: { date: string, shift: string }) => void} props.onChange
 * @param {'customer' | 'vendor'} [props.mode]
 */
export default function HallShiftCalendar({ hallId, loadRange, value, onChange, mode = 'customer', disabled }) {
  const isVendor = mode === 'vendor';
  const [range, setRange] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState(() => {
    const t = new Date();
    return { y: t.getFullYear(), m: t.getMonth() };
  });

  useEffect(() => {
    if (!hallId || !loadRange) {
      setRange(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    loadRange(String(hallId))
      .then((data) => {
        if (!cancelled) setRange(data);
      })
      .catch(() => {
        if (!cancelled) setRange(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hallId, loadRange]);

  const allowedSet = useMemo(() => {
    if (!range?.slots) return new Set();
    return new Set(range.slots.map((s) => s.date));
  }, [range]);

  const slotMap = useMemo(() => {
    const m = new Map();
    if (range?.slots) {
      for (const s of range.slots) m.set(s.date, s.availability);
    }
    return m;
  }, [range]);

  const inWindow = useCallback((ymd) => allowedSet.has(ymd), [allowedSet]);

  useEffect(() => {
    if (value?.date) {
      try {
        const d = parseYmd(value.date);
        setView({ y: d.getFullYear(), m: d.getMonth() });
      } catch {
        /* ignore */
      }
    }
  }, [value?.date]);

  const cells = useMemo(() => buildCells(view.y, view.m), [view.y, view.m]);

  const monthRaw = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(
    new Date(view.y, view.m, 1),
  );
  const monthLabel = monthRaw.charAt(0).toUpperCase() + monthRaw.slice(1);

  const pickDate = (ymd) => {
    if (!inWindow(ymd) || disabled) return;
    const av = slotMap.get(ymd);
    if (!av) return;
    const anyFree = av.MORNING?.available || av.EVENING?.available;
    if (!isVendor && !anyFree) return;

    let shift = value?.shift || 'MORNING';
    if (!av[shift]?.available) {
      if (av.MORNING?.available) shift = 'MORNING';
      else if (av.EVENING?.available) shift = 'EVENING';
      else shift = 'MORNING';
    }
    onChange?.({ date: ymd, shift });
  };

  const pickShift = (shift) => {
    if (!value?.date || disabled) return;
    const av = slotMap.get(value.date);
    if (!av) return;
    if (!isVendor && !av[shift]?.available) return;
    onChange?.({ ...value, shift });
  };

  const goMonth = (delta) => {
    setView((prev) => {
      const d = new Date(prev.y, prev.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  };

  const avSelected = value?.date ? slotMap.get(value.date) : null;

  return (
    <div className="hall-shift-calendar" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {!hallId && (
        <p className="text-muted" style={{ margin: 0 }}>
          Chọn sảnh để xem lịch trống trong 14 ngày tới.
        </p>
      )}

      {hallId && loading && <p className="text-muted" style={{ margin: 0 }}>Đang tải lịch…</p>}

      {hallId && !loading && !range && (
        <p className="text-muted" style={{ margin: 0 }}>Không tải được lịch. Thử lại sau.</p>
      )}

      {hallId && range && (
        <>
          <div
            style={{
              border: '1px solid var(--border, #e5e7eb)',
              borderRadius: 'var(--radius-md, 8px)',
              padding: '1rem',
              background: 'var(--surface, #fff)',
            }}
          >
            <div className="d-flex align-center justify-between" style={{ marginBottom: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ padding: '0.35rem', minWidth: '2.25rem' }}
                onClick={() => goMonth(-1)}
                aria-label="Tháng trước"
              >
                <ChevronLeft size={22} />
              </button>
              <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{monthLabel}</span>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ padding: '0.35rem', minWidth: '2.25rem' }}
                onClick={() => goMonth(1)}
                aria-label="Tháng sau"
              >
                <ChevronRight size={22} />
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '0.25rem',
                textAlign: 'center',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '0.35rem',
              }}
            >
              {WEEK_HEADERS.map((h) => (
                <div key={h}>{h}</div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.35rem' }}>
              {cells.map((cell) => {
                const win = inWindow(cell.ymd);
                const av = slotMap.get(cell.ymd);
                const selected = value?.date === cell.ymd;
                const greyed = !cell.inMonth || !win;
                const mFree = av?.MORNING?.available;
                const eFree = av?.EVENING?.available;

                let border = '1px solid var(--border, #e5e7eb)';
                if (selected && win) border = '2px solid var(--primary, #c9a227)';

                return (
                  <button
                    key={`${cell.ymd}-${cell.inMonth}`}
                    type="button"
                    disabled={disabled || !win || (!isVendor && av && !mFree && !eFree)}
                    onClick={() => pickDate(cell.ymd)}
                    style={{
                      border,
                      borderRadius: '10px',
                      padding: '0.35rem 0.15rem 0.5rem',
                      background: selected && win ? 'rgba(201, 162, 39, 0.12)' : 'transparent',
                      cursor: win && (isVendor || (mFree || eFree)) && !disabled ? 'pointer' : 'default',
                      opacity: greyed ? 0.38 : 1,
                      minHeight: '3.35rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text, #1a1a1a)' }}>
                      {parseYmd(cell.ymd).getDate()}
                    </span>
                    {win && av && (
                      <div className="d-flex gap-1" style={{ justifyContent: 'center' }}>
                        <span
                          title={mFree ? 'Ca sáng trống' : 'Ca sáng hết'}
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            background: mFree ? '#16a34a' : '#dc2626',
                          }}
                        />
                        <span
                          title={eFree ? 'Ca tối trống' : 'Ca tối hết'}
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            background: eFree ? '#16a34a' : '#dc2626',
                          }}
                        />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div
              className="d-flex gap-4 justify-center"
              style={{ marginTop: '0.85rem', fontSize: '0.75rem', flexWrap: 'wrap' }}
            >
              <span className="d-flex align-center gap-2">
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} />
                Trống
              </span>
              <span className="d-flex align-center gap-2">
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626' }} />
                Hết
              </span>
            </div>

            {range.from && range.to && (
              <p className="text-muted" style={{ margin: '0.75rem 0 0', fontSize: '0.75rem', textAlign: 'center' }}>
                Chỉ trong khoảng {range.from} — {range.to} ({isVendor ? 'đối tác' : 'bạn'} có thể đặt theo quy định hệ thống).
              </p>
            )}
          </div>

          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.04em', margin: '0 0 0.75rem' }}>
              CHỌN CA {value?.date ? `(ngày ${value.date})` : ''}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {['MORNING', 'EVENING'].map((key) => {
                const meta = SHIFT_META[key];
                const ok = avSelected?.[key]?.available;
                const active = value?.shift === key && value?.date;
                const blocked = !isVendor && !ok;

                return (
                  <button
                    key={key}
                    type="button"
                    disabled={disabled || !value?.date || blocked}
                    onClick={() => pickShift(key)}
                    style={{
                      textAlign: 'left',
                      padding: '1rem',
                      borderRadius: '12px',
                      border: active ? '2px solid var(--primary, #2563eb)' : '1px solid var(--border)',
                      background: blocked ? 'rgba(0,0,0,0.03)' : 'var(--surface, #fff)',
                      opacity: blocked ? 0.65 : 1,
                      cursor: disabled || !value?.date || blocked ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <div className="d-flex justify-between align-start">
                      <div>
                        <div style={{ fontWeight: 700 }}>{meta.label}</div>
                        <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                          {meta.time}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.45rem',
                          borderRadius: '6px',
                          background: ok ? '#dcfce7' : '#fee2e2',
                          color: ok ? '#166534' : '#991b1b',
                        }}
                      >
                        {ok ? 'TRỐNG' : 'HẾT'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
