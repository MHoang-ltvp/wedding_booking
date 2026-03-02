const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'wedding-booking-secret-dev';

/**
 * Middleware kiểm tra tính hợp lệ của JWT Token.
 * Token gửi qua header: Authorization: Bearer <token>
 * Gắn thông tin user (id, username, role, status) vào req.user.
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Thiếu token hoặc định dạng không hợp lệ. Gửi: Authorization: Bearer <token>',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Người dùng không tồn tại.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ.',
      });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn.',
      });
    }
    next(err);
  }
};

module.exports = authMiddleware;
module.exports.JWT_SECRET = JWT_SECRET;
