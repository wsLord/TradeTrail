const dotenv = require("dotenv");
dotenv.config(); // Load environment variables

const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser"); // Ensure cookies are parsed
const session = require("express-session");
const flash = require("connect-flash");
 
const Razorpay= require('razorpay');
const bodyParser=require('body-parser');
const fs= require('fs');

const multer = require("multer");

const bodyParser = require("body-parser");
const { default: ollama } = require('ollama');

// Predefined responses with redirect paths
const predefinedResponses = {
  "hello": {
      text: "Hello! How can I assist you today?",
      path: null
  },
  // "rent": {
  //     text: "You can rent items by visiting our rental section. Check out the 'Renting Items' feature!",
  //     path: "/rental"
  // },
  // "subscription": {
  //     text: "To swap subscriptions, go to the 'Subscription Swapping' section. Need more help?",
  //     path: "/subscription"
  // },
  "contact": {
      text: "Our contact details are available in the Contact Us section below.",
      path: "/contact"
  },
  "buy": {
      text: "For second-hand items, please visit the 'Second-Hand Buying' section.",
      path: "/secondHand"
  },
  "default": {
      text: "I'm here to help with questions about renting, subscriptions, and second-hand items. Feel free to ask!",
      path: null
  }
};



// Connect to MongoDB
const connectToMongoDB = require("./config/mongoose");

// Import routes
const authRoutes = require("./routes/authRoutes"); // ✅ ADD THIS
const secondHandRoutes = require("./routes/secondHandRoutes");
const rentingRoutes = require("./routes/rentingRoutes");
const profileRoutes = require("./routes/profileRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const cartRoutes = require('./routes/cartRoutes');

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



// Add new chat endpoint before routes
app.post('/api/chat', async (req, res) => {
  try {
      const { message } = req.body;
      const lowerMessage = message.toLowerCase();

      // Check predefined responses first
      const matchedKey = Object.keys(predefinedResponses).find(key => 
          key !== 'default' && lowerMessage.includes(key)
      );

      if(matchedKey) {
          return res.json({
              response: predefinedResponses[matchedKey].text,
              redirect: predefinedResponses[matchedKey].path
          });
      }

      // Use Ollama for other queries
      // const response = await ollama.chat({
      //     model: 'mistral',
      //     messages: [{
      //         role: 'user',
      //         content: `Respond as a concise shopping assistant. Focus on: 
      //         - Item rentals
      //         - Subscription swapping
      //         - Second-hand goods
      //         Keep responses under 2 sentences. Query: "${message}"`
      //     }]
      // });

      const response = await ollama.chat({
        model: 'mistral',
        messages: [{
          role: 'user',
          content: `Act as an official chatbot for our multi-purpose platform which has features rental, subscription and second hand specializing in:
          - OTT platform come under the subscription feature in which a person can list the subscription in two ways, direct listing or auction based listing. In direct listing the subscription is sold at the given price and in auction based listing the subscription can have bids. And there are two types of bids, monetary and product, customers can either bid with money or products.
          - second hand items come under second hand buying feature in which a person can list the item in two ways, direct listing or auction based listing. In direct listing the item is sold at the given price and in auction based listing the item can have bids. And there are two types of bids, monetary and product, customers can either bid with money or products.
          - renting items with security deposit
          - Credential-verified account sharing for subscription
          - Auction-style bidding
          - Fixed-price purchase
          - Secure subscription transfers
          - check the product listings of any feature if a user asks for any particular thing and then tell the user in which feature that item is present
      
          Response Requirements:
          1. Highlight either auction bids or fixed-price options for second hand and subscriptions, tell whether that particular product is listed in direct listing or auction based listing and once the feature is identified, also give the clickable link to that particular feature
          2. Tell about if the asked item, subscription is avaialable or not
          3. Mention remaining duration for auction in auction based
          4. In auction based, give the maximum bids and the bid products if a user asks for a particular item or subscription
      
      
          Current Query: "${message}"
          
          [First confirm screen count needed, then suggest duration options]`
        }]
      });

      res.json({
          response: response.message.content,
          redirect: null
      });

  } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ 
          error: "Our chat service is currently unavailable. Please try again later." 
      });
  }
});

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
