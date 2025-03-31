const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const OttSchema = new Schema({
  platform_name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },

  min_price: {
    type: Number,
    required: function () {
      return this.saleType === "auction";
    },
  },
  startDate: {
    type: Date,
    required: function () {
      return this.saleType === "auction";
    },
  },
  endDate: {
    type: Date,
    required: function () {
      return this.saleType === "auction";
    },
  },

  maxBid: { type: Number, default: 0 },

  bids: [{ type: mongoose.Schema.Types.ObjectId, ref: "BidProducts" }],
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: [1, "Quantity cannot be less than 1"],
    max: [1, "Cannot have more than one subscription"],
  },
  saleType: {
    type: String,
    enum: ["direct", "auction"],
    required: true,
  },

  credentialsVerified: {
    type: Boolean,
    default: false,
  },

  verificationPending: {
    type: Boolean,
    default: false,
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    default: null,
  },
});
const ottProduct = mongoose.model("Ott", OttSchema);
module.exports = ottProduct;
