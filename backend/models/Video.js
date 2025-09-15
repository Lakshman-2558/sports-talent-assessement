const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Video title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader information is required']
  },
  videoUrl: {
    type: String,
    required: [true, 'Video URL is required']
  },
  thumbnailUrl: {
    type: String,
    default: null
  },
  videoPublicId: {
    type: String,
    required: false // Cloudinary public ID for deletion
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  fileSize: {
    type: Number, // in bytes
    default: 0
  },
  mimeType: {
    type: String,
    default: 'video/mp4'
  },
  // Location information
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Location coordinates are required']
    },
    address: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    }
  },
  // Sport and category information
  sport: {
    type: String,
    required: [true, 'Sport type is required'],
    trim: true
  },
  category: {
    type: String,
    enum: ['training', 'performance', 'assessment', 'technique', 'other'],
    default: 'training'
  },
  // Video type to distinguish between gesture practice and assignment videos
  videoType: {
    type: String,
    enum: ['gesture_practice', 'assignment_submission', 'regular_upload'],
    default: 'regular_upload'
  },
  skillLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'professional'],
    default: 'beginner'
  },
  // Sharing and visibility settings
  visibility: {
    type: String,
    enum: ['public', 'coaches_only', 'sai_officials_only', 'private'],
    default: 'coaches_only'
  },
  shareRadius: {
    type: Number, // in kilometers
    default: 50,
    min: [1, 'Share radius must be at least 1km'],
    max: [500, 'Share radius cannot exceed 500km']
  },
  // Engagement metrics
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    commentedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // AI Analysis results (if applicable)
  aiAnalysis: {
    confidence: Number,
    detectedAnomalies: [{
      type: String,
      description: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high']
      },
      timestamp: Number
    }],
    formAnalysis: {
      overallScore: Number,
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
    },
    rawMeasurements: mongoose.Schema.Types.Mixed,
    processedAt: Date
  },
  // Status and moderation
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending'
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatedAt: Date,
  moderationNotes: String,
  // Coach verification for assessment videos
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  verificationNotes: String,
  // Tags for better searchability
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }]
}, {
  timestamps: true
});

// Create geospatial index for location-based queries
videoSchema.index({ location: '2dsphere' });

// Create compound indexes for better query performance
videoSchema.index({ uploadedBy: 1, createdAt: -1 });
videoSchema.index({ sport: 1, category: 1, createdAt: -1 });
videoSchema.index({ visibility: 1, status: 1, createdAt: -1 });
videoSchema.index({ 'location.city': 1, 'location.state': 1 });

// Virtual for like count
videoSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Virtual for comment count
videoSchema.virtual('commentCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

// Method to check if user has liked the video
videoSchema.methods.isLikedBy = function(userId) {
  return this.likes.some(like => like.user.toString() === userId.toString());
};

// Method to add a like
videoSchema.methods.addLike = function(userId) {
  if (!this.isLikedBy(userId)) {
    this.likes.push({ user: userId });
  }
};

// Method to remove a like
videoSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
};

// Method to add a comment
videoSchema.methods.addComment = function(userId, commentText) {
  this.comments.push({
    user: userId,
    comment: commentText
  });
};

// Static method to find videos within radius
videoSchema.statics.findNearby = function(longitude, latitude, radiusInKm, filters = {}) {
  const query = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: radiusInKm * 1000 // Convert km to meters
      }
    },
    status: 'approved',
    ...filters
  };
  
  return this.find(query).populate('uploadedBy', 'name userType specialization city state');
};

// Static method to find videos for coaches (nearby athletes)
videoSchema.statics.findForCoaches = function(longitude, latitude, radiusInKm = 50) {
  return this.findNearby(longitude, latitude, radiusInKm, {
    visibility: { $in: ['public', 'coaches_only'] },
    'uploadedBy': { $exists: true }
  }).populate('uploadedBy', 'name userType specialization city state');
};

// Static method to find videos for SAI officials
videoSchema.statics.findForSAIOfficials = function(longitude, latitude, radiusInKm = 100) {
  return this.findNearby(longitude, latitude, radiusInKm, {
    visibility: { $in: ['public', 'coaches_only', 'sai_officials_only'] }
  }).populate('uploadedBy', 'name userType specialization city state');
};

// Ensure virtual fields are serialized
videoSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Video', videoSchema);
