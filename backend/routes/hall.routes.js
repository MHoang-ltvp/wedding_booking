/**
 * Hall Routes - Thành viên 3 (NDung)
 */

const express = require('express');
const hallController = require('../controllers/hall.controller');
const uploadController = require('../controllers/upload.controller');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();
router.use(authMiddleware, roleMiddleware(['VENDOR']));

// POST /api/vendor/halls
router.post('/', hallController.create);

// GET /api/vendor/halls
router.get('/', hallController.list);

// POST /api/vendor/halls/:id/images — multipart field "images" (Cloudinary)
router.post(
  '/:id/images',
  uploadController.upload.array('images', uploadController.MAX_IMAGES_PER_REQUEST),
  hallController.uploadHallImages,
);

// GET /api/vendor/halls/:id/availability-range
router.get('/:id/availability-range', hallController.availabilityRange);

// PUT /api/vendor/halls/:id
router.put('/:id', hallController.update);

// DELETE /api/vendor/halls/:id
router.delete('/:id', hallController.remove);

module.exports = router;
