const mongoose = require('mongoose');

/**
 * Gói dịch vụ (menu, trang trí…) gắn với **một nhà hàng** (`restaurantId`).
 * Mỗi nhà hàng có danh sách gói riêng; vendor quản lý qua quyền sở hữu Restaurant.
 */
const servicePackageSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['FOOD', 'DECORATION'],
      required: true,
    },
    unit: {
      type: String,
      enum: ['TABLE', 'PACKAGE'],
      required: true,
    },
    price: { type: Number, required: true },
    items: [{ type: String }],
    description: { type: String },
    images: [{ url: String, public_id: String }],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ServicePackage', servicePackageSchema);
