const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscriptionController");
const subscriptionCartController = require("../controllers/subscriptionCartController");
const { protectRoute } = require("../middleware/authMiddleware");
router.get("/", subscriptionController.getHome);
router.get("/sell", subscriptionController.getAddProduct);
router.post("/sell", subscriptionController.postAddProduct);
router.get("/buy", subscriptionController.getProducts);
router.post("/add-to-cart/:productId", protectRoute, subscriptionController.addToCart);
//router.post("/add-to-cart", protectRoute, subscriptionController.addToCart);
router.get("/add-to-cart", protectRoute, subscriptionCartController.getCart);
router.post("/update-cart/:productId", protectRoute, subscriptionController.updateCart);
router.get("/buy/:productId", protectRoute, subscriptionController.getProduct); // Ensure protectRoute is used

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