const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/videos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure local storage for videos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Multer configuration for local video uploads
const uploadVideo = multer({
  storage: storage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'), false);
    }
  }
});

// Helper function to delete video from local storage
const deleteVideo = async (filename) => {
  try {
    const filePath = path.join(uploadsDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return { result: 'ok' };
  } catch (error) {
    console.error('Error deleting video from local storage:', error);
    throw error;
  }
};

// Helper function to generate video thumbnail (placeholder)
const generateThumbnail = async (filename) => {
  // For local storage, return a placeholder thumbnail URL
  return `/api/videos/thumbnail/${filename}`;
};

// Helper function to get video duration (placeholder)
const getVideoDuration = async (filename) => {
  // For local storage, return a default duration
  // In a real implementation, you'd use ffmpeg or similar to get actual duration
  return 60; // 60 seconds default
};

module.exports = {
  uploadVideo,
  deleteVideo,
  generateThumbnail,
  getVideoDuration
};
