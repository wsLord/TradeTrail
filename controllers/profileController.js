// controllers/profileController.js
const User = require("../models/userModel");
const Product = require("../models/product");
const RentalProduct = require("../models/rentalProduct");
const BidProduct = require("../models/bidproduct");
const SecondhandDirectProduct = require("../models/product");
const SubscriptionDirectProduct = require("../models/ott");
const RentalBooking = require("../models/rentalBooking");
const Subscription = require("../models/ott");
const Order = require("../models/order");

const bcrypt = require("bcryptjs");

const { v4: uuidv4 } = require('uuid');
const Transaction = require('../models/transaction');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    //renting products
    const rentalProducts = await RentalProduct.find({
      seller: req.user._id,
    }).populate({
      path: "orderIds",
      populate: {
        path: "buyer",
        model: "User",
        select: "fullName",
      },
      select: "quantity otp",
    });

    //secondHand auction
    const secondHandAuction = await Product.find({
      seller: req.user._id,
      saleType: "auction",
    }).populate({
      path: "orderIds",
      populate: {
        path: "buyer",
        model: "User",
        select: "fullName",
      },
      select: "quantity otp",
    });
    //subscription auction
    const subscriptionAuction = await Subscription.find({
      seller: req.user._id,
      saleType: "auction",
    }).populate({
      path: "orderId",
      populate: {
        path: "buyer",
        model: "User",
        select: "fullName",
      },
      select: "quantity otp",
    });

    //direct secondhand and subscription products
    const directSecondhandProducts = await Product.find({
      seller: req.user._id,
      saleType: "direct",
    }).populate({
      path: "orderIds",
      populate: {
        path: "buyer",
        model: "User",
        select: "fullName",
      },
      select: "quantity otp",
    });
    const directSubscriptionProducts = await Subscription.find({
      seller: req.user._id,
      saleType: "direct",
    }).populate({
      path: "orderId",
      populate: {
        path: "buyer",
        model: "User",
        select: "fullName",
      },
      select: "quantity otp",
    });

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
      secondHandAuction,
      subscriptionAuction,
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
        message: "Password change not available for social login users",
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
        message: "Password must be at least 6 characters",
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

exports.getRentalDetails = (req, res, next) => {
  const productId = req.params.productId;
  let fetchedProduct;

  RentalProduct.findById(productId)
    .populate("seller", "fullName")
    // Instead of populating a "buyer" field, populate orderIds and within that, buyer details.
    .populate({
      path: "orderIds",
      populate: {
        path: "buyer",
        model: "User",
        select: "fullName"
      },
      select: "quantity otp paymentTransferred transactionId"
    })
    .then((product) => {
      if (!product) {
        return res.status(404).send("Product not found");
      }
      fetchedProduct = product;
      // Find an active booking for this product
      return RentalBooking.findOne({ product: productId, status: "active" }).populate("user", "fullName");
    })
    .then((booking) => {
      if (booking) {
        fetchedProduct.currentBooking = booking;
      }
      // Render the 'rental-details' view from your views folder
      res.render("rental-details", {
        pageTitle: fetchedProduct.title,
        product: fetchedProduct,
        user: req.user,
        activePage: "rental",
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error fetching product details");
    });
};


exports.getSecondHandDetails = (req, res, next) => {
  const productId = req.params.productId;
  let fetchedProduct;

  SecondhandDirectProduct.findById(productId)
    .populate("seller", "fullName")
    // Populate the orderIds array with buyer details
    .populate({
      path: "orderIds",
      populate: {
        path: "buyer",
        model: "User",
        select: "fullName"
      },
      select: "quantity otp paymentTransferred transactionId"
    })
    .then((product) => {
      if (!product) {
        return res.status(404).send("Product not found");
      }
      fetchedProduct = product;
      // Render the 'direct-details' view from your views folder
      res.render("secondHand-details", {
        pageTitle: fetchedProduct.title,
        product: fetchedProduct,
        user: req.user,
        activePage: "direct",
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error fetching product details");
    });
};


exports.getSubscriptionDetails = async (req, res, next) => {
  try {
    const productId = req.params.productId;
    const product = await SubscriptionDirectProduct.findById(productId)
      .populate("seller", "fullName")
      // Populate orderIds instead of buyer directly
      .populate({
        path: "orderId",
        populate: {
          path: "buyer",
          model: "User",
          select: "fullName"
        },
        select: "quantity otp paymentTransferred transactionId"
      });

    if (!product) {
      return res.status(404).send("Product not found");
    }

    res.render("subscription-details", {
      pageTitle: product.platform_name,
      user: req.user,
      product,
      activePage: "subscription",
    });
  } catch (error) {
    console.error("Error fetching subscription details:", error);
    res.status(500).send("Error fetching product details");
  }
};


exports.verifyOTP = async (req, res) => {
  try {
    const { productId, productType, otp, upiId } = req.body;

    // Validate UPI ID format
    if (!/^[\w.-]+@[\w]+/.test(upiId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid UPI ID format. Use format: username@bank' 
      });
    }
    
    // Map productType to Order's productModel values
    const productModelMap = {
      rental: 'Rental',
      secondhand: 'SecondHand',
      subscription: 'Subscription'
    };
    
    const productModel = productModelMap[productType.toLowerCase()];
    if (!productModel) {
      return res.status(400).json({ success: false, message: 'Invalid product type' });
    }

    // Determine product model
    let Model;
    switch (productType.toLowerCase()) {
      case 'rental': Model = RentalProduct; break;
      case 'secondhand': Model = Product; break;
      case 'subscription': Model = Subscription; break;
      default: return res.status(400).json({ success: false, message: 'Invalid product type' });
    }

    // Verify product ownership
    const product = await Model.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Check orders for matching OTP
    const orders = await Order.find({
      product_id: productId,
      productModel: productModel,
      otp: otp
    });

    // If OTP is valid
    if (orders.length > 0) {
      // Create transaction record
      const transaction = new Transaction({
        seller: req.user._id,
        buyer: orders[0].buyer,
        product: productId,
        amount: orders[0].amount, // Adjust based on your order structure
        upiId,
        transactionId: `TT-${uuidv4()}`,
        status: 'completed'
      });

      await transaction.save();

      // Update order status if needed
      await Order.updateMany(
        { _id: { $in: orders.map(o => o._id) } },
        { 
          $set: { 
            paymentTransferred: true,
            transactionId: transaction.transactionId 
          } 
        }
      );

      await Model.findByIdAndUpdate(productId, { 
        $set: { 
          orderId: orders[0]._id,
          quantity: 0 // Mark as sold out
        } 
      });

      return res.json({
        success: true,
        transactionId: transaction.transactionId,
        message: 'OTP verified & payment initiated successfully'
      });
    }

    res.json({ success: false, message: 'Invalid OTP' });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

