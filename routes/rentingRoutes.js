const express = require("express");
const router = express.Router();
const rentingController = require("../controllers/rentingController");

router.get("/", rentingController.getHome);

module.exports = router;
