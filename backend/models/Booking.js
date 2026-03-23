const mongoose = require('mongoose');

const bookingServiceSchema = new mongoose.Schema(
  {
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServicePackage' },
    type: { type: String, enum: ['FOOD', 'DECORATION'] },
    snapshotPrice: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    hallId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hall', required: true },
    bookingDate: { type: Date, required: true },
    shift: { type: String, enum: ['MORNING', 'EVENING'], required: true },
    services: [bookingServiceSchema],
    customerNote: { type: String },
    cancelReason: { type: String },
    rejectReason: { type: String },
    estimatedTotal: { type: Number, required: true },
    depositRequired: { type: Number },
    /** Khách bấm “Thanh toán” — không qua cổng thanh toán riêng */
    depositPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    finalAmount: { type: Number },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'CANCELLED', 'REJECTED'],
      default: 'PENDING',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
