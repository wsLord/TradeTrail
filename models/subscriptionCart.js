const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const SubscriptionCartSchema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Ott", required: true },
        quantity: { type: Number, required: true, default: 1 },
    }, ],
});

const SubscriptionCart = mongoose.model("SubscriptionCart", SubscriptionCartSchema);

module.exports = SubscriptionCart; // ✅ Ensure correct export