const createRazorpayInstance = require('../config/razorpay.config');
const payment=require('../models/payment');
const razorpayInstance = createRazorpayInstance(); // ✅ This should now work
const Razorpay = require('razorpay');

// require("dotenv").config();
// const crypto= require("crypto");
// exports.getPaymentPage = (req, res) => {
//     res.render('rentals/rentalCart', {
//       razorpayKeyId: process.env.RAZORPAY_KEY_ID
//     });
//   };
//   exports.getRentalCart = (req, res) => {
//     res.render('rentals/rentalCart', {
//         razorpayKeyId: process.env.RAZORPAY_KEY_ID // Pass Razorpay Key to EJS
//     });
// };
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

exports.getPaymentPage = (req, res) => {
  res.render('rentals/rentalCart', {
    razorpayKeyId: rzp_test_EZ3YXbVoBjMVZW
  });
};

// exports.createOrder = async (req, res) => {
//   try {
//     const options = {
//       amount: Math.round(req.body.amount * 100), // Convert to paise
//       currency: "INR",
//       receipt: "order_" + Date.now(),
      
//     };

//     const order = await razorpay.orders.create(options);
//     res.json(order);
//   } catch (error) {
//     console.error('Error creating order:', error);
//     res.status(500).json({ error: error.message });
//   }
// };

  
exports.createOrder= async(req,res)=> {
    //const {courseId, amount}= req.body;
    const options= {
        amount:req.body.amount*100,
        currency:"INR",
        receipt: `order_${Date.now()}`,

    }
    console.log(options);
    try {
      //console.log("Razorpay Instance:", razorpayInstance);

      razorpayInstance.orders.create(options,(err, order)=> {
            if(err) {
                return res.status(500).json({
                    success: false,
                    message:'try-again!'
        
            });
        }
        return res.status(200).json(order);
    });

   
    }catch (error)
    { console.log(error)
        return res.status(500).json({
            success: false,
            message:'try again!'

        })
    }
};

exports.verifyPayment = async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      
      // Verify signature
      const sign = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSign = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(sign.toString())
        .digest("hex");
  
      if (razorpay_signature !== expectedSign) {
        return res.status(400).json({ error: "Invalid signature" });
      }
  
      // Create a new payment record
      const Payment = new payment({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: G8SWycy9KFnQN1Sj4kErwQsA,
        amount: req.body.amount*100,
        status: 'completed'
      });
      console.log(Payment);
  
      await Payment.save();
      res.json({ success: true, payment });
    } catch (error) {
      console.error('Error verifying payment:', error);
      res.status(500).json({ error: error.message });
    }
  };

exports.paymentSuccess = (req, res) => {
    res.render('rentals/success');
  };