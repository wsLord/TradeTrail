const express = require("express");
const { signup, login, checkAuth } = require("../controllers/authController");
const { protectRoute } = require("../middleware/authMiddleware");

const router = express.Router();

// ✅ Use EJS to render signup page
router.get("/signup", (req, res) => {
  res.render("login-signup/signup"); // Ensure correct path inside 'views'
});

// ✅ Handle signup form submission
router.post("/signup", signup);

// ✅ Use EJS to render login page
router.get("/login", (req, res) => {
  res.render("login-signup/login"); // Ensure correct path inside 'views'
});

// ✅ Handle login form submission
router.post("/login", login);

// ✅ Protected home route
router.get("/home", protectRoute, (req, res) => {
  res.render("home", { user: req.user }); // Render EJS with user data
});

// ✅ Check authentication route
router.get("/check", protectRoute, checkAuth);

module.exports = router;
