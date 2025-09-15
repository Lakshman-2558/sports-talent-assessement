const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');
const Video = require('../models/Video');
const User = require('../models/User');
// Try Cloudinary first, fallback to local storage if it fails
let videoUtils;
try {
  videoUtils = require('../utils/cloudinary');
} catch (error) {
  console.log('Cloudinary not available, using local storage');
  videoUtils = require('../utils/localStorage');
}
const { uploadVideo, deleteVideo, generateThumbnail, getVideoDuration } = videoUtils;

const router = express.Router();

// @route   POST /api/videos/upload
// @desc    Upload video file with location and metadata
// @access  Private
router.post('/upload', auth, uploadVideo.single('video'), [
  body('title').notEmpty().withMessage('Video title is required'),
  body('sport').notEmpty().withMessage('Sport type is required'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('state').notEmpty().withMessage('State is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file uploaded'
      });
    }

    const { title, description, sport, category, skillLevel, visibility, shareRadius, latitude, longitude, city, state, address, tags, videoType } = req.body;

    // Video uploaded via multer (Cloudinary or local storage)
    const videoUrl = req.file.path || `/uploads/videos/${req.file.filename}`;
    const videoPublicId = req.file.filename;
    
    // Generate thumbnail from video
    const thumbnailUrl = await generateThumbnail(videoPublicId);
    
    // Get video duration
    const duration = await getVideoDuration(videoPublicId);

    // Auto-approve certain video types
    let videoStatus = 'pending';
    if (videoType === 'assignment_submission' || videoType === 'gesture_practice') {
      videoStatus = 'approved'; // Auto-approve assessment and practice videos
    }

    // Create video document
    const video = new Video({
      title,
      description,
      videoUrl,
      thumbnailUrl,
      uploadedBy: req.user.id,
      videoPublicId, // Store Cloudinary public ID for deletion
      duration,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        address,
        city,
        state
      },
      sport,
      category: category || 'training',
      videoType: videoType || 'regular_upload',
      skillLevel: skillLevel || 'beginner',
      visibility: visibility || 'coaches_only',
      shareRadius: shareRadius || 50,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      status: videoStatus
    });

    await video.save();
    await video.populate('uploadedBy', 'name userType specialization');

    logger.info(`Video uploaded: ${title} by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Video uploaded successfully',
      video
    });

  } catch (error) {
    logger.error('Video upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during video upload'
    });
  }
});

// @route   POST /api/videos/analyze
// @desc    Analyze video using AI
// @access  Private
router.post('/analyze', auth, [
  body('videoUrl').isURL().withMessage('Valid video URL is required'),
  body('testType').isIn([
    'vertical_jump', 'shuttle_run', 'sit_ups', 'endurance_run_800m', 
    'endurance_run_1500m', 'height_weight', 'flexibility', 'strength_test'
  ]).withMessage('Invalid test type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { videoUrl, testType } = req.body;

    // TODO: Implement actual AI analysis
    // For now, we'll simulate the analysis process
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate mock analysis results
    const analysisResult = {
      confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
      detectedAnomalies: [],
      formAnalysis: {
        overallScore: Math.floor(Math.random() * 30) + 70, // 70-100
        keyPoints: generateKeyPoints(testType)
      },
      performanceMetrics: {
        consistency: Math.floor(Math.random() * 30) + 70,
        technique: Math.floor(Math.random() * 30) + 70,
        efficiency: Math.floor(Math.random() * 30) + 70
      },
      rawMeasurements: generateRawMeasurements(testType),
      processedAt: new Date()
    };

    // Add anomalies based on confidence score
    if (analysisResult.confidence < 0.8) {
      analysisResult.detectedAnomalies.push({
        type: 'form_issue',
        description: 'Minor form inconsistencies detected',
        severity: 'low',
        timestamp: Math.random() * 30 // seconds in video
      });
    }

    logger.info(`Video analyzed: ${testType} for user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Video analysis completed',
      analysis: analysisResult
    });

  } catch (error) {
    logger.error('Video analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during video analysis'
    });
  }
});

// @route   GET /api/videos/:id/stream
// @desc    Stream video file
// @access  Public (we'll handle auth differently for video streaming)
router.get('/:id/stream', async (req, res) => {
  try {
    const videoId = req.params.id;
    
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    console.log('Streaming video:', video.title, 'URL:', video.videoUrl);

    // Increment view count
    video.views = (video.views || 0) + 1;
    await video.save();

    // Handle different video URL types
    let videoUrl = video.videoUrl;
    
    // Set CORS headers for video streaming
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    // If it's a local file path, serve it directly
    if (videoUrl.startsWith('/uploads/')) {
      const path = require('path');
      const fs = require('fs');
      const filePath = path.join(__dirname, '..', videoUrl);
      
      if (fs.existsSync(filePath)) {
        // Set proper content type for video
        res.setHeader('Content-Type', 'video/mp4');
        return res.sendFile(path.resolve(filePath));
      } else {
        return res.status(404).json({
          success: false,
          message: 'Video file not found on server'
        });
      }
    }
    
    // If it's a Cloudinary URL or any HTTP URL, redirect to it
    if (videoUrl.startsWith('http')) {
      return res.redirect(videoUrl);
    }
    
    // If videoUrl is relative, make it absolute
    if (videoUrl.startsWith('uploads/')) {
      const fullUrl = `${req.protocol}://${req.get('host')}/${videoUrl}`;
      return res.redirect(fullUrl);
    }
    
    return res.status(404).json({
      success: false,
      message: 'Video URL format not supported'
    });

  } catch (error) {
    logger.error('Video streaming error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during video streaming'
    });
  }
});

// @route   DELETE /api/videos/:id
// @desc    Delete video file
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const videoId = req.params.id;
    
    // Find the video first
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Authorization check: Only video owner or SAI officials can delete
    if (video.uploadedBy.toString() !== req.user.id && req.user.userType !== 'sai_official') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this video'
      });
    }

    // Delete from Cloudinary
    if (video.videoPublicId) {
      await deleteVideo(video.videoPublicId);
    }
    
    // Delete from database
    await Video.findByIdAndDelete(videoId);
    
    logger.info(`Video deleted: ${video.title} (${videoId}) by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Video deleted successfully'
    });

  } catch (error) {
    logger.error('Video deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during video deletion'
    });
  }
});

// Helper function to generate key points based on test type
function generateKeyPoints(testType) {
  const keyPointsMap = {
    vertical_jump: [
      { joint: 'knee', accuracy: 85, feedback: 'Good knee bend during takeoff' },
      { joint: 'ankle', accuracy: 78, feedback: 'Slight improvement needed in ankle extension' },
      { joint: 'hip', accuracy: 92, feedback: 'Excellent hip drive' }
    ],
    shuttle_run: [
      { joint: 'foot_placement', accuracy: 88, feedback: 'Good foot placement during direction changes' },
      { joint: 'body_lean', accuracy: 75, feedback: 'Maintain forward lean during acceleration' },
      { joint: 'arm_swing', accuracy: 82, feedback: 'Consistent arm swing pattern' }
    ],
    sit_ups: [
      { joint: 'spine', accuracy: 90, feedback: 'Proper spinal alignment maintained' },
      { joint: 'hip', accuracy: 85, feedback: 'Good hip flexion range' },
      { joint: 'neck', accuracy: 70, feedback: 'Avoid excessive neck strain' }
    ],
    endurance_run_800m: [
      { joint: 'stride', accuracy: 87, feedback: 'Consistent stride length' },
      { joint: 'posture', accuracy: 83, feedback: 'Maintain upright posture' },
      { joint: 'breathing', accuracy: 79, feedback: 'Work on breathing rhythm' }
    ],
    endurance_run_1500m: [
      { joint: 'stride', accuracy: 85, feedback: 'Good stride efficiency' },
      { joint: 'posture', accuracy: 88, feedback: 'Excellent running posture' },
      { joint: 'pacing', accuracy: 76, feedback: 'Consider more even pacing strategy' }
    ]
  };

  return keyPointsMap[testType] || [];
}

// Helper function to generate raw measurements based on test type
function generateRawMeasurements(testType) {
  const measurementsMap = {
    vertical_jump: {
      jumpHeight: Math.floor(Math.random() * 40) + 40, // 40-80cm
      takeoffVelocity: Math.random() * 2 + 2, // 2-4 m/s
      hangTime: Math.random() * 0.3 + 0.4 // 0.4-0.7 seconds
    },
    shuttle_run: {
      totalTime: Math.random() * 5 + 10, // 10-15 seconds
      averageSpeed: Math.random() * 2 + 4, // 4-6 m/s
      directionChanges: Math.floor(Math.random() * 3) + 8 // 8-10 changes
    },
    sit_ups: {
      totalCount: Math.floor(Math.random() * 30) + 20, // 20-50
      averageSpeed: Math.random() * 0.5 + 0.8, // 0.8-1.3 per second
      formConsistency: Math.random() * 20 + 80 // 80-100%
    },
    endurance_run_800m: {
      totalTime: Math.random() * 60 + 120, // 2-3 minutes
      averagePace: Math.random() * 30 + 150, // 2:30-3:00 per 400m
      heartRateEstimate: Math.floor(Math.random() * 40) + 160 // 160-200 bpm
    },
    endurance_run_1500m: {
      totalTime: Math.random() * 120 + 300, // 5-7 minutes
      averagePace: Math.random() * 30 + 180, // 3:00-3:30 per 400m
      heartRateEstimate: Math.floor(Math.random() * 30) + 170 // 170-200 bpm
    }
  };

  return measurementsMap[testType] || {};
}

// @route   GET /api/videos/nearby
// @desc    Get videos near user's location
// @access  Private
router.get('/nearby', auth, async (req, res) => {
  try {
    const { latitude, longitude, radius = 50, sport, category } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const filters = {};
    if (sport) filters.sport = sport;
    if (category) filters.category = category;

    // Determine what videos user can see based on their role
    let videos;
    if (req.user.userType === 'coach') {
      videos = await Video.findForCoaches(
        parseFloat(longitude),
        parseFloat(latitude),
        parseFloat(radius)
      ).sort({ createdAt: -1 });
    } else if (req.user.userType === 'sai_official') {
      videos = await Video.findForSAIOfficials(
        parseFloat(longitude),
        parseFloat(latitude),
        parseFloat(radius)
      ).sort({ createdAt: -1 });
    } else {
      // Athletes can only see their own videos and public ones
      videos = await Video.findNearby(
        parseFloat(longitude),
        parseFloat(latitude),
        parseFloat(radius),
        {
          $or: [
            { uploadedBy: req.user.id },
            { visibility: 'public' }
          ],
          ...filters
        }
      ).sort({ createdAt: -1 });
    }

    res.json({
      success: true,
      count: videos.length,
      videos
    });

  } catch (error) {
    logger.error('Nearby videos fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching nearby videos'
    });
  }
});

// @route   GET /api/videos/my-videos
// @desc    Get user's uploaded videos
// @access  Private
router.get('/my-videos', auth, async (req, res) => {
  try {
    const videos = await Video.find({ uploadedBy: req.user.id })
      .populate('uploadedBy', 'name userType specialization')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: videos.length,
      videos
    });

  } catch (error) {
    logger.error('My videos fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user videos'
    });
  }
});

// @route   POST /api/videos/:id/like
// @desc    Like/unlike a video
// @access  Private
router.post('/:id/like', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    const isLiked = video.isLikedBy(req.user.id);
    
    if (isLiked) {
      video.removeLike(req.user.id);
    } else {
      video.addLike(req.user.id);
    }

    await video.save();

    res.json({
      success: true,
      message: isLiked ? 'Video unliked' : 'Video liked',
      likeCount: video.likeCount,
      isLiked: !isLiked
    });

  } catch (error) {
    logger.error('Video like error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing like'
    });
  }
});

// @route   POST /api/videos/:id/comment
// @desc    Add comment to video
// @access  Private
router.post('/:id/comment', auth, [
  body('comment').notEmpty().withMessage('Comment text is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    video.addComment(req.user.id, req.body.comment);
    await video.save();
    await video.populate('comments.user', 'name userType');

    res.json({
      success: true,
      message: 'Comment added successfully',
      comment: video.comments[video.comments.length - 1]
    });

  } catch (error) {
    logger.error('Video comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding comment'
    });
  }
});

// @route   PUT /api/videos/:id/verify
// @desc    Verify assessment video (coaches only)
// @access  Private
router.put('/:id/verify', auth, authorize(['coach']), [
  body('verificationStatus').isIn(['approved', 'rejected']).withMessage('Verification status must be approved or rejected'),
  body('verificationNotes').optional().isString().withMessage('Verification notes must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { verificationStatus, verificationNotes } = req.body;
    
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Only allow verification of assessment videos
    if (video.videoType !== 'assignment_submission') {
      return res.status(400).json({
        success: false,
        message: 'Only assessment videos can be verified'
      });
    }

    video.verificationStatus = verificationStatus;
    video.verifiedBy = req.user.id;
    video.verifiedAt = new Date();
    video.verificationNotes = verificationNotes;

    await video.save();
    await video.populate(['uploadedBy', 'verifiedBy'], 'name userType specialization');

    logger.info(`Video ${verificationStatus} by coach ${req.user.email}: ${video.title}`);

    res.json({
      success: true,
      message: `Video ${verificationStatus} successfully`,
      video
    });

  } catch (error) {
    logger.error('Video verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during verification'
    });
  }
});

// @route   PUT /api/videos/:id/moderate
// @desc    Moderate video (SAI officials only)
// @access  Private
router.put('/:id/moderate', auth, authorize(['sai_official']), [
  body('status').isIn(['approved', 'rejected', 'flagged']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { status, moderationNotes } = req.body;
    
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    video.status = status;
    video.moderatedBy = req.user.id;
    video.moderatedAt = new Date();
    video.moderationNotes = moderationNotes;

    await video.save();
    await video.populate(['uploadedBy', 'moderatedBy'], 'name userType');

    logger.info(`Video ${status} by ${req.user.email}: ${video.title}`);

    res.json({
      success: true,
      message: `Video ${status} successfully`,
      video
    });

  } catch (error) {
    logger.error('Video moderation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during moderation'
    });
  }
});

module.exports = router;
