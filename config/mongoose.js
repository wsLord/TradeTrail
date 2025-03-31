const mongoose = require("mongoose");

const url = process.env.MONGO_DB_URI;

const connectToMongoDB = async () => {
  try {
    if (!url) {
      throw new Error("MONGO_DB_URI is not defined in .env file");
    }
    await mongoose.connect(url); 
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
  }
};

module.exports = connectToMongoDB;
