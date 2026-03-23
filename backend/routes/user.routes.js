/**
 * User Routes - Thành viên 1 (Trg Anh)
 * Tạm thời chưa gắn middleware (authMiddleware, roleMiddleware, statusMiddleware).
 * Khi cần bảo vệ: uncomment và gắn vào từng route.
 */

const express = require('express');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Router cho /api/users (profile: me)
const userRouter = express.Router();
userRouter.get('/me', authMiddleware, userController.getMe);
userRouter.put('/me', authMiddleware, userController.updateMe);

// Router cho /api/admin/users (quản lý user)
const adminUserRouter = express.Router();
adminUserRouter.use(authMiddleware, roleMiddleware(['ADMIN']));
adminUserRouter.get('/', userController.getAdminUsers);
adminUserRouter.put('/:id/status', userController.updateUserStatus);

module.exports = { userRouter, adminUserRouter };
