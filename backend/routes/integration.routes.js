/**
 * Integration Routes - Upload + Statistics (thống kê vendor/admin).
 */

const express = require('express');
const uploadController = require('../controllers/upload.controller');
const statsController = require('../controllers/payment.controller');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Router cho /api/upload
const uploadRouter = express.Router();
uploadRouter.post(
  '/image',
  uploadController.upload.single('image'),
  uploadController.uploadImage,
);
uploadRouter.post(
  '/images',
  uploadController.upload.array('images', uploadController.MAX_IMAGES_PER_REQUEST),
  uploadController.uploadImages,
);
uploadRouter.delete('/image', uploadController.deleteImage);

// GET /api/vendor/stats
const vendorStatsRouter = express.Router();
vendorStatsRouter.use(authMiddleware, roleMiddleware(['VENDOR']));
vendorStatsRouter.get('/stats', statsController.getVendorStats);

// GET /api/admin/stats
const adminStatsRouter = express.Router();
adminStatsRouter.use(authMiddleware, roleMiddleware(['ADMIN']));
adminStatsRouter.get('/stats', statsController.getAdminStats);

module.exports = {
  uploadRouter,
  vendorStatsRouter,
  adminStatsRouter,
};
