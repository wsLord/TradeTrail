const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscriptionController");
const { protectRoute } = require("../middleware/authMiddleware");

router.get("/", subscriptionController.getHome);

router.get("/sell", protectRoute, subscriptionController.getPostType);
router.get(
  "/sell/direct-add-product",
  protectRoute,
  subscriptionController.getDirectAddProduct
);
router.post(
  "/sell/direct-add-product",
  protectRoute,
  subscriptionController.postDirectAddProduct
);
router.get(
  "/sell/add-product",
  protectRoute,
  subscriptionController.getAddProduct
);
router.post(
  "/sell/add-product",
  protectRoute,
  subscriptionController.postAddProduct
);

router.get(
  "/verify-credentials",
  protectRoute,
  subscriptionController.getVerifyCredentials
);
router.post(
  "/verify-credentials",
  protectRoute,
  subscriptionController.postVerifyCredentials
);

router.get(
  "/direct-verify",
  protectRoute,
  subscriptionController.getDirectVerifyCredentials
);
router.post(
  "/process-direct-verification",
  protectRoute,
  subscriptionController.postDirectVerifyCredentials
);
router.post(
  "/verify-direct-credentials",
  protectRoute,
  subscriptionController.postDirectVerifyCredentials
);

router.get("/buy", protectRoute, subscriptionController.getProducts);
router.post(
  "/add-to-cart/:productId",
  protectRoute,
  subscriptionController.addToCart
);
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
