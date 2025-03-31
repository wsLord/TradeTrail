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
    folder: "uploads",
    format: async (req, file) => "png",
    public_id: (req, file) => `${Date.now()}-${file.originalname}`,
  },
});

// 🔹 Multer Middleware
const uploadSingle = multer({ storage }).single("image");
const uploadMultiple = multer({ storage }).array("images", 10);

module.exports = { uploadSingle, uploadMultiple };
