const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentSubscriptionController");
router.post("/createOrder", paymentController.createOrder);
router.post("/verifyPayment", paymentController.verifyPayment);
router.get("/", paymentController.getPaymentPage);
router.get("/payment-success", paymentController.paymentSuccess);
router.get("/test", (req, res) => {
  res.send("Payment API is working!");
});

router.post("/makePayment", paymentController.makePayment);
router.post("/razorpayRefund", paymentController.razorpayRefund);
//router.post('/process', paymentController.processRefund);
// routes/secondHandRoutes.js

// Existing routes...
router.post("/delete-bid/:bidId", async (req, res) => {
  try {
    const bidId = req.params.bidId;
    const bid = await Bid.findById(bidId);

    if (!bid) {
      req.flash("error", "Bid not found");
      return res.redirect("back");
    }

    // Check if this bid belongs to the current user
    if (bid.bidder.toString() !== req.user._id.toString()) {
      req.flash("error", "Unauthorized");
      return res.redirect("back");
    }

    if (bid.razorpay_payment_id) {
      // If there's a payment ID, redirect to the refund controller
      return res.redirect(307, `/subscription/delete-bid/${bidId}`);
    } else {
      // If no payment was made or it's a product bid, just delete the bid
      await Bid.findByIdAndDelete(bidId);
      req.flash("success", "Bid deleted successfully");
      return res.redirect("back");
    }
  } catch (error) {
    console.error("Error deleting bid:", error);
    req.flash("error", "Error deleting bid");
    return res.redirect("back");
  }
});
module.exports = router;
