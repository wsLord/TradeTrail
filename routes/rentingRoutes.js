// routes/rentingRoutes.js

const express = require("express");
const router = express.Router();
const rentingController = require("../controllers/rentingController");

// Route to render the homepage for renting (options: post or rent an item)
router.get("/", rentingController.getHome);

// Route to render the form for posting a rental product
router.get("/post", rentingController.getAddProduct);

// Route to handle the form submission for posting a rental product
router.post("/post", rentingController.postAddProduct);

// Route to display rented products (this can be a page where renters can browse items)
router.get("/rent", rentingController.getRentItems);


module.exports = router;
