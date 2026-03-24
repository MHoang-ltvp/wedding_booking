const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    type: {
      type: String,
      enum: ['FULL_PAYMENT', 'DEPOSIT', 'FINAL_PAYMENT'],
      required: true,
    },
    paymentMethod: { type: String, default: 'MOCK_GATEWAY' },
    transactionCode: { type: String },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED'],
      default: 'PENDING',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
