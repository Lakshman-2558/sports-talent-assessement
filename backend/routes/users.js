const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Assessment = require('../models/Assessment');
const { auth, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// @route   GET /api/users/profile/:id
// @desc    Get user profile by ID
// @access  Private
router.get('/profile/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if current user can view this profile
    const canView = req.user._id.toString() === user._id.toString() ||
                   req.user.userType === 'coach' ||
                   req.user.userType === 'sai_official';

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get user's assessment statistics if viewing athlete profile
    let assessmentStats = null;
    if (user.userType === 'athlete') {
      const stats = await Assessment.aggregate([
        { $match: { athlete: user._id } },
        {
          $group: {
            _id: null,
            totalAssessments: { $sum: 1 },
            verifiedAssessments: {
              $sum: { $cond: [{ $eq: ['$verificationStatus', 'verified'] }, 1, 0] }
            },
            averageScore: { $avg: '$normalizedScore' },
            bestScore: { $max: '$normalizedScore' }
          }
        }
      ]);

      assessmentStats = stats[0] || {
        totalAssessments: 0,
        verifiedAssessments: 0,
        averageScore: 0,
        bestScore: 0
      };
    }

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        assessmentStats
      }
    });

  } catch (error) {
    logger.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving profile'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('phone').optional().isMobilePhone(),
  body('city').optional().trim().isLength({ min: 2 }),
  body('state').optional().trim().isLength({ min: 2 }),
  body('specialization').optional().trim().isLength({ min: 2 })
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

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update allowed fields
    const allowedFields = ['name', 'phone', 'city', 'state', 'specialization'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    // Update type-specific fields
    if (user.userType === 'athlete') {
      const athleteFields = ['height', 'weight', 'bloodGroup', 'emergencyContact'];
      athleteFields.forEach(field => {
        if (req.body[field] !== undefined) {
          user[field] = req.body[field];
        }
      });
    } else if (user.userType === 'coach') {
      const coachFields = ['experience', 'certifications'];
      coachFields.forEach(field => {
        if (req.body[field] !== undefined) {
          user[field] = req.body[field];
        }
      });
    }

    await user.save();

    logger.info(`Profile updated for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        phone: user.phone,
        city: user.city,
        state: user.state,
        specialization: user.specialization
      }
    });

  } catch (error) {
    logger.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during profile update'
    });
  }
});

// @route   GET /api/users/search
// @desc    Search users (coaches and SAI officials only)
// @access  Private
router.get('/search', auth, authorize('coach', 'sai_official'), async (req, res) => {
  try {
    const { q, userType, state, sport, page = 1, limit = 20 } = req.query;
    
    let query = {};
    
    if (userType && ['athlete', 'coach'].includes(userType)) {
      query.userType = userType;
    }
    
    if (state) {
      query.state = state;
    }
    
    if (sport) {
      query.specialization = { $regex: sport, $options: 'i' };
    }
    
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const users = await User.find(query)
      .select('name email userType city state specialization points level badges')
      .sort({ points: -1, name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    logger.error('User search error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during search'
    });
  }
});

// @route   POST /api/users/:id/award-badge
// @desc    Award badge to user (SAI officials only)
// @access  Private
router.post('/:id/award-badge', auth, authorize('sai_official'), [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Badge name is required'),
  body('description').trim().isLength({ min: 1, max: 200 }).withMessage('Badge description is required'),
  body('icon').optional().trim().isLength({ min: 1, max: 50 })
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

    const { name, description, icon } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user already has this badge
    const existingBadge = user.badges.find(badge => badge.name === name);
    if (existingBadge) {
      return res.status(400).json({
        success: false,
        message: 'User already has this badge'
      });
    }

    const newBadge = {
      name,
      description,
      icon: icon || 'fas fa-medal',
      earnedDate: new Date()
    };

    user.badges.push(newBadge);
    user.points += 50; // Award points for earning a badge
    await user.save();

    logger.info(`Badge "${name}" awarded to user ${user.email} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Badge awarded successfully',
      badge: newBadge
    });

  } catch (error) {
    logger.error('Award badge error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error awarding badge'
    });
  }
});

// @route   GET /api/users/leaderboard
// @desc    Get user leaderboard
// @access  Public
router.get('/leaderboard', async (req, res) => {
  try {
    const { userType = 'athlete', state, limit = 50 } = req.query;
    
    let query = { userType };
    
    if (state) {
      query.state = state;
    }

    const users = await User.find(query)
      .select('name city state specialization points level badges')
      .sort({ points: -1, level: -1 })
      .limit(parseInt(limit));

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      name: user.name,
      location: `${user.city}, ${user.state}`,
      specialization: user.specialization,
      points: user.points,
      level: user.level,
      badgeCount: user.badges.length
    }));

    res.json({
      success: true,
      leaderboard
    });

  } catch (error) {
    logger.error('Leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving leaderboard'
    });
  }
});

// @route   PUT /api/users/:id/status
// @desc    Update user status (SAI officials only)
// @access  Private
router.put('/:id/status', auth, authorize('sai_official'), [
  body('isActive').isBoolean().withMessage('isActive must be a boolean'),
  body('isVerified').optional().isBoolean().withMessage('isVerified must be a boolean')
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

    const { isActive, isVerified } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = isActive;
    if (isVerified !== undefined) {
      user.isVerified = isVerified;
    }

    await user.save();

    logger.info(`User status updated for ${user.email} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'User status updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    logger.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating user status'
    });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private (SAI Officials only)
router.get('/stats', auth, authorize('sai_official'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    
    const usersByType = await User.aggregate([
      {
        $group: {
          _id: '$userType',
          count: { $sum: 1 }
        }
      }
    ]);

    const usersByState = await User.aggregate([
      { $match: { userType: 'athlete' } },
      {
        $group: {
          _id: '$state',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const topPerformers = await User.find({ userType: 'athlete' })
      .select('name city state points level badges')
      .sort({ points: -1 })
      .limit(10);

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        verifiedUsers,
        usersByType,
        usersByState,
        topPerformers
      }
    });

  } catch (error) {
    logger.error('User stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving user statistics'
    });
  }
});

module.exports = router;
