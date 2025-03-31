const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("connect-flash");

const Razorpay = require("razorpay");
const fs = require("fs");

const multer = require("multer");

const bodyParser = require("body-parser");
const { default: ollama } = require("ollama");

const connectToMongoDB = require("./config/mongoose");

// Import routes
const authRoutes = require("./routes/authRoutes");
const secondHandRoutes = require("./routes/secondHandRoutes");
const rentingRoutes = require("./routes/rentingRoutes");
const profileRoutes = require("./routes/profileRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const cartRoutes = require("./routes/cartRoutes");
const chatRoutes = require("./routes/chatRoutes");

const paymentRoutes = require("./routes/paymentRoutes");

const cron = require("node-cron");
const User = require("./models/userModel");

const paymentSecondRoutes = require("./routes/paymentsecondhandRoutes");
const paymentSubscriptionRoutes = require("./routes/paymentSubscriptionRoutes");

// Daily cleanup at 3 AM of unverified accounts whose verification emails bounce back
cron.schedule("0 3 * * *", async () => {
  try {
    await User.deleteMany({
      isVerified: false,
      createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });
    console.log("Cleaned up unverified accounts");
  } catch (error) {
    console.error("Cleanup error:", error);
  }
});

const app = express();
const PORT = process.env.PORT || 8000;

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

// Flash middleware
app.use(flash());

// Make flash messages available in all views
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // ✅ Required for JWT authentication
app.use(express.static(path.join(__dirname, "public")));
app.use("/assets", express.static(path.join(__dirname, "assets")));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const cors = require("cors");
app.use(cors());

// Set up EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/api/chat", chatRoutes);

// Register Routes
app.use("/api/auth", authRoutes);
app.use("/secondHand", secondHandRoutes);
app.use("/rental", rentingRoutes);
app.use("/", profileRoutes);
app.use("/subscription", subscriptionRoutes);
app.use("/cart", cartRoutes);

app.use("/api/payment", paymentRoutes);

app.use("/secondHand/api/payment", paymentSecondRoutes);
app.use("/subscription/api/payment", paymentSubscriptionRoutes);
app.get("/", (req, res) => {
  res.render("home", {
    pageTitle: "Home",
    activePage: "home",
  });
});

connectToMongoDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB. Server not started.", err);
  });

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render("error", {
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

app.use((req, res) => {
  res.status(404).render("404");
});
