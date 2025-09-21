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
    type: String
  },
  videoThumbnail: {
    type: String
  },
  videoDuration: {
    type: Number
  },
  // GEOSPATIAL LOCATION DATA
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  locationMetadata: {
    accuracy: Number,
    capturedAt: Date,
    source: String
  },
  // Raw measurements
  rawData: {
    jumpHeight: { type: Number },
    shuttleTime: { type: Number },
    sitUpCount: { type: Number },
    sitUpDuration: { type: Number },
    runTime: { type: Number },
    runDistance: { type: Number },
    height: { type: Number },
    weight: { type: Number },
    flexibilityScore: { type: Number },
    strengthScore: { type: Number }
  },
  aiAnalysis: {
    confidence: { type: Number, min: 0, max: 1, default: 0 },
    detectedAnomalies: [{
      type: { type: String, enum: ['form_issue', 'timing_manipulation', 'video_tampering', 'environmental_factor'] },
      description: String,
      severity: { type: String, enum: ['low', 'medium', 'high'] },
      timestamp: Number
    }],
    formAnalysis: {
      overallScore: { type: Number, min: 0, max: 100 },
      keyPoints: [{
        joint: String,
        accuracy: Number,
        feedback: String
      }]
    },
    performanceMetrics: {
      consistency: Number,
      technique: Number,
      efficiency: Number
    }
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'flagged', 'rejected'],
    default: 'pending'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verificationDate: Date,
  verificationNotes: String,
  normalizedScore: { type: Number, min: 0, max: 100 },
  percentile: { type: Number, min: 0, max: 100 },
  ageGroupRank: Number,
  genderRank: Number,
  benchmarkData: {
    ageGroup: String,
    gender: String,
    averageScore: Number,
    topPercentileScore: Number,
    bottomPercentileScore: Number
  },
  testConditions: {
    weather: String,
    temperature: Number,
    humidity: Number,
    location: String,
    equipment: String
  },
  attemptNumber: { type: Number, default: 1 },
  previousAttempts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Assessment' }],
  comments: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: String,
    timestamp: { type: Date, default: Date.now },
    type: { type: String, enum: ['feedback', 'improvement_suggestion', 'verification_note'] }
  }],
  flags: [{
    type: { type: String, enum: ['performance_anomaly', 'technical_issue', 'requires_review'] },
    description: String,
    flaggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    flaggedAt: { type: Date, default: Date.now },
    resolved: { type: Boolean, default: false }
  }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  views: { type: Number, default: 0 }
}, {
  timestamps: true
});

// GEOSPATIAL INDEX
assessmentSchema.index({ location: '2dsphere' });
assessmentSchema.index({ athlete: 1, assessmentType: 1, testDate: -1 });
assessmentSchema.index({ verificationStatus: 1, testDate: -1 });
assessmentSchema.index({ 'benchmarkData.ageGroup': 1, 'benchmarkData.gender': 1 });
assessmentSchema.index({ normalizedScore: -1, percentile: -1 });

// Virtual for like count
assessmentSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
assessmentSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

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