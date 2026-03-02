const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Một URI duy nhất: bật cái đang dùng (local hoặc Atlas), ẩn/comment cái còn lại trong .env
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wedding_booking';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {});
    console.log('Đã kết nối MongoDB thành công');
  } catch (err) {
    console.error('Kết nối MongoDB thất bại:', err.message);
    process.exit(1);
  }
};

module.exports = {
  connectDB,
};
