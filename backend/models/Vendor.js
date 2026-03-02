const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    restaurantName: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      required: true,
      enum: ['Active', 'Pending', 'Rejected'],
      default: 'Pending',
    },
    rejectionReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Vendor', vendorSchema);
