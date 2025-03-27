const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  Payment: {
    type: Schema.Types.ObjectId,
    ref: "Payment", // Payment model'Payment'
    required: true
  },
  product_id: {
    type: Schema.Types.ObjectId,
    refPath: 'productModel', 
    required: true
  },
  productModel: {
    type: String,
    enum: ['Rental', 'Subscription', 'SecondHand'], // Dynamic model names
    required: true
  },
  buyer: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  amount: {
    type: Number,
    required: true
  },
  otp: {
    type: String, // 6-digit OTP as a string
    required: true
  },
});

// Indexing for faster queries
orderSchema.index({ order_id: 1, buyer: 1 });

module.exports = mongoose.model("Order", orderSchema);