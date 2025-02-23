const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    cart: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    secondHandsell: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  },
  { timestamps: true }
);

// Prevent overwriting model
const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User;
