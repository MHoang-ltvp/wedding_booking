import { useEffect, useId, useRef, useState } from 'react';
import { createRestaurant } from '../../services/vendor.service';
import { uploadImages } from '../../services/upload.service';
import {
  fetchPublicDistricts,
  fetchPublicProvinces,
  fetchPublicWards,
} from '../../services/public.service';
import '../../styles/vendor.css';

const MAX_FILES = 15;

function RestaurantCreateModal({ open, onClose, onCreated }) {
  const titleId = useId();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    name: '',
    provinceCode: '',
    districtCode: '',
    wardCode: '',
    street: '',
    description: '',
  });
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [locLoading, setLocLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState(''); // 'upload' | 'create' | ''

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setForm({
        name: '',
        provinceCode: '',
        districtCode: '',
        wardCode: '',
        street: '',
        description: '',
      });
      setProvinces([]);
      setDistricts([]);
      setWards([]);
      setFiles([]);
      setPreviews((prev) => {
        prev.forEach((u) => URL.revokeObjectURL(u));
        return [];
      });
      setError('');
      setPhase('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    (async () => {
      setLocLoading(true);
      try {
        const data = await fetchPublicProvinces();
        if (active && data.success) {
          setProvinces(Array.isArray(data.provinces) ? data.provinces : []);
        }
      } catch (_) {
        // fallback: hiển thị lỗi khi submit
      } finally {
        if (active) setLocLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (!form.provinceCode) {
      setDistricts([]);
      setWards([]);
      setForm((f) => ({ ...f, districtCode: '', wardCode: '' }));
      return;
    }
    let active = true;
    (async () => {
      try {
        const data = await fetchPublicDistricts(form.provinceCode);
        if (active && data.success) {
          setDistricts(Array.isArray(data.districts) ? data.districts : []);
          setWards([]);
          setForm((f) => ({ ...f, districtCode: '', wardCode: '' }));
        }
      } catch (_) {
        if (active) {
          setDistricts([]);
          setWards([]);
          setForm((f) => ({ ...f, districtCode: '', wardCode: '' }));
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [form.provinceCode]);

  useEffect(() => {
    if (!form.districtCode) {
      setWards([]);
      setForm((f) => ({ ...f, wardCode: '' }));
      return;
    }
    let active = true;
    (async () => {
      try {
        const data = await fetchPublicWards(form.districtCode);
        if (active && data.success) {
          setWards(Array.isArray(data.wards) ? data.wards : []);
          setForm((f) => ({ ...f, wardCode: '' }));
        }
      } catch (_) {
        if (active) {
          setWards([]);
          setForm((f) => ({ ...f, wardCode: '' }));
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [form.districtCode]);

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files || []).slice(0, MAX_FILES);
    setError('');
    previews.forEach((u) => URL.revokeObjectURL(u));
    const nextPreviews = selected.map((f) => URL.createObjectURL(f));
    setPreviews(nextPreviews);
    setFiles(selected);
  };

  const removeFile = (index) => {
    URL.revokeObjectURL(previews[index]);
    setFiles((f) => f.filter((_, i) => i !== index));
    setPreviews((p) => p.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !form.name.trim() ||
      !form.provinceCode ||
      !form.districtCode ||
      !form.wardCode ||
      !form.street.trim()
    ) {
      setError('Vui lòng chọn tỉnh/quận/phường và nhập số nhà, đường.');
      return;
    }

    setError('');
    let uploadedPayload = [];

    try {
      if (files.length > 0) {
        setPhase('upload');
        const up = await uploadImages(files);
        if (!up.success || !Array.isArray(up.images)) {
          setError(up.message || 'Upload ảnh thất bại.');
          setPhase('');
          return;
        }
        uploadedPayload = up.images.map((img) => ({
          url: img.url,
          public_id: img.public_id,
        }));
      }

      setPhase('create');
      const province = provinces.find((p) => p.code === form.provinceCode);
      const district = districts.find((d) => d.code === form.districtCode);
      const ward = wards.find((w) => w.code === form.wardCode);
      const data = await createRestaurant({
        name: form.name.trim(),
        addressDetail: {
          provinceCode: form.provinceCode,
          provinceName: province?.name || '',
          districtCode: form.districtCode,
          districtName: district?.name || '',
          wardCode: form.wardCode,
          wardName: ward?.name || '',
          street: form.street.trim(),
        },
        description: form.description.trim(),
        images: uploadedPayload,
      });

      if (data.success) {
        onCreated?.();
        onClose();
      } else {
        setError(data.message || 'Tạo hồ sơ thất bại.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          (phase === 'upload' ? 'Lỗi upload ảnh.' : 'Lỗi tạo nhà hàng.')
      );
    } finally {
      setPhase('');
    }
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const busy = phase === 'upload' || phase === 'create';
  const submitLabel =
    phase === 'upload' ? 'Đang tải ảnh lên…' : phase === 'create' ? 'Đang tạo hồ sơ…' : 'Tạo';

  if (!open) return null;

  return (
    <div
      className="vendor-modal-backdrop"
      role="presentation"
      onMouseDown={handleBackdrop}
    >
      <div
        className="vendor-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h3 id={titleId} className="vendor-modal__title">
          Hồ sơ nhà hàng mới
        </h3>
        <form onSubmit={handleSubmit} className="vendor-modal__form">
          {error && (
            <div className="vendor-alert vendor-alert--error" role="alert">
              {error}
            </div>
          )}

          <label className="vendor-field">
            <span className="vendor-field__label">Tên *</span>
            <input
              className="vendor-field__input"
              required
              disabled={busy}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              autoComplete="organization"
            />
          </label>

          <label className="vendor-field">
            <span className="vendor-field__label">Tỉnh/Thành *</span>
            <select
              className="vendor-field__input"
              required
              disabled={busy || locLoading}
              value={form.provinceCode}
              onChange={(e) => setForm((f) => ({ ...f, provinceCode: e.target.value }))}
            >
              <option value="">{locLoading ? 'Đang tải...' : '-- Chọn tỉnh/thành --'}</option>
              {provinces.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label className="vendor-field">
            <span className="vendor-field__label">Quận/Huyện *</span>
            <select
              className="vendor-field__input"
              required
              disabled={busy || !form.provinceCode}
              value={form.districtCode}
              onChange={(e) => setForm((f) => ({ ...f, districtCode: e.target.value }))}
            >
              <option value="">-- Chọn quận/huyện --</option>
              {districts.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>

          <label className="vendor-field">
            <span className="vendor-field__label">Phường/Xã *</span>
            <select
              className="vendor-field__input"
              required
              disabled={busy || !form.districtCode}
              value={form.wardCode}
              onChange={(e) => setForm((f) => ({ ...f, wardCode: e.target.value }))}
            >
              <option value="">-- Chọn phường/xã --</option>
              {wards.map((w) => (
                <option key={w.code} value={w.code}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>

          <label className="vendor-field">
            <span className="vendor-field__label">Số nhà, đường *</span>
            <input
              className="vendor-field__input"
              required
              disabled={busy}
              value={form.street}
              onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
              autoComplete="street-address"
            />
          </label>

          <label className="vendor-field">
            <span className="vendor-field__label">Mô tả</span>
            <textarea
              className="vendor-field__input vendor-field__textarea"
              rows={3}
              disabled={busy}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>

          <div className="vendor-field">
            <span className="vendor-field__label">Ảnh nhà hàng (tối đa {MAX_FILES})</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              disabled={busy}
              className="vendor-field__file"
              onChange={handleFiles}
            />
            <p className="vendor-field__help">
              Chọn một hoặc nhiều ảnh. Khi bấm <strong>Tạo</strong>, hệ thống sẽ upload ảnh lên
              server trước, sau đó tạo hồ sơ kèm đường dẫn ảnh.
            </p>
            {previews.length > 0 && (
              <ul className="vendor-modal__previews">
                {previews.map((src, i) => (
                  <li key={src} className="vendor-modal__preview-item">
                    <img src={src} alt="" className="vendor-modal__thumb" />
                    <button
                      type="button"
                      className="vendor-modal__preview-remove"
                      onClick={() => removeFile(i)}
                      disabled={busy}
                      aria-label="Xóa ảnh"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="vendor-modal__actions">
            <button type="submit" className="vendor-btn-primary" disabled={busy}>
              {submitLabel}
            </button>
            <button type="button" className="vendor-btn-ghost" disabled={busy} onClick={onClose}>
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RestaurantCreateModal;
