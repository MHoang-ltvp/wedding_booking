/**
 * Service (ServicePackage) Routes - Thành viên 3 (NDung)
 * Tạm thời chưa gắn middleware.
 */

const express = require('express');
const serviceController = require('../controllers/service.controller');

const router = express.Router();

// POST /api/vendor/services
router.post('/', serviceController.create);

// GET /api/vendor/services
router.get('/', serviceController.list);

// PUT /api/vendor/services/:id
router.put('/:id', serviceController.update);

// DELETE /api/vendor/services/:id
router.delete('/:id', serviceController.remove);

module.exports = router;
