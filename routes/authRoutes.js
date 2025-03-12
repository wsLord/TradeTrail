const express = require("express");
const { signup, login, checkAuth, resendVerificationEmail } = require("../controllers/authController");
const { protectRoute } = require("../middleware/authMiddleware");
const User = require("../models/userModel"); 
const { sendWelcomeEmail } = require("../services/emailService");

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

router.get('/verify-email', async (req, res) => {
  try {
    const user = await User.findOne({
      verificationToken: req.query.token,
      verificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).render('verification-error');
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    // Now send the welcome email
    await sendWelcomeEmail(user.email, user.fullName);
    
    res.render('verification-success');
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).render('verification-error');
  }
});

router.post('/resend-verification', resendVerificationEmail);


module.exports = router;
