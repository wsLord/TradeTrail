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
    min_price: {
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

    startDate: {
        type: Date,
        required: true,
    },
    endDate: { type: Date, required: true },
    maxBid: { type: Number, default: 0 }, // Store highest bid
    //need to add user
    bids: [{ type: mongoose.Schema.Types.ObjectId, ref: "BidProducts" }], // Store bid product references
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    quantity: { type: Number, required: true, default: 10 } // ✅ Add this line
});
const ottProduct = mongoose.model("Ott", OttSchema);
module.exports = ottProduct;