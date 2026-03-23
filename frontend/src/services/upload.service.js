import api from '../lib/api';

/**
 * POST /api/upload/images — field "images", tối đa theo backend.
 * Dùng chung cho ảnh nhà hàng, sảnh, **gói dịch vụ** (ServicePackage), v.v.
 * @param {File[]} files
 * @returns {Promise<{ success?: boolean, images?: { url: string, public_id: string }[], message?: string }>}
 */
export async function uploadImages(files) {
  if (!files?.length) {
    return { success: true, images: [] };
  }
  const fd = new FormData();
  for (const file of files) {
    fd.append('images', file);
  }
  const { data } = await api.post('/upload/images', fd, {
    timeout: 120000,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });
  return data;
}

/** Alias: upload ảnh cho gói dịch vụ (cùng API `/upload/images`). */
export const uploadServicePackageImages = uploadImages;
