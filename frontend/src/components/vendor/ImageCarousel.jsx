import { useState } from 'react';

const PLACEHOLDER_SVG = (label) =>
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250"><rect fill="#1e293b" width="400" height="250"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#64748b" font-family="sans-serif" font-size="14">${label}</text></svg>`
  );

/**
 * @param {{ images?: { url?: string }[], alt?: string, className?: string, emptyLabel?: string }} props
 */
function ImageCarousel({ images = [], alt = '', className = '', emptyLabel = 'Chưa có ảnh' }) {
  const urls = (images || []).map((i) => i?.url).filter(Boolean);
  const [idx, setIdx] = useState(0);

  if (!urls.length) {
    return (
      <div className={`vendor-carousel vendor-carousel--empty ${className}`}>
        <img
          className="vendor-carousel__img"
          src={PLACEHOLDER_SVG(emptyLabel.slice(0, 20))}
          alt=""
        />
      </div>
    );
  }

  const n = urls.length;
  const safeIdx = ((idx % n) + n) % n;
  const prev = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setIdx((i) => (i - 1 + n) % n);
  };
  const next = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setIdx((i) => (i + 1) % n);
  };

  return (
    <div className={`vendor-carousel ${className}`}>
      <img src={urls[safeIdx]} alt={alt} className="vendor-carousel__img" />
      {n > 1 && (
        <>
          <button
            type="button"
            className="vendor-carousel__arrow vendor-carousel__arrow--prev"
            onClick={prev}
            aria-label="Ảnh trước"
          >
            ‹
          </button>
          <button
            type="button"
            className="vendor-carousel__arrow vendor-carousel__arrow--next"
            onClick={next}
            aria-label="Ảnh sau"
          >
            ›
          </button>
          <span className="vendor-carousel__counter" aria-hidden>
            {safeIdx + 1} / {n}
          </span>
        </>
      )}
    </div>
  );
}

export default ImageCarousel;
