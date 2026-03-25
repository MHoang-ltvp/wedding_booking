import React, { useId } from 'react';
import { createPortal } from 'react-dom';
import { UploadCloud, Loader2 } from 'lucide-react';

/**
 * Cột gallery 2 cột + ô upload dashed — dùng chung form có ảnh.
 */
export default function MediaGalleryPanel({
  title = 'Thư viện ảnh',
  images = [],
  resolveUrl = (img) => (typeof img === 'string' ? img : img?.url || ''),
  onRemove,
  uploading = false,
  onFileChange,
  uploadCaption = 'UPLOAD',
  uploadHint,
}) {
  const fileInputId = useId();

  const onInputChange = (e) => {
    onFileChange?.(e);
    e.target.value = '';
  };

  const blockingOverlay =
    uploading &&
    createPortal(
      <div
        className="upload-blocking-overlay"
        aria-busy="true"
        aria-label="Đang tải ảnh, vui lòng chờ"
        onMouseDown={(e) => e.preventDefault()}
        onTouchStart={(e) => e.preventDefault()}
      >
        <div className="upload-blocking-overlay__panel" role="status" aria-live="polite">
          <Loader2 className="upload-blocking-overlay__spinner" size={26} strokeWidth={2.5} aria-hidden />
          <span>Đang tải ảnh lên…</span>
        </div>
      </div>,
      document.body
    );

  return (
    <div className="media-gallery">
      {blockingOverlay}
      <div className="media-gallery__head">
        <h3 className="media-gallery__title">{title}</h3>
      </div>
      <input
        id={fileInputId}
        type="file"
        multiple
        accept="image/*"
        className="visually-hidden"
        onChange={onInputChange}
        disabled={uploading}
      />
      <div className="media-gallery__grid">
        {images.map((img, idx) => (
          <div key={`${resolveUrl(img) || 'img'}-${idx}`} className="media-gallery__cell">
            <img src={resolveUrl(img)} alt="" />
            <button
              type="button"
              className="media-gallery__remove"
              onClick={() => onRemove?.(idx)}
              aria-label="Xóa ảnh"
            >
              ×
            </button>
          </div>
        ))}
        <label
          htmlFor={fileInputId}
          className={`media-gallery__upload${uploading ? ' media-gallery__upload--busy' : ''}`}
          aria-label={uploadCaption}
        >
          <UploadCloud size={28} strokeWidth={1.75} aria-hidden />
          <span className="media-gallery__upload-label">{uploadCaption}</span>
          {uploadHint ? <span className="media-gallery__upload-hint">{uploadHint}</span> : null}
        </label>
      </div>
    </div>
  );
}
