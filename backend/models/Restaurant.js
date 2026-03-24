const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    address: { type: String, required: true },
    addressDetail: {
      provinceCode: { type: String, default: '' },
      provinceName: { type: String, default: '' },
      districtCode: { type: String, default: '' },
      districtName: { type: String, default: '' },
      wardCode: { type: String, default: '' },
      wardName: { type: String, default: '' },
      /** Một khối: số nhà + đường/phố/ngõ (nội dung tự do) */
      street: { type: String, default: '' },
    },
    description: { type: String },
    contact: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
    },
    images: [
      {
        url: String,
        public_id: String,
      },
    ],
    approvalStatus: {
      type: String,
      enum: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'],
      default: 'DRAFT',
      index: true,
    },
    /** Lý do từ chối do admin gửi (khi approvalStatus = REJECTED) */
    rejectionReason: { type: String, default: '' },
    status: {
      type: String,
      enum: ['ACTIVE', 'HIDDEN'],
      default: 'ACTIVE',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Restaurant', restaurantSchema);
