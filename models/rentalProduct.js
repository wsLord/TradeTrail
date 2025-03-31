const mongoose = require("mongoose");

const rentalProductSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  imageUrls: {
    type: [String],
    required: true,
  },
  rate: {
    type: String,
    enum: ["hour", "day", "week", "month"],
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 1,
  },
  securityDeposit: { type: Number, required: true, min: 0 },
  description: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
  },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  orderIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: [],
    },
  ],
});

const RentalProduct = mongoose.model("RentalProduct", rentalProductSchema);

module.exports = RentalProduct;
