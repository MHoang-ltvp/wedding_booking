/**
 * Hall Routes - Thành viên 3 (NDung)
 * Tạm thời chưa gắn middleware.
 */

const express = require('express');
const hallController = require('../controllers/hall.controller');

const router = express.Router();

// POST /api/vendor/halls
router.post('/', hallController.create);

// GET /api/vendor/halls
router.get('/', hallController.list);

// PUT /api/vendor/halls/:id
router.put('/:id', hallController.update);

// DELETE /api/vendor/halls/:id
router.delete('/:id', hallController.remove);

module.exports = router;
