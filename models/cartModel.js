const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cartItemSchema = new Schema({
  productType: {
    type: String,
    enum: ["Rental", "Subscription", "SecondHand"],
    required: true,
  },
  productModel: {
    type: String,
    enum: ["RentalProduct", "Ott", "Product"],
    required: true,
  },
  product: {
    type: Schema.Types.ObjectId,
    refPath: "productModel",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  rentalStart: Date,
  rentalEnd: Date,
  calculatedPrice: Number,
  securityDeposit: Number,
});

const cartSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  items: [cartItemSchema],
});

module.exports = mongoose.model("Cart", cartSchema);
