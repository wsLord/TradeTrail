// controllers/profileController.js
const User = require("../models/userModel");
const Product = require("../models/product");
const RentalProduct = require("../models/rentalProduct");
const BidProduct = require("../models/bidproduct");
const axios = require("axios");

const Payment = require("../models/payment");

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
    console.log("the entering auction detaiils");
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

    console.log("these are bids",monetaryBids);
    // Extract payment IDs from bids that have a paymentId
    // const paymentIDs = bids
    //   .filter((bid) => bid.paymentId) // Only keep bids where paymentId exists
    //   .map((bid) => bid.paymentId);  // Extract paymentId values
 
    res.render("auction-details", {
      product,
      monetaryBids,
      productBids,
      // Pass the payment IDs to the template
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
    const product = await Product.findById(bid.auction).populate("bids");
    if (!product) {
      req.flash("error", "Product not found.");
      return res.redirect("back");
    }

    // Set the winner and update status to completed
    product.winner = bid.bidder._id;
    product.auctionStatus = "completed";
    await product.save();

    // Process refunds for other monetary bids
    if (bid.bidAmount !== null) {
      const otherBids = product.bids.filter(
        (otherBid) => otherBid._id.toString() !== bidId && otherBid.bidAmount
      );

      // for (const otherBid of otherBids) {
      //   console.log("all done successfully");
      //   await initiateRefund(otherBid.paymentId, otherBid.bidAmount);
      //   console.log("all doneedoneee");
      // }
      // Process refunds for all other bids concurrently
     await Promise.all(
        otherBids.map(async (otherBid) => {
           console.log(`Processing refund for Payment ID: ${otherBid.paymentId}`);
           await initiateRefund(otherBid.paymentId, otherBid.bidAmount);
            console.log(`Refund completed for Payment ID: ${otherBid.paymentId}`);
         })
     );

    }

    // Flash success message
    const bidTypeMessage =
      bid.bidAmount !== null
        ? `Monetary bid accepted! Winner is ${bid.bidder.fullName}. Other bids have been refunded.`
        : `Product bid accepted! Winner is ${bid.bidder.fullName}.`;

        console.log("flash message aarha h");

    req.flash("success", bidTypeMessage);
    console.log("hoagyajsdkj");
    res.redirect(`/secondHand/buy/${product._id}`);
  } catch (error) {
    console.error("Error accepting bid:", error);
    req.flash("error", "An error occurred while accepting the bid.");
    // res.redirect('/');
  }
};

// Function to handle Razorpay refund
const initiateRefund = async (paymentId, amount) => {
  console.log(paymentId);
  console.log(amount);
  if (!paymentId) {
    console.log(`${paymentId} toh hai`);
    console.error("Refund failed: Missing payment ID");
    return;
  }

  if (!amount || isNaN(amount) || amount <= 0) {
    console.log("amount bhi zero nhi h");
    console.error("Refund failed: Invalid amount", amount);
    return;
  }

  console.log(`Initiating refund for payment: ${paymentId}, amount: ${amount}`);

  try {
    // Razorpay API authentication
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
        amount: Math.floor(amount * 100 * 0.9), // Convert to paise
        notes: { reason: "Bid refund due to another bid being accepted" },
        speed: "normal",
      },
    });

    const refundData = response.data;
    console.log("Refund successful:", refundData);

    // Update payment record
    const paymentRecord = await Payment.findOne({ paymentId: paymentId });
    if (paymentRecord) {
      paymentRecord.status = "refunded";
      paymentRecord.refundId = refundData.id;
      paymentRecord.refundedAt = new Date();
      paymentRecord.refundAmount = amount;
      await paymentRecord.save();
      console.log(`Payment record updated to refunded. ID: ${paymentId}`);
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
