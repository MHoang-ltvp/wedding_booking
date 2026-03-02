const mongoose = require('mongoose');

const hallSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    images: {
      type: [String],
      default: [],
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Hall', hallSchema);
