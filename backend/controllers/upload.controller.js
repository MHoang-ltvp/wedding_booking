/**
 * Upload Controller - Thành viên 6 (Minh Công)
 * Cloudinary: upload ảnh, xóa ảnh bằng public_id
 *
 * Viết logic vào các hàm dưới đây. Route gọi qua integration.routes.js (hoặc upload.routes nếu tách).
 * Tạm thời chưa gắn middleware.
 */

// POST /api/upload/image - Nhận file, đẩy lên Cloudinary, trả về url và public_id
const uploadImage = async (req, res) => {
  // TODO: Dùng multer hoặc form-data. Gọi Cloudinary API upload. Trả { url, public_id }
  res.json({ message: 'POST /api/upload/image - Viết logic tại đây (upload.controller.uploadImage)' });
};

// DELETE /api/upload/image - Xóa ảnh trên Cloudinary bằng public_id (body hoặc query)
const deleteImage = async (req, res) => {
  // TODO: Lấy public_id từ req.body hoặc req.query. Gọi Cloudinary destroy. Trả success
  res.json({ message: 'DELETE /api/upload/image - Viết logic tại đây (upload.controller.deleteImage)' });
};

module.exports = {
  uploadImage,
  deleteImage,
};
