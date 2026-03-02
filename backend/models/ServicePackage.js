const mongoose = require('mongoose');

const servicePackageSchema = new mongoose.Schema(
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
    type: {
      type: String,
      required: true,
      enum: ['Menu', 'Decor'],
    },
    pricePerUnit: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ServicePackage', servicePackageSchema);
