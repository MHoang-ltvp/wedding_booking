/**
 * File DUY NHẤT cả nhóm gọi chung - Tập trung mount tất cả routes.
 * Tạm thời chưa gắn middleware (auth, role, status).
 */

const express = require('express');
const { userRouter, adminUserRouter } = require('./user.routes');
const { vendorRestaurantRouter, adminRestaurantRouter } = require('./restaurant.routes');
const hallRoutes = require('./hall.routes');
const serviceRoutes = require('./service.routes');
const publicRoutes = require('./public.routes');
const authRoutes = require('./auth.routes');
const {
  customerBookingRouter,
  vendorBookingRouter,
  adminBookingRouter,
} = require('./booking.routes');
const {
  uploadRouter,
  vendorStatsRouter,
  adminStatsRouter,
} = require('./integration.routes');

const router = express.Router();

// ---- Auth (public) ----
router.use('/auth', authRoutes);

// ---- Public (guest/customer) ----
router.use('/public', publicRoutes);

// ---- User (profile) ----
router.use('/users', userRouter);

// ---- Admin ----
router.use('/admin/users', adminUserRouter);
router.use('/admin/restaurants', adminRestaurantRouter);
router.use('/admin/bookings', adminBookingRouter);
router.use('/admin', adminStatsRouter); // GET /api/admin/stats

// ---- Vendor (thứ tự: path dài trước, /api/vendor cuối cho /stats) ----
router.use('/vendor/restaurants', vendorRestaurantRouter);
router.use('/vendor/halls', hallRoutes);
router.use('/vendor/services', serviceRoutes);
router.use('/vendor/bookings', vendorBookingRouter);
router.use('/vendor', vendorStatsRouter); // GET /api/vendor/stats

// ---- Customer bookings ----
router.use('/bookings', customerBookingRouter);

// ---- Upload ----
router.use('/upload', uploadRouter);

module.exports = router;
