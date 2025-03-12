const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const crypto = require('crypto');
const { generateToken } = require("../lib/utils");
const { sendLoginNotification } = require('../services/emailService');
const { sendVerificationEmail } = require("../services/emailService");
const dns = require('dns').promises;


const signup = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  const fullName = `${firstName} ${lastName}`.trim(); // Combine first and last name

  try {
    // Check if all required fields are provided
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }

    // Additional email validation
    try {
      // Check email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      
      // Check that the email domain has MX records
      const domain = email.split('@')[1];
      await dns.resolveMx(domain);
    } catch (error) {
      return res.status(400).json({ message: "Invalid email domain" });
    }

    // Check password length
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate verification token and expiration
    const verificationToken = crypto.randomBytes(20).toString('hex');
    const verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // Expires in 24 hours

    // Create new user with verification token fields
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      verificationToken,
      verificationExpires,
    });

    await newUser.save(); // Save the new user

    // Send verification email instead of welcome email
    await sendVerificationEmail(newUser.email, verificationToken);

    res.status(201).json({
      message: "Signup successful! Please check your email to verify your account",
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
        email: user.email
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
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
    const verificationToken = crypto.randomBytes(20).toString('hex');
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

module.exports = { signup, login, checkAuth, resendVerificationEmail };
