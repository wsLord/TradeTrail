const mongoose = require("mongoose");
const Schema = mongoose.Schema;
//for products i am bidding against other product
//subscription

const bidProductsSchema = Schema({
    title: { type: String },
    description: { type: String },
    imageUrl: { type: String },
    location: { type: String },
    bidAmount: { type: Number }, // New field for numeric bids
    bidder: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Reference to the user who placed the bid
    auction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ott",
        required: true,
    },
    createdAt: { type: Date, default: Date.now },
  paymentId:{type: String, default: null}
});

bidProductsSchema.pre("save", function(next) {
    if (!this.bidAmount && !this.title) {
        return next(new Error("Either a bid amount or a product bid is required."));
    }
    next();
});

module.exports = mongoose.model("BidProducts", bidProductsSchema);