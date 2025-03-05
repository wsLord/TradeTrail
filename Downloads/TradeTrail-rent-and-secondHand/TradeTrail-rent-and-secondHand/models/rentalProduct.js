const mongoose = require('mongoose');

const rentalProductSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true, // The title is required.
  },
  imageUrl: {
    type: String,
    required: true, // The image URL is required.
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
    default: 10, // Default quantity to 10 if not specified.
  },
});

const RentalProduct = mongoose.model('RentalProduct', rentalProductSchema);

module.exports = RentalProduct;
