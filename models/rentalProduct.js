const mongoose = require('mongoose');

const rentalProductSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true, // The title is required.
  },
  imageUrls: {
    type: [String], // Array of image paths
    required: true,
  },
  rate: {
    type: String,
    enum: ['hour', 'day', 'week', 'month'],
    required: true, // Rental period (price type) is required.
  },
  price: {
    type: Number,
    required: true, // The price is required.
    min: 1, // Ensure that the price is at least 1.
  },
  securityDeposit: { type: Number, required: true, min: 0 },
  description: {
    type: String,
    required: true, // Description is required.
  },
  location: {
    type: String,
    required: true, // Location is required.
  },
  quantity: {
    type: Number,
    required: true, // Quantity is required.
    default: 1, // Default quantity to 1 if not specified.
  },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  orderIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: [],
    }],
});

const RentalProduct = mongoose.model('RentalProduct', rentalProductSchema);

module.exports = RentalProduct;
