const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const { protectRoute } = require("../middleware/authMiddleware");

router.get("/", protectRoute, cartController.getCart);
router.post("/delete/:itemId", protectRoute, cartController.deleteCartItem);
router.post("/update/:itemId", protectRoute, cartController.updateCart);

module.exports = router;
