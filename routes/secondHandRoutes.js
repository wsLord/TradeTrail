const express = require("express");
const router = express.Router();
const { protectRoute } = require("../middleware/authmiddleware");
const secondHandController = require("../controllers/secondHandController");

router.get("/", secondHandController.getHome);
router.get("/sell", secondHandController.getAddProduct);
router.post("/sell", protectRoute, secondHandController.postAddProduct);
router.get("/buy", protectRoute, secondHandController.getProducts);
// router.get("/buy/:productId", secondHandController.getProduct); //auction page
router.get("/buy/:productId", protectRoute, secondHandController.getProduct); // Ensure protectRoute is used

// Existing routes for product-based bidding
router.get(
  "/buy/:productId/add-bid-product",
  protectRoute,
  secondHandController.getAddBidProduct
);
router.post(
  "/buy/:productId/add-bid-product",
  protectRoute,
  secondHandController.postAddBidProduct
);

module.exports = router;
