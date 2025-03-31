const express = require("express");
const { protectRoute } = require("../middleware/authMiddleware");
const { uploadMultiple } = require("../middleware/multerConfig");
const secondHandController = require("../controllers/secondHandController");

const router = express.Router();

router.get("/", secondHandController.getHome);

router.get("/sell", protectRoute, secondHandController.getPostType);
router.get(
  "/sell/direct-add-product",
  protectRoute,
  secondHandController.getDirectAddProduct
);
router.post(
  "/sell/direct-add-product",
  uploadMultiple,
  protectRoute,
  secondHandController.postDirectAddProduct
);
router.get(
  "/sell/add-product",
  protectRoute,
  secondHandController.getAddProduct
);
router.post(
  "/sell/add-product",
  uploadMultiple,
  protectRoute,
  secondHandController.postAddProduct
);

router.post(
  "/add-to-cart/:productId",
  protectRoute,
  secondHandController.addToCart
);

router.get("/buy", protectRoute, secondHandController.getProducts);
router.get("/buy/:productId", protectRoute, secondHandController.getProduct);

router.post("/delete-bid/:bidId", protectRoute, secondHandController.deleteBid);
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
