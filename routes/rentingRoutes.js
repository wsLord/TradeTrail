const express = require("express");
const router = express.Router();
const rentingController = require("../controllers/rentingController");
const cartController = require("../controllers/rentalCartController");
const { protectRoute } = require("../middleware/authMiddleware");

// Route to render the homepage for renting (options: post or rent an item)
router.get("/", rentingController.getHome);

// Route to render the form for posting a rental product
router.get("/post", rentingController.getAddProduct);

// Route to handle the form submission for posting a rental product
router.post("/post", rentingController.postAddProduct);

// Product details route
router.get('/details/:productId', rentingController.getProductDetails);

// Route to display rented products (this can be a page where renters can browse items)
router.get("/rent", rentingController.getRentItems);

// Handle the purchase of a rental product (Decrement the quantity)
router.post("/buy/:productId", rentingController.buyProduct);

// Protected route for Add-to-Cart
// router.post("/add-to-cart/:productId", protectRoute, rentingController.addToCart);

router.post("/add-to-cart/:productId", protectRoute, (req, res) => {
    // Modified to handle rental dates
    req.body = {
      ...req.body,
      rentalStart: req.body.rentalStart,
      rentalEnd: req.body.rentalEnd
    };
    rentingController.addToCart(req, res);
  });

// Protected route for Cart Status
router.get("/cart", protectRoute, cartController.getCart);


router.post("/update-cart/:productId", protectRoute, rentingController.updateCart);


// routes/rentingRoutes.js
router.post("/rent/:productId", protectRoute, rentingController.rentProduct);





module.exports = router;
