import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { paths } from '../../api/endpoints';
import { fetchVendorServices } from '../../services/vendor.service';
import { useVendorRestaurant } from '../../contexts/VendorRestaurantContext';
import { toast } from 'react-toastify';
import { Edit, Trash2, Plus, X } from 'lucide-react';
import MediaGalleryPanel from '../../shared/components/MediaGalleryPanel';
import { formatVndMoneyInput, parseVndMoneyToNumber } from '../../shared/moneyInput';

const initialForm = () => ({
  name: '',
  type: 'FOOD',
  price: '',
  description: '',
  items: '',
  images: [],
});

const mapServiceImagesForApi = (images) =>
  (images || []).map((img) =>
    typeof img === 'string'
      ? { url: img, public_id: '' }
      : { url: img.url, public_id: img.public_id || '' }
  );

const imageToUrl = (img) => (typeof img === 'string' ? img : img?.url || '');

const ServicesManagement = () => {
  const { selectedRestaurantId, selectedRestaurant, loading: vrLoading, restaurants } = useVendorRestaurant();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(() => initialForm());
  const [uploading, setUploading] = useState(false);
  const [restaurantExists, setRestaurantExists] = useState(true);

  useEffect(() => {
    if (!showModal) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [showModal]);

  useEffect(() => {
    if (vrLoading) return;
    if (!selectedRestaurantId) {
      setRestaurantExists(restaurants.length > 0);
      setServices([]);
      setLoading(false);
      return;
    }
    setRestaurantExists(true);
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const list = await fetchVendorServices(selectedRestaurantId);
        if (!cancelled) setServices(list);
      } catch (error) {
        if (!cancelled) toast.error(error.response?.data?.message || 'Không tải được dịch vụ.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedRestaurantId, vrLoading, restaurants.length]);

  const fetchServices = async () => {
    if (!selectedRestaurantId) return;
    try {
      setLoading(true);
      const list = await fetchVendorServices(selectedRestaurantId);
      setServices(list);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không tải được dịch vụ.');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData(initialForm());
    setEditingId(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(initialForm());
  };

  const handleEdit = (service) => {
    setFormData({
      name: service.name,
      type: service.type,
      price:
        service.price != null && service.price !== ''
          ? formatVndMoneyInput(String(service.price))
          : '',
      description: service.description || '',
      items: service.items ? service.items.join(', ') : '',
      images: Array.isArray(service.images) ? [...service.images] : [],
    });
    setEditingId(service._id);
    setShowModal(true);
  };

  const handleServiceImageUpload = async (e) => {
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
      setFormData((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...added],
      }));
      toast.success('Đã tải ảnh lên.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được ảnh.');
    } finally {
      setUploading(false);
    }
  };

  const removeServiceImage = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        'Xóa gói dịch vụ này? Nếu đang gắn với đặt chỗ tương lai, có thể không xóa được.'
      )
    ) {
      return;
    }
    try {
      await api.delete(paths.vendor.service(id));
      toast.success('Đã xóa dịch vụ.');
      fetchServices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không xóa được.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const priceNum = parseVndMoneyToNumber(formData.price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      toast.error('Giá không hợp lệ.');
      return;
    }
    try {
      const payload = {
        restaurantId: selectedRestaurantId,
        name: formData.name.trim(),
        type: formData.type,
        price: priceNum,
        items: formData.items
          .split(',')
          .map((i) => i.trim())
          .filter(Boolean),
        description: (formData.description || '').trim(),
        images: mapServiceImagesForApi(formData.images),
      };
      if (editingId) {
        await api.put(paths.vendor.service(editingId), payload);
        toast.success('Đã cập nhật dịch vụ.');
      } else {
        await api.post(paths.vendor.services, payload);
        toast.success('Đã tạo dịch vụ.');
      }
      closeModal();
      fetchServices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Thao tác thất bại.');
    }
  };

  const modal =
    showModal &&
    createPortal(
      <div
        role="presentation"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100%',
          minHeight: '100dvh',
          boxSizing: 'border-box',
          background: 'rgba(0,0,0,0.45)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding:
            'max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left))',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
        onClick={closeModal}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-modal-title"
          className="card"
          style={{
            width: '100%',
            maxWidth: '640px',
            margin: 'auto',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'min(calc(100dvh - 24px), calc(100vh - 24px), 880px)',
            overflow: 'hidden',
            boxSizing: 'border-box',
            flexShrink: 0,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="d-flex justify-between align-center gap-2"
            style={{
              padding: 'clamp(0.75rem, 2vw, 1rem)',
              borderBottom: '1px solid var(--border)',
              flexShrink: 0,
            }}
          >
            <h2 id="service-modal-title" style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
              {editingId ? 'Sửa dịch vụ / menu' : 'Thêm dịch vụ / menu'}
            </h2>
            <button type="button" className="btn btn-ghost" onClick={closeModal} aria-label="Đóng" style={{ padding: '0.25rem' }}>
              <X size={22} />
            </button>
          </div>
          <div
            style={{
              flex: '1 1 auto',
              minHeight: 0,
              overflowY: 'auto',
              padding: 'clamp(0.75rem, 2vw, 1.25rem)',
            }}
          >
            <form id="service-form" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label>Tên gói / menu</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Ví dụ: Menu cao cấp"
                  />
                </div>
                <div className="input-group">
                  <label>Giá (VNĐ)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    className="input-field"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: formatVndMoneyInput(e.target.value),
                      })
                    }
                    required
                    placeholder="Ví dụ: 220.000"
                  />
                </div>
              </div>
              <div className="input-group">
                <label>Loại</label>
                <select className="input-field" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                  <option value="FOOD">Món ăn / Thực đơn</option>
                  <option value="DECORATION">Trang trí</option>
                </select>
              </div>
              <div className="input-group">
                <label>Món / hạng mục (phân cách bằng dấu phẩy)</label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={formData.items}
                  onChange={(e) => setFormData({ ...formData, items: e.target.value })}
                  placeholder="Ví dụ: Tôm hùm, Bò Wagyu, Súp…"
                />
              </div>
              <div className="input-group">
                <label>Mô tả thêm</label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ghi chú, điều kiện áp dụng…"
                />
              </div>
              <MediaGalleryPanel
                title="Ảnh minh họa gói"
                images={formData.images || []}
                resolveUrl={imageToUrl}
                onRemove={removeServiceImage}
                uploading={uploading}
                onFileChange={handleServiceImageUpload}
                uploadCaption="Tải lên"
                uploadHint={uploading ? 'Đang tải…' : 'JPG, PNG — có thể chọn nhiều'}
              />
            </form>
          </div>
          <div
            className="d-flex justify-end gap-3 flex-wrap"
            style={{
              padding: 'clamp(0.75rem, 2vw, 1rem)',
              borderTop: '1px solid var(--border)',
              flexShrink: 0,
            }}
          >
            <button type="button" className="btn btn-outline" onClick={closeModal}>
              Hủy
            </button>
            <button type="submit" form="service-form" className="btn btn-primary">
              {editingId ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </div>
      </div>,
      document.body
    );

  if (!restaurantExists) {
    return (
      <div className="fade-in" style={{ padding: '2rem', textAlign: 'center' }}>
        <div
          style={{
            backgroundColor: '#fef3c7',
            color: '#92400e',
            padding: '1rem',
            borderRadius: '0.5rem',
            display: 'inline-block',
            maxWidth: '520px',
          }}
        >
          <strong>Chưa có nhà hàng.</strong> Thực đơn và gói trang trí gắn với từng nhà hàng — hãy tạo và chọn nhà hàng ở sidebar.
        </div>
        <div style={{ marginTop: '1rem' }}>
          <Link to="/vendor/restaurants" className="btn btn-primary">
            Đi tới danh sách nhà hàng
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {modal}
      <div className="page-header d-flex justify-between align-center flex-wrap gap-2">
        <div>
          <h1 className="page-title">Dịch vụ & menu</h1>
          {selectedRestaurant && (
            <p className="text-muted" style={{ marginTop: '0.35rem', fontSize: '0.9rem' }}>
              Nhà hàng: <strong>{selectedRestaurant.name}</strong> — đồ ăn và trang trí chỉ thuộc nhà hàng này.
            </p>
          )}
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={18} /> Thêm dịch vụ
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Đang tải…</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tên dịch vụ</th>
                  <th>Loại</th>
                  <th>Giá</th>
                  <th>Món / hạng mục</th>
                  <th>Ảnh</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {services.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center" style={{ padding: '2rem' }}>
                      Chưa có dịch vụ. Bấm «Thêm dịch vụ» để tạo.
                    </td>
                  </tr>
                ) : (
                  services.map((svc) => (
                    <tr key={svc._id}>
                      <td style={{ fontWeight: 600 }}>{svc.name}</td>
                      <td>
                        <span className={`status-badge ${svc.type === 'FOOD' ? 'active' : 'pending'}`}>
                          {svc.type === 'FOOD' ? 'Thực đơn' : svc.type === 'DECORATION' ? 'Trang trí' : svc.type}
                        </span>
                      </td>
                      <td style={{ color: 'var(--primary)', fontWeight: 500 }}>
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(svc.price)}
                        <span className="text-muted" style={{ fontWeight: 400, marginLeft: '4px' }}>
                          / {svc.unit === 'TABLE' ? 'bàn' : 'gói'}
                        </span>
                      </td>
                      <td
                        className="text-muted"
                        style={{
                          fontSize: '0.85rem',
                          maxWidth: '300px',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                        }}
                        title={svc.items?.join(', ') || ''}
                      >
                        {svc.items?.join(', ') || '—'}
                      </td>
                      <td className="text-muted" style={{ fontSize: '0.85rem' }}>
                        {svc.images?.length ? `${svc.images.length} ảnh` : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="d-flex gap-2 justify-end" style={{ justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ padding: '0.25rem' }}
                            onClick={() => handleEdit(svc)}
                            aria-label="Sửa"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ padding: '0.25rem', color: 'var(--error)' }}
                            onClick={() => handleDelete(svc._id)}
                            aria-label="Xóa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicesManagement;
