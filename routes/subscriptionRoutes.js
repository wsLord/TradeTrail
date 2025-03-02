const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscriptionController");
router.get("/", subscriptionController.getHome);
router.get("/sell", subscriptionController.getAddProduct);
router.post("/sell", subscriptionController.postAddProduct);
router.get("/buy", subscriptionController.getProducts);
module.exports = router;