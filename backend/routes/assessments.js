const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');
const Assessment = require('../models/Assessment'); // Changed from Video to Assessment
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

// @route   POST /api/assessments/upload
// @desc    Upload assessment video with location and metadata
// @access  Private
router.post('/upload', auth, (req, res, next) => {
  console.log('🔍 DEBUG - User info in assessment upload:', {
    userId: req.user?.id,
    userType: req.user?.userType,
    email: req.user?.email
  });
  next();
}, uploadVideo.single('video'), [
  body('assessmentType').isIn([
    'vertical_jump', 'shuttle_run', 'sit_ups', 'endurance_run_800m', 
    'endurance_run_1500m', 'height_weight', 'flexibility', 'strength_test'
  ]).withMessage('Valid assessment type is required'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required')
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

    const { assessmentType, testDate, latitude, longitude, rawData, testConditions } = req.body;

    // Video uploaded via multer (Cloudinary or local storage)
    const videoUrl = req.file.path || `/uploads/assessments/${req.file.filename}`;
    const videoPublicId = req.file.filename;
    
    // Generate thumbnail from video
    const videoThumbnail = await generateThumbnail(videoPublicId);
    
    // Get video duration
    const videoDuration = await getVideoDuration(videoPublicId);

    // Parse raw data if provided
    let parsedRawData = {};
    if (rawData) {
      try {
        parsedRawData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      } catch (e) {
        console.warn('Failed to parse rawData:', e);
      }
    }

    // Parse test conditions if provided
    let parsedTestConditions = {};
    if (testConditions) {
      try {
        parsedTestConditions = typeof testConditions === 'string' ? JSON.parse(testConditions) : testConditions;
      } catch (e) {
        console.warn('Failed to parse testConditions:', e);
      }
    }

    // Create assessment document
    const assessment = new Assessment({
      athlete: req.user.id,
      assessmentType,
      testDate: testDate || new Date(),
      videoUrl,
      videoPublicId,
      videoThumbnail,
      videoDuration,
      rawData: parsedRawData,
      testConditions: parsedTestConditions,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      locationMetadata: {
        accuracy: req.body.accuracy || null,
        capturedAt: new Date(),
        source: 'browser_geolocation'
      }
    });

    await assessment.save();
    await assessment.populate('athlete', 'name email specialization city state profileImage');

    logger.info(`Assessment uploaded: ${assessmentType} by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Assessment uploaded successfully',
      assessment
    });

  } catch (error) {
    logger.error('Assessment upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during assessment upload'
    });
  }
});

// @route   POST /api/assessments/analyze
// @desc    Analyze assessment video using AI
// @access  Private
router.post('/analyze', auth, [
  body('videoUrl').isURL().withMessage('Valid video URL is required'),
  body('assessmentType').isIn([
    'vertical_jump', 'shuttle_run', 'sit_ups', 'endurance_run_800m', 
    'endurance_run_1500m', 'height_weight', 'flexibility', 'strength_test'
  ]).withMessage('Invalid assessment type')
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

    const { videoUrl, assessmentType } = req.body;

    // TODO: Implement actual AI analysis
    // For now, we'll simulate the analysis process
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate mock analysis results
    const aiAnalysis = {
      confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
      detectedAnomalies: [],
      formAnalysis: {
        overallScore: Math.floor(Math.random() * 30) + 70, // 70-100
        keyPoints: generateKeyPoints(assessmentType)
      },
      performanceMetrics: {
        consistency: Math.floor(Math.random() * 30) + 70,
        technique: Math.floor(Math.random() * 30) + 70,
        efficiency: Math.floor(Math.random() * 30) + 70
      }
    };

    // Add anomalies based on confidence score
    if (aiAnalysis.confidence < 0.8) {
      aiAnalysis.detectedAnomalies.push({
        type: 'form_issue',
        description: 'Minor form inconsistencies detected',
        severity: 'low',
        timestamp: Math.random() * 30 // seconds in video
      });
    }

    // Generate normalized score based on assessment type
    const normalizedScore = generateNormalizedScore(assessmentType, aiAnalysis);

    logger.info(`Assessment analyzed: ${assessmentType} for user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Assessment analysis completed',
      analysis: {
        ...aiAnalysis,
        normalizedScore,
        percentile: Math.floor(Math.random() * 30) + 60 // 60-90%
      }
    });

  } catch (error) {
    logger.error('Assessment analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during assessment analysis'
    });
  }
});

// @route   GET /api/assessments/:id/stream
// @desc    Stream assessment video file
// @access  Public
router.get('/:id/stream', async (req, res) => {
  try {
    const assessmentId = req.params.id;
    
    const assessment = await Assessment.findById(assessmentId).populate('athlete', 'name');
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    console.log('Streaming assessment:', assessment.assessmentType, 'URL:', assessment.videoUrl);

    // Increment view count
    assessment.views = (assessment.views || 0) + 1;
    await assessment.save();

    // Handle different video URL types
    let videoUrl = assessment.videoUrl;
    
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
    logger.error('Assessment streaming error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during assessment streaming'
    });
  }
});

// @route   DELETE /api/assessments/:id
// @desc    Delete assessment
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const assessmentId = req.params.id;
    
    // Find the assessment first
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Authorization check: Only athlete owner or admin can delete
    if (assessment.athlete.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this assessment'
      });
    }

    // Delete from Cloudinary if videoPublicId exists
    if (assessment.videoPublicId) {
      await deleteVideo(assessment.videoPublicId);
    }
    
    // Delete from database
    await Assessment.findByIdAndDelete(assessmentId);
    
    logger.info(`Assessment deleted: ${assessment.assessmentType} (${assessmentId}) by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Assessment deleted successfully'
    });

  } catch (error) {
    logger.error('Assessment deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during assessment deletion'
    });
  }
});

// @route   GET /api/assessments/nearby
// @desc    Get assessments near user's location
// @access  Private
router.get('/nearby', auth, async (req, res) => {
  try {
    console.log('🔍 NEARBY-ASSESSMENTS DEBUG - Request:', {
      userId: req.user.id,
      userType: req.user.userType,
      query: req.query
    });

    const { latitude, longitude, radius = 50, sport, category, maxResults = 20 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Validate coordinates
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const searchRadius = parseInt(radius) * 1000; // Convert km to meters

    if (isNaN(lat) || isNaN(lng) || isNaN(searchRadius)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates or radius'
      });
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Coordinates out of valid range'
      });
    }

    // Build query
    const query = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: searchRadius
        }
      },
      verificationStatus: { $in: ['verified', 'pending'] } // Only show verified or pending assessments
    };

    // Add optional filters
    if (sport) query.sport = sport;
    if (category) query.category = category;

    const nearbyAssessments = await Assessment.find(query)
      .populate('athlete', 'name email specialization city state profileImage')
      .populate('comments.author', 'name role')
      .limit(parseInt(maxResults))
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ Found ${nearbyAssessments.length} nearby assessments`);

    res.json({
      success: true,
      count: nearbyAssessments.length,
      assessments: nearbyAssessments,
      searchParams: {
        center: { latitude: lat, longitude: lng },
        radius: radius,
        filters: { sport, category }
      }
    });

  } catch (error) {
    logger.error('Nearby assessments fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching nearby assessments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/assessments/my-assessments
// @desc    Get user's uploaded assessments
// @access  Private
router.get('/my-assessments', auth, async (req, res) => {
  try {
    console.log('📋 MY-ASSESSMENTS DEBUG - User requesting:', {
      userId: req.user.id,
      userType: req.user.userType,
      email: req.user.email
    });

    const assessments = await Assessment.find({ athlete: req.user.id })
      .populate('comments.author', 'name role')
      .sort({ testDate: -1 });

    console.log('📋 MY-ASSESSMENTS DEBUG - Found assessments:', {
      count: assessments.length,
      assessmentIds: assessments.map(a => a._id),
      assessmentTypes: assessments.map(a => a.assessmentType)
    });

    res.json({
      success: true,
      assessments: assessments
    });

  } catch (error) {
    logger.error('My assessments fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assessments'
    });
  }
});

// @route   POST /api/assessments/:id/like
// @desc    Like/unlike an assessment
// @access  Private
router.post('/:id/like', auth, async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    const userId = req.user.id;
    const isLiked = assessment.likes.includes(userId);

    if (isLiked) {
      assessment.likes = assessment.likes.filter(id => id.toString() !== userId);
    } else {
      assessment.likes.push(userId);
    }

    await assessment.save();

    res.json({
      success: true,
      liked: !isLiked,
      likeCount: assessment.likes.length
    });

  } catch (error) {
    logger.error('Assessment like error:', error);
    res.status(500).json({
      success: false,
      message: 'Error liking assessment'
    });
  }
});

// @route   POST /api/assessments/:id/comment
// @desc    Add comment to assessment
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

    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    assessment.comments.push({
      author: req.user.id,
      content: req.body.comment.trim(),
      type: 'feedback'
    });

    await assessment.save();
    await assessment.populate('comments.author', 'name role');

    res.json({
      success: true,
      message: 'Comment added successfully',
      comment: assessment.comments[assessment.comments.length - 1]
    });

  } catch (error) {
    logger.error('Assessment comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding comment'
    });
  }
});

// @route   PUT /api/assessments/:id/verify
// @desc    Verify assessment (coaches only)
// @access  Private
router.put('/:id/verify', auth, authorize(['coach']), [
  body('verificationStatus').isIn(['verified', 'flagged', 'rejected']).withMessage('Invalid verification status'),
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
    
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    assessment.verificationStatus = verificationStatus;
    assessment.verifiedBy = req.user.id;
    assessment.verificationDate = new Date();
    assessment.verificationNotes = verificationNotes;

    await assessment.save();
    await assessment.populate('athlete', 'name email');
    await assessment.populate('verifiedBy', 'name specialization');

    logger.info(`Assessment ${verificationStatus} by coach ${req.user.email}: ${assessment.assessmentType}`);

    res.json({
      success: true,
      message: `Assessment ${verificationStatus} successfully`,
      assessment
    });

  } catch (error) {
    logger.error('Assessment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during verification'
    });
  }
});

// Helper function to generate key points based on assessment type
function generateKeyPoints(assessmentType) {
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
    ],
    flexibility: [
      { joint: 'hamstring', accuracy: 82, feedback: 'Good hamstring flexibility' },
      { joint: 'lower_back', accuracy: 75, feedback: 'Work on lower back mobility' },
      { joint: 'shoulder', accuracy: 88, feedback: 'Excellent shoulder flexibility' }
    ],
    strength_test: [
      { joint: 'core', accuracy: 85, feedback: 'Strong core engagement' },
      { joint: 'upper_body', accuracy: 80, feedback: 'Good upper body strength' },
      { joint: 'lower_body', accuracy: 90, feedback: 'Excellent lower body strength' }
    ]
  };

  return keyPointsMap[assessmentType] || [];
}

// Helper function to generate normalized score based on assessment type
function generateNormalizedScore(assessmentType, aiAnalysis) {
  const baseScores = {
    vertical_jump: 75,
    shuttle_run: 80,
    sit_ups: 85,
    endurance_run_800m: 70,
    endurance_run_1500m: 65,
    flexibility: 90,
    strength_test: 85,
    height_weight: 95
  };

  const baseScore = baseScores[assessmentType] || 80;
  const formBonus = (aiAnalysis.formAnalysis.overallScore - 70) / 3; // 0-10 points
  const performanceBonus = ((aiAnalysis.performanceMetrics.technique + 
                           aiAnalysis.performanceMetrics.consistency + 
                           aiAnalysis.performanceMetrics.efficiency) - 210) / 9; // 0-10 points

  return Math.min(100, Math.max(0, baseScore + formBonus + performanceBonus));
}

module.exports = router;