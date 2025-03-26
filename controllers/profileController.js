// controllers/profileController.js
const User = require("../models/userModel");
const Product = require("../models/product");
const RentalProduct = require("../models/rentalProduct");
const BidProduct = require("../models/bidProduct");
const SecondhandDirectProduct = require("../models/product");
const SubscriptionDirectProduct = require("../models/ott");
const bcrypt = require("bcryptjs");

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const auctionProducts = await Product.find({
      seller: req.user._id,
      saleType: "auction",
    });
    const rentalProducts = await RentalProduct.find({
      seller: req.user._id,
    }).populate("buyer");

    const directSecondhandProducts = await SecondhandDirectProduct.find({ seller: req.user._id }).populate("buyer");
    const directSubscriptionProducts = await SubscriptionDirectProduct.find({ seller: req.user._id }).populate("buyer");


    // Add default badges if none exist
    if (!user.badges || user.badges.length === 0) {
      user.badges = [
        "/badges/badgeone.png",
        "/badges/badgetwo.png",
        "/badges/badgethree.png",
      ];
    }
    res.render("profile", {
      user: user,
      auctionProducts,
      rentalProducts,
      directSecondhandProducts,
      directSubscriptionProducts,
      activePage: "profile",
      
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { city, state, country, phone } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { city, state, country, phone },
      { new: true }
    );
    res.redirect("/profile");
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.getAuctionDetails = async (req, res) => {
  try {
    const { productId } = req.params;

    // Find product details
    const product = await Product.findById(productId).populate("seller");
    if (!product) {
      return res.status(404).send("Product not found.");
    }

    // Find all bids related to this product and populate bidder details
    const bids = await BidProduct.find({ auction: productId }).populate(
      "bidder"
    );

    // Separate bids into monetary and product bids
    const monetaryBids = bids.filter((bid) => bid.bidAmount !== null);
    const productBids = bids.filter((bid) => bid.bidAmount === null);

    // res.render("secondHand/auction", {
    //   product,
    //   monetaryBids,
    //   productBids,
    //   type:"sell"
    // });
    res.render("auction-details", {
      product,
      monetaryBids,
      productBids,
    });
  } catch (error) {
    console.error("Error fetching auction details:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.acceptBid = async (req, res) => {
  try {
    const { bidId } = req.body;

    // Find the bid and populate the fields
    const bid = await BidProduct.findById(bidId).populate("bidder");
    if (!bid) {
      req.flash("error", "Bid not found.");
      return res.redirect("back");
    }

    // Find the product related to the bid
    const product = await Product.findById(bid.auction);
    if (!product) {
      req.flash("error", "Product not found.");
      return res.redirect("back");
    }

    // Set the winner and update status to completed
    product.winner = bid.bidder._id;
    product.auctionStatus = "completed";

    await product.save();

    // Flash appropriate success message
    const bidTypeMessage =
      bid.bidAmount !== null
        ? `Monetary bid accepted! Winner is ${bid.bidder.fullName}`
        : `Product bid accepted! Winner is ${bid.bidder.fullName}`;

    req.flash("success", bidTypeMessage);
    res.redirect(`/secondHand/buy/${product._id}`);
  } catch (error) {
    console.error("Error accepting bid:", error);
    req.flash("error", "An error occurred while accepting the bid.");
    res.redirect("back");
  }
};

exports.updateProfilePic = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePic: req.file.path },
      { new: true }
    );
    res.json({ success: true, profilePic: user.profilePic });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    res.status(500).json({ success: false });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const user = await User.findById(req.user._id);

    // Check if user has password (OAuth users shouldn't have one)
    if (!user.password) {
      return res.status(400).json({ 
        message: "Password change not available for social login users" 
      });
    }

    // Validate current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Validate new password
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New passwords do not match" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: "Password must be at least 6 characters" 
      });
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true });
    
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};