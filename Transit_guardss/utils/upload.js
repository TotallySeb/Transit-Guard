// utils/upload.js

const multer = require('multer');
const path = require('path');

// Set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter for images/videos
function fileFilter(req, file, cb) {
  if (
    file.mimetype.startsWith('image/') ||
    file.mimetype.startsWith('video/')
  ) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type, only images and videos allowed!'), false);
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB limit per file
  }
});

module.exports = upload;
// This code sets up a Multer middleware for handling file uploads in an Express application.
// It configures the storage location, file naming convention, and file type filtering for images and videos.
// The uploaded files are stored in the 'uploads/' directory with a unique filename based on the current timestamp and a random number.
// The file size limit is set to 50 MB per file.