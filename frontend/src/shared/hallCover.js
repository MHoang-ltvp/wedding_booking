const PLACEHOLDER =
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80';

/** @returns {string|null} */
export function getHallCoverSrc(hall) {
  if (!hall) return null;
  if (hall.coverImage) return hall.coverImage;
  const imgs = Array.isArray(hall.images) ? hall.images : [];
  const first = imgs[0];
  return typeof first === 'string' ? first : first?.url || null;
}

export function getHallCoverSrcOrPlaceholder(hall) {
  return getHallCoverSrc(hall) || PLACEHOLDER;
}

/** @returns {string[]} */
export function getHallImageUrls(hall) {
  if (!hall) return [];
  const imgs = Array.isArray(hall.images) ? hall.images : [];
  return imgs.map((img) => (typeof img === 'string' ? img : img?.url)).filter(Boolean);
}
