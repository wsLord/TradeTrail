const Razorpay = require("razorpay");
const crypto = require("crypto");
const dotenv = require("dotenv");

dotenv.config();
const payment = require("../models/payment");

const axios = require("axios");

// Initialize Razorpay with your test keys
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.makePayment = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid amount" });
    }

    const options = {
      amount: amount,
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
  res.render("subscriptionSwapping/auction", {
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  });
};

exports.createOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    const amountInPaise = Math.round(amount * 100);

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpayInstance.orders.create(options);

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
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
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

    if (razorpay_signature !== expectedSign) {
      console.log("Signature verification failed!");
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    const newPayment = new payment({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      amount: parseFloat(amount || 0),
      status: "completed",
    });

    await newPayment.save();

    return res.json({
      success: true,
      redirectUrl: "/subscription",
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res
      .status(500)
      .json({ success: false, message: "Payment verification failed" });
  }
};

exports.paymentSuccess = (req, res) => {
  res.render("cart/success");
};

// Handling Razorpay refunds
exports.razorpayRefund = async (req, res) => {
  try {
    const { paymentId, amount, notes } = req.body;

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

    const auth = Buffer.from(
      `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
    ).toString("base64");

    // Direct API call to Razorpay
    const response = await axios({
      method: "POST",
      url: `https://api.razorpay.com/v1/payments/${paymentId}/refund`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      data: {
        amount: Math.floor(amount * 0.9),
        notes: notes || { reason: "Refund requested by user" },
        speed: "normal",
      },
    });

    const refundData = response.data;

    try {
      const paymentRecord = await payment.findOne({ paymentId: paymentId });
      if (paymentRecord) {
        paymentRecord.status = "refunded";
        paymentRecord.refundId = refundData.id;
        paymentRecord.refundedAt = new Date();
        paymentRecord.refundAmount = amount / 100;
        await paymentRecord.save();
      } else {
        console.warn(`Payment record not found for ID: ${paymentId}`);
      }
    } catch (dbError) {
      console.error("Error updating payment record:", dbError);
    }

    return res.status(200).json({
      success: true,
      message: `Refund initiated successfully with refundID:${refundData.id}`,
      refundId: refundData.id,
      refundDetails: refundData,
    });
  } catch (error) {
    console.error("Razorpay refund error:", error);

    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data.error.description || "Razorpay error",
        error: error.response.data,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error while processing refund",
      error: error.message,
    });
  }
};
