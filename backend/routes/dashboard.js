const express = require('express');
const Assessment = require('../models/Assessment');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics for current user
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const userType = req.user.userType;

    let stats = {};

    if (userType === 'athlete') {
      // Athlete dashboard stats
      const totalAssessments = await Assessment.countDocuments({ athlete: userId });
      const verifiedAssessments = await Assessment.countDocuments({ 
        athlete: userId, 
        verificationStatus: 'verified' 
      });
      const pendingAssessments = await Assessment.countDocuments({ 
        athlete: userId, 
        verificationStatus: 'pending' 
      });

      // Get best scores for each test type
      const bestScores = await Assessment.aggregate([
        { $match: { athlete: userId, verificationStatus: 'verified' } },
        {
          $group: {
            _id: '$assessmentType',
            bestScore: { $max: '$normalizedScore' },
            bestPercentile: { $max: '$percentile' }
          }
        }
      ]);

      // Recent performance trend
      const recentAssessments = await Assessment.find({ 
        athlete: userId,
        verificationStatus: 'verified'
      })
      .sort({ testDate: -1 })
      .limit(5)
      .select('normalizedScore testDate assessmentType');

      stats = {
        totalAssessments,
        verifiedAssessments,
        pendingAssessments,
        bestScores,
        recentPerformance: recentAssessments,
        averageScore: recentAssessments.length > 0 
          ? recentAssessments.reduce((sum, a) => sum + a.normalizedScore, 0) / recentAssessments.length 
          : 0
      };

    } else if (userType === 'coach') {
      // Coach dashboard stats
      const totalAthletes = await User.countDocuments({ userType: 'athlete' });
      const totalAssessments = await Assessment.countDocuments();
      const pendingVerifications = await Assessment.countDocuments({ 
        verificationStatus: 'pending' 
      });

      // Recent assessments from all athletes
      const recentAssessments = await Assessment.find()
        .sort({ testDate: -1 })
        .limit(10)
        .populate('athlete', 'name email')
        .select('assessmentType testDate normalizedScore verificationStatus athlete');

      stats = {
        totalAthletes,
        totalAssessments,
        pendingVerifications,
        recentAssessments
      };

    } else if (userType === 'sai_official') {
      // SAI Official dashboard stats
      const totalAthletes = await User.countDocuments({ userType: 'athlete' });
      const totalCoaches = await User.countDocuments({ userType: 'coach' });
      const totalAssessments = await Assessment.countDocuments();
      const pendingVerifications = await Assessment.countDocuments({ 
        verificationStatus: 'pending' 
      });
      const verifiedToday = await Assessment.countDocuments({
        verificationStatus: 'verified',
        verificationDate: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      });

      // Assessment distribution by type
      const assessmentsByType = await Assessment.aggregate([
        {
          $group: {
            _id: '$assessmentType',
            count: { $sum: 1 },
            averageScore: { $avg: '$normalizedScore' }
          }
        }
      ]);

      // Top performers
      const topPerformers = await Assessment.aggregate([
        { $match: { verificationStatus: 'verified' } },
        {
          $group: {
            _id: '$athlete',
            averageScore: { $avg: '$normalizedScore' },
            totalAssessments: { $sum: 1 }
          }
        },
        { $match: { totalAssessments: { $gte: 3 } } },
        { $sort: { averageScore: -1 } },
        { $limit: 10 }
      ]);

      // Populate athlete details for top performers
      const populatedTopPerformers = await User.populate(topPerformers, {
        path: '_id',
        select: 'name email city state'
      });

      stats = {
        totalAthletes,
        totalCoaches,
        totalAssessments,
        pendingVerifications,
        verifiedToday,
        assessmentsByType,
        topPerformers: populatedTopPerformers.map(p => ({
          athlete: p._id,
          averageScore: Math.round(p.averageScore),
          totalAssessments: p.totalAssessments
        }))
      };
    }

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    logger.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving dashboard stats'
    });
  }
});

// @route   GET /api/dashboard/athletes
// @desc    Get athletes list for coaches and SAI officials
// @access  Private (Coaches and SAI Officials only)
router.get('/athletes', auth, authorize('coach', 'sai_official'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const state = req.query.state || '';
    const sport = req.query.sport || '';

    // Build query
    let query = { userType: 'athlete' };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (state) {
      query.state = state;
    }
    
    if (sport) {
      query.specialization = { $regex: sport, $options: 'i' };
    }

    const athletes = await User.find(query)
      .select('name email phone city state specialization points level badges createdAt')
      .sort({ points: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    // Get assessment counts for each athlete
    const athleteIds = athletes.map(a => a._id);
    const assessmentCounts = await Assessment.aggregate([
      { $match: { athlete: { $in: athleteIds } } },
      {
        $group: {
          _id: '$athlete',
          totalAssessments: { $sum: 1 },
          verifiedAssessments: {
            $sum: { $cond: [{ $eq: ['$verificationStatus', 'verified'] }, 1, 0] }
          },
          averageScore: { $avg: '$normalizedScore' }
        }
      }
    ]);

    // Merge assessment data with athlete data
    const athletesWithStats = athletes.map(athlete => {
      const stats = assessmentCounts.find(s => s._id.toString() === athlete._id.toString()) || {
        totalAssessments: 0,
        verifiedAssessments: 0,
        averageScore: 0
      };
      
      return {
        ...athlete.toObject(),
        assessmentStats: {
          total: stats.totalAssessments,
          verified: stats.verifiedAssessments,
          averageScore: Math.round(stats.averageScore || 0)
        }
      };
    });

    res.json({
      success: true,
      athletes: athletesWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('Get athletes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving athletes'
    });
  }
});

// @route   GET /api/dashboard/pending-assessments
// @desc    Get pending assessments for verification
// @access  Private (SAI Officials only)
router.get('/pending-assessments', auth, authorize('sai_official'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const testType = req.query.testType || '';

    let query = { verificationStatus: 'pending' };
    
    if (testType) {
      query.assessmentType = testType;
    }

    const assessments = await Assessment.find(query)
      .populate('athlete', 'name email city state specialization')
      .sort({ testDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Assessment.countDocuments(query);

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
    logger.error('Get pending assessments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving pending assessments'
    });
  }
});

// @route   GET /api/dashboard/analytics
// @desc    Get analytics data for SAI officials
// @access  Private (SAI Officials only)
router.get('/analytics', auth, authorize('sai_official'), async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '30'; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeframe));

    // Registration trends
    const registrationTrend = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            userType: '$userType'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Assessment trends
    const assessmentTrend = await Assessment.aggregate([
      { $match: { testDate: { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$testDate' } },
            assessmentType: '$assessmentType'
          },
          count: { $sum: 1 },
          averageScore: { $avg: '$normalizedScore' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Geographic distribution
    const geographicDistribution = await User.aggregate([
      { $match: { userType: 'athlete' } },
      {
        $group: {
          _id: '$state',
          athleteCount: { $sum: 1 },
          averagePoints: { $avg: '$points' }
        }
      },
      { $sort: { athleteCount: -1 } }
    ]);

    // Performance distribution
    const performanceDistribution = await Assessment.aggregate([
      { $match: { verificationStatus: 'verified', normalizedScore: { $exists: true } } },
      {
        $bucket: {
          groupBy: '$normalizedScore',
          boundaries: [0, 20, 40, 60, 80, 100],
          default: 'Other',
          output: {
            count: { $sum: 1 },
            averageScore: { $avg: '$normalizedScore' }
          }
        }
      }
    ]);

    res.json({
      success: true,
      analytics: {
        registrationTrend,
        assessmentTrend,
        geographicDistribution,
        performanceDistribution,
        timeframe: parseInt(timeframe)
      }
    });

  } catch (error) {
    logger.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving analytics'
    });
  }
});

// @route   POST /api/dashboard/bulk-verify
// @desc    Bulk verify assessments
// @access  Private (SAI Officials only)
router.post('/bulk-verify', auth, authorize('sai_official'), async (req, res) => {
  try {
    const { assessmentIds, status, notes } = req.body;

    if (!assessmentIds || !Array.isArray(assessmentIds) || assessmentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Assessment IDs array is required'
      });
    }

    if (!['verified', 'flagged', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification status'
      });
    }

    const result = await Assessment.updateMany(
      { _id: { $in: assessmentIds }, verificationStatus: 'pending' },
      {
        $set: {
          verificationStatus: status,
          verifiedBy: req.user._id,
          verificationDate: new Date(),
          verificationNotes: notes || ''
        }
      }
    );

    logger.info(`Bulk verification: ${result.modifiedCount} assessments ${status} by ${req.user.email}`);

    res.json({
      success: true,
      message: `${result.modifiedCount} assessments ${status} successfully`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    logger.error('Bulk verify error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during bulk verification'
    });
  }
});

module.exports = router;
