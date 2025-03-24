// models/bidModel.js
const mongoose = require("mongoose");

const bidSchema = new mongoose.Schema({
  bidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  bidAmount: {
    type: Number,
  },
  // For product bids
  title: String,
  description: String,
  location: String,
  // Payment information
  razorpay_payment_id: String,
  razorpay_order_id: String,
  razorpay_signature: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Bid", bidSchema);
