const Razorpay = require("razorpay");
const crypto = require("crypto");
const dotenv = require("dotenv");

dotenv.config();
const payment = require("../models/payment");
//const Bid = require('../models/bidproduct');
const Bid = require("../models/bid"); // Adjust path as needed
const axios = require("axios");

// Initialize Razorpay with your test keys
const razorpayInstance = new Razorpay({
  
  key_id: process.env.RAZORPAY_KEY_ID, // Using your test key directly
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
// console.log(process.env.RAZORPAY_KEY_ID);

exports.makePayment = async (req, res) => {
  try {
    console.log("Received request body:", req.body); // Debug request body
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid amount" });
    }

    const options = {
      amount: amount, // Keep amount as is, no extra multiplication
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpayInstance.orders.create(options);

    res.json({
      success: true,
      options: {
        key: process.env.RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "TradeTrail",
        description: "Payment for Bidding",
        order_id: order.id,
        theme: { color: "#4F7942" },
        prefill: { email: "customer@example.com", contact: "" },
      },
    });
  } catch (error) {
    console.error("Error in makePayment:", error);
    res.status(500).json({ success: false, message: "Failed to create order" });
  }
};

exports.getPaymentPage = (req, res) => {
  res.render("secondHand/auction", {
    razorpayKeyId: process.env.RAZORPAY_KEY_ID, // Using your test key directly
  });
};

exports.createOrder = async (req, res) => {
  try {
    const { amount } = req.body; // Amount in INR (e.g., 100.50)

    // Convert to paise (smallest currency unit) by multiplying by 100
    const amountInPaise = Math.round(amount * 100);

    const options = {
      amount: amountInPaise, // Already in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    console.log("Creating order with options:", options);
    const order = await razorpayInstance.orders.create(options);
    console.log("Order created:", order);

    res.status(200).json({
      success: true,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({
      success: false,
      message: "Order creation failed",
      error: error.message,
    });
  }
};
exports.verifyPayment = async (req, res) => {
  try {
    console.log("Received verification request:", req.body);

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
      productId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Missing payment details" });
    }

    // Verify Razorpay Signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    console.log("Expected signature:", expectedSign);
    console.log("Received signature:", razorpay_signature);

    if (razorpay_signature !== expectedSign) {
      console.log("Signature verification failed!");
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    // Save the payment details in the database
    const newPayment = new payment({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      amount: parseFloat(amount || 0),
      status: "completed",
    });

    console.log("Saving payment:", newPayment);
    await newPayment.save();

    // req.session.lastPaymentId = razorpay_payment_id;

    return res.json({
      success: true,
      redirectUrl: "/secondHand",
      // paymentId: razorpay_payment_id,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res
      .status(500)
      .json({ success: false, message: "Payment verification failed" });
  }
};

exports.paymentSuccess = (req, res) => {
  res.render("secondHand/auction");
};

// New function for handling Razorpay refunds
exports.razorpayRefund = async (req, res) => {
  try {
    const { paymentId, amount, notes } = req.body;

    // Validate required parameters
    if (!paymentId) {
      console.error("Refund failed: Missing payment ID");
      return res.status(400).json({
        success: false,
        message: "Payment ID is required",
      });
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      console.error("Refund failed: Invalid amount", amount);
      return res.status(400).json({
        success: false,
        message: "Valid amount is required",
      });
    }

    // Log refund attempt
    console.log(
      `Initiating refund for payment: ${paymentId}, amount: ${amount}`
    );

    // Basic auth for Razorpay API - convert key_id:key_secret to base64
    const auth = Buffer.from(
      `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
    ).toString("base64");

    // Make direct API call to Razorpay
    const response = await axios({
      method: "POST",
      url: `https://api.razorpay.com/v1/payments/${paymentId}/refund`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      data: {
        amount: Math.floor(amount * 0.9), // Amount should already be in paise from client
        notes: notes || { reason: "Refund requested by user" },
        speed: "normal", // Can be 'normal' or 'optimum'
      },
    });

    // Get refund details from response
    const refundData = response.data;
    console.log("Refund successful:", refundData);

    // Update payment status in the database
    try {
      const paymentRecord = await payment.findOne({ paymentId: paymentId });
      if (paymentRecord) {
        paymentRecord.status = "refunded";
        paymentRecord.refundId = refundData.id;
        paymentRecord.refundedAt = new Date();
        paymentRecord.refundAmount = amount / 100; // Convert paise to INR for storage
        await paymentRecord.save();
        console.log(
          `Payment record updated to refunded status. ID: ${paymentId}`
        );
      } else {
        console.warn(`Payment record not found for ID: ${paymentId}`);
      }
    } catch (dbError) {
      console.error("Error updating payment record:", dbError);
      // Continue with the response even if DB update fails
    }

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Refund initiated successfully",
      refundId: refundData.id,
      refundDetails: refundData,
    });
  } catch (error) {
    // Log the error
    console.error("Razorpay refund error:", error);

    // Handle axios error responses from Razorpay
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data.error.description || "Razorpay error",
        error: error.response.data,
      });
    }

    // Handle network or other errors
    return res.status(500).json({
      success: false,
      message: "Internal server error while processing refund",
      error: error.message,
    });
  }
};
