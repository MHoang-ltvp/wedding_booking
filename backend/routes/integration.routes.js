/**
 * Integration Routes - Thành viên 6 (Minh Công)
 * Upload (Cloudinary) + Payment + Statistics.
 * Tạm thời chưa gắn middleware.
 */

const express = require("express");
const uploadController = require("../controllers/upload.controller");
const paymentController = require("../controllers/payment.controller");

// Router cho /api/upload
const uploadRouter = express.Router();
uploadRouter.post(
  "/image",
  uploadController.upload.single("image"), // 👈 thêm dòng này
  uploadController.uploadImage,
);
uploadRouter.delete("/image", uploadController.deleteImage);

// Router cho /api/payments
const paymentRouter = express.Router();
paymentRouter.post("/create-url", paymentController.createPaymentUrl);
paymentRouter.post("/webhook", paymentController.webhook);

// Router cho /api/vendor/stats (mount tại /api/vendor, route /stats)
const vendorStatsRouter = express.Router();
vendorStatsRouter.get("/stats", paymentController.getVendorStats);

// Router cho /api/admin/stats (mount tại /api/admin, route /stats)
const adminStatsRouter = express.Router();
adminStatsRouter.get("/stats", paymentController.getAdminStats);

module.exports = {
  uploadRouter,
  paymentRouter,
  vendorStatsRouter,
  adminStatsRouter,
};
