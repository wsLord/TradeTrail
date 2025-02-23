const dotenv = require("dotenv");
dotenv.config(); // Load environment variables

const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser"); // Ensure cookies are parsed

// Connect to MongoDB
const connectToMongoDB = require("./config/mongoose");

// Import routes
const authRoutes = require("./routes/authRoutes"); // ✅ ADD THIS
const secondHandRoutes = require("./routes/secondHandRoutes");
// const rentingRoutes = require("./routes/rentingRoutes"); // Ensure this file exists

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // ✅ Required for JWT authentication
app.use(express.static(path.join(__dirname, "public")));

// Set up EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ✅ Register Routes
app.use("/api/auth", authRoutes); // ✅ FIX: Include auth routes
app.use("/secondHand", secondHandRoutes);
// app.use("/", rentingRoutes);

// Connect to MongoDB **before** starting the server
connectToMongoDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB. Server not started.", err);
  });
