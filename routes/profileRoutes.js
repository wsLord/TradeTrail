const express = require("express");
const profileController = require("../controllers/profileController");
const { protectRoute } = require("../middleware/authMiddleware");
const { uploadSingle } = require("../middleware/multerConfig");

const router = express.Router();

router.get("/profile", protectRoute, profileController.getProfile);
router.post("/profile", protectRoute, profileController.updateProfile);
router.post(
  "/profile/change-password",
  protectRoute,
  profileController.changePassword
);
router.post(
  "/profile/picture",
  protectRoute,
  uploadSingle,
  profileController.updateProfilePic
);
router.get(
  "/profile/auction/:productId",
  protectRoute,
  profileController.getAuctionDetails
);
router.get(
  "/profile/rentals/:productId",
  protectRoute,
  profileController.getRentalDetails
);
router.get(
  "/profile/secondHand/:productId",
  protectRoute,
  profileController.getSecondHandDetails
);
router.get(
  "/profile/subscription/:productId",
  protectRoute,
  profileController.getSubscriptionDetails
);

router.post(
  "/profile/secondHand/accept-bid",
  protectRoute,
  profileController.acceptBid
);

router.post(
  "/profile/subscription/accept-bid",
  protectRoute,
  profileController.acceptSubscriptionBid
);

router.get(
  "/profile/subscription-auction/:productId",
  protectRoute,
  profileController.getSubscriptionAuctionDetails
);

// Add new route
router.post("/api/verify-otp", protectRoute, profileController.verifyOTP);

module.exports = router;
