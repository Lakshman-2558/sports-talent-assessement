const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const GestureAnalysis = require('../models/GestureAnalysis');
const Video = require('../models/Video');
const logger = require('../utils/logger');

const router = express.Router();

// @route   POST /api/gesture-analysis/start
// @desc    Start a new gesture analysis session
// @access  Private
router.post('/start', auth, [
  body('sport').notEmpty().withMessage('Sport is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('videoId').optional().isMongoId().withMessage('Valid video ID required if provided')
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

    const { sport, category, videoId } = req.body;

    const analysisData = {
      athleteId: req.user.id,
      sport,
      category,
      status: 'recording',
      rulesApplied: getRulesForSportCategory(sport, category)
    };

    if (videoId) {
      analysisData.videoId = videoId;
    }

    const gestureAnalysis = new GestureAnalysis(analysisData);
    await gestureAnalysis.save();

    res.status(201).json({
      success: true,
      message: 'Gesture analysis session started',
      analysisId: gestureAnalysis._id,
      rules: gestureAnalysis.rulesApplied
    });

  } catch (error) {
    logger.error('Error starting gesture analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Server error starting analysis'
    });
  }
});

// @route   POST /api/gesture-analysis/:id/violation
// @desc    Record a rule violation during analysis
// @access  Private
router.post('/:id/violation', auth, [
  body('attemptNumber').isInt({ min: 1 }).withMessage('Valid attempt number required'),
  body('timestamp').isNumeric().withMessage('Valid timestamp required'),
  body('ruleName').notEmpty().withMessage('Rule name is required'),
  body('ruleDescription').notEmpty().withMessage('Rule description is required'),
  body('severity').optional().isIn(['minor', 'major', 'critical']).withMessage('Invalid severity level')
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

    const { attemptNumber, timestamp, ruleName, ruleDescription, severity, landmarkData } = req.body;
    const analysisId = req.params.id;

    const gestureAnalysis = await GestureAnalysis.findById(analysisId);
    if (!gestureAnalysis) {
      return res.status(404).json({
        success: false,
        message: 'Gesture analysis session not found'
      });
    }

    // Verify ownership
    if (gestureAnalysis.athleteId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this analysis'
      });
    }

    await gestureAnalysis.addViolation(
      attemptNumber,
      timestamp,
      ruleName,
      ruleDescription,
      severity || 'major',
      landmarkData
    );

    // Check if max violations reached (3 per attempt)
    const currentAttemptViolations = gestureAnalysis.violations.filter(
      v => v.attemptNumber === attemptNumber
    ).length;

    res.json({
      success: true,
      message: 'Violation recorded',
      violationCount: currentAttemptViolations,
      totalViolations: gestureAnalysis.violations.length,
      maxViolationsReached: currentAttemptViolations >= 3
    });

  } catch (error) {
    logger.error('Error recording violation:', error);
    res.status(500).json({
      success: false,
      message: 'Server error recording violation'
    });
  }
});

// @route   PUT /api/gesture-analysis/:id/complete
// @desc    Complete gesture analysis and calculate scores
// @access  Private
router.put('/:id/complete', auth, [
  body('duration').isNumeric().withMessage('Valid duration required'),
  body('totalAttempts').isInt({ min: 1 }).withMessage('Valid total attempts required'),
  body('recordingMetadata').optional().isObject().withMessage('Invalid recording metadata')
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

    const { duration, totalAttempts, recordingMetadata } = req.body;
    const analysisId = req.params.id;

    const gestureAnalysis = await GestureAnalysis.findById(analysisId);
    if (!gestureAnalysis) {
      return res.status(404).json({
        success: false,
        message: 'Gesture analysis session not found'
      });
    }

    // Verify ownership
    if (gestureAnalysis.athleteId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this analysis'
      });
    }

    // Update analysis data
    gestureAnalysis.totalAttempts = totalAttempts;
    gestureAnalysis.recordingMetadata.duration = duration;
    if (recordingMetadata) {
      Object.assign(gestureAnalysis.recordingMetadata, recordingMetadata);
    }
    gestureAnalysis.status = 'completed';
    gestureAnalysis.completedAt = new Date();

    // Calculate scores and improvement areas
    await gestureAnalysis.calculateScores();
    
    // Generate improvement suggestions
    gestureAnalysis.analysisResults.improvementAreas = generateImprovementSuggestions(
      gestureAnalysis.violations,
      gestureAnalysis.sport,
      gestureAnalysis.category
    );

    await gestureAnalysis.save();

    res.json({
      success: true,
      message: 'Analysis completed successfully',
      results: {
        overallScore: gestureAnalysis.analysisResults.overallScore,
        formAccuracy: gestureAnalysis.analysisResults.formAccuracy,
        consistencyScore: gestureAnalysis.analysisResults.consistencyScore,
        totalViolations: gestureAnalysis.violations.length,
        totalAttempts: gestureAnalysis.totalAttempts,
        improvementAreas: gestureAnalysis.analysisResults.improvementAreas
      }
    });

  } catch (error) {
    logger.error('Error completing analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Server error completing analysis'
    });
  }
});

// @route   GET /api/gesture-analysis/athlete/:athleteId
// @desc    Get athlete's gesture analysis history
// @access  Private
router.get('/athlete/:athleteId', auth, async (req, res) => {
  try {
    const { athleteId } = req.params;
    const { sport, limit = 10 } = req.query;

    // Verify access (athletes can only see their own data, coaches/officials can see all)
    if (req.user.userType === 'athlete' && athleteId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this data'
      });
    }

    const query = { athleteId };
    if (sport) query.sport = sport;

    const analyses = await GestureAnalysis.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('videoId', 'title createdAt')
      .select('sport category analysisResults violations totalAttempts createdAt completedAt status');

    res.json({
      success: true,
      analyses
    });

  } catch (error) {
    logger.error('Error fetching athlete analyses:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching analyses'
    });
  }
});

// @route   GET /api/gesture-analysis/:id
// @desc    Get detailed gesture analysis results
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const analysisId = req.params.id;

    const gestureAnalysis = await GestureAnalysis.findById(analysisId)
      .populate('athleteId', 'name email sport')
      .populate('videoId', 'title videoUrl createdAt');

    if (!gestureAnalysis) {
      return res.status(404).json({
        success: false,
        message: 'Gesture analysis not found'
      });
    }

    // Verify access
    if (req.user.userType === 'athlete' && gestureAnalysis.athleteId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this analysis'
      });
    }

    res.json({
      success: true,
      analysis: gestureAnalysis
    });

  } catch (error) {
    logger.error('Error fetching analysis details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching analysis'
    });
  }
});

// @route   GET /api/gesture-analysis/analytics/:sport
// @desc    Get sport-specific analytics
// @access  Private (Coaches/Officials only)
router.get('/analytics/:sport', auth, async (req, res) => {
  try {
    if (!['coach', 'sai_official'].includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Coaches and officials only.'
      });
    }

    const { sport } = req.params;
    const { timeframe = 30 } = req.query;

    const analytics = await GestureAnalysis.getSportAnalytics(sport, parseInt(timeframe));

    res.json({
      success: true,
      analytics: analytics[0] || {
        avgOverallScore: 0,
        avgFormAccuracy: 0,
        avgConsistencyScore: 0,
        totalAnalyses: 0,
        totalViolations: 0,
        commonViolations: []
      }
    });

  } catch (error) {
    logger.error('Error fetching sport analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching analytics'
    });
  }
});

// Helper function to get rules for sport/category combination
function getRulesForSportCategory(sport, category) {
  const ruleDatabase = {
    athletics: {
      sprint: [
        { name: 'proper_stance', description: 'Maintain proper sprint stance with slight forward lean' },
        { name: 'arm_swing', description: 'Arms should swing naturally, not crossing body centerline' },
        { name: 'knee_lift', description: 'Adequate knee lift for efficient stride' }
      ],
      long_jump: [
        { name: 'approach_angle', description: 'Maintain consistent approach angle' },
        { name: 'takeoff_position', description: 'Proper takeoff foot placement and body position' }
      ]
    },
    football: [
      { name: 'ball_control', description: 'Maintain close ball control while dribbling' },
      { name: 'body_position', description: 'Keep balanced body position during movements' }
    ],
    basketball: [
      { name: 'shooting_form', description: 'Proper shooting form with consistent release' },
      { name: 'dribbling_posture', description: 'Maintain low center of gravity while dribbling' }
    ]
  };

  return ruleDatabase[sport]?.[category] || ruleDatabase[sport] || [];
}

// Helper function to generate improvement suggestions
function generateImprovementSuggestions(violations, sport, category) {
  const suggestions = [];
  const violationCounts = {};

  // Count violations by rule
  violations.forEach(v => {
    violationCounts[v.ruleName] = (violationCounts[v.ruleName] || 0) + 1;
  });

  // Generate suggestions based on most common violations
  Object.entries(violationCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .forEach(([ruleName, count]) => {
      const suggestion = getSuggestionForRule(ruleName, sport, category);
      if (suggestion) {
        suggestions.push({
          area: ruleName.replace('_', ' '),
          priority: count >= 3 ? 'high' : count >= 2 ? 'medium' : 'low',
          suggestion
        });
      }
    });

  return suggestions;
}

function getSuggestionForRule(ruleName, sport, category) {
  const suggestionMap = {
    proper_stance: 'Focus on maintaining a slight forward lean with your torso. Practice wall drills to feel the correct body angle.',
    arm_swing: 'Keep your arms relaxed and swing them naturally. Avoid crossing your arms over your body centerline.',
    knee_lift: 'Work on high knee drills to improve your knee lift height and stride efficiency.',
    ball_control: 'Practice close ball control drills. Keep the ball within one step of your feet.',
    body_position: 'Focus on maintaining balance and a low center of gravity during movements.',
    shooting_form: 'Practice your shooting form with consistent hand placement and follow-through.',
    dribbling_posture: 'Keep your knees bent and maintain a low center of gravity while dribbling.'
  };

  return suggestionMap[ruleName] || 'Continue practicing proper form and technique.';
}

module.exports = router;
