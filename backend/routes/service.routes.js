/**
 * Service (ServicePackage) Routes - Thành viên 3 (NDung)
 * Gói theo từng nhà hàng (restaurantId trong body / query).
 */

const express = require('express');
const serviceController = require('../controllers/service.controller');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();
router.use(authMiddleware, roleMiddleware(['VENDOR']));

// POST /api/vendor/services
router.post('/', serviceController.create);

// GET /api/vendor/services
router.get('/', serviceController.list);

// PUT /api/vendor/services/:id
router.put('/:id', serviceController.update);

// DELETE /api/vendor/services/:id
router.delete('/:id', serviceController.remove);

module.exports = router;
