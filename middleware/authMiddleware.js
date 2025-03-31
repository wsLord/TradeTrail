const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies?.jwt;

    if (!token) return res.redirect("/api/auth/signup");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) return res.redirect("/api/auth/signup");
    if (!user.isVerified) return res.redirect("/api/auth/signup");

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error.message);

    res.redirect("/api/auth/signup");
  }
};

module.exports = { protectRoute };
