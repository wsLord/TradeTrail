const express = require("express");
const rentingController = require("../controllers/rentingController");
const { protectRoute } = require("../middleware/authMiddleware");
const { uploadMultiple } = require("../middleware/multerConfig");

const router = express.Router();

router.get("/", rentingController.getHome);

router.get("/post", protectRoute, rentingController.getAddProduct);

router.post(
  "/post",
  uploadMultiple,
  protectRoute,
  rentingController.postAddProduct
);

router.get(
  "/details/:productId",
  protectRoute,
  rentingController.getProductDetails
);

router.get("/rent", protectRoute, rentingController.getRentItems);

router.post("/buy/:productId", protectRoute, rentingController.buyProduct);

router.post("/add-to-cart/:productId", protectRoute, (req, res) => {
  req.body = {
    ...req.body,
    rentalStart: req.body.rentalStart,
    rentalEnd: req.body.rentalEnd,
  };
  rentingController.addToCart(req, res);
});

router.post(
  "/update-cart/:productId",
  protectRoute,
  rentingController.updateCart
);

router.post("/rent/:productId", protectRoute, rentingController.rentProduct);

module.exports = router;
