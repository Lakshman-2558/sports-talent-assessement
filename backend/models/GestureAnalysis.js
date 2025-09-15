const mongoose = require('mongoose');

const gestureAnalysisSchema = new mongoose.Schema({
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: false
  },
  athleteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sport: {
    type: String,
    required: true,
    enum: ['athletics', 'football', 'basketball', 'swimming', 'cricket', 'badminton', 'wrestling', 'boxing']
  },
  category: {
    type: String,
    required: true,
    enum: ['sprint', 'long_jump', 'high_jump', 'shot_put', 'dribbling', 'shooting', 'passing', 'general']
  },
  totalAttempts: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  violations: [{
    attemptNumber: {
      type: Number,
      required: true
    },
    timestamp: {
      type: Number, // Milliseconds from start of recording
      required: true
    },
    ruleName: {
      type: String,
      required: true
    },
    ruleDescription: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ['minor', 'major', 'critical'],
      default: 'major'
    },
    landmarkData: {
      type: Object, // Store pose landmarks at violation time
      required: false
    }
  }],
  rulesApplied: [{
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    parameters: {
      type: Object,
      default: {}
    }
  }],
  analysisResults: {
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    formAccuracy: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    consistencyScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    improvementAreas: [{
      area: String,
      priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      },
      suggestion: String
    }]
  },
  recordingMetadata: {
    duration: {
      type: Number, // Duration in seconds
      required: false,
      default: 0
    },
    fps: {
      type: Number,
      default: 30
    },
    resolution: {
      width: Number,
      height: Number
    },
    recordingQuality: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  },
  status: {
    type: String,
    enum: ['recording', 'analyzing', 'completed', 'failed'],
    default: 'recording'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
gestureAnalysisSchema.index({ athleteId: 1, sport: 1 });
gestureAnalysisSchema.index({ videoId: 1 });
gestureAnalysisSchema.index({ createdAt: -1 });

// Virtual for violation count
gestureAnalysisSchema.virtual('violationCount').get(function() {
  return this.violations.length;
});

// Virtual for success rate
gestureAnalysisSchema.virtual('successRate').get(function() {
  if (this.totalAttempts === 0) return 0;
  const successfulAttempts = this.totalAttempts - Math.min(this.violations.length, 3);
  return (successfulAttempts / this.totalAttempts) * 100;
});

// Method to add violation
gestureAnalysisSchema.methods.addViolation = function(attemptNumber, timestamp, ruleName, ruleDescription, severity = 'major', landmarkData = null) {
  this.violations.push({
    attemptNumber,
    timestamp,
    ruleName,
    ruleDescription,
    severity,
    landmarkData
  });
  return this.save();
};

// Method to calculate final scores
gestureAnalysisSchema.methods.calculateScores = function() {
  const totalViolations = this.violations.length;
  const maxViolations = this.totalAttempts * 3; // Max 3 violations per attempt
  
  // Form accuracy based on violations
  this.analysisResults.formAccuracy = Math.max(0, 100 - (totalViolations / maxViolations) * 100);
  
  // Consistency score based on violation distribution across attempts
  const violationsByAttempt = {};
  this.violations.forEach(v => {
    violationsByAttempt[v.attemptNumber] = (violationsByAttempt[v.attemptNumber] || 0) + 1;
  });
  
  const attemptScores = Object.values(violationsByAttempt);
  const avgViolationsPerAttempt = attemptScores.reduce((a, b) => a + b, 0) / this.totalAttempts;
  const variance = attemptScores.reduce((acc, score) => acc + Math.pow(score - avgViolationsPerAttempt, 2), 0) / this.totalAttempts;
  this.analysisResults.consistencyScore = Math.max(0, 100 - variance * 20);
  
  // Overall score (weighted average)
  this.analysisResults.overallScore = (this.analysisResults.formAccuracy * 0.7) + (this.analysisResults.consistencyScore * 0.3);
  
  return this.save();
};

// Static method to get athlete's progress
gestureAnalysisSchema.statics.getAthleteProgress = function(athleteId, sport, limit = 10) {
  return this.find({ athleteId, sport })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('videoId', 'title createdAt')
    .select('analysisResults violations totalAttempts createdAt');
};

// Static method to get sport-specific analytics
gestureAnalysisSchema.statics.getSportAnalytics = function(sport, timeframe = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeframe);
  
  return this.aggregate([
    {
      $match: {
        sport: sport,
        createdAt: { $gte: startDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        avgOverallScore: { $avg: '$analysisResults.overallScore' },
        avgFormAccuracy: { $avg: '$analysisResults.formAccuracy' },
        avgConsistencyScore: { $avg: '$analysisResults.consistencyScore' },
        totalAnalyses: { $sum: 1 },
        totalViolations: { $sum: { $size: '$violations' } },
        commonViolations: {
          $push: {
            $map: {
              input: '$violations',
              as: 'violation',
              in: '$$violation.ruleName'
            }
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('GestureAnalysis', gestureAnalysisSchema);
