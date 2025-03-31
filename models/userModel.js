const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: {
      type: String,
      required: function () {
        return !(this.googleId || this.facebookId);
      },
    },
    city: String,
    state: String,
    country: String,
    resetToken: String,
    resetExpires: Date,
    phone: String,
    rating: { type: Number, default: 4.5 },
    badges: {
      type: [String],
      default: [
        "/badges/badgeone.png",
        "/badges/badgetwo.png",
        "/badges/badgethree.png",
      ],
    },
    profilePic: {
      type: String,
      default:
        "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
    },
    googleId: String,
    facebookId: String,
    isVerified: { type: Boolean, default: false },
    verificationToken: String,
    verificationExpires: Date,
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User;
