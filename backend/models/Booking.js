const mongoose = require('mongoose');

const selectedPackageSchema = new mongoose.Schema(
  {
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServicePackage',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    hallId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hall',
      required: true,
    },
    weddingDate: {
      type: Date,
      required: true,
    },
    session: {
      type: String,
      required: true,
      enum: ['Morning', 'Evening'],
    },
    selectedPackages: {
      type: [selectedPackageSchema],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Phải chọn ít nhất một gói dịch vụ.',
      },
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      required: true,
      enum: ['Pending approval', 'Confirmed', 'Pending payment', 'Canceled'],
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ['Unpaid', 'Paid'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
