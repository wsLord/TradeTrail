const express = require("express");
const router = express.Router();
const rentalCartController = require("../controllers/rentalCartController");
const { protectRoute } = require("../middleware/authMiddleware");

// Cart Status Route
router.get("/", protectRoute, rentalCartController.getCart);
router.post("/update/:productId", protectRoute, require("../controllers/rentingController").updateCart);

router.post('/delete-item/:id', protectRoute, rentalCartController.deleteCartItem);

module.exports = router;
