import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { paths } from '../../api/endpoints';
import { fetchVendorHalls } from '../../services/vendor.service';
import { useVendorRestaurant } from '../../contexts/VendorRestaurantContext';
import { toast } from 'react-toastify';
import { Edit, Trash2, Plus, X } from 'lucide-react';
import MediaGalleryPanel from '../../shared/components/MediaGalleryPanel';
import { formatVndMoneyInput, parseVndMoneyToNumber } from '../../shared/moneyInput';

/** Đồng bộ với backend normalizeHallImages */
const mapHallImagesForApi = (images) =>
  (images || []).map((img) =>
    typeof img === 'string'
      ? { url: img, public_id: '' }
      : { url: img.url, public_id: img.public_id || '' }
  );

const HallsManagement = () => {
  const { selectedRestaurantId, selectedRestaurant, loading: vrLoading, restaurants } = useVendorRestaurant();
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    area: '',
    basePrice: '',
    description: '',
    images: [],
    status: 'AVAILABLE',
  });
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const data = new FormData();
    for (let i = 0; i < files.length; i++) {
      data.append('images', files[i]);
    }
    try {
      setUploading(true);
      if (editingId) {
        const res = await api.post(paths.vendor.hallImages(editingId), data);
        const hall = res.data.hall;
        if (hall?.images) {
          setFormData((prev) => ({ ...prev, images: hall.images }));
        }
        toast.success(res.data.message || 'Đã thêm ảnh cho sảnh.');
      } else {
        const res = await api.post(paths.upload.images, data);
        const added = res.data.images || [];
        setFormData((prev) => ({
          ...prev,
          images: [...(prev.images || []), ...added],
        }));
        toast.success('Đã tải ảnh lên.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được ảnh.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (indexToRemove) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== indexToRemove) }));
  };
  const [restaurantExists, setRestaurantExists] = useState(true);

  useEffect(() => {
    if (vrLoading) return;
    if (!selectedRestaurantId) {
      setRestaurantExists(restaurants.length > 0);
      setHalls([]);
      setLoading(false);
      return;
    }
    setRestaurantExists(true);
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const list = await fetchVendorHalls(selectedRestaurantId);
        if (!cancelled) setHalls(list);
      } catch (error) {
        if (!cancelled) toast.error(error.response?.data?.message || 'Không tải được danh sách sảnh.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedRestaurantId, vrLoading, restaurants.length]);

  const fetchHalls = async () => {
    if (!selectedRestaurantId) return;
    try {
      setLoading(true);
      const list = await fetchVendorHalls(selectedRestaurantId);
      setHalls(list);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không tải được danh sách sảnh.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      capacity: '',
      area: '',
      basePrice: '',
      description: '',
      images: [],
      status: 'AVAILABLE',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (hall) => {
    setFormData({
      name: hall.name,
      capacity: hall.capacity,
      area: hall.area || '',
      basePrice:
        hall.basePrice != null && hall.basePrice !== ''
          ? formatVndMoneyInput(String(hall.basePrice))
          : '',
      description: hall.description || '',
      images: hall.images || [],
      status: hall.status || 'AVAILABLE',
    });
    setEditingId(hall._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this hall? If it is linked to future bookings, deletion will fail.')) return;
    try {
      await api.delete(paths.vendor.hall(id));
      toast.success('Đã xóa sảnh.');
      fetchHalls();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không xóa được sảnh.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const basePriceNum = parseVndMoneyToNumber(formData.basePrice);
    if (!Number.isFinite(basePriceNum) || basePriceNum < 0) {
      toast.error('Giá cơ bản không hợp lệ.');
      return;
    }
    try {
      const payload = {
        name: formData.name,
        restaurantId: selectedRestaurantId,
        capacity: Number(formData.capacity),
        basePrice: basePriceNum,
        area: formData.area ? Number(formData.area) : null,
        description: formData.description,
        status: formData.status,
        images: mapHallImagesForApi(formData.images),
      };
      if (editingId) {
        await api.put(paths.vendor.hall(editingId), payload);
        toast.success('Đã cập nhật sảnh.');
      } else {
        await api.post(paths.vendor.halls, payload);
        toast.success('Đã tạo sảnh.');
      }
      resetForm();
      fetchHalls();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Thao tác thất bại.');
    }
  };

  if (!restaurantExists) {
    return (
      <div className="fade-in" style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '1rem', borderRadius: '0.5rem', display: 'inline-block', maxWidth: '480px' }}>
          <strong>Chưa có nhà hàng.</strong> Hãy thêm nhà hàng trước, sau đó chọn nhà hàng ở sidebar để quản lý sảnh.
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
      <div className="page-header d-flex justify-between align-center flex-wrap gap-2">
        <div>
          <h1 className="page-title">Quản lý sảnh</h1>
          {selectedRestaurant && (
            <p className="text-muted" style={{ marginTop: '0.35rem', fontSize: '0.9rem' }}>
              Nhà hàng: <strong>{selectedRestaurant.name}</strong> — mỗi sảnh thuộc đúng nhà hàng này.
            </p>
          )}
        </div>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={18} /> Thêm sảnh mới
          </button>
        )}
      </div>

      {showForm && (
        <div className="card fade-in" style={{ marginBottom: 'var(--space-5)', border: '1px solid var(--primary)', backgroundColor: 'var(--background)' }}>
          <div className="d-flex justify-between align-center" style={{ marginBottom: 'var(--space-4)' }}>
            <h2 style={{ fontSize: '1.2rem' }}>{editingId ? 'Sửa sảnh' : 'Thêm sảnh mới'}</h2>
            <button className="btn btn-ghost" onClick={resetForm} style={{ padding: '0.25rem' }}>
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="media-form-layout">
              <div className="media-form-general">
                <div className="media-form-general__head">
                  <h3 className="media-form-general__title">Thông tin chung</h3>
                  <div className="media-form-status">
                    <span>Hoạt động</span>
                    <button
                      type="button"
                      className="media-form-toggle"
                      role="switch"
                      aria-checked={formData.status === 'AVAILABLE'}
                      onClick={() =>
                        setFormData((f) => ({
                          ...f,
                          status: f.status === 'AVAILABLE' ? 'MAINTENANCE' : 'AVAILABLE',
                        }))
                      }
                    >
                      <span className="media-form-toggle__knob" aria-hidden />
                    </button>
                  </div>
                </div>

                <div className="media-form-field">
                  <label className="media-form-label">Tên sảnh</label>
                  <input
                    type="text"
                    className="media-form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Ví dụ: Sảnh Hoàng Gia"
                  />
                </div>

                <div className="media-form-row-2">
                  <div className="media-form-field media-form-field--grow">
                    <label className="media-form-label">Sức chứa</label>
                    <div className="media-form-affix">
                      <input
                        type="number"
                        className="media-form-input"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                        required
                        min="1"
                        placeholder="550"
                      />
                      <span className="media-form-affix__symbol media-form-affix__symbol--suffix">khách</span>
                    </div>
                  </div>
                  <div className="media-form-field media-form-field--grow">
                    <label className="media-form-label">Diện tích (m²)</label>
                    <div className="media-form-affix">
                      <input
                        type="number"
                        className="media-form-input"
                        value={formData.area}
                        onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                        min="1"
                        placeholder="820"
                      />
                      <span className="media-form-affix__symbol media-form-affix__symbol--suffix">m²</span>
                    </div>
                  </div>
                </div>

                <div className="media-form-field">
                  <label className="media-form-label">Giá cơ bản (VNĐ)</label>
                  <div className="media-form-affix">
                    <span className="media-form-affix__symbol">₫</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      className="media-form-input"
                      value={formData.basePrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          basePrice: formatVndMoneyInput(e.target.value),
                        })
                      }
                      required
                      placeholder="Ví dụ: 4.500.000"
                    />
                  </div>
                </div>

                <div className="media-form-field">
                  <label className="media-form-label">Mô tả</label>
                  <textarea
                    className="media-form-textarea"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Mô tả không gian, ánh sáng, sức chứa bàn tiệc…"
                  />
                </div>
              </div>

              <MediaGalleryPanel
                title="Thư viện ảnh"
                images={formData.images || []}
                resolveUrl={(img) => (typeof img === 'string' ? img : img?.url)}
                onRemove={removeImage}
                uploading={uploading}
                onFileChange={handleImageUpload}
                uploadCaption="Tải lên"
                uploadHint={uploading ? 'Đang tải…' : 'JPG, PNG — có thể chọn nhiều'}
              />
            </div>

            <div className="d-flex justify-end gap-3" style={{ marginTop: 'var(--space-4)' }}>
              <button type="button" className="btn btn-outline" onClick={resetForm}>
                Hủy
              </button>
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Cập nhật sảnh' : 'Tạo sảnh'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Đang tải…</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tên sảnh</th>
                  <th>Sức chứa</th>
                  <th>Diện tích</th>
                  <th>Giá cơ bản</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {halls.length === 0 ? (
                  <tr><td colSpan="6" className="text-center" style={{ padding: '2rem' }}>Chưa có sảnh. Bấm «Thêm sảnh mới» để bắt đầu.</td></tr>
                ) : (
                  halls.map(hall => (
                    <tr key={hall._id}>
                      <td style={{ fontWeight: 600 }}>{hall.name}</td>
                      <td>{hall.capacity} khách</td>
                      <td className="text-muted">{hall.area ? `${hall.area} m²` : '-'}</td>
                      <td style={{ color: 'var(--primary)' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(hall.basePrice)}</td>
                      <td>
                        <span className={`status-badge ${hall.status === 'AVAILABLE' ? 'active' : hall.status === 'MAINTENANCE' ? 'pending' : 'locked'}`}>
                          {hall.status === 'AVAILABLE' ? 'Khả dụng' : hall.status === 'MAINTENANCE' ? 'Bảo trì' : hall.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="d-flex gap-2 justify-end" style={{ justifyContent: 'flex-end' }}>
                          <button className="btn btn-ghost" style={{ padding: '0.25rem' }} onClick={() => handleEdit(hall)}>
                            <Edit size={16} />
                          </button>
                          <button className="btn btn-ghost" style={{ padding: '0.25rem', color: 'var(--error)' }} onClick={() => handleDelete(hall._id)}>
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

export default HallsManagement;
