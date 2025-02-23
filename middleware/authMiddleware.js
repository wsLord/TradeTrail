// const jwt = require("jsonwebtoken");
// const User = require("../models/userModel");

// const protectRoute = async (req, res, next) => {
//   try {
//     // Ensure cookies are properly parsed
//     const token = req.cookies?.jwt;

//     if (!token) {
//       return res
//         .status(401)
//         .json({ message: "Unauthorized - No Token Provided" });
//     }

//     // Verify JWT
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     if (!decoded) {
//       return res.status(401).json({ message: "Unauthorized - Invalid Token" });
//     }

//     // Find user in the database
//     const user = await User.findById(decoded.userId).select("-password");
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Attach user object to the request
//     req.user = user;
//     next();
//   } catch (error) {
//     console.error("Error in protectRoute middleware:", error.message);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// module.exports = { protectRoute };

// // const jwt = require("jsonwebtoken");
// // const User = require("../models/userModel");

// // exports.authenticateUser = async (req, res, next) => {
// //   try {
// //     const token = req.cookies.jwt; // Get token from cookies

// //     console.log("JWT Token:", token); // Debug: Check if token exists

// //     if (!token) {
// //       console.log("No token found.");
// //       return res.redirect("/api/auth/login");
// //     }

// //     const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify JWT
// //     console.log("Decoded Token:", decoded);

// //     // Check if decoded object has 'userId' instead of 'id'
// //     const user = await User.findById(decoded.userId).select("-password"); // Fetch user, exclude password
// //     if (!user) {
// //       console.log("User not found in database.");
// //       return res.redirect("/api/auth/login");
// //     }

// //     req.user = user; // Attach user to request
// //     console.log("Authenticated User:", req.user);
// //     next();
// //   } catch (error) {
// //     console.error("Authentication error:", error);
// //     res.redirect("/api/auth/login");
// //   }
// // };

// const jwt = require("jsonwebtoken");
// const User = require("../models/userModel");

// const protectRoute = async (req, res, next) => {
//   try {
//     // console.log("Cookies:", req.cookies);

//     const token = req.cookies?.jwt;
//     if (!token) {
//       console.log("No Token Found");
//       return res.status(401).json({ message: "Unauthorized - No Token Provided" });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     // console.log("Decoded Token:", decoded);

//     if (!decoded || !decoded.userId) {
//       console.log("Invalid Token Data");
//       return res.status(401).json({ message: "Unauthorized - Invalid Token" });
//     }

//     // Fetch user from MongoDB
//     const user = await User.findById(decoded.userId).select("-password");
    
//     // console.log("User Fetched from DB:", user); // ✅ Debugging line

//     if (!user) {
//       console.log("User Not Found in Database");
//       return res.status(404).json({ message: "User not found" });
//     }

//     req.user = user;
//     next();
//   } catch (error) {
//     console.error("Error in protectRoute middleware:", error.message);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// module.exports = { protectRoute };

const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const protectRoute = async (req, res, next) => {
  try {
    // console.log("Cookies received:", req.cookies); // Debugging line

    const token = req.cookies?.jwt;
    if (!token) {
      console.log("❌ No Token Found in Cookies");
      return res.status(401).json({ message: "Unauthorized - No Token Provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log("✅ Decoded Token:", decoded);

    if (!decoded || !decoded.userId) {
      console.log("❌ Invalid Token Structure: Missing userId");
      return res.status(401).json({ message: "Unauthorized - Invalid Token" });
    }

    // Fetch user from MongoDB
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      console.log("❌ User Not Found in Database");
      return res.status(404).json({ message: "User not found" });
    }

    // console.log("✅ User Authenticated:", user.fullName); // User successfully found

    req.user = user; // ✅ Ensure this is set
    // console.log("✅ req.user SET:", req.user);
    next();
  } catch (error) {
    console.error("🚨 Error in protectRoute middleware:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { protectRoute };
