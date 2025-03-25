const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  buyer:{ type: mongoose.Schema.Types.ObjectId, ref: "User", },
  orderId: {
    type: String,
    required: true,
  },
  paymentId: {
    type: String,
    required: true,
  },
  signature: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  // product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  productIds: [{ type: String }],
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("payment", paymentSchema);
