/**
 * Booking Routes - Thành viên 5 (Triệu Hoàng)
 * Customer + Vendor + Admin. Tạm thời chưa gắn middleware.
 */

const express = require('express');
const bookingController = require('../controllers/booking.controller');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Router cho /api/bookings (Customer)
const customerBookingRouter = express.Router();
customerBookingRouter.use(authMiddleware, roleMiddleware(['CUSTOMER']));
customerBookingRouter.post('/', bookingController.create);
customerBookingRouter.get('/my-bookings', bookingController.getMyBookings);
customerBookingRouter.get('/:id', bookingController.getById);
customerBookingRouter.put('/:id/cancel', bookingController.cancel);
customerBookingRouter.put('/:id/resubmit', bookingController.resubmit);
customerBookingRouter.post('/:id/confirm-payment', bookingController.confirmPayment);

// Router cho /api/vendor/bookings
const vendorBookingRouter = express.Router();
vendorBookingRouter.use(authMiddleware, roleMiddleware(['VENDOR']));
vendorBookingRouter.get('/', bookingController.getVendorBookings);
vendorBookingRouter.put('/:id/approve', bookingController.approve);
vendorBookingRouter.put('/:id/reject', bookingController.reject);
vendorBookingRouter.put('/:id/status', bookingController.updateVendorStatus);

// Router cho /api/admin/bookings
const adminBookingRouter = express.Router();
adminBookingRouter.use(authMiddleware, roleMiddleware(['ADMIN']));
adminBookingRouter.get('/', bookingController.getAdminBookings);

module.exports = {
  customerBookingRouter,
  vendorBookingRouter,
  adminBookingRouter,
};
