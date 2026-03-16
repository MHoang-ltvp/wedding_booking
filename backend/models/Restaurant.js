const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: { type: String, required: true },
    address: { type: String, required: true },
    description: { type: String },
    images: [
      {
        url: String,
        public_id: String,
      },
    ],
    status: {
      type: String,
      enum: ['ACTIVE', 'HIDDEN'],
      default: 'ACTIVE',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Restaurant', restaurantSchema);
