// const express = require("express");
// const path = require("path");
// const mongoose = require("mongoose");

// const app = express();

// // Middleware
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(express.static(path.join(__dirname, "public")));

// app.set("view engine", "ejs");
// app.set("views", "views");

// // const subscriptionRoutes = require("./routes/subscriptionRoutes");
// const secondHandRoutes = require("./routes/secondHandRoutes");
// const rentingRoutes = require("./routes/rentingRoutes");

// // app.use("/subscriptions", subscriptionRoutes);
// app.use("/secondHand", secondHandRoutes);
// // app.use("/users", userRoutes);
// app.use("/", rentingRoutes);

// const uri = "mongodb+srv://aaryakotalwar:aarya%402005@cluster0.mtozb.mongodb.net/buy?retryWrites=true&w=majority";

// mongoose.connect(uri)
//   .then(() => {
//     console.log('Connected to MongoDB');
//     app.listen(8000);
//   })
//   .catch((err) => {
//     console.error('Error connecting to MongoDB:', err);
//   });
const dotenv = require("dotenv");
dotenv.config(); // Load environment variables

const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser"); // Ensure cookies are parsed
const cartRoutes = require("./routes/cartRoutes");
const session = require("express-session");
const flash = require("connect-flash");




// Connect to MongoDB
const connectToMongoDB = require("./config/mongoose");

// Import routes
const authRoutes = require("./routes/authRoutes"); // ✅ ADD THIS
const secondHandRoutes = require("./routes/secondHandRoutes");
const rentingRoutes = require("./routes/rentingRoutes");
const profileRoutes = require("./routes/profileRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");



const app = express();
const PORT = process.env.PORT || 8000;

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


// Set up EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ✅ Register Routes
app.use("/api/auth", authRoutes); // ✅ FIX: Include auth routes
app.use("/secondHand", secondHandRoutes);
app.use("/rental", rentingRoutes);
<<<<<<< HEAD
app.use("/", profileRoutes);
app.use("/subscription", subscriptionRoutes);
=======
app.use("/cart", cartRoutes);

>>>>>>> 07855f16b0ec870c2a89a8d7b88da5cba0142408

app.get("/", (req, res) => {
    res.render("home"); // Renders the home.ejs file inside views/
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