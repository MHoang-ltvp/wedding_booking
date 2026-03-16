const mongoose = require('mongoose');

const hallSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    name: { type: String, required: true },
    capacity: { type: Number, required: true },
    area: { type: Number },
    basePrice: { type: Number, required: true },
    description: { type: String },
    images: [{ url: String, public_id: String }],
    status: {
      type: String,
      enum: ['AVAILABLE', 'MAINTENANCE', 'LOCKED'],
      default: 'AVAILABLE',
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Hall', hallSchema);
