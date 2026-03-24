import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  fetchRestaurant,
  fetchHalls,
  fetchServices,
  submitRestaurantApproval,
  updateRestaurant,
  createHall,
  updateHall,
  deleteHall,
  createServicePackage,
  updateServicePackage,
  deleteServicePackage,
} from '../../services/vendor.service';
import ImageCarousel from '../../components/vendor/ImageCarousel';
import { uploadImages } from '../../services/upload.service';
import '../../styles/vendor.css';

const HALL_STATUS = [
  { value: 'AVAILABLE', label: 'Hoạt động' },
  { value: 'MAINTENANCE', label: 'Bảo trì' },
];

function parseItemLines(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function unitCodeFromType(type) {
  return type === 'FOOD' ? 'TABLE' : 'PACKAGE';
}

function VendorVenueDetail() {
  const { restaurantId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') === 'menu' ? 'menu' : 'halls';

  const [restaurant, setRestaurant] = useState(null);
  const [halls, setHalls] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hallError, setHallError] = useState('');
  const [serviceError, setServiceError] = useState('');
  const [submitBusy, setSubmitBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [submitModal, setSubmitModal] = useState(null);
  const [restaurantForm, setRestaurantForm] = useState({
    name: '',
    address: '',
    description: '',
    images: [],
  });
  const [restaurantNewFiles, setRestaurantNewFiles] = useState([]);
  const [savingRestaurant, setSavingRestaurant] = useState(false);

  const [hallForm, setHallForm] = useState({
    name: '',
    capacity: '',
    basePrice: '',
    area: '',
    description: '',
    status: 'AVAILABLE',
  });
  const [savingHall, setSavingHall] = useState(false);
  const [editingHall, setEditingHall] = useState(null);
  const [savingHallEdit, setSavingHallEdit] = useState(false);
  const [hallImageFiles, setHallImageFiles] = useState([]);
  /** Ảnh mới khi sửa sảnh */
  const [hallEditNewFiles, setHallEditNewFiles] = useState([]);

  const [pkgForm, setPkgForm] = useState({
    name: '',
    type: 'FOOD',
    price: '',
    itemsText: '',
    description: '',
  });
  const [pkgImageFiles, setPkgImageFiles] = useState([]);
  const [savingPkg, setSavingPkg] = useState(false);
  const [editingSvc, setEditingSvc] = useState(null);
  /** Ảnh mới khi sửa gói (upload trước khi PUT) */
  const [editSvcNewFiles, setEditSvcNewFiles] = useState([]);
  const [savingSvcEdit, setSavingSvcEdit] = useState(false);

  const showToast = (message, type = 'error') => {
    if (!message) return;
    setToast({ message, type });
  };

  const setActiveTab = (tab) => {
    const next = new URLSearchParams(searchParams);
    if (tab === 'halls') {
      next.delete('tab');
    } else {
      next.set('tab', 'menu');
    }
    setSearchParams(next, { replace: true });
  };

  const loadAll = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const [rData, hData, sData] = await Promise.all([
        fetchRestaurant(restaurantId),
        fetchHalls(restaurantId),
        fetchServices(restaurantId),
      ]);
      if (rData.success && rData.restaurant) {
        setRestaurant(rData.restaurant);
      } else {
        setError(rData.message || 'Không tìm thấy nhà hàng.');
      }
      if (hData.success && Array.isArray(hData.halls)) setHalls(hData.halls);
      if (sData.success && Array.isArray(sData.services)) setServices(sData.services);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Lỗi tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!restaurant) return;
    setRestaurantForm({
      name: restaurant.name || '',
      address: restaurant.address || '',
      description: restaurant.description || '',
      images: Array.isArray(restaurant.images) ? [...restaurant.images] : [],
    });
    setRestaurantNewFiles([]);
  }, [restaurant?._id]);

  const handleUpdateRestaurant = async (e) => {
    e.preventDefault();
    if (!restaurant?._id) return;
    setError('');
    const name = restaurantForm.name.trim();
    const address = restaurantForm.address.trim();
    if (!name || !address) {
      showToast('Tên và địa chỉ nhà hàng không được để trống.');
      return;
    }
    setSavingRestaurant(true);
    try {
      let mergedImages = [...(restaurantForm.images || [])];
      if (restaurantNewFiles.length > 0) {
        const up = await uploadImages(restaurantNewFiles);
        if (!up.success || !Array.isArray(up.images)) {
          showToast(up.message || 'Lỗi upload ảnh nhà hàng.');
          return;
        }
        mergedImages = [
          ...mergedImages,
          ...up.images.map((img) => ({ url: img.url, public_id: img.public_id })),
        ];
      }
      const data = await updateRestaurant(restaurant._id, {
        name,
        address,
        description: restaurantForm.description.trim(),
        images: mergedImages,
      });
      if (data.success) {
        showToast('Đã cập nhật thông tin nhà hàng.', 'success');
        await loadAll();
      } else {
        showToast(data.message || 'Không cập nhật được nhà hàng.');
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Lỗi cập nhật nhà hàng.');
    } finally {
      setSavingRestaurant(false);
    }
  };

  const handleCreateHall = async (e) => {
    e.preventDefault();
    setHallError('');
    const name = hallForm.name.trim();
    const capacity = Number(hallForm.capacity);
    const basePrice = Number(hallForm.basePrice);
    if (!name || Number.isNaN(capacity) || Number.isNaN(basePrice)) {
      setHallError('Nhập đủ tên, sức chứa và giá cơ bản (số).');
      return;
    }
    setSavingHall(true);
    try {
      let imagesPayload = [];
      if (hallImageFiles.length > 0) {
        const up = await uploadImages(hallImageFiles);
        if (!up.success) {
          setHallError(up.message || 'Lỗi upload ảnh. Kiểm tra Cloudinary / mạng.');
          return;
        }
        if (!up.images?.length) {
          setHallError('Không nhận được ảnh sau khi upload.');
          return;
        }
        imagesPayload = up.images.map((img) => ({
          url: img.url,
          public_id: img.public_id,
        }));
      }
      const data = await createHall({
        restaurantId,
        name,
        capacity,
        basePrice,
        area:
          hallForm.area !== '' && !Number.isNaN(Number(hallForm.area))
            ? Number(hallForm.area)
            : undefined,
        description: hallForm.description.trim(),
        status: hallForm.status,
        images: imagesPayload,
      });
      if (data.success) {
        setHallForm({
          name: '',
          capacity: '',
          basePrice: '',
          area: '',
          description: '',
          status: 'AVAILABLE',
        });
        setHallImageFiles([]);
        showToast('Đã thêm sảnh thành công.', 'success');
        await loadAll();
      } else {
        const msg = data.message || 'Không tạo được sảnh.';
        setHallError(msg);
        showToast(msg);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Lỗi tạo sảnh.';
      setHallError(msg);
      showToast(msg);
    } finally {
      setSavingHall(false);
    }
  };

  const handleSubmitApproval = async () => {
    if (!restaurant?._id) return;
    const hallCount = restaurant.hallCount || 0;
    const menuCount = restaurant.menuCount || 0;
    if (hallCount < 1 || menuCount < 1) {
      setSubmitModal({
        title: 'Chưa đủ điều kiện gửi duyệt',
        lines: [
          `Hiện tại có ${hallCount} sảnh và ${menuCount} menu FOOD.`,
          'Cần tối thiểu 1 sảnh và 1 menu FOOD trước khi gửi duyệt.',
        ],
      });
      return;
    }
    setError('');
    setSubmitBusy(true);
    try {
      const data = await submitRestaurantApproval(restaurant._id);
      if (!data.success) {
        const req = data?.requirements;
        if (req && (req.hallCount < req.minHalls || req.menuCount < req.minMenus)) {
          setSubmitModal({
            title: 'Chưa đủ điều kiện gửi duyệt',
            lines: [
              `Hiện tại có ${req.hallCount} sảnh và ${req.menuCount} menu FOOD.`,
              `Yêu cầu tối thiểu ${req.minHalls} sảnh và ${req.minMenus} menu FOOD.`,
            ],
          });
        } else {
          showToast(data.message || 'Gửi duyệt thất bại.');
        }
        return;
      }
      showToast('Đã gửi duyệt cho admin.', 'success');
      await loadAll();
    } catch (err) {
      const req = err.response?.data?.requirements;
      if (req && (req.hallCount < req.minHalls || req.menuCount < req.minMenus)) {
        setSubmitModal({
          title: 'Chưa đủ điều kiện gửi duyệt',
          lines: [
            `Hiện tại có ${req.hallCount} sảnh và ${req.menuCount} menu FOOD.`,
            `Yêu cầu tối thiểu ${req.minHalls} sảnh và ${req.minMenus} menu FOOD.`,
          ],
        });
      } else {
        showToast(err.response?.data?.message || err.message || 'Lỗi gửi duyệt.');
      }
    } finally {
      setSubmitBusy(false);
    }
  };

  useEffect(() => {
    if (!toast?.message) return undefined;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleUpdateHall = async (e) => {
    e.preventDefault();
    if (!editingHall) return;
    setHallError('');
    setSavingHallEdit(true);
    try {
      const capacity = Number(editingHall.capacity);
      const basePrice = Number(editingHall.basePrice);
      if (!editingHall.name?.trim() || Number.isNaN(capacity) || Number.isNaN(basePrice)) {
        setHallError('Kiểm tra tên, sức chứa và giá.');
        return;
      }
      let mergedImages = [...(editingHall.images || [])];
      if (hallEditNewFiles.length > 0) {
        const up = await uploadImages(hallEditNewFiles);
        if (!up.success) {
          setHallError(up.message || 'Lỗi upload ảnh.');
          return;
        }
        if (!up.images?.length) {
          setHallError('Không nhận được ảnh sau khi upload.');
          return;
        }
        mergedImages = [
          ...mergedImages,
          ...up.images.map((img) => ({ url: img.url, public_id: img.public_id })),
        ];
      }
      const data = await updateHall(editingHall._id, {
        name: editingHall.name.trim(),
        capacity,
        basePrice,
        area:
          editingHall.area !== '' && editingHall.area != null && !Number.isNaN(Number(editingHall.area))
            ? Number(editingHall.area)
            : undefined,
        description: String(editingHall.description || ''),
        status: editingHall.status,
        images: mergedImages,
      });
      if (data.success) {
        setEditingHall(null);
        setHallEditNewFiles([]);
        showToast('Đã cập nhật sảnh.', 'success');
        await loadAll();
      } else {
        const msg = data.message || 'Không cập nhật được.';
        setHallError(msg);
        showToast(msg);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Lỗi cập nhật sảnh.';
      setHallError(msg);
      showToast(msg);
    } finally {
      setSavingHallEdit(false);
    }
  };

  const handleDeleteHall = async (hallId, hallName) => {
    if (!window.confirm(`Xóa sảnh "${hallName}"?`)) return;
    setHallError('');
    try {
      const data = await deleteHall(hallId);
      if (data.success) {
        showToast('Đã xóa sảnh.', 'success');
        await loadAll();
      } else {
        const msg = data.message || 'Không xóa được.';
        setHallError(msg);
        showToast(msg);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Lỗi xóa sảnh.';
      setHallError(msg);
      showToast(msg);
    }
  };

  const handleCreatePackage = async (e) => {
    e.preventDefault();
    setServiceError('');
    if (!restaurantId?.trim()) {
      setServiceError('Thiếu mã nhà hàng. Hãy vào lại từ danh sách nhà hàng (đường dẫn /vendor/venues/...).');
      return;
    }
    const name = pkgForm.name.trim();
    const price = Number(pkgForm.price);
    if (!name || Number.isNaN(price)) {
      setServiceError('Nhập tên và giá (số).');
      return;
    }
    setSavingPkg(true);
    try {
      let imagesPayload = [];
      if (pkgImageFiles.length > 0) {
        const up = await uploadImages(pkgImageFiles);
        if (!up.success) {
          setServiceError(up.message || 'Lỗi upload ảnh. Kiểm tra Cloudinary / mạng.');
          return;
        }
        if (!up.images?.length) {
          setServiceError('Không nhận được ảnh sau khi upload.');
          return;
        }
        imagesPayload = up.images.map((img) => ({
          url: img.url,
          public_id: img.public_id,
        }));
      }
      const data = await createServicePackage({
        restaurantId,
        name,
        type: pkgForm.type,
        unit: unitCodeFromType(pkgForm.type),
        price,
        items: parseItemLines(pkgForm.itemsText),
        description: pkgForm.description.trim(),
        images: imagesPayload,
      });
      if (data.success) {
        setPkgForm({
          name: '',
          type: 'FOOD',
          price: '',
          itemsText: '',
          description: '',
        });
        setPkgImageFiles([]);
        showToast('Đã thêm gói dịch vụ.', 'success');
        await loadAll();
      } else {
        const msg = data.message || 'Không tạo được gói.';
        setServiceError(msg);
        showToast(msg);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Lỗi tạo gói.';
      setServiceError(msg);
      showToast(msg);
    } finally {
      setSavingPkg(false);
    }
  };

  const handleUpdatePackage = async (e) => {
    e.preventDefault();
    if (!editingSvc) return;
    setServiceError('');
    const price = Number(editingSvc.price);
    if (!editingSvc.name?.trim() || Number.isNaN(price)) {
      setServiceError('Kiểm tra tên và giá.');
      return;
    }
    setSavingSvcEdit(true);
    try {
      let mergedImages = [...(editingSvc.images || [])];
      if (editSvcNewFiles.length > 0) {
        const up = await uploadImages(editSvcNewFiles);
        if (!up.success) {
          setServiceError(up.message || 'Lỗi upload ảnh.');
          return;
        }
        if (!up.images?.length) {
          setServiceError('Không nhận được ảnh sau khi upload.');
          return;
        }
        mergedImages = [
          ...mergedImages,
          ...up.images.map((img) => ({ url: img.url, public_id: img.public_id })),
        ];
      }
      const data = await updateServicePackage(editingSvc._id, {
        name: editingSvc.name.trim(),
        type: editingSvc.type,
        unit: unitCodeFromType(editingSvc.type),
        price,
        items: parseItemLines(editingSvc.itemsText),
        description: String(editingSvc.description || ''),
        images: mergedImages,
      });
      if (data.success) {
        setEditingSvc(null);
        setEditSvcNewFiles([]);
        showToast('Đã cập nhật gói dịch vụ.', 'success');
        await loadAll();
      } else {
        const msg = data.message || 'Không cập nhật được.';
        setServiceError(msg);
        showToast(msg);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Lỗi cập nhật gói.';
      setServiceError(msg);
      showToast(msg);
    } finally {
      setSavingSvcEdit(false);
    }
  };

  const handleDeletePackage = async (svc) => {
    if (!window.confirm(`Xóa gói "${svc.name}"?`)) return;
    setServiceError('');
    try {
      const data = await deleteServicePackage(svc._id);
      if (data.success) {
        showToast('Đã xóa gói dịch vụ.', 'success');
        await loadAll();
      } else {
        const msg = data.message || 'Không xóa được.';
        setServiceError(msg);
        showToast(msg);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Lỗi xóa gói.';
      setServiceError(msg);
      showToast(msg);
    }
  };

  const openEditService = (s) => {
    setServiceError('');
    setEditSvcNewFiles([]);
    setEditingSvc({
      ...s,
      itemsText: Array.isArray(s.items) ? s.items.join('\n') : '',
      price: String(s.price ?? ''),
      images: Array.isArray(s.images) ? [...s.images] : [],
    });
  };

  const food = services.filter((s) => s.type === 'FOOD');
  const decor = services.filter((s) => s.type === 'DECORATION');
  const isPendingApproval = restaurant?.approvalStatus === 'PENDING';
  const canSubmitApproval =
    restaurant &&
    !isPendingApproval &&
    (restaurant.hallCount || 0) > 0 &&
    (restaurant.menuCount || 0) > 0;

  if (loading) {
    return <p className="vendor-muted">Đang tải…</p>;
  }

  if (error || !restaurant) {
    return (
      <div>
        <div className="breadcrumb">
          <Link to="/vendor/venues">← Nhà hàng</Link>
        </div>
        <p className="vendor-alert vendor-alert--error">{error || 'Không tìm thấy.'}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/vendor/venues">Nhà hàng</Link>
        <span style={{ color: '#64748b', margin: '0 0.35rem' }}>/</span>
        <span style={{ color: '#94a3b8' }}>{restaurant.name}</span>
      </div>

      <div className="vendor-detail__hero">
        <ImageCarousel images={restaurant.images || []} alt={restaurant.name} />
      </div>

      <div className="vendor-page-header">
        <p className="vendor-kicker">Chi tiết địa điểm</p>
        <h1 className="vendor-page-title">{restaurant.name}</h1>
        <p className="vendor-page-desc">{restaurant.address}</p>
        {restaurant.description && (
          <p className="vendor-page-desc" style={{ marginTop: '0.5rem' }}>
            {restaurant.description}
          </p>
        )}
        <p className="vendor-muted" style={{ marginTop: '0.5rem' }}>
          Trạng thái duyệt: <strong>{restaurant.approvalStatus}</strong> · Sảnh: {restaurant.hallCount || 0} · Menu:{' '}
          {restaurant.menuCount || 0}
        </p>
        {isPendingApproval && (
          <p className="vendor-alert" style={{ marginTop: '0.65rem' }}>
            Nhà hàng đang chờ duyệt, bạn không thể chỉnh sửa sảnh/menu lúc này.
          </p>
        )}
        {!isPendingApproval && (
          <button
            type="button"
            className="vendor-btn-primary"
            onClick={handleSubmitApproval}
            disabled={submitBusy}
            style={{ marginTop: '0.65rem' }}
          >
            {submitBusy ? 'Đang gửi duyệt…' : 'Gửi duyệt cho admin'}
          </button>
        )}
      </div>

      <section className="vendor-hall-form" style={{ marginBottom: '1rem' }}>
        <p className="vendor-section-sub">Thông tin nhà hàng</p>
        <form onSubmit={handleUpdateRestaurant}>
          <div className="vendor-hall-form__grid">
            <label className="vendor-field">
              <span className="vendor-field__label">Tên nhà hàng *</span>
              <input
                className="vendor-field__input"
                value={restaurantForm.name}
                onChange={(e) => setRestaurantForm((v) => ({ ...v, name: e.target.value }))}
                disabled={savingRestaurant || isPendingApproval}
                required
              />
            </label>
            <label className="vendor-field">
              <span className="vendor-field__label">Địa chỉ *</span>
              <input
                className="vendor-field__input"
                value={restaurantForm.address}
                onChange={(e) => setRestaurantForm((v) => ({ ...v, address: e.target.value }))}
                disabled={savingRestaurant || isPendingApproval}
                required
              />
            </label>
          </div>
          <label className="vendor-field" style={{ marginTop: '0.6rem' }}>
            <span className="vendor-field__label">Mô tả</span>
            <textarea
              className="vendor-field__input vendor-field__textarea"
              rows={3}
              value={restaurantForm.description}
              onChange={(e) => setRestaurantForm((v) => ({ ...v, description: e.target.value }))}
              disabled={savingRestaurant || isPendingApproval}
            />
          </label>

          <div className="vendor-field" style={{ marginTop: '0.6rem' }}>
            <span className="vendor-field__label">Ảnh nhà hàng</span>
            {(restaurantForm.images || []).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {(restaurantForm.images || []).map((img, idx) => (
                  <div
                    key={img.public_id || img.url || idx}
                    style={{
                      position: 'relative',
                      width: 84,
                      height: 64,
                      borderRadius: 6,
                      overflow: 'hidden',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                  >
                    <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      className="vendor-btn-ghost vendor-btn-ghost--danger"
                      style={{ position: 'absolute', top: 2, right: 2, padding: '0 0.25rem', fontSize: '0.7rem', lineHeight: 1.2 }}
                      onClick={() =>
                        setRestaurantForm((v) => ({
                          ...v,
                          images: (v.images || []).filter((_, i) => i !== idx),
                        }))
                      }
                      disabled={savingRestaurant || isPendingApproval}
                      aria-label="Xóa ảnh nhà hàng"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              className="vendor-field__input"
              disabled={savingRestaurant || isPendingApproval}
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (files.length) setRestaurantNewFiles((prev) => [...prev, ...files]);
                e.target.value = '';
              }}
            />
            {restaurantNewFiles.length > 0 && (
              <ul style={{ marginTop: '0.35rem', paddingLeft: '1.1rem', fontSize: '0.9rem' }}>
                {restaurantNewFiles.map((f, i) => (
                  <li key={`${f.name}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ flex: 1 }}>{f.name} (mới)</span>
                    <button
                      type="button"
                      className="vendor-btn-ghost vendor-btn-ghost--danger"
                      style={{ padding: '0.1rem 0.35rem', fontSize: '0.75rem' }}
                      onClick={() => setRestaurantNewFiles((prev) => prev.filter((_, j) => j !== i))}
                      disabled={savingRestaurant || isPendingApproval}
                    >
                      Bỏ
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="submit"
            className="vendor-btn-primary"
            style={{ marginTop: '0.75rem' }}
            disabled={savingRestaurant || isPendingApproval}
          >
            {savingRestaurant ? 'Đang tải ảnh / lưu…' : 'Lưu thông tin nhà hàng'}
          </button>
        </form>
      </section>

      <div className="vendor-tabs" role="tablist" aria-label="Nội dung nhà hàng">
        <button
          type="button"
          role="tab"
          id="tab-halls"
          aria-selected={tabFromUrl === 'halls'}
          aria-controls="panel-halls"
          className={`vendor-tab${tabFromUrl === 'halls' ? ' vendor-tab--active' : ''}`}
          onClick={() => setActiveTab('halls')}
        >
          Sảnh
        </button>
        <button
          type="button"
          role="tab"
          id="tab-menu"
          aria-selected={tabFromUrl === 'menu'}
          aria-controls="panel-menu"
          className={`vendor-tab${tabFromUrl === 'menu' ? ' vendor-tab--active' : ''}`}
          onClick={() => setActiveTab('menu')}
        >
          Menu
        </button>
      </div>

      {tabFromUrl === 'halls' && (
        <section
          id="panel-halls"
          role="tabpanel"
          aria-labelledby="tab-halls"
          className="vendor-tab-panel"
        >
          {hallError && (
            <div className="vendor-alert vendor-alert--error" role="alert">
              {hallError}
            </div>
          )}

          <form className="vendor-hall-form" onSubmit={handleCreateHall}>
            <p className="vendor-section-sub">Thêm sảnh mới</p>
            <div className="vendor-hall-form__grid">
              <label className="vendor-field">
                <span className="vendor-field__label">Tên sảnh *</span>
                <input
                  className="vendor-field__input"
                  value={hallForm.name}
                  onChange={(e) => setHallForm((f) => ({ ...f, name: e.target.value }))}
                  disabled={savingHall || isPendingApproval}
                  required
                />
              </label>
              <label className="vendor-field">
                <span className="vendor-field__label">Sức chứa *</span>
                <input
                  className="vendor-field__input"
                  type="number"
                  min={1}
                  value={hallForm.capacity}
                  onChange={(e) => setHallForm((f) => ({ ...f, capacity: e.target.value }))}
                  disabled={savingHall || isPendingApproval}
                  required
                />
              </label>
              <label className="vendor-field">
                <span className="vendor-field__label">Giá cơ bản (đ) *</span>
                <input
                  className="vendor-field__input"
                  type="number"
                  min={0}
                  value={hallForm.basePrice}
                  onChange={(e) => setHallForm((f) => ({ ...f, basePrice: e.target.value }))}
                  disabled={savingHall || isPendingApproval}
                  required
                />
              </label>
              <label className="vendor-field">
                <span className="vendor-field__label">Diện tích (m²)</span>
                <input
                  className="vendor-field__input"
                  type="number"
                  min={0}
                  value={hallForm.area}
                  onChange={(e) => setHallForm((f) => ({ ...f, area: e.target.value }))}
                  disabled={savingHall || isPendingApproval}
                />
              </label>
              <label className="vendor-field">
                <span className="vendor-field__label">Trạng thái</span>
                <select
                  className="vendor-field__input"
                  value={hallForm.status}
                  onChange={(e) => setHallForm((f) => ({ ...f, status: e.target.value }))}
                  disabled={savingHall || isPendingApproval}
                >
                  {HALL_STATUS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="vendor-field" style={{ marginTop: '0.5rem' }}>
              <span className="vendor-field__label">Mô tả</span>
              <textarea
                className="vendor-field__input vendor-field__textarea"
                rows={2}
                value={hallForm.description}
                onChange={(e) => setHallForm((f) => ({ ...f, description: e.target.value }))}
                disabled={savingHall || isPendingApproval}
              />
            </label>
            <div className="vendor-field" style={{ marginTop: '0.5rem' }}>
              <span className="vendor-field__label">Ảnh sảnh (tùy chọn)</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="vendor-field__input"
                disabled={savingHall || isPendingApproval}
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length) setHallImageFiles((prev) => [...prev, ...files]);
                  e.target.value = '';
                }}
              />
              {hallImageFiles.length > 0 && (
                <ul className="vendor-pkg-file-list" style={{ marginTop: '0.5rem', paddingLeft: '1.1rem' }}>
                  {hallImageFiles.map((f, i) => (
                    <li key={`${f.name}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ flex: 1 }}>{f.name}</span>
                      <button
                        type="button"
                        className="vendor-btn-ghost vendor-btn-ghost--danger"
                        style={{ padding: '0.15rem 0.4rem', fontSize: '0.8rem' }}
                        onClick={() => setHallImageFiles((prev) => prev.filter((_, j) => j !== i))}
                        disabled={savingHall || isPendingApproval}
                      >
                        Bỏ
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="submit"
              className="vendor-btn-primary"
              style={{ marginTop: '0.75rem' }}
              disabled={savingHall || isPendingApproval}
            >
              {savingHall ? 'Đang tải ảnh / lưu…' : 'Thêm sảnh'}
            </button>
          </form>

          {halls.length === 0 ? (
            <div className="vendor-placeholder" style={{ marginTop: '1rem' }}>
              Chưa có sảnh. Dùng form phía trên để thêm.
            </div>
          ) : (
            <div className="vendor-table-wrap" style={{ marginTop: '1rem' }}>
              <table className="vendor-table">
                <thead>
                  <tr>
                    <th>Ảnh</th>
                    <th>Tên sảnh</th>
                    <th>Sức chứa</th>
                    <th>Giá cơ bản</th>
                    <th>Trạng thái</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {halls.map((h) => (
                    <tr key={h._id}>
                      <td style={{ width: 72 }}>
                        {h.images?.[0]?.url ? (
                          <img
                            src={h.images[0].url}
                            alt=""
                            style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)' }}
                          />
                        ) : (
                          <span className="vendor-muted" style={{ fontSize: '0.8rem' }}>
                            —
                          </span>
                        )}
                      </td>
                      <td>{h.name}</td>
                      <td>{h.capacity}</td>
                      <td>{h.basePrice?.toLocaleString('vi-VN')} đ</td>
                      <td>{h.status}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          className="vendor-btn-ghost"
                          style={{ marginRight: '0.35rem' }}
                          onClick={() => {
                            setHallError('');
                            setHallEditNewFiles([]);
                            setEditingHall({
                              ...h,
                              capacity: String(h.capacity ?? ''),
                              basePrice: String(h.basePrice ?? ''),
                              area: h.area != null ? String(h.area) : '',
                              images: Array.isArray(h.images) ? [...h.images] : [],
                            });
                          }}
                          disabled={isPendingApproval}
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          className="vendor-btn-ghost vendor-btn-ghost--danger"
                          onClick={() => handleDeleteHall(h._id, h.name)}
                          disabled={isPendingApproval}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tabFromUrl === 'menu' && (
        <section
          id="panel-menu"
          role="tabpanel"
          aria-labelledby="tab-menu"
          className="vendor-tab-panel"
        >
          {serviceError && (
            <div className="vendor-alert vendor-alert--error" role="alert">
              {serviceError}
            </div>
          )}

          <form className="vendor-hall-form" onSubmit={handleCreatePackage} style={{ marginBottom: '1.5rem' }}>
            <p className="vendor-section-sub">Thêm gói dịch vụ</p>
            <div className="vendor-hall-form__grid">
              <label className="vendor-field">
                <span className="vendor-field__label">Tên gói *</span>
                <input
                  className="vendor-field__input"
                  value={pkgForm.name}
                  onChange={(e) => setPkgForm((f) => ({ ...f, name: e.target.value }))}
                  disabled={savingPkg || isPendingApproval}
                  required
                />
              </label>
              <label className="vendor-field">
                <span className="vendor-field__label">Loại *</span>
                <select
                  className="vendor-field__input"
                  value={pkgForm.type}
                  onChange={(e) => setPkgForm((f) => ({ ...f, type: e.target.value }))}
                  disabled={savingPkg || isPendingApproval}
                >
                  <option value="FOOD">Thực đơn / Đồ ăn</option>
                  <option value="DECORATION">Trang trí</option>
                </select>
              </label>
              <label className="vendor-field">
                <span className="vendor-field__label">Giá (đ) *</span>
                <input
                  className="vendor-field__input"
                  type="number"
                  min={0}
                  value={pkgForm.price}
                  onChange={(e) => setPkgForm((f) => ({ ...f, price: e.target.value }))}
                  disabled={savingPkg || isPendingApproval}
                  required
                />
              </label>
            </div>
            <label className="vendor-field" style={{ marginTop: '0.5rem' }}>
              <span className="vendor-field__label">Món / hạng mục (mỗi dòng một mục)</span>
              <textarea
                className="vendor-field__input vendor-field__textarea"
                rows={3}
                value={pkgForm.itemsText}
                onChange={(e) => setPkgForm((f) => ({ ...f, itemsText: e.target.value }))}
                disabled={savingPkg || isPendingApproval}
                placeholder="Ví dụ: Khai vị&#10;Soup&#10;Món chính"
              />
            </label>
            <label className="vendor-field" style={{ marginTop: '0.5rem' }}>
              <span className="vendor-field__label">Mô tả</span>
              <textarea
                className="vendor-field__input vendor-field__textarea"
                rows={2}
                value={pkgForm.description}
                onChange={(e) => setPkgForm((f) => ({ ...f, description: e.target.value }))}
                disabled={savingPkg || isPendingApproval}
              />
            </label>
            <div className="vendor-field" style={{ marginTop: '0.5rem' }}>
              <span className="vendor-field__label">Ảnh gói (tùy chọn)</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="vendor-field__input"
                disabled={savingPkg || isPendingApproval}
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length) setPkgImageFiles((prev) => [...prev, ...files]);
                  e.target.value = '';
                }}
              />
              {pkgImageFiles.length > 0 && (
                <ul className="vendor-pkg-file-list" style={{ marginTop: '0.5rem', paddingLeft: '1.1rem' }}>
                  {pkgImageFiles.map((f, i) => (
                    <li key={`${f.name}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ flex: 1 }}>{f.name}</span>
                      <button
                        type="button"
                        className="vendor-btn-ghost vendor-btn-ghost--danger"
                        style={{ padding: '0.15rem 0.4rem', fontSize: '0.8rem' }}
                        onClick={() => setPkgImageFiles((prev) => prev.filter((_, j) => j !== i))}
                        disabled={savingPkg || isPendingApproval}
                      >
                        Bỏ
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="submit"
              className="vendor-btn-primary"
              style={{ marginTop: '0.75rem' }}
              disabled={savingPkg || isPendingApproval}
            >
              {savingPkg ? 'Đang tải ảnh / lưu…' : 'Thêm gói'}
            </button>
          </form>

          <div className="vendor-pkg-lists">
            <h3 className="vendor-section-sub">Thực đơn / Đồ ăn</h3>
            {food.length === 0 ? (
              <p className="vendor-muted" style={{ marginBottom: '1.25rem' }}>
                Chưa có gói menu.
              </p>
            ) : (
              <div className="vendor-table-wrap vendor-table-wrap--pkg" style={{ marginBottom: '1.25rem' }}>
                <table className="vendor-table vendor-table--pkg">
                  <colgroup>
                    <col className="vendor-table__col-name" />
                    <col className="vendor-table__col-price" />
                    <col className="vendor-table__col-actions" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th scope="col">Tên gói</th>
                      <th scope="col" className="vendor-table__cell-num">
                        Giá
                      </th>
                      <th scope="col" className="vendor-table__cell-actions">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {food.map((s) => (
                      <tr key={s._id}>
                        <td className="vendor-table__cell-name">{s.name}</td>
                        <td className="vendor-table__cell-num">{s.price?.toLocaleString('vi-VN')} đ</td>
                        <td className="vendor-table__cell-actions">
                          <div className="vendor-table__action-btns">
                            <button
                              type="button"
                              className="vendor-btn-ghost"
                              onClick={() => openEditService(s)}
                              disabled={isPendingApproval}
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              className="vendor-btn-ghost vendor-btn-ghost--danger"
                              onClick={() => handleDeletePackage(s)}
                              disabled={isPendingApproval}
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <h3 className="vendor-section-sub">Trang trí</h3>
            {decor.length === 0 ? (
              <p className="vendor-muted">Chưa có gói trang trí.</p>
            ) : (
              <div className="vendor-table-wrap vendor-table-wrap--pkg">
                <table className="vendor-table vendor-table--pkg">
                  <colgroup>
                    <col className="vendor-table__col-name" />
                    <col className="vendor-table__col-price" />
                    <col className="vendor-table__col-actions" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th scope="col">Tên gói</th>
                      <th scope="col" className="vendor-table__cell-num">
                        Giá
                      </th>
                      <th scope="col" className="vendor-table__cell-actions">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {decor.map((s) => (
                      <tr key={s._id}>
                        <td className="vendor-table__cell-name">{s.name}</td>
                        <td className="vendor-table__cell-num">{s.price?.toLocaleString('vi-VN')} đ</td>
                        <td className="vendor-table__cell-actions">
                          <div className="vendor-table__action-btns">
                            <button
                              type="button"
                              className="vendor-btn-ghost"
                              onClick={() => openEditService(s)}
                              disabled={isPendingApproval}
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              className="vendor-btn-ghost vendor-btn-ghost--danger"
                              onClick={() => handleDeletePackage(s)}
                              disabled={isPendingApproval}
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {editingHall && (
        <div
          className="vendor-modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setEditingHall(null);
              setHallEditNewFiles([]);
            }
          }}
        >
          <div className="vendor-modal" role="dialog" aria-modal="true" aria-labelledby="hall-edit-title">
            <h3 id="hall-edit-title" className="vendor-modal__title">
              Sửa sảnh
            </h3>
            <form onSubmit={handleUpdateHall}>
              <label className="vendor-field">
                <span className="vendor-field__label">Tên *</span>
                <input
                  className="vendor-field__input"
                  value={editingHall.name}
                  onChange={(e) => setEditingHall((h) => ({ ...h, name: e.target.value }))}
                  disabled={savingHallEdit}
                  required
                />
              </label>
              <div className="vendor-hall-form__grid" style={{ marginTop: '0.5rem' }}>
                <label className="vendor-field">
                  <span className="vendor-field__label">Sức chứa *</span>
                  <input
                    className="vendor-field__input"
                    type="number"
                    min={1}
                    value={editingHall.capacity}
                    onChange={(e) => setEditingHall((h) => ({ ...h, capacity: e.target.value }))}
                    disabled={savingHallEdit}
                    required
                  />
                </label>
                <label className="vendor-field">
                  <span className="vendor-field__label">Giá cơ bản *</span>
                  <input
                    className="vendor-field__input"
                    type="number"
                    min={0}
                    value={editingHall.basePrice}
                    onChange={(e) => setEditingHall((h) => ({ ...h, basePrice: e.target.value }))}
                    disabled={savingHallEdit}
                    required
                  />
                </label>
                <label className="vendor-field">
                  <span className="vendor-field__label">Diện tích (m²)</span>
                  <input
                    className="vendor-field__input"
                    type="number"
                    min={0}
                    value={editingHall.area}
                    onChange={(e) => setEditingHall((h) => ({ ...h, area: e.target.value }))}
                    disabled={savingHallEdit}
                  />
                </label>
                <label className="vendor-field">
                  <span className="vendor-field__label">Trạng thái</span>
                  <select
                    className="vendor-field__input"
                    value={editingHall.status}
                    onChange={(e) => setEditingHall((h) => ({ ...h, status: e.target.value }))}
                    disabled={savingHallEdit}
                  >
                    {HALL_STATUS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="vendor-field" style={{ marginTop: '0.5rem' }}>
                <span className="vendor-field__label">Mô tả</span>
                <textarea
                  className="vendor-field__input vendor-field__textarea"
                  rows={2}
                  value={editingHall.description || ''}
                  onChange={(e) => setEditingHall((h) => ({ ...h, description: e.target.value }))}
                  disabled={savingHallEdit}
                />
              </label>
              <div className="vendor-field" style={{ marginTop: '0.5rem' }}>
                <span className="vendor-field__label">Ảnh sảnh</span>
                {(editingHall.images || []).length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    {(editingHall.images || []).map((img, idx) => (
                      <div
                        key={img.public_id || img.url || idx}
                        style={{
                          position: 'relative',
                          width: 72,
                          height: 72,
                          borderRadius: 6,
                          overflow: 'hidden',
                          border: '1px solid rgba(255,255,255,0.12)',
                        }}
                      >
                        <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          aria-label="Xóa ảnh"
                          className="vendor-btn-ghost vendor-btn-ghost--danger"
                          style={{ position: 'absolute', top: 2, right: 2, padding: '0 0.25rem', fontSize: '0.7rem', lineHeight: 1.2 }}
                          onClick={() =>
                            setEditingHall((h) => ({
                              ...h,
                              images: (h.images || []).filter((_, i) => i !== idx),
                            }))
                          }
                          disabled={savingHallEdit}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="vendor-field__input"
                  disabled={savingHallEdit}
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length) setHallEditNewFiles((prev) => [...prev, ...files]);
                    e.target.value = '';
                  }}
                />
                {hallEditNewFiles.length > 0 && (
                  <ul style={{ marginTop: '0.35rem', paddingLeft: '1.1rem', fontSize: '0.85rem' }}>
                    {hallEditNewFiles.map((f, i) => (
                      <li key={`${f.name}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ flex: 1 }}>{f.name}</span>
                        <button
                          type="button"
                          className="vendor-btn-ghost vendor-btn-ghost--danger"
                          style={{ padding: '0.1rem 0.35rem', fontSize: '0.75rem' }}
                          onClick={() => setHallEditNewFiles((prev) => prev.filter((_, j) => j !== i))}
                          disabled={savingHallEdit}
                        >
                          Bỏ
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="vendor-modal__actions" style={{ marginTop: '1rem' }}>
                <button type="submit" className="vendor-btn-primary" disabled={savingHallEdit}>
                  {savingHallEdit ? 'Đang tải ảnh / lưu…' : 'Cập nhật'}
                </button>
                <button
                  type="button"
                  className="vendor-btn-ghost"
                  disabled={savingHallEdit}
                  onClick={() => {
                    setEditingHall(null);
                    setHallEditNewFiles([]);
                  }}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingSvc && (
        <div
          className="vendor-modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setEditingSvc(null);
              setEditSvcNewFiles([]);
            }
          }}
        >
          <div className="vendor-modal" role="dialog" aria-modal="true" aria-labelledby="svc-edit-title">
            <h3 id="svc-edit-title" className="vendor-modal__title">
              Sửa gói dịch vụ
            </h3>
            <form onSubmit={handleUpdatePackage}>
              <label className="vendor-field">
                <span className="vendor-field__label">Tên *</span>
                <input
                  className="vendor-field__input"
                  value={editingSvc.name}
                  onChange={(e) => setEditingSvc((s) => ({ ...s, name: e.target.value }))}
                  disabled={savingSvcEdit}
                  required
                />
              </label>
              <div className="vendor-hall-form__grid" style={{ marginTop: '0.5rem' }}>
                <label className="vendor-field">
                  <span className="vendor-field__label">Loại</span>
                  <select
                    className="vendor-field__input"
                    value={editingSvc.type}
                    onChange={(e) => setEditingSvc((s) => ({ ...s, type: e.target.value }))}
                    disabled={savingSvcEdit}
                  >
                    <option value="FOOD">Thực đơn / Đồ ăn</option>
                    <option value="DECORATION">Trang trí</option>
                  </select>
                </label>
                <label className="vendor-field">
                  <span className="vendor-field__label">Giá (đ) *</span>
                  <input
                    className="vendor-field__input"
                    type="number"
                    min={0}
                    value={editingSvc.price}
                    onChange={(e) => setEditingSvc((s) => ({ ...s, price: e.target.value }))}
                    disabled={savingSvcEdit}
                    required
                  />
                </label>
              </div>
              <label className="vendor-field" style={{ marginTop: '0.5rem' }}>
                <span className="vendor-field__label">Món / hạng mục (mỗi dòng)</span>
                <textarea
                  className="vendor-field__input vendor-field__textarea"
                  rows={4}
                  value={editingSvc.itemsText}
                  onChange={(e) => setEditingSvc((s) => ({ ...s, itemsText: e.target.value }))}
                  disabled={savingSvcEdit}
                />
              </label>
              <label className="vendor-field" style={{ marginTop: '0.5rem' }}>
                <span className="vendor-field__label">Mô tả</span>
                <textarea
                  className="vendor-field__input vendor-field__textarea"
                  rows={2}
                  value={editingSvc.description || ''}
                  onChange={(e) => setEditingSvc((s) => ({ ...s, description: e.target.value }))}
                  disabled={savingSvcEdit}
                />
              </label>
              <div className="vendor-field" style={{ marginTop: '0.5rem' }}>
                <span className="vendor-field__label">Ảnh</span>
                {(editingSvc.images || []).length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    {(editingSvc.images || []).map((img, idx) => (
                      <div
                        key={img.public_id || img.url || idx}
                        style={{ position: 'relative', width: 72, height: 72, borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)' }}
                      >
                        <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          aria-label="Xóa ảnh"
                          className="vendor-btn-ghost vendor-btn-ghost--danger"
                          style={{ position: 'absolute', top: 2, right: 2, padding: '0 0.25rem', fontSize: '0.7rem', lineHeight: 1.2 }}
                          onClick={() =>
                            setEditingSvc((s) => ({
                              ...s,
                              images: (s.images || []).filter((_, i) => i !== idx),
                            }))
                          }
                          disabled={savingSvcEdit}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="vendor-field__input"
                  disabled={savingSvcEdit}
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length) setEditSvcNewFiles((prev) => [...prev, ...files]);
                    e.target.value = '';
                  }}
                />
                {editSvcNewFiles.length > 0 && (
                  <ul style={{ marginTop: '0.35rem', paddingLeft: '1.1rem', fontSize: '0.9rem' }}>
                    {editSvcNewFiles.map((f, i) => (
                      <li key={`${f.name}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ flex: 1 }}>{f.name} (mới)</span>
                        <button
                          type="button"
                          className="vendor-btn-ghost vendor-btn-ghost--danger"
                          style={{ padding: '0.1rem 0.35rem', fontSize: '0.75rem' }}
                          onClick={() => setEditSvcNewFiles((prev) => prev.filter((_, j) => j !== i))}
                          disabled={savingSvcEdit}
                        >
                          Bỏ
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="vendor-modal__actions" style={{ marginTop: '1rem' }}>
                <button type="submit" className="vendor-btn-primary" disabled={savingSvcEdit}>
                  {savingSvcEdit ? 'Đang tải ảnh / lưu…' : 'Cập nhật'}
                </button>
                <button
                  type="button"
                  className="vendor-btn-ghost"
                  disabled={savingSvcEdit}
                  onClick={() => {
                    setEditingSvc(null);
                    setEditSvcNewFiles([]);
                  }}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast?.message && (
        <aside
          className={`vendor-toast${toast.type === 'success' ? ' vendor-toast--success' : ' vendor-toast--error'}`}
          role="alert"
          aria-live="assertive"
        >
          <p className="vendor-toast__text">{toast.message}</p>
          <button
            type="button"
            className="vendor-toast__close"
            onClick={() => setToast(null)}
            aria-label="Đóng thông báo"
          >
            ×
          </button>
        </aside>
      )}

      {submitModal && (
        <aside className="vendor-side-modal" role="dialog" aria-modal="true" aria-label="Thông báo gửi duyệt">
          <div className="vendor-side-modal__head">
            <h3 className="vendor-side-modal__title">{submitModal.title}</h3>
            <button
              type="button"
              className="vendor-side-modal__close"
              onClick={() => setSubmitModal(null)}
              aria-label="Đóng thông báo"
            >
              ×
            </button>
          </div>
          <div className="vendor-side-modal__body">
            {submitModal.lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <div className="vendor-side-modal__actions">
            <button type="button" className="vendor-btn-primary" onClick={() => setSubmitModal(null)}>
              Đã hiểu
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}

export default VendorVenueDetail;
