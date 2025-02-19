import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { signup, login, checkAuth } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Convert __dirname to ESM format
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve the signup page
router.get("/signup", (req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "..", "..", "ui", "src", "pages", "signup.html")
  );
});

// Handle signup form submission
router.post("/signup", signup);

// Serve the login page
router.get("/login", (req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "..", "..", "ui", "src", "pages", "login.html")
  );
});

// Handle login form submission
router.post("/login", login);

// Protect the home page
router.get("/home", protectRoute, (req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "..", "..", "ui", "src", "pages", "home.html")
  );
});

// Protected route to check authentication
router.get("/check", protectRoute, checkAuth);

export default router;
