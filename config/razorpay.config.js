require("dotenv").config();
const Razorpay = require("razorpay");
const createRazorpayInstance = () => {  // ✅ Correct function syntax
    return new Razorpay({ 
        key_id: process.env.RAZORPAY_KEY_ID, 
        key_secret: process.env.RAZORPAY_KEY_SECRET 
    });
};
console.log("RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID);
console.log("RAZORPAY_KEY_SECRET:", process.env.RAZORPAY_KEY_SECRET);


module.exports = createRazorpayInstance;
