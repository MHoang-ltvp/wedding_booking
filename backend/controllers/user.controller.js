/**
 * User Controller — Profile + Admin quản lý user
 */

const mongoose = require('mongoose');
const User = require('../models/User');

// GET /api/users/me
const getMe = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập.' });
    }
    const user = await User.findById(req.user._id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' });
    }
    return res.json({ success: true, user });
  } catch (err) {
    console.error('user.getMe:', err);
    return res.status(500).json({ success: false, message: 'Lỗi tải profile.' });
  }
};

// PUT /api/users/me
const updateMe = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập.' });
    }
    const { fullName, phone } = req.body || {};
    const updates = {};
    if (fullName !== undefined) {
      const v = String(fullName).trim();
      if (!v) {
        return res.status(400).json({ success: false, message: 'Họ tên không được rỗng.' });
      }
      updates.fullName = v;
    }
    if (phone !== undefined) {
      const v = String(phone).trim();
      if (!v) {
        return res.status(400).json({ success: false, message: 'Số điện thoại không được rỗng.' });
      }
      updates.phone = v;
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'Không có dữ liệu cập nhật.' });
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true })
      .select('-password')
      .lean();
    return res.json({ success: true, message: 'Đã cập nhật profile.', user });
  } catch (err) {
    console.error('user.updateMe:', err);
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật profile.' });
  }
};

// GET /api/admin/users
const getAdminUsers = async (req, res) => {
  try {
    const { role, status, page = 1, limit = 20, search } = req.query || {};
    const filter = {};
    if (role && ['ADMIN', 'VENDOR', 'CUSTOMER'].includes(String(role).toUpperCase())) {
      filter.role = String(role).toUpperCase();
    }
    if (status && ['ACTIVE', 'LOCKED'].includes(String(status).toUpperCase())) {
      filter.status = String(status).toUpperCase();
    }
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { email: { $regex: q, $options: 'i' } },
        { fullName: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
      ];
    }

    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
    ]);

    return res.json({
      success: true,
      page: safePage,
      limit: safeLimit,
      total,
      users,
    });
  } catch (err) {
    console.error('user.getAdminUsers:', err);
    return res.status(500).json({ success: false, message: 'Lỗi danh sách người dùng.' });
  }
};

// PUT /api/admin/users/:id/status
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ.' });
    }
    if (!['ACTIVE', 'LOCKED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'status phải là ACTIVE hoặc LOCKED.',
      });
    }
    if (String(req.user._id) === String(id) && status === 'LOCKED') {
      return res.status(400).json({
        success: false,
        message: 'Không thể khóa chính tài khoản đang đăng nhập.',
      });
    }

    const user = await User.findByIdAndUpdate(id, { status }, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }

    return res.json({
      success: true,
      message: 'Đã cập nhật trạng thái tài khoản.',
      user,
    });
  } catch (err) {
    console.error('user.updateUserStatus:', err);
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật trạng thái.' });
  }
};

module.exports = {
  getMe,
  updateMe,
  getAdminUsers,
  updateUserStatus,
};
