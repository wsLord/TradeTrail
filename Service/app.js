import dotenv from "dotenv";
dotenv.config(); // Load environment variables at the top!

import express from "express";
import cookieParser from "cookie-parser"; // Import cookie-parser
import path from "path";
import { fileURLToPath } from "url";
import connectToMongoDB from "./db/connectToMongoDB.js";
import authRoutes from "./src/routes/auth.route.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For form data
app.use(cookieParser()); // Ensure cookie-parser is used

// Routes
app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  connectToMongoDB();
  console.log(`Server running on http://localhost:${PORT}`);
});
