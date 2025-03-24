const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

// In protectRoute middleware (authMiddleware.js)
const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies?.jwt;
    // if (!token) return res.status(401).json({ message: "Unauthorized" });
    if (!token) return res.redirect("/api/auth/signup");  // if no token

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    
    // if (!user) return res.status(401).json({ message: "User not found" });
    // if (!user.isVerified) return res.status(403).json({ message: "Email not verified" });

    if (!user) return res.redirect("/api/auth/signup"); // if user not found
    if (!user.isVerified) return res.redirect("/api/auth/signup"); // if email not verified

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    // res.status(500).json({ message: "Internal server error" });
    res.redirect("/api/auth/signup"); // if any auth error
  }
};

module.exports = { protectRoute };



