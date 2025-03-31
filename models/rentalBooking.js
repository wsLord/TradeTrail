const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const rentalBookingSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: "RentalProduct",
    required: true,
  },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  rentalStart: { type: Date, default: Date.now },
  rentalEnd: { type: Date, required: true },
  status: { type: String, default: "active" },
});

// TTL Index to delete documents automatically
rentalBookingSchema.index({ rentalEnd: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("RentalBooking", rentalBookingSchema);
