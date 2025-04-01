// controllers/profileController.js
const User = require("../models/userModel");
const Product = require("../models/product");
const RentalProduct = require("../models/rentalProduct");
const Subscription = require("../models/ott");
const BidProduct = require("../models/bidSecondHand");
const BidProducts = require("../models/bidSubscription");
const RentalBooking = require("../models/rentalBooking");
const Payment = require("../models/payment");

const Order = require("../models/order");
const emailService = require("../services/emailService");

const bcrypt = require("bcryptjs");
const axios = require("axios");

const { v4: uuidv4 } = require("uuid");
const Transaction = require("../models/transaction");

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

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
    const product = await Product.findById(productId)
      .populate("seller")
      .populate({
        path: "orderIds",
        select: "paymentTransferred transactionId buyer",
        populate: {
          path: "buyer",
          select: "fullName",
        },
      });

    if (!product) {
      return res.status(404).send("Product not found.");
    }

    const bids = await BidProduct.find({ auction: productId }).populate(
      "bidder"
    );

    const monetaryBids = bids.filter((bid) => bid.bidAmount !== null);
    const productBids = bids.filter((bid) => bid.location);

    res.render("secondHand-auction-details", {
      product,
      monetaryBids,
      productBids,
      user: req.user,
    });
  } catch (error) {
    console.error("Error fetching auction details:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.acceptBid = async (req, res) => {
  try {
    const { bidId } = req.body;

    const bid = await BidProduct.findById(bidId).populate("bidder");
    if (!bid) {
      req.flash("error", "Bid not found.");
      return res.redirect("back");
    }

    const product = await Product.findById(bid.auction).populate({
      path: "bids",
      populate: { path: "bidder" },
    });
    if (!product) {
      req.flash("error", "Product not found.");
      return res.redirect("back");
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Create a dummy Payment record to satisfy the required Payment field
    const dummyPayment = new Payment({
      orderId: `dummy_${Date.now()}`,
      paymentId: "NA",
      buyer: bid.bidder._id,
      signature: "NA",
      amount: 0,
      status: "success",
    });
    await dummyPayment.save();

    // Create order record associated with buyer
    const order = new Order({
      Payment: dummyPayment._id,
      product_id: product._id,
      productModel: "SecondHand",
      buyer: bid.bidder._id,
      seller: product.seller._id,
      quantity: 1,
      otp: otp,
      amount: bid.bidAmount || 0,
    });
    await order.save();

    product.winner = bid.bidder._id;
    product.auctionStatus = "completed";
    product.endDate = Date.now();
    product.orderIds.push(order._id);
    await product.save();

    // Send OTP to BUYER's email
    await emailService.sendOtpEmail(bid.bidder.email, otp);

    if (bid.bidAmount !== null) {
      const otherBids = product.bids.filter(
        (otherBid) => otherBid._id.toString() !== bidId && otherBid.bidAmount
      );
      // Process refunds for all other bids concurrently
      await Promise.all(
        otherBids.map(async (otherBid) => {
          await initiateRefund(otherBid.paymentId, otherBid.bidAmount);
        })
      );
    } else {
      const otherBids = product.bids.filter((otherBid) => otherBid.bidAmount);

      await Promise.all(
        otherBids.map(async (otherBid) => {
          await initiateRefund(otherBid.paymentId, otherBid.bidAmount);
        })
      );
    }

    const bidTypeMessage =
      bid.bidAmount !== null
        ? `Monetary bid accepted! Winner is ${bid.bidder.fullName}. Other bids have been refunded.`
        : `Product bid accepted! Winner is ${bid.bidder.fullName}.`;

    req.flash("success", bidTypeMessage);
    res.redirect(`/secondHand/buy/${product._id}`);
  } catch (error) {
    console.error("Error accepting bid:", error);
    req.flash("error", "An error occurred while accepting the bid.");
  }
};

// Handle Razorpay refund
const initiateRefund = async (paymentId, amount) => {
  if (!paymentId) {
    console.error("Refund failed: Missing payment ID");
    return;
  }

  if (!amount || isNaN(amount) || amount <= 0) {
    console.error("Refund failed: Invalid amount", amount);
    return;
  }

  try {
    const auth = Buffer.from(
      `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
    ).toString("base64");

    // Make refund request
    const response = await axios({
      method: "POST",
      url: `https://api.razorpay.com/v1/payments/${paymentId}/refund`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      data: {
        amount: Math.floor(amount * 100 ),
        notes: { reason: "Bid refund due to another bid being accepted" },
        speed: "normal",
      },
    });

    const refundData = response.data;

    const paymentRecord = await Payment.findOne({ paymentId: paymentId });
    if (paymentRecord) {
      paymentRecord.status = "refunded";
      paymentRecord.refundId = refundData.id;
      paymentRecord.refundedAt = new Date();
      paymentRecord.refundAmount = amount;
      await paymentRecord.save();
    } else {
      console.warn(`Payment record not found for ID: ${paymentId}`);
    }
  } catch (error) {
    console.error("Razorpay refund error:", error);
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

    if (!user.password) {
      return res.status(400).json({
        message: "Password change not available for social login users",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

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

    .populate({
      path: "orderIds",
      populate: {
        path: "buyer",
        model: "User",
        select: "fullName",
      },
      select: "quantity otp paymentTransferred transactionId",
    })
    .then((product) => {
      if (!product) {
        return res.status(404).send("Product not found");
      }
      fetchedProduct = product;

      return RentalBooking.findOne({
        product: productId,
        status: "active",
      }).populate("user", "fullName");
    })
    .then((booking) => {
      if (booking) {
        fetchedProduct.currentBooking = booking;
      }

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

  Product.findById(productId)
    .populate("seller", "fullName")

    .populate({
      path: "orderIds",
      populate: {
        path: "buyer",
        model: "User",
        select: "fullName",
      },
      select: "quantity otp paymentTransferred transactionId",
    })
    .then((product) => {
      if (!product) {
        return res.status(404).send("Product not found");
      }
      fetchedProduct = product;

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
    const product = await Subscription.findById(productId)
      .populate("seller", "fullName")

      .populate({
        path: "orderId",
        populate: {
          path: "buyer",
          model: "User",
          select: "fullName",
        },
        select: "quantity otp paymentTransferred transactionId",
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

    if (!/^[\w.-]+@[\w]+/.test(upiId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid UPI ID format. Use format: username@bank",
      });
    }

    const productModelMap = {
      rental: "Rental",
      secondhand: "SecondHand",
      subscription: "Subscription",
    };

    const productModel = productModelMap[productType.toLowerCase()];
    if (!productModel) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product type" });
    }

    let Model;
    switch (productType.toLowerCase()) {
      case "rental":
        Model = RentalProduct;
        break;
      case "secondhand":
        Model = Product;
        break;
      case "subscription":
        Model = Subscription;
        break;
      default:
        return res
          .status(400)
          .json({ success: false, message: "Invalid product type" });
    }

    const product = await Model.findById(productId);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const orders = await Order.find({
      product_id: productId,
      productModel: productModel,
      otp: otp,
    });

    // If OTP is valid
    if (orders.length > 0) {
      const transaction = new Transaction({
        seller: req.user._id,
        buyer: orders[0].buyer,
        product: productId,
        amount: orders[0].amount,
        upiId,
        transactionId: `TT-${uuidv4()}`,
        status: "completed",
      });

      await transaction.save();

      await Order.updateMany(
        { _id: { $in: orders.map((o) => o._id) } },
        {
          $set: {
            paymentTransferred: true,
            transactionId: transaction.transactionId,
          },
        }
      );

      await Model.findByIdAndUpdate(productId, {
        $set: {
          orderId: orders[0]._id,
          quantity: 0,
        },
      });

      return res.json({
        success: true,
        transactionId: transaction.transactionId,
        message: "OTP verified & payment initiated successfully",
      });
    }

    res.json({ success: false, message: "Invalid OTP" });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getSubscriptionAuctionDetails = async (req, res) => {
  try {
    const productId = req.params.productId;

    const product = await Subscription.findById(productId)
      .populate("seller")
      .populate({
        path: "bids",
        populate: {
          path: "bidder",
          select: "fullName",
        },
      })
      .populate({
        path: "orderId",
        select: "paymentTransferred transactionId",
        populate: {
          path: "buyer",
          select: "fullName",
        },
      });

    if (!product) {
      req.flash("error", "Subscription not found.");
      return res.redirect("/profile");
    }
    const bids = await BidProducts.find({ auction: productId }).populate(
      "bidder"
    );

    const monetaryBids = product.bids.filter((bid) => bid.bidAmount);
    const productBids = product.bids.filter((bid) => bid.location);

    res.render("subscription-auction-details", {
      product,
      monetaryBids,
      productBids,
      user: req.user,
    });
  } catch (err) {
    console.error(err);
    req.flash("error", "Error loading auction details");
    res.redirect("/profile");
  }
};

exports.acceptSubscriptionBid = async (req, res) => {
  try {
    const { bidId } = req.body;

    const bid = await BidProduct.findById(bidId).populate("bidder");
    if (!bid) {
      req.flash("error", "Bid not found.");
      return res.redirect("back");
    }

    const subscription = await Subscription.findById(bid.auction).populate({
      path: "bids",
      populate: { path: "bidder" },
    });
    if (!subscription) {
      req.flash("error", "Subscription not found.");
      return res.redirect("back");
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Create a dummy Payment record to satisfy the required Payment field
    const dummyPayment = new Payment({
      orderId: `dummy_${Date.now()}`,
      paymentId: "NA",
      buyer: bid.bidder._id,
      signature: "NA",
      amount: 0,
      status: "completed",
    });
    await dummyPayment.save();

    const order = new Order({
      Payment: dummyPayment._id,
      product_id: subscription._id,
      productModel: "Subscription",
      buyer: bid.bidder._id,
      seller: subscription.seller,
      quantity: 1,
      otp: otp,
      amount: bid.bidAmount || 0,
    });
    await order.save();

    subscription.winner = bid.bidder._id;
    subscription.auctionStatus = "completed";
    subscription.endDate = Date.now();
    subscription.orderId = order._id;
    await subscription.save();

    await emailService.sendOtpEmail(bid.bidder.email, otp);

    if (bid.bidAmount !== null) {
      const otherBids = subscription.bids.filter(
        (otherBid) => otherBid._id.toString() !== bidId && otherBid.bidAmount
      );

      await Promise.all(
        otherBids.map(async (otherBid) => {
          await initiateRefund(otherBid.paymentId, otherBid.bidAmount);
        })
      );
    } else {
      const otherBids = subscription.bids.filter(
        (otherBid) => otherBid.bidAmount
      );

      await Promise.all(
        otherBids.map(async (otherBid) => {
          await initiateRefund(otherBid.paymentId, otherBid.bidAmount);
        })
      );
    }

    const bidTypeMessage =
      bid.bidAmount !== null
        ? `Monetary bid accepted! Winner is ${bid.bidder.fullName}. Other bids refunded.`
        : `Subscription swap accepted! ${bid.bidder.fullName} will contact you.`;

    req.flash("success", bidTypeMessage);
    res.redirect(`/subscription/buy/${subscription._id}`);
  } catch (error) {
    console.error("Error accepting subscription bid:", error);
    req.flash("error", "Failed to accept subscription bid.");
    res.redirect("back");
  }
};
