/**
 * Middleware chặn truy cập nếu tài khoản User có status: "Inactive".
 * Phải dùng sau authMiddleware (req.user đã có).
 */
const statusMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Vui lòng đăng nhập (dùng authMiddleware trước statusMiddleware).',
    });
  }

  if (req.user.status === 'Inactive') {
    return res.status(403).json({
      success: false,
      message: 'Tài khoản đã bị vô hiệu hóa. Liên hệ quản trị viên để được hỗ trợ.',
    });
  }

  next();
};

module.exports = statusMiddleware;
