const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  athlete: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Athlete reference is required']
  },
  assessmentType: {
    type: String,
    required: [true, 'Assessment type is required'],
    enum: [
      'vertical_jump',
      'shuttle_run',
      'sit_ups',
      'endurance_run_800m',
      'endurance_run_1500m',
      'height_weight',
      'flexibility',
      'strength_test'
    ]
  },
  testDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  videoUrl: {
    type: String,
    required: function() {
      return ['vertical_jump', 'shuttle_run', 'sit_ups', 'endurance_run_800m', 'endurance_run_1500m'].includes(this.assessmentType);
    }
  },
  videoPublicId: {
    type: String // Cloudinary public ID for video management
  },
  videoThumbnail: {
    type: String
  },
  videoDuration: {
    type: Number // in seconds
  },
  // Raw measurements
  rawData: {
    // For vertical jump
    jumpHeight: {
      type: Number // in cm
    },
    // For shuttle run
    shuttleTime: {
      type: Number // in seconds
    },
    // For sit-ups
    sitUpCount: {
      type: Number
    },
    sitUpDuration: {
      type: Number // in seconds, usually 60s
    },
    // For endurance runs
    runTime: {
      type: Number // in seconds
    },
    runDistance: {
      type: Number // in meters
    },
    // For height/weight
    height: {
      type: Number // in cm
    },
    weight: {
      type: Number // in kg
    },
    // For flexibility
    flexibilityScore: {
      type: Number // in cm (sit-and-reach test)
    },
    // For strength test
    strengthScore: {
      type: Number
    }
  },
  // AI Analysis Results
  aiAnalysis: {
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    },
    detectedAnomalies: [{
      type: {
        type: String,
        enum: ['form_issue', 'timing_manipulation', 'video_tampering', 'environmental_factor']
      },
      description: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high']
      },
      timestamp: Number // seconds in video
    }],
    formAnalysis: {
      overallScore: {
        type: Number,
        min: 0,
        max: 100
      },
      keyPoints: [{
        joint: String,
        accuracy: Number,
        feedback: String
      }]
    },
    performanceMetrics: {
      consistency: Number, // 0-100
      technique: Number, // 0-100
      efficiency: Number // 0-100
    }
  },
  // Verification status
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'flagged', 'rejected'],
    default: 'pending'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verificationDate: {
    type: Date
  },
  verificationNotes: {
    type: String
  },
  // Scoring and benchmarking
  normalizedScore: {
    type: Number,
    min: 0,
    max: 100
  },
  percentile: {
    type: Number,
    min: 0,
    max: 100
  },
  ageGroupRank: {
    type: Number
  },
  genderRank: {
    type: Number
  },
  // Benchmarking data
  benchmarkData: {
    ageGroup: String, // e.g., "16-18"
    gender: String,
    averageScore: Number,
    topPercentileScore: Number,
    bottomPercentileScore: Number
  },
  // Environmental conditions
  testConditions: {
    weather: String,
    temperature: Number,
    humidity: Number,
    location: String,
    equipment: String
  },
  // Retry information
  attemptNumber: {
    type: Number,
    default: 1
  },
  previousAttempts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment'
  }],
  // Coach/Official comments
  comments: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['feedback', 'improvement_suggestion', 'verification_note']
    }
  }],
  // Flags and alerts
  flags: [{
    type: {
      type: String,
      enum: ['performance_anomaly', 'technical_issue', 'requires_review']
    },
    description: String,
    flaggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    flaggedAt: {
      type: Date,
      default: Date.now
    },
    resolved: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
assessmentSchema.index({ athlete: 1, assessmentType: 1, testDate: -1 });
assessmentSchema.index({ verificationStatus: 1, testDate: -1 });
assessmentSchema.index({ 'benchmarkData.ageGroup': 1, 'benchmarkData.gender': 1 });
assessmentSchema.index({ normalizedScore: -1, percentile: -1 });

// Calculate percentile based on age group and gender
assessmentSchema.methods.calculatePercentile = async function() {
  const Assessment = this.constructor;
  
  // Get athlete's age and gender
  await this.populate('athlete', 'dateOfBirth gender');
  const age = this.athlete.age;
  const gender = this.athlete.gender;
  
  // Define age group
  let ageGroup;
  if (age < 16) ageGroup = '12-15';
  else if (age < 19) ageGroup = '16-18';
  else if (age < 23) ageGroup = '19-22';
  else ageGroup = '23+';
  
  // Find all verified assessments of same type, age group, and gender
  const similarAssessments = await Assessment.find({
    assessmentType: this.assessmentType,
    verificationStatus: 'verified',
    'benchmarkData.ageGroup': ageGroup,
    'benchmarkData.gender': gender,
    normalizedScore: { $exists: true }
  }).select('normalizedScore');
  
  if (similarAssessments.length === 0) {
    this.percentile = 50; // Default to median if no data
    return;
  }
  
  // Calculate percentile
  const scores = similarAssessments.map(a => a.normalizedScore).sort((a, b) => a - b);
  const rank = scores.filter(score => score < this.normalizedScore).length;
  this.percentile = Math.round((rank / scores.length) * 100);
  
  // Update benchmark data
  this.benchmarkData = {
    ageGroup,
    gender,
    averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
    topPercentileScore: scores[Math.floor(scores.length * 0.9)],
    bottomPercentileScore: scores[Math.floor(scores.length * 0.1)]
  };
};

// Generate improvement suggestions
assessmentSchema.methods.generateImprovementSuggestions = function() {
  const suggestions = [];
  
  if (this.aiAnalysis.performanceMetrics) {
    const { consistency, technique, efficiency } = this.aiAnalysis.performanceMetrics;
    
    if (technique < 70) {
      suggestions.push({
        area: 'Technique',
        priority: 'high',
        suggestion: 'Focus on proper form and technique. Consider working with a coach to improve movement patterns.'
      });
    }
    
    if (consistency < 60) {
      suggestions.push({
        area: 'Consistency',
        priority: 'medium',
        suggestion: 'Work on maintaining consistent performance across multiple attempts. Practice regularly to build muscle memory.'
      });
    }
    
    if (efficiency < 65) {
      suggestions.push({
        area: 'Efficiency',
        priority: 'medium',
        suggestion: 'Focus on energy conservation and optimal movement patterns to improve efficiency.'
      });
    }
  }
  
  return suggestions;
};

// Virtual for assessment display name
assessmentSchema.virtual('displayName').get(function() {
  const typeNames = {
    'vertical_jump': 'Vertical Jump',
    'shuttle_run': 'Shuttle Run',
    'sit_ups': 'Sit-ups',
    'endurance_run_800m': '800m Endurance Run',
    'endurance_run_1500m': '1500m Endurance Run',
    'height_weight': 'Height & Weight',
    'flexibility': 'Flexibility Test',
    'strength_test': 'Strength Test'
  };
  
  return typeNames[this.assessmentType] || this.assessmentType;
});

assessmentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Assessment', assessmentSchema);
