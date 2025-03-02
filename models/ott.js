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
    bids: [{ type: mongoose.Schema.Types.ObjectId, ref: "BidProduct" }], // Store bid product references
});

module.exports = mongoose.model("Ott", OttSchema);