const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const Assessment = require('../models/Assessment');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Configure multer for video uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'), false);
    }
  }
});

// @route   POST /api/assessments/upload
// @desc    Upload and analyze assessment video
// @access  Private (Athletes only)
router.post('/upload', auth, authorize('athlete'), upload.single('video'), [
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

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file uploaded'
      });
    }

    const { testType } = req.body;
    const videoBuffer = req.file.buffer;

    // Create assessment record
    const assessment = new Assessment({
      athlete: req.user._id,
      assessmentType: testType,
      testDate: new Date(),
      videoDuration: 0, // Will be updated after processing
      verificationStatus: 'pending'
    });

    // TODO: Implement video upload to cloud storage (Cloudinary/AWS S3)
    // For now, we'll simulate the upload
    assessment.videoUrl = `https://storage.example.com/videos/${assessment._id}.webm`;
    assessment.videoThumbnail = `https://storage.example.com/thumbnails/${assessment._id}.jpg`;

    // TODO: Implement AI analysis
    // For now, we'll simulate AI analysis results
    assessment.aiAnalysis = {
      confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
      detectedAnomalies: [],
      formAnalysis: {
        overallScore: Math.floor(Math.random() * 30) + 70, // 70-100
        keyPoints: []
      },
      performanceMetrics: {
        consistency: Math.floor(Math.random() * 30) + 70,
        technique: Math.floor(Math.random() * 30) + 70,
        efficiency: Math.floor(Math.random() * 30) + 70
      }
    };

    // Generate mock performance data based on test type
    switch (testType) {
      case 'vertical_jump':
        assessment.rawData.jumpHeight = Math.floor(Math.random() * 40) + 40; // 40-80cm
        assessment.normalizedScore = Math.min(100, (assessment.rawData.jumpHeight / 80) * 100);
        break;
      case 'shuttle_run':
        assessment.rawData.shuttleTime = Math.random() * 5 + 10; // 10-15 seconds
        assessment.normalizedScore = Math.max(0, 100 - ((assessment.rawData.shuttleTime - 10) * 20));
        break;
      case 'sit_ups':
        assessment.rawData.sitUpCount = Math.floor(Math.random() * 30) + 20; // 20-50
        assessment.rawData.sitUpDuration = 60;
        assessment.normalizedScore = Math.min(100, (assessment.rawData.sitUpCount / 50) * 100);
        break;
      case 'endurance_run_800m':
      case 'endurance_run_1500m':
        assessment.rawData.runTime = Math.random() * 120 + 180; // 3-5 minutes
        assessment.rawData.runDistance = testType === 'endurance_run_800m' ? 800 : 1500;
        assessment.normalizedScore = Math.max(0, 100 - ((assessment.rawData.runTime - 180) / 120 * 50));
        break;
    }

    await assessment.save();

    // Calculate percentile (this would normally be done after AI analysis)
    await assessment.calculatePercentile();
    await assessment.save();

    // Award points to user
    const user = await User.findById(req.user._id);
    user.points += Math.floor(assessment.normalizedScore / 10);
    await user.save();

    logger.info(`Assessment uploaded: ${testType} by user ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Assessment uploaded and analyzed successfully',
      assessment: {
        id: assessment._id,
        testType: assessment.assessmentType,
        confidence: assessment.aiAnalysis.confidence,
        normalizedScore: assessment.normalizedScore,
        percentile: assessment.percentile,
        verificationStatus: assessment.verificationStatus
      }
    });

  } catch (error) {
    logger.error('Assessment upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during assessment upload'
    });
  }
});

// @route   GET /api/assessments/my-assessments
// @desc    Get user's assessments
// @access  Private
router.get('/my-assessments', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const assessments = await Assessment.find({ athlete: req.user._id })
      .sort({ testDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate('athlete', 'name email');

    const total = await Assessment.countDocuments({ athlete: req.user._id });

    res.json({
      success: true,
      assessments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('Get assessments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving assessments'
    });
  }
});

// @route   GET /api/assessments/:id
// @desc    Get specific assessment details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id)
      .populate('athlete', 'name email userType')
      .populate('verifiedBy', 'name email');

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Check if user has permission to view this assessment
    const canView = assessment.athlete._id.toString() === req.user._id.toString() ||
                   req.user.userType === 'coach' ||
                   req.user.userType === 'sai_official';

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      assessment
    });

  } catch (error) {
    logger.error('Get assessment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving assessment'
    });
  }
});

// @route   PUT /api/assessments/:id/verify
// @desc    Verify assessment (SAI Officials only)
// @access  Private (SAI Officials only)
router.put('/:id/verify', auth, authorize('sai_official'), [
  body('status').isIn(['verified', 'flagged', 'rejected']).withMessage('Invalid verification status'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
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

    const { status, notes } = req.body;
    
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    assessment.verificationStatus = status;
    assessment.verifiedBy = req.user._id;
    assessment.verificationDate = new Date();
    assessment.verificationNotes = notes;

    await assessment.save();

    logger.info(`Assessment ${assessment._id} ${status} by ${req.user.email}`);

    res.json({
      success: true,
      message: `Assessment ${status} successfully`,
      assessment: {
        id: assessment._id,
        verificationStatus: assessment.verificationStatus,
        verifiedBy: req.user.name,
        verificationDate: assessment.verificationDate
      }
    });

  } catch (error) {
    logger.error('Assessment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during verification'
    });
  }
});

// @route   GET /api/assessments/leaderboard/:testType
// @desc    Get leaderboard for specific test type
// @access  Public
router.get('/leaderboard/:testType', async (req, res) => {
  try {
    const { testType } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const leaderboard = await Assessment.find({
      assessmentType: testType,
      verificationStatus: 'verified',
      normalizedScore: { $exists: true }
    })
    .sort({ normalizedScore: -1 })
    .limit(limit)
    .populate('athlete', 'name city state')
    .select('normalizedScore percentile testDate athlete');

    res.json({
      success: true,
      leaderboard: leaderboard.map((assessment, index) => ({
        rank: index + 1,
        athleteName: assessment.athlete.name,
        location: `${assessment.athlete.city}, ${assessment.athlete.state}`,
        score: assessment.normalizedScore,
        percentile: assessment.percentile,
        testDate: assessment.testDate
      }))
    });

  } catch (error) {
    logger.error('Leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving leaderboard'
    });
  }
});

// @route   POST /api/assessments/:id/comment
// @desc    Add comment to assessment
// @access  Private (Coaches and SAI Officials)
router.post('/:id/comment', auth, authorize('coach', 'sai_official'), [
  body('content').trim().isLength({ min: 1, max: 500 }).withMessage('Comment must be between 1 and 500 characters'),
  body('type').isIn(['feedback', 'improvement_suggestion', 'verification_note']).withMessage('Invalid comment type')
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

    const { content, type } = req.body;
    
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    assessment.comments.push({
      author: req.user._id,
      content,
      type,
      timestamp: new Date()
    });

    await assessment.save();

    const populatedAssessment = await Assessment.findById(req.params.id)
      .populate('comments.author', 'name userType');

    const newComment = populatedAssessment.comments[populatedAssessment.comments.length - 1];

    logger.info(`Comment added to assessment ${assessment._id} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: newComment
    });

  } catch (error) {
    logger.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding comment'
    });
  }
});

module.exports = router;
