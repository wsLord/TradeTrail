const express = require("express");
const paymentController = require("../controllers/paymentController");
const { protectRoute } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/verifyPayment", protectRoute, paymentController.verifyPayment);
router.get("/", paymentController.getPaymentPage);
router.get("/success", paymentController.paymentSuccess);
router.get("/test", (req, res) => {
  res.send("Payment API is working!");
});
router.post("/makePayment", protectRoute, paymentController.makePayment);
module.exports = router;
