const express = require("express");
const router = express.Router();
const secondHandController = require("../controllers/secondHandController");

router.get("/", secondHandController.getHome);
router.get("/sell", secondHandController.getAddProduct);
router.post("/sell", secondHandController.postAddProduct);
router.get("/buy", secondHandController.getProducts);
router.get("/buy/:productId", secondHandController.getProduct);//auction page

//bid
router.get("/buy/:productId/add-bid-product", secondHandController.getAddBidProduct);
router.post("/buy/:productId/add-bid-product", secondHandController.postAddBidProduct);

module.exports = router;
