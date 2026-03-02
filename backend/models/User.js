const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['Admin', 'Vendor', 'Customer', 'Guest'],
    },
    status: {
      type: String,
      required: true,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
