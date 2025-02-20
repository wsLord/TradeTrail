const express = require("express");
const path = require("path");
const mongoose = require("mongoose");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", "views");

// const subscriptionRoutes = require("./routes/subscriptionRoutes");
const secondHandRoutes = require("./routes/secondHandRoutes");
const rentingRoutes = require("./routes/rentingRoutes");

// app.use("/subscriptions", subscriptionRoutes);
app.use("/secondHand", secondHandRoutes);
// app.use("/users", userRoutes);
app.use("/", rentingRoutes);

// app.use(errorController.get404);

// app.use(); //for error

// app.listen(8000,()=>{
//     console.log('starting server');
// });

const uri = "mongodb+srv://aaryakotalwar:aarya%402005@cluster0.mtozb.mongodb.net/buy?retryWrites=true&w=majority";

mongoose.connect(uri)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(8000);
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });
