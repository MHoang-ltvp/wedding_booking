/**
 * Restaurant Routes - Thành viên 2 (VHoang)
 * Tạm thời chưa gắn middleware.
 */

const express = require('express');
const restaurantController = require('../controllers/restaurant.controller');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Router cho /api/vendor/restaurants
const vendorRestaurantRouter = express.Router();
vendorRestaurantRouter.use(authMiddleware, roleMiddleware(['VENDOR']));
vendorRestaurantRouter.get('/me', restaurantController.getMyRestaurant);
vendorRestaurantRouter.post('/', restaurantController.create);
vendorRestaurantRouter.put('/:id', restaurantController.update);

// Router cho /api/admin/restaurants
const adminRestaurantRouter = express.Router();
adminRestaurantRouter.use(authMiddleware, roleMiddleware(['ADMIN']));
adminRestaurantRouter.get('/', restaurantController.getAdminRestaurants);

module.exports = { vendorRestaurantRouter, adminRestaurantRouter };
