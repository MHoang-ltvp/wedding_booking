/**
 * Auth Routes - Thành viên 5 (Triệu Hoàng)
 * Đăng ký, đăng nhập - public, tạm thời không middleware.
 */

const express = require('express');
const authController = require('../controllers/auth.controller');

const router = express.Router();

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

module.exports = router;
