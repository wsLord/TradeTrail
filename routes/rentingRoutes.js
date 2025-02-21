const express = require("express");
const router = express.Router();
const rentingController = require("../controllers/rentingController");

router.get("/", rentingController.getHome);
router.get("/post", rentingController.getAddProduct);
// router.post("/post", secondHandController.postAddProduct);

module.exports = router;
