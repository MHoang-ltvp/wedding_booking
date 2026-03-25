import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { paths } from '../../api/endpoints';
import { useVendorRestaurant } from '../../contexts/VendorRestaurantContext';
import { toast } from 'react-toastify';
import { ArrowLeft, X, ChevronRight, ChevronLeft } from 'lucide-react';
import MediaGalleryPanel from '../../shared/components/MediaGalleryPanel';
import { fetchProvinces, fetchDistrictsByProvince, fetchWardsByDistrict } from '../../services/address.service';

const emptyAddressDetail = () => ({
  provinceCode: '',
  provinceName: '',
  districtCode: '',
  districtName: '',
  wardCode: '',
  wardName: '',
  street: '',
});

/**
 * Form hồ sơ nhà hàng — dùng trên trang riêng hoặc trong modal.
 * Tạo mới (trang): 3 bước — tên → địa chỉ (tỉnh/quận/phường + một khối chi tiết) → mô tả & ảnh.
 * @param {'page'|'modal'} variant
 */
export default function VendorRestaurantEditor({
  restaurantId,
  isNew = false,
  variant = 'page',
  onRequestClose,
  onSaved,
}) {
  const navigate = useNavigate();
  const { refreshRestaurants, setSelectedRestaurantId } = useVendorRestaurant();
  const syncSelection = variant === 'page';
  const useWizard = isNew && variant === 'page';

  const [restaurant, setRestaurant] = useState(null);
  const emptyContact = () => ({ phone: '', email: '' });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    images: [],
    contact: emptyContact(),
    /** ACTIVE = hiển thị khách; HIDDEN = ẩn khỏi cổng (admin vẫn xem đủ) */
    status: 'ACTIVE',
  });
  const [addressDetail, setAddressDetail] = useState(emptyAddressDetail);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [geoHint, setGeoHint] = useState({ districts: false, wards: false });

  const imageToUrl = (img) => (typeof img === 'string' ? img : img?.url || '');

  const loadProvincesOnce = useCallback(async () => {
    try {
      const list = await fetchProvinces();
      setProvinces(list);
    } catch {
      toast.error('Không tải được danh sách tỉnh/thành.');
    }
  }, []);

  useEffect(() => {
    loadProvincesOnce();
  }, [loadProvincesOnce]);

  useEffect(() => {
    if (isNew) {
      setRestaurant(null);
      setFormData({ name: '', description: '', images: [], contact: emptyContact(), status: 'ACTIVE' });
      setAddressDetail(emptyAddressDetail());
      setDistricts([]);
      setWards([]);
      setStep(0);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get(paths.vendor.restaurant(restaurantId));
        if (cancelled) return;
        const rest = res.data.restaurant;
        if (!rest) {
          toast.error('Không tìm thấy nhà hàng.');
          if (variant === 'page') navigate('/vendor/restaurants', { replace: true });
          else onRequestClose?.();
          return;
        }
        setRestaurant(rest);
        if (syncSelection) setSelectedRestaurantId(rest._id);
        const c = rest.contact && typeof rest.contact === 'object' ? rest.contact : {};
        setFormData({
          name: rest.name || '',
          description: rest.description || '',
          images: (rest.images || []).map((img) =>
            typeof img === 'string' ? img : { url: img.url, public_id: img.public_id || '' }
          ),
          contact: {
            phone: c.phone != null ? String(c.phone) : '',
            email: c.email != null ? String(c.email) : '',
          },
          status: rest.status === 'HIDDEN' ? 'HIDDEN' : 'ACTIVE',
        });
        const ad = rest.addressDetail;
        if (ad && typeof ad === 'object') {
          const hn = ad.houseNumber != null ? String(ad.houseNumber).trim() : '';
          const st = (ad.street || '').trim();
          const mergedLine = [hn, st].filter(Boolean).join(' ').trim();
          setAddressDetail({
            provinceCode: String(ad.provinceCode ?? ''),
            provinceName: ad.provinceName || '',
            districtCode: String(ad.districtCode ?? ''),
            districtName: ad.districtName || '',
            wardCode: String(ad.wardCode ?? ''),
            wardName: ad.wardName || '',
            street: mergedLine || st,
          });
        } else {
          setAddressDetail(emptyAddressDetail());
        }
      } catch {
        if (!cancelled) {
          toast.error('Không tải được nhà hàng.');
          if (variant === 'page') navigate('/vendor/restaurants', { replace: true });
          else onRequestClose?.();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [restaurantId, isNew, navigate, setSelectedRestaurantId, syncSelection, variant]);

  useEffect(() => {
    const pc = addressDetail.provinceCode;
    if (!pc) {
      setDistricts([]);
      return;
    }
    let cancelled = false;
    setGeoHint((h) => ({ ...h, districts: true }));
    fetchDistrictsByProvince(pc)
      .then((list) => {
        if (!cancelled) setDistricts(list);
      })
      .catch(() => {
        if (!cancelled) {
          setDistricts([]);
          toast.error('Không tải được quận/huyện.');
        }
      })
      .finally(() => {
        if (!cancelled) setGeoHint((h) => ({ ...h, districts: false }));
      });
    return () => {
      cancelled = true;
    };
  }, [addressDetail.provinceCode]);

  useEffect(() => {
    const dc = addressDetail.districtCode;
    if (!dc) {
      setWards([]);
      return;
    }
    let cancelled = false;
    setGeoHint((h) => ({ ...h, wards: true }));
    fetchWardsByDistrict(dc)
      .then((list) => {
        if (!cancelled) setWards(list);
      })
      .catch(() => {
        if (!cancelled) {
          setWards([]);
          toast.error('Không tải được phường/xã.');
        }
      })
      .finally(() => {
        if (!cancelled) setGeoHint((h) => ({ ...h, wards: false }));
      });
    return () => {
      cancelled = true;
    };
  }, [addressDetail.districtCode]);

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const data = new FormData();
    for (let i = 0; i < files.length; i++) {
      data.append('images', files[i]);
    }
    try {
      setUploading(true);
      const res = await api.post(paths.upload.images, data);
      const added = res.data.images || [];
      setFormData((prev) => ({ ...prev, images: [...(prev.images || []), ...added] }));
      toast.success('Đã tải ảnh lên.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi upload.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const addressStepValid = () => {
    const a = addressDetail;
    return Boolean(
      a.provinceCode && a.districtCode && a.wardCode && a.street.trim()
    );
  };

  const saveRestaurant = async () => {
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên nhà hàng.');
      return;
    }
    if (!addressStepValid()) {
      toast.error('Chọn đủ tỉnh/thành, quận/huyện, phường/xã và nhập số nhà, tên đường.');
      return;
    }

    const imagesPayload = (formData.images || []).map((img) =>
      typeof img === 'string'
        ? { url: img, public_id: '' }
        : { url: img.url, public_id: img.public_id || '' }
    );
    const body = {
      name: formData.name.trim(),
      description: (formData.description || '').trim(),
      images: imagesPayload,
      addressDetail: {
        provinceCode: addressDetail.provinceCode,
        provinceName: addressDetail.provinceName,
        districtCode: addressDetail.districtCode,
        districtName: addressDetail.districtName,
        wardCode: addressDetail.wardCode,
        wardName: addressDetail.wardName,
        street: addressDetail.street.trim(),
      },
      contact: {
        phone: (formData.contact?.phone || '').trim(),
        email: (formData.contact?.email || '').trim(),
      },
    };

    if (!isNew) {
      body.status = formData.status === 'HIDDEN' ? 'HIDDEN' : 'ACTIVE';
    }

    setSaving(true);
    try {
      if (isNew) {
        const res = await api.post(paths.vendor.restaurants, body);
        const created = res.data.restaurant;
        if (created?._id) {
          if (syncSelection) setSelectedRestaurantId(created._id);
          await refreshRestaurants();
          toast.success('Đã tạo nhà hàng.');
          if (variant === 'page') {
            navigate(`/vendor/restaurants/${created._id}`, { replace: true });
          } else {
            onSaved?.();
            onRequestClose?.();
          }
        }
      } else {
        const res = await api.put(paths.vendor.restaurant(restaurantId), body);
        const next = res.data.restaurant || res.data;
        if (next) setRestaurant(next);
        await refreshRestaurants();
        toast.success('Đã cập nhật hồ sơ.');
        if (variant === 'modal') {
          onSaved?.();
          onRequestClose?.();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lưu thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (useWizard && step < 2) return;
    saveRestaurant();
  };

  const goNext = () => {
    if (step === 0 && !formData.name.trim()) {
      toast.error('Nhập tên nhà hàng.');
      return;
    }
    if (step === 1 && !addressStepValid()) {
      toast.error('Hoàn tất địa chỉ: tỉnh/thành → quận/huyện → phường/xã, tên đường (và số nhà nếu có).');
      return;
    }
    setStep((s) => Math.min(2, s + 1));
  };

  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const onSelectProvince = (e) => {
    const code = e.target.value;
    const p = provinces.find((x) => x.code === code);
    setAddressDetail((ad) => ({
      ...ad,
      provinceCode: code,
      provinceName: p?.name || '',
      districtCode: '',
      districtName: '',
      wardCode: '',
      wardName: '',
    }));
  };

  const onSelectDistrict = (e) => {
    const code = e.target.value;
    const d = districts.find((x) => x.code === code);
    setAddressDetail((ad) => ({
      ...ad,
      districtCode: code,
      districtName: d?.name || '',
      wardCode: '',
      wardName: '',
    }));
  };

  const onSelectWard = (e) => {
    const code = e.target.value;
    const w = wards.find((x) => x.code === code);
    setAddressDetail((ad) => ({
      ...ad,
      wardCode: code,
      wardName: w?.name || '',
    }));
  };

  const renderAddressFields = () => (
    <>
      <div className="media-form-field">
        <label className="media-form-label">Tỉnh / Thành phố</label>
        <select
          className="rest-select"
          value={addressDetail.provinceCode}
          onChange={onSelectProvince}
          required={!useWizard}
        >
          <option value="">— Chọn tỉnh/thành —</option>
          {provinces.map((p) => (
            <option key={p.code} value={p.code}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="media-form-field">
        <label className="media-form-label">Quận / Huyện / Thị xã</label>
        <select
          className="rest-select"
          value={addressDetail.districtCode}
          onChange={onSelectDistrict}
          disabled={!addressDetail.provinceCode || geoHint.districts}
          required={!useWizard}
        >
          <option value="">
            {geoHint.districts ? 'Đang tải…' : '— Chọn quận/huyện —'}
          </option>
          {districts.map((d) => (
            <option key={d.code} value={d.code}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
      <div className="media-form-field">
        <label className="media-form-label">Phường / Xã / Thị trấn</label>
        <select
          className="rest-select"
          value={addressDetail.wardCode}
          onChange={onSelectWard}
          disabled={!addressDetail.districtCode || geoHint.wards}
          required={!useWizard}
        >
          <option value="">{geoHint.wards ? 'Đang tải…' : '— Chọn phường/xã —'}</option>
          {wards.map((w) => (
            <option key={w.code} value={w.code}>
              {w.name}
            </option>
          ))}
        </select>
      </div>
      <div className="media-form-field">
        <label className="media-form-label">Số nhà, đường / phố / ngõ</label>
        <textarea
          className="media-form-textarea"
          rows={3}
          value={addressDetail.street}
          onChange={(e) => setAddressDetail((ad) => ({ ...ad, street: e.target.value }))}
          placeholder="Ví dụ: 120A Nguyễn Huệ — hoặc Lô 5, đường số 7, KDC…"
          autoComplete="street-address"
          style={{ minHeight: '5.5rem' }}
        />
        <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.35rem', marginBottom: 0 }}>
          Gõ cả dòng địa chỉ chi tiết trong một khối. Khi lưu sẽ ghép với phường, quận, tỉnh thành địa chỉ
          đầy đủ.
        </p>
      </div>
    </>
  );

  const renderContactFields = () => (
    <>
      <div className="media-form-general__head" style={{ marginTop: '0.5rem' }}>
        <h3 className="media-form-general__title">Liên hệ hiển thị</h3>
      </div>
      <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
        Khách đặt tiệc sẽ thấy các thông tin này (khác với tài khoản đăng nhập của bạn).
      </p>
      <div className="media-form-field">
        <label className="media-form-label">Điện thoại</label>
        <input
          type="tel"
          className="media-form-input"
          value={formData.contact?.phone || ''}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              contact: { ...(prev.contact || emptyContact()), phone: e.target.value },
            }))
          }
          placeholder="0900 xxx xxx"
          autoComplete="tel"
        />
      </div>
      <div className="media-form-field">
        <label className="media-form-label">Email</label>
        <input
          type="email"
          className="media-form-input"
          value={formData.contact?.email || ''}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              contact: { ...(prev.contact || emptyContact()), email: e.target.value },
            }))
          }
          placeholder="contact@nhahang.com"
          autoComplete="email"
        />
      </div>
    </>
  );

  if (loading) {
    return (
      <div style={{ padding: variant === 'modal' ? '2rem' : '2rem', textAlign: 'center' }}>
        <p className="text-muted">Đang tải…</p>
      </div>
    );
  }

  const wizardStepsBar = useWizard ? (
    <div className="restaurant-wizard-steps" aria-label="Tiến trình tạo nhà hàng">
      {[
        { n: 1, label: 'Tên nhà hàng' },
        { n: 2, label: 'Địa chỉ' },
        { n: 3, label: 'Mô tả & ảnh' },
      ].map((item, i) => (
        <div
          key={item.n}
          className={`restaurant-wizard-step${
            step === i ? ' restaurant-wizard-step--active' : ''
          }${step > i ? ' restaurant-wizard-step--done' : ''}`}
        >
          <span className="restaurant-wizard-step-num">{item.n}</span>
          {item.label}
        </div>
      ))}
    </div>
  ) : null;

  const inner = (
    <>
      {variant === 'page' && (
        <Link
          to="/vendor/restaurants"
          className="btn btn-ghost d-inline-flex align-center gap-2"
          style={{ padding: 0, marginBottom: '1rem' }}
        >
          <ArrowLeft size={18} /> Danh sách nhà hàng
        </Link>
      )}

      {variant === 'modal' && (
        <div
          className="d-flex justify-between align-start gap-2"
          style={{ marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Hồ sơ & ảnh</h2>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onRequestClose}
            aria-label="Đóng"
            style={{ padding: '0.25rem' }}
          >
            <X size={22} />
          </button>
        </div>
      )}

      <div className="page-header" style={variant === 'modal' ? { marginBottom: '1rem' } : undefined}>
        {variant === 'page' && (
          <>
            <h1 className="page-title">{isNew ? 'Thêm nhà hàng mới' : 'Hồ sơ nhà hàng'}</h1>
            {!isNew && restaurant && (
              <p className="text-muted" style={{ marginTop: '0.35rem' }}>
                Sảnh và gói dịch vụ (đồ ăn / trang trí) luôn thuộc nhà hàng này — chọn đúng nhà hàng ở
                sidebar trước khi vào mục Sảnh hoặc Dịch vụ.
              </p>
            )}
            {isNew && (
              <p className="text-muted" style={{ marginTop: '0.35rem' }}>
                Hoàn tất từng bước: đặt tên → chọn địa chỉ theo tỉnh/quận/phường → mô tả và ảnh.
              </p>
            )}
          </>
        )}
      </div>

      <div
        className="card"
        style={{
          maxWidth: variant === 'modal' ? 'none' : '1100px',
          boxShadow: variant === 'modal' ? 'none' : undefined,
          border: variant === 'modal' ? 'none' : undefined,
          padding: variant === 'modal' ? 0 : undefined,
        }}
      >
        {!isNew && restaurant && formData.status === 'HIDDEN' && (
          <div
            style={{
              backgroundColor: '#fef3c7',
              color: '#92400e',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
            }}
          >
            <strong>Đang ẩn khỏi cổng khách.</strong> Khách không tìm thấy nhà hàng và không đặt chỗ qua
            ứng dụng; admin vẫn xem đầy đủ hồ sơ.
          </div>
        )}

        {wizardStepsBar}

        <form onSubmit={handleFormSubmit}>
          {useWizard && step === 0 && (
            <div className="media-form-field">
              <div className="media-form-general__head" style={{ marginBottom: '1rem' }}>
                <h3 className="media-form-general__title">Bước 1 — Tên nhà hàng</h3>
              </div>
              <label className="media-form-label">Tên nhà hàng</label>
              <input
                type="text"
                className="media-form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Tên hiển thị trên ứng dụng"
              />
            </div>
          )}

          {useWizard && step === 1 && (
            <div className="media-form-general" style={{ marginTop: '0.25rem' }}>
              <div className="media-form-general__head">
                <h3 className="media-form-general__title">Bước 2 — Địa chỉ</h3>
              </div>
              {renderAddressFields()}
            </div>
          )}

          {!useWizard && (
            <div className="media-form-layout">
              <div className="media-form-general">
                <div className="media-form-general__head">
                  <h3 className="media-form-general__title">Thông tin chung</h3>
                </div>
                <div className="media-form-field">
                  <label className="media-form-label">Tên nhà hàng</label>
                  <input
                    type="text"
                    className="media-form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Tên hiển thị trên ứng dụng"
                  />
                </div>
                <div className="media-form-field">
                  <label className="media-form-label">Hiển thị trên cổng khách hàng</label>
                  <select
                    className="rest-select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    disabled={restaurant?.approvalStatus === 'PENDING'}
                  >
                    <option value="ACTIVE">Hiển thị — khách tìm thấy và có thể đặt chỗ (khi đã duyệt)</option>
                    <option value="HIDDEN">Ẩn — không hiển thị với khách (admin vẫn xem đầy đủ)</option>
                  </select>
                  {restaurant?.approvalStatus === 'PENDING' && (
                    <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.35rem', marginBottom: 0 }}>
                      Đang chờ duyệt — không đổi được chế độ hiển thị cho đến khi admin xử lý xong.
                    </p>
                  )}
                </div>
                <div className="media-form-general__head" style={{ marginTop: '0.5rem' }}>
                  <h3 className="media-form-general__title">Địa chỉ</h3>
                </div>
                {renderAddressFields()}
                {renderContactFields()}
                <div className="media-form-general__head" style={{ marginTop: '1.25rem' }}>
                  <h3 className="media-form-general__title">Mô tả</h3>
                </div>
                <div className="media-form-field">
                  <textarea
                    className="media-form-textarea"
                    rows={5}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Giới thiệu nhà hàng, phong cách phục vụ, điểm nổi bật…"
                  />
                </div>
              </div>
              <MediaGalleryPanel
                title="Thư viện ảnh"
                images={formData.images || []}
                resolveUrl={imageToUrl}
                onRemove={removeImage}
                uploading={uploading}
                onFileChange={handleImageUpload}
                uploadCaption="Tải lên"
                uploadHint={uploading ? 'Đang tải…' : 'JPG, PNG — có thể chọn nhiều'}
              />
            </div>
          )}

          {useWizard && step === 2 && (
            <div className="media-form-layout" style={{ marginTop: '0.25rem' }}>
              <div className="media-form-general">
                <div className="media-form-general__head">
                  <h3 className="media-form-general__title">Bước 3 — Mô tả</h3>
                </div>
                <div className="media-form-field">
                  <textarea
                    className="media-form-textarea"
                    rows={6}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Giới thiệu nhà hàng, phong cách phục vụ, điểm nổi bật…"
                  />
                </div>
                {renderContactFields()}
              </div>
              <MediaGalleryPanel
                title="Thư viện ảnh"
                images={formData.images || []}
                resolveUrl={imageToUrl}
                onRemove={removeImage}
                uploading={uploading}
                onFileChange={handleImageUpload}
                uploadCaption="Tải lên"
                uploadHint={uploading ? 'Đang tải…' : 'JPG, PNG — có thể chọn nhiều'}
              />
            </div>
          )}

          <div
            style={{ marginTop: 'var(--space-4)' }}
            className="d-flex gap-2 flex-wrap align-center"
          >
            {useWizard && step > 0 && (
              <button type="button" className="btn btn-outline d-inline-flex align-center gap-2" onClick={goBack}>
                <ChevronLeft size={18} /> Quay lại
              </button>
            )}
            {useWizard && step < 2 && (
              <button type="button" className="btn btn-primary d-inline-flex align-center gap-2" onClick={goNext}>
                Tiếp theo <ChevronRight size={18} />
              </button>
            )}
            {(!useWizard || step === 2) && (
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Đang lưu…' : isNew ? 'Tạo nhà hàng' : 'Cập nhật hồ sơ'}
              </button>
            )}
            {variant === 'modal' && (
              <button type="button" className="btn btn-outline" onClick={onRequestClose} disabled={saving}>
                Hủy
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  );

  if (variant === 'modal') {
    return <div className="fade-in">{inner}</div>;
  }

  return <div className="fade-in">{inner}</div>;
}
