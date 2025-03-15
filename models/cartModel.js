const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cartItemSchema = new Schema({
  productType: {
    type: String,
    enum: ['Rental', 'Subscription', 'SecondHand'], // Fixed enum values
    required: true
  },
  productModel: {
    type: String,
    enum: ['RentalProduct', 'Ott', 'Product'], // Fixed model names
    required: true
  },
  product: {
    type: Schema.Types.ObjectId,
    refPath: 'productModel',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  }
});

const cartSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  items: [cartItemSchema]
});

module.exports = mongoose.model("Cart", cartSchema);