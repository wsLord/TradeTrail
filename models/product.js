const mongoose = require("mongoose");
const order = require("./order");
const Schema = mongoose.Schema;

const productSchema = new Schema({
  title: {
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
  imageUrls: {
    type: [String], // Array of image paths
    required: true,
  },
  saleType: {
    type: String,
    enum: ['direct', 'auction'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  location: {
    type: String,
    required: true,
  },
  min_price: { 
    type: Number, 
    required: function() { return this.saleType === 'auction'; }
  },
  startDate: {
    type: Date,
    required: function() { return this.saleType === 'auction'; }
  },
  endDate: { 
    type: Date, 
    required: function() { return this.saleType === 'auction'; }
  },
  // maxBid: { type: Number, default: 0 }, // Store highest bid
  //need to add user
  bids: [{ type: mongoose.Schema.Types.ObjectId, ref: "BidProduct" }], // Store bid product references
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  otp: { type: String },
  auctionStatus: {
    type: String,
    enum: ["upcoming", "ongoing", "completed"],
    default: "upcoming",
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  orderIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    default: null,
  }],
});

module.exports = mongoose.model("Product", productSchema);