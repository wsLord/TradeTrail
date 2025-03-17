const multer = require("multer");
const path = require("path");

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Ensure this folder exists
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    },
});

// Multer middlewares for different cases
const uploadSingle = multer({ storage: storage }).single("image"); // Single file
const uploadMultiple = multer({ storage: storage }).array("images", 10); // Multiple files

module.exports = { uploadSingle, uploadMultiple };
