const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const { protectRoute } = require("../middleware/authMiddleware");

// Cart Status Route
router.get("/", protectRoute, cartController.getCart);
router.post("/update/:productId", protectRoute, require("../controllers/rentingController").updateCart);

module.exports = router;
