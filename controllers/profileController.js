// controllers/profileController.js
const User = require("../models/userModel");
const Product = require("../models/product");
const RentalProduct = require("../models/rentalProduct");
const BidProduct = require("../models/bidProduct");

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
      activePage: "profile",
      rentalProducts,
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
