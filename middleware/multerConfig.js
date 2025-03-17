require("dotenv").config();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// 🔹 Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🔹 Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "uploads", // Cloudinary folder name
    format: async (req, file) => "png", // Convert all images to PNG (optional)
    public_id: (req, file) => `${Date.now()}-${file.originalname}`, // Unique filename
  },
});

// 🔹 Multer Middleware
const uploadSingle = multer({ storage }).single("image"); // Single file upload
const uploadMultiple = multer({ storage }).array("images", 10); // Multiple files upload

module.exports = { uploadSingle, uploadMultiple };
