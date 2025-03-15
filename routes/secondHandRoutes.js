const express = require("express");
const router = express.Router();
const { protectRoute } = require("../middleware/authMiddleware");
const secondHandController = require("../controllers/secondHandController");

router.get("/", secondHandController.getHome);

// Sell routes
router.get("/sell", protectRoute, secondHandController.getPostType);
router.get("/sell/direct-add-product", protectRoute, secondHandController.getDirectAddProduct);
router.post("/sell/direct-add-product", protectRoute, secondHandController.postDirectAddProduct);
router.get("/sell/add-product", protectRoute, secondHandController.getAddProduct);
router.post("/sell/add-product", protectRoute, secondHandController.postAddProduct);

router.post("/add-to-cart/:productId", protectRoute, secondHandController.addToCart);



// Product browsing and bidding
router.get("/buy", protectRoute, secondHandController.getProducts);
router.get("/buy/:productId", protectRoute, secondHandController.getProduct);

// Bidding routes
router.post("/delete-bid/:bidId", protectRoute, secondHandController.deleteBid);
router.get("/buy/:productId/add-bid-product", protectRoute, secondHandController.getAddBidProduct);
router.post("/buy/:productId/add-bid-product", protectRoute, secondHandController.postAddBidProduct);

module.exports = router;