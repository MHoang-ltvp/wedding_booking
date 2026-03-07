const mongoose = require('mongoose');

const servicePackageSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
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
