const express = require("express");
const router = express.Router();
const secondHandCartController = require("../controllers/secondHandCartController");
const { protectRoute } = require("../middleware/authMiddleware");

// Route to get the cart
router.get("/", protectRoute, secondHandCartController.getCart);

// Route to update the cart item quantity
router.post("/update/:productId", protectRoute, secondHandCartController.updateCart);

// Route to delete an item from the cart
router.post("/delete-item/:id", protectRoute, secondHandCartController.deleteCartItem);

module.exports = router;
