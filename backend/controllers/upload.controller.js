const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;

/** Số file tối đa mỗi request (POST /api/upload/images) */
const MAX_IMAGES_PER_REQUEST = 15;
// cấu hình cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// cấu hình multer lưu file tạm
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const unique =
      Date.now() + "-" + Math.random().toString(36).slice(2, 10);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

async function safeUnlink(filePath) {
  try {
    await fs.unlink(filePath);
  } catch {
    // ignore
  }
}

// POST /api/upload/image - Một file, field name: "image"
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Thiếu file (multipart field: image).",
      });
    }
    const result = await cloudinary.uploader.upload(req.file.path);
    await safeUnlink(req.file.path);

    return res.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    if (req.file?.path) await safeUnlink(req.file.path);
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi upload.",
    });
  }
};

/**
 * Upload các file tạm (multer disk) lên Cloudinary, xóa file sau khi xong.
 * Dùng chung cho POST /api/upload/images và POST /api/vendor/halls/:id/images
 * @param {Express.Multer.File[]} files
 * @returns {Promise<{ url: string, public_id: string }[]>}
 */
async function uploadDiskFilesToCloudinary(files) {
  const uploaded = [];
  for (const file of files) {
    const result = await cloudinary.uploader.upload(file.path);
    uploaded.push({
      url: result.secure_url,
      public_id: result.public_id,
    });
    await safeUnlink(file.path);
  }
  return uploaded;
}

// POST /api/upload/images - Nhiều file, field name: "images"
const uploadImages = async (req, res) => {
  try {
    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({
        success: false,
        message: `Thiếu file (multipart field: images, tối đa ${MAX_IMAGES_PER_REQUEST} ảnh).`,
      });
    }

    const uploaded = await uploadDiskFilesToCloudinary(files);

    return res.json({
      success: true,
      count: uploaded.length,
      images: uploaded,
    });
  } catch (error) {
    if (req.files?.length) {
      for (const f of req.files) {
        await safeUnlink(f.path);
      }
    }
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi upload nhiều ảnh.",
    });
  }
};

// DELETE /api/upload/image
const deleteImage = async (req, res) => {
  try {
    const { public_id } = req.body;

    const result = await cloudinary.uploader.destroy(public_id);

    res.json({
      message: "Image deleted successfully",
      result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadImage,
  uploadImages,
  deleteImage,
  upload,
  uploadDiskFilesToCloudinary,
  safeUnlink,
  MAX_IMAGES_PER_REQUEST,
};
