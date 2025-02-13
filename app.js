const express = require("express");
const path = require("path");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", "views");

// const subscriptionRoutes = require("./routes/subscriptionRoutes");
// const secondHandRoutes = require("./routes/secondHandRoutes");
const rentingRoutes = require("./routes/rentingRoutes");


// app.use("/subscriptions", subscriptionRoutes);
// app.use("/second-hand", secondHandRoutes);
// app.use("/users", userRoutes);
app.use("/", rentingRoutes);

// app.use(errorController.get404);

// app.use(); //for error

app.listen(8000,()=>{
    console.log('starting server');
});
