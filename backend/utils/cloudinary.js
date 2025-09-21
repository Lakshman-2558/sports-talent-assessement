const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const logger = require('./logger');

// Configure Cloudinary with enhanced options
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Use HTTPS
  api_proxy: process.env.HTTP_PROXY, // Add proxy support if needed
  upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET, // Optional: Use upload preset
  timeout: 60000, // 1 minute timeout for API calls
  chunk_size: 20000000, // 20MB chunks for large files
});

// Helper function to log Cloudinary responses
const logCloudinaryResponse = (result) => {
  logger.info('Cloudinary upload result:', {
    public_id: result.public_id,
    format: result.format,
    resource_type: result.resource_type,
    bytes: result.bytes,
    duration: result.duration,
    url: result.secure_url
  });
  return result;
};

// Configure Cloudinary storage for videos with enhanced settings
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    logger.info('Uploading video file:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    return {
      folder: 'sports-talent-videos',
      resource_type: 'video',
      allowed_formats: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'quicktime'],
      format: 'webm', // Force webm format for consistency
      transformation: [
        { quality: 'auto' },
        { fetch_format: 'auto' },
        { codec: 'vp9' } // Use VP9 codec for better compression
      ],
      chunk_size: 6000000, // 6MB chunks for large files
      timeout: 120000, // 2 minutes
      eager: [
        { width: 640, height: 360, crop: 'fill', format: 'webm' },
        { width: 320, height: 180, crop: 'fill', format: 'webm' }
      ]
    };
  },
  filename: (req, file, cb) => {
    // Create a unique filename with timestamp and original extension
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = file.originalname.split('.').pop().toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}.${ext}`);
  }
});

// Configure Cloudinary storage for images/thumbnails
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'sports-talent-thumbnails',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 640, height: 360, crop: 'fill' },
      { quality: 'auto' },
      { fetch_format: 'auto' }
    ]
  },
});

// Multer configuration for video uploads with enhanced validation
const uploadVideo = multer({
  storage: videoStorage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit (increased from 200MB)
    files: 1,
    fields: 10 // Maximum number of non-file fields
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'video/mp4', 
      'video/webm', 
      'video/quicktime', 
      'video/x-msvideo', 
      'video/avi',
      'video/x-matroska'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error('Invalid file type. Only MP4, WebM, MOV, AVI, and MKV videos are allowed.');
      error.code = 'LIMIT_FILE_TYPE';
      cb(error, false);
    }
  }
});

// Error handler for multer
const handleMulterError = (err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ 
      success: false, 
      message: 'File too large. Maximum size is 500MB.' 
    });
  }
  
  if (err.code === 'LIMIT_FILE_TYPE') {
    return res.status(400).json({ 
      success: false, 
      message: err.message || 'Invalid file type.' 
    });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ 
      success: false, 
      message: 'Too many files uploaded. Only one file is allowed.' 
    });
  }
  
  // For other errors
  console.error('Upload error:', err);
  return res.status(500).json({ 
    success: false, 
    message: 'Error uploading file. Please try again.' 
  });
};

// Multer configuration for image uploads
const uploadImage = multer({
  storage: imageStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Unified function to delete any file from Cloudinary
const deleteFile = async (publicId, resourceType = 'auto') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { 
      resource_type: resourceType,
      invalidate: true // Invalidate CDN cache
    });
    logger.info('File deleted from Cloudinary:', { publicId, resourceType, result });
    return result;
  } catch (error) {
    logger.error('Error deleting file from Cloudinary:', { publicId, resourceType, error });
    throw error;
  }
};

// Helper function to delete video from Cloudinary (legacy)
const deleteVideo = async (publicId) => deleteFile(publicId, 'video');

// Helper function to delete image from Cloudinary (legacy)
const deleteImage = async (publicId) => deleteFile(publicId, 'image');

// Helper function to generate video thumbnail
const generateThumbnail = async (videoPublicId) => {
  try {
    const thumbnailUrl = cloudinary.url(videoPublicId, {
      resource_type: 'video',
      format: 'jpg',
      transformation: [
        { width: 640, height: 360, crop: 'fill' },
        { start_offset: '10%' }, // Take thumbnail at 10% of video duration
        { quality: 'auto' }
      ]
    });
    return thumbnailUrl;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    throw error;
  }
};

// Helper function to get video duration
const getVideoDuration = async (videoPublicId) => {
  try {
    const result = await cloudinary.api.resource(videoPublicId, {
      resource_type: 'video'
    });
    return result.duration || 0;
  } catch (error) {
    console.error('Error getting video duration:', error);
    return 0;
  }
};

module.exports = {
  cloudinary,
  uploadVideo,
  uploadImage,
  deleteFile,
  deleteVideo,
  deleteImage,
  generateThumbnail,
  getVideoDuration,
  handleMulterError
};
