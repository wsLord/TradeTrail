const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bidProductSchema = Schema({
  title: { type: String },
  description: { type: String },
  imageUrl: { type: String },
  location: { type: String },
  bidAmount: { type: Number }, // New field for numeric bids
//   bidder: { type: String, required: true }, // Name or ID of the bidder
  auction: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true }
});

bidProductSchema.pre("save", function (next) {
    if (!this.bidAmount && !this.title) {
      return next(new Error("Either a bid amount or a product bid is required."));
    }
    next();
  });

module.exports = mongoose.model("BidProduct", bidProductSchema);