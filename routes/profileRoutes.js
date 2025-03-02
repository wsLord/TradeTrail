// routes/profileRoutes.js
const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");

// Route to render the profile page
router.get("/profile", profileController.getProfile);

module.exports = router;