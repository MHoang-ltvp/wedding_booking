/**
 * Middleware phân quyền theo role.
 * Phải dùng sau authMiddleware (req.user đã có).
 * @param {string[]} allowedRoles - Các role được phép: 'Admin' | 'Vendor' | 'Customer'
 */
const roleMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập (dùng authMiddleware trước roleMiddleware).',
      });
    }

    const userRole = req.user.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập tài nguyên này.',
        requiredRoles: allowedRoles,
        yourRole: userRole,
      });
    }

    next();
  };
};

module.exports = roleMiddleware;
