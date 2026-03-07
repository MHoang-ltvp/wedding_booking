/**
 * Public Routes - Thành viên 4 (Tdung)
 * API công khai, không cần auth.
 */

const express = require('express');
const publicController = require('../controllers/public.controller');

const router = express.Router();

// GET /api/public/restaurants
router.get('/restaurants', publicController.getRestaurants);

// GET /api/public/restaurants/:id
router.get('/restaurants/:id', publicController.getRestaurantById);

// GET /api/public/restaurants/:id/halls
router.get('/restaurants/:id/halls', publicController.getHallsByRestaurant);

// GET /api/public/restaurants/:id/services
router.get('/restaurants/:id/services', publicController.getServicesByRestaurant);

// GET /api/public/halls/:id/availability?date=YYYY-MM-DD
router.get('/halls/:id/availability', publicController.getHallAvailability);

module.exports = router;
