const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * POST /api/auth/login
 * Body: { username, password }
 * Trả về: { success, token, user } hoặc { success: false, message }.
 * Dùng JWT_SECRET giống authMiddleware để token verify được ở các route bảo vệ.
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu username hoặc password.',
      });
    }

    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Sai tên đăng nhập hoặc mật khẩu.',
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: 'Sai tên đăng nhập hoặc mật khẩu.',
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userObj = user.toObject ? user.toObject() : user;
    delete userObj.password;

    return res.json({
      success: true,
      token,
      user: { _id: user._id, username: user.username, role: user.role, status: user.status },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi đăng nhập.',
    });
  }
});

module.exports = router;
