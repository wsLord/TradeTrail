const express = require("express");
const router = express.Router();
const subscriptionCartController = require("../controllers/subscriptionCartController");
const subscriptionController = require("../controllers/subscriptionController");
const { protectRoute } = require("../middleware/authMiddleware");

// Cart Status Route
router.get("/", protectRoute, subscriptionCartController.getCart);
router.post("/update/:productId", protectRoute, subscriptionController.updateCart);

module.exports = router;