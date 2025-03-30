const dotenv = require("dotenv");
dotenv.config(); // Load environment variables

const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser"); // Ensure cookies are parsed
const session = require("express-session");
const flash = require("connect-flash");
 
const Razorpay= require('razorpay');
const fs= require('fs');

const multer = require("multer");

const bodyParser = require("body-parser");
const { default: ollama } = require('ollama');


// Connect to MongoDB
const connectToMongoDB = require("./config/mongoose");

// Import routes
const authRoutes = require("./routes/authRoutes"); // ✅ ADD THIS
const secondHandRoutes = require("./routes/secondHandRoutes");
const rentingRoutes = require("./routes/rentingRoutes");
const profileRoutes = require("./routes/profileRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const cartRoutes = require('./routes/cartRoutes');
const chatRoutes = require("./routes/chatRoutes");

// const rentalCartRoutes = require("./routes/rentalCartRoutes");
// const secondHandCartRoutes = require("./routes/secondHandCartRoutes");
// const subscriptionCartRoutes = require("./routes/subscriptionCartRoutes");

const paymentRoutes = require("./routes/paymentRoutes");

const cron = require('node-cron');
const User = require('./models/userModel');

const paymentSecondRoutes=require("./routes/paymentsecondhandRoutes");
const paymentSubscriptionRoutes=require("./routes/paymentSubscriptionRoutes");

// Daily cleanup at 3 AM of unverified accounts whose verification emails bounce back 
cron.schedule('0 3 * * *', async () => {
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
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Multer setup
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/"); // Ensure this folder exists
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
//   },
// });
// const upload = multer({ storage: storage });

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Static folder to serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Session middleware (already set up)
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

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // ✅ Required for JWT authentication
app.use(express.static(path.join(__dirname, "public")));
app.use('/assets', express.static(path.join(__dirname, 'assets')));


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
const cors = require('cors');
app.use(cors());


// Set up EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/api/chat", chatRoutes);

// ✅ Register Routes
app.use("/api/auth", authRoutes); // ✅ FIX: Include auth routes
app.use("/secondHand", secondHandRoutes);
app.use("/rental", rentingRoutes);
app.use("/", profileRoutes);
app.use("/subscription", subscriptionRoutes);
app.use('/cart', cartRoutes);


app.use("/api/payment", paymentRoutes);
// app.use("/rental/cart", rentalCartRoutes);
// app.use("/subscription/cart", subscriptionCartRoutes);
// app.use("/secondHand/cart", secondHandCartRoutes);

app.use("/secondHand/api/payment", paymentSecondRoutes);
app.use("/subscription/api/payment", paymentSubscriptionRoutes);
app.get("/", (req, res) => {
  res.render("home", {
    pageTitle: "Home",
    activePage: "home" 
}); 
});




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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render("error", {
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).render("404");
});
