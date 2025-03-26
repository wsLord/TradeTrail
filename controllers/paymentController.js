const Razorpay = require("razorpay");
const crypto = require("crypto");
const dotenv = require("dotenv");
dotenv.config();
const payment = require("../models/payment");
const Product = require("../models/product");
const RentalProduct = require("../models/rentalProduct");
const RentalBooking = require("../models/rentalBooking");
const Ott = require("../models/ott");
const Cart = require("../models/cartModel");
const emailService = require("../services/emailService");

// Initialize Razorpay with your test keys
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID, // Using your test key directly
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

console.log(process.env.RAZORPAY_KEY_ID);

exports.makePayment = async (req, res) => {
  console.log("hit");
  try {
    const { section } = req.body; // Amount from the frontend
    console.log("te", req.body);

    // Find user's cart and get relevant product details
    const cart = await Cart.findOne({ user: req.user._id });

    // Filter products based on the section and product IDs
    const filteredProducts = cart.items.filter(
      (item) =>
        item.productType === section &&
        productIds.includes(item.product.toString())
    );

    if (filteredProducts.length === 0) {
      return res
        .status(404)
        .json({
          success: false,
          message: `No ${section} products found in your cart.`,
        });
    }

    let sectionTotal=0;
    let sectionDeposit=0;
    filteredProducts.forEach((item) => {
      let totalPrice = 0;
      let itemDeposit = 0;
      if (sectionName === "Rental") {
        totalPrice = item.calculatedPrice * item.quantity;
        itemDeposit = item.securityDeposit;
        sectionDeposit += itemDeposit;
      } else {
        totalPrice = item.product.price * item.quantity;
      }
      sectionTotal += totalPrice;
    });
    let amount=sectionTotal+sectionDeposit;

    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid amount" });
    }

    const options = {
      amount: amount * 100, // Convert to paise (₹1 = 100 paise)
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    };
    console.log(options);

    const order = await razorpayInstance.orders.create(options);
    console.log("order", order);

    res.json({
      success: true,
      options: {
        key: process.env.RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "TradeTrail",
        description: "Payment",
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
  res.render("cart/unifiedCart", {
    razorpayKeyId: process.env.RAZORPAY_KEY_ID, // Using your test key directly
  });
};

exports.verifyPayment = async (req, res) => {
  console.log("verify");
  try {
    console.log("Received verification request:", req.body);

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

    console.log("Expected signature:", expectedSign);
    console.log("Received signature:", razorpay_signature);

    if (razorpay_signature !== expectedSign) {
      console.log("Signature verification failed!");
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    //payment verification done
    console.log('Payment verified');

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("Generated OTP:", otp);

    // Send OTP to buyer via email
    await emailService.sendOtpEmail(req.user.email, otp);

    // Update each product with the generated OTP so the seller can view it later.
    // We try to update the product in each collection (RentalProduct, Ott, Product)
    for (const productId of productIds) {
      let updated = false;
      const rental = await RentalProduct.findById(productId);
      if (rental) {
        await RentalProduct.findByIdAndUpdate(productId, { otp });
        updated = true;
      }
      const subscription = await Ott.findById(productId);
      if (subscription) {
        await Ott.findByIdAndUpdate(productId, { otp });
        updated = true;
      }
      const secondHand = await Product.findById(productId);
      if (secondHand) {
        await Product.findByIdAndUpdate(productId, { otp });
        updated = true;
      }
      if (!updated) {
        console.log(`Product ${productId} not found in any model.`);
      }
    }

    // Save the payment details in the database
    const newPayment = new payment({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      buyer: req.user._id,
      signature: razorpay_signature,
      amount: parseFloat(amount || 0),
      status: "completed",
    });

    console.log("Saving payment:", newPayment);
    await newPayment.save();

    // Find user's cart and get relevant product details
    const cart = await Cart.findOne({ user: req.user._id });

    // Filter products based on the section and product IDs
    const filteredProducts = cart.items.filter(
      (item) =>
        item.productType === section &&
        productIds.includes(item.product.toString())
    );

    if (filteredProducts.length === 0) {
      return res
        .status(404)
        .json({
          success: false,
          message: `No ${section} products found in your cart.`,
        });
    }

    // Update the buyer field for each product and handle rentals if necessary
    await Promise.all(
      filteredProducts.map(async (item) => {
        try {
          let model;
          // Identify the correct model based on productType
          if (section === "Rental") model = RentalProduct;
          else if (section === "Subscription") model = Ott;
          else if (section === "SecondHand") model = Product;

          // Update the product with buyer info
          await model.findByIdAndUpdate(item.product, {
            $set: { buyer: req.user._id },
          });

          console.log(`Buyer updated for product ${item.product}`);

          // For rentals, create a booking entry
          if (section === "Rental") {
            const booking = new RentalBooking({
              product: item.product,
              user: req.user._id,
              rentalStart: item.rentalStart || new Date(),
              rentalEnd: item.rentalEnd,
              status: "active",
            });
            await booking.save();
            console.log(`Rental booking created for product ${item.product}`);
          }
        } catch (error) {
          console.error(`Error updating product ${item.product}:`, error);
        }
      })
    );

    // ✅ Remove the products from the cart after successful payment
    cart.items = cart.items.filter(
      (item) =>
        !(
          item.productType === section &&
          productIds.includes(item.product.toString())
        )
    );
    await cart.save();
    console.log("Products removed from the cart.");

    return res.json({
      success: true,
      redirectUrl: `/api/payment/success?paymentId=${razorpay_payment_id}`,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res
      .status(500)
      .json({ success: false, message: "Payment verification failed" });
  }
};

exports.paymentSuccess = (req, res) => {
  const paymentId = req.query.paymentId || "N/A";
  res.render("cart/success", { paymentId });
};
