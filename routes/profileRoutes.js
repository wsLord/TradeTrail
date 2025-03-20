const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const { protectRoute } = require("../middleware/authMiddleware");
const { uploadSingle } = require("../middleware/multerConfig");

router.get("/profile", protectRoute, profileController.getProfile);
router.post("/profile", protectRoute, profileController.updateProfile);
router.post("/profile/picture", protectRoute, uploadSingle, profileController.updateProfilePic);

module.exports = router;