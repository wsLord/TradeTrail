const express = require("express");
const { signup, login, checkAuth, resendVerificationEmail } = require("../controllers/authController");
const { protectRoute } = require("../middleware/authMiddleware");
const User = require("../models/userModel"); 
const { sendWelcomeEmail } = require("../services/emailService");
const { OAuth2Client } = require('google-auth-library');
const { generateToken } = require("../lib/utils");
const axios = require('axios');

const router = express.Router();

// Google OAuth
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

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

router.get('/google', (req, res) => {
  const url = googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email'],
    redirect_uri: process.env.GOOGLE_REDIRECT_URI
  });
  res.redirect(url);
});

router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await googleClient.getToken({
      code,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI
    });
    
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const { sub: googleId, email, name } = ticket.getPayload();
    
    let user = await User.findOne({ 
      $or: [{ googleId }, { email }] 
    });

    if (!user) {
      user = await User.create({
        fullName: name,
        email,
        googleId,
        isVerified: true,
        password: undefined // Explicitly set password as undefined
      });
    } else if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }

    generateToken(user._id, res);
    res.redirect('/');
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.redirect('/api/auth/login?error=Google+login+failed');
  }
});

// Facebook OAuth
router.get('/facebook', (req, res) => {
  const authUrl = `https://www.facebook.com/v12.0/dialog/oauth?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${process.env.FACEBOOK_REDIRECT_URI}&scope=email`;
  res.redirect(authUrl);
});

router.get('/facebook/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    // Exchange code for access token
    const { data } = await axios.get('https://graph.facebook.com/v12.0/oauth/access_token', {
      params: {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
        code
      }
    });

    // Get user profile
    const { data: profile } = await axios.get('https://graph.facebook.com/me', {
      params: {
        fields: 'id,name,email',
        access_token: data.access_token
      }
    });

    let user = await User.findOne({ 
      $or: [{ facebookId: profile.id }, { email: profile.email }] 
    });

    if (!user) {
      user = await User.create({
        fullName: profile.name,
        email: profile.email,
        facebookId: profile.id,
        isVerified: true,
        password: undefined // Explicitly set password as undefined
      });
    } else if (!user.facebookId) {
      user.facebookId = profile.id;
      await user.save();
    }

    generateToken(user._id, res);
    res.redirect('/');
  } catch (error) {
    console.error('Facebook OAuth error:', error.response?.data || error);
    res.redirect('/api/auth/login?error=Facebook+login+failed');
  }
});


module.exports = router;
