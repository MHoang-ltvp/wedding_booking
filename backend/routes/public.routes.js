/**
 * Public Routes - Thành viên 4 (Tdung)
 * API công khai, không cần auth.
 */

const express = require('express');
const publicController = require('../controllers/public.controller');
const locationController = require('../controllers/location.controller');

const router = express.Router();

// GET /api/public/restaurants
router.get('/restaurants', publicController.getRestaurants);

// GET /api/public/restaurants/:id
router.get('/restaurants/:id', publicController.getRestaurantById);

// GET /api/public/restaurants/:id/halls
router.get('/restaurants/:id/halls', publicController.getHallsByRestaurant);

// GET /api/public/halls — tất cả sảnh (nhà hàng đang hoạt động)
router.get('/halls', publicController.getAllPublicHalls);

// GET /api/public/restaurants/:id/services
router.get('/restaurants/:id/services', publicController.getServicesByRestaurant);

// GET /api/public/halls/:id/availability-range?from=&days=14 — lịch trống nhiều ngày (2 ca)
router.get('/halls/:id/availability-range', publicController.getHallAvailabilityRange);

// GET /api/public/halls/:id/availability?date=YYYY-MM-DD
router.get('/halls/:id/availability', publicController.getHallAvailability);

// GET /api/public/locations/provinces
router.get('/locations/provinces', locationController.getProvinces);

// GET /api/public/locations/districts?provinceCode=
router.get('/locations/districts', locationController.getDistrictsByProvince);

// GET /api/public/locations/wards?districtCode=
router.get('/locations/wards', locationController.getWardsByDistrict);

module.exports = router;
