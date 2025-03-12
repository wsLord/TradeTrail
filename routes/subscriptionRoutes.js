const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscriptionController");
const subscriptionCartController = require("../controllers/subscriptionCartController");
const { protectRoute } = require("../middleware/authMiddleware");

router.get("/", subscriptionController.getHome);

// Protect the sell routes so that req.user is defined
router.get("/sell", protectRoute, subscriptionController.getAddProduct);
router.post("/sell", protectRoute, subscriptionController.postAddProduct);

router.get("/verify-credentials", protectRoute, subscriptionController.getVerifyCredentials);
router.post("/verify-credentials", protectRoute, subscriptionController.postVerifyCredentials);

router.get("/buy", protectRoute, subscriptionController.getProducts);
router.post("/add-to-cart/:productId", protectRoute, subscriptionController.addToCart);
//router.post("/add-to-cart", protectRoute, subscriptionController.addToCart);
router.get("/add-to-cart", protectRoute, subscriptionCartController.getCart);
router.post("/update-cart/:productId", protectRoute, subscriptionController.updateCart);
router.get("/buy/:productId", protectRoute, subscriptionController.getProduct);

router.post(
    "/delete-bid/:bidId",
    protectRoute,
    subscriptionController.deleteBid
  );

router.get(
    "/buy/:productId/add-bid-product",
    protectRoute,
    subscriptionController.getAddBidProduct
);
router.post(
    "/buy/:productId/add-bid-product",
    protectRoute,
    subscriptionController.postAddBidProduct
);

module.exports = router;
