const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const path = require("path");
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
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// POST /api/upload/image - Nhận file, đẩy lên Cloudinary, trả về url và public_id
const uploadImage = async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path);

    res.json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
  deleteImage,
  upload,
};
