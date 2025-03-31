const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { generateToken } = require("../lib/utils");
const { sendLoginNotification } = require("../services/emailService");
const { sendVerificationEmail } = require("../services/emailService");
const dns = require("dns").promises;
const {
  sendPasswordResetEmail,
  sendPasswordResetConfirmation,
} = require("../services/emailService");

const signup = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  const fullName = `${firstName} ${lastName}`.trim();

  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }

    try {
      // Check email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // Check that the email domain has MX records
      const domain = email.split("@")[1];
      await dns.resolveMx(domain);
    } catch (error) {
      return res.status(400).json({ message: "Invalid email domain" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Check for existing OAuth users
    const existingOAuthUser = await User.findOne({
      email,
      $or: [{ googleId: { $exists: true } }, { facebookId: { $exists: true } }],
    });

    if (existingOAuthUser) {
      return res.status(400).json({
        message:
          "This email is associated with a social login. Please use Google/Facebook to sign in.",
        shouldUseOAuth: true,
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate verification token and expiration
    const verificationToken = crypto.randomBytes(20).toString("hex");
    const verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // Expires in 24 hours

    // Create new user with verification token fields
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      verificationToken,
      verificationExpires,
    });

    await newUser.save();

    // Send verification email
    await sendVerificationEmail(newUser.email, verificationToken);

    res.status(201).json({
      message:
        "Signup successful! Please check your email to verify your account",
      _id: newUser._id,
    });
  } catch (error) {
    console.log("Error in signup controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(401).json({
        message: "Email not verified - Please check your inbox",
        shouldResend: true,
        email: user.email,
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if the account is OAuth-only (i.e., no password set)
    if (!user.password) {
      return res.status(401).json({
        message:
          "This account uses social login. Please sign in with Google or Facebook.",
        shouldUseOAuth: true,
      });
    }

    // Generate JWT token
    generateToken(user._id, res);
    await sendLoginNotification(user.email, user.fullName);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log("Error in login controller:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const resendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(20).toString("hex");
    const verificationExpires = Date.now() + 24 * 60 * 60 * 1000;

    user.verificationToken = verificationToken;
    user.verificationExpires = verificationExpires;
    await user.save();

    await sendVerificationEmail(user.email, verificationToken);

    res.status(200).json({ message: "Verification email resent successfully" });
  } catch (error) {
    console.log("Error resending verification:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

const logout = (req, res) => {
  try {
    // Clear session first
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }

      // Clear cookies after session is destroyed
      res.clearCookie("connect.sid");
      res.clearCookie("jwt", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
      });

      res.status(200).json({ message: "Logged out successfully" });
    });
  } catch (error) {
    console.log("Error in logout controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "If that email exists, we'll send a reset link." });
    }

    if (!user.isVerified) {
      return res.status(400).json({
        message: "Please verify your email before resetting password",
        shouldResend: true,
        email: user.email,
      });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetExpires = Date.now() + 3600000; // 1 hour

    user.resetToken = resetToken;
    user.resetExpires = resetExpires;
    await user.save();

    await sendPasswordResetEmail(user.email, resetToken);
    res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const user = await User.findOne({
      resetToken: token,
      resetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetToken = undefined;
    user.resetExpires = undefined;
    await user.save();

    await sendPasswordResetConfirmation(user.email, user.fullName);
    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  signup,
  login,
  checkAuth,
  resendVerificationEmail,
  logout,
  forgotPassword,
  resetPassword,
};
