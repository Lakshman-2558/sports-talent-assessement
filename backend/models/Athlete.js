const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Athlete model now includes authentication + profile fields
const athleteSchema = new mongoose.Schema({
  // Auth/Common fields
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'] },
  password: { type: String, required: true, minlength: 6, select: false },
  phone: { type: String, required: true, match: /^\+?[\d\s-()]+$/ },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, required: true, enum: ['male', 'female', 'other'] },
  state: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  profileImage: { type: String, default: null },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null },

  // Sports Information
  sport: { type: String, trim: true },
  category: { type: String, trim: true },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'professional', 'elite'],
    default: 'beginner'
  },

  // Physical Information
  height: { type: Number, min: 50, max: 300 }, // centimeters
  weight: { type: Number, min: 20, max: 300 },  // kilograms
  bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },

  // Emergency Contact
  emergencyContact: {
    name: String,
    phone: { type: String, match: /^\+?[\d\s-()]+$/ },
    relationship: String
  },

  // Training Information
  trainingCenter: { type: String, trim: true },
  coach: { type: mongoose.Schema.Types.ObjectId, ref: 'Coach' },
  personalBest: [{ event: String, performance: String, date: Date, venue: String }],
  achievements: [{
    title: String,
    description: String,
    date: Date,
    level: { type: String, enum: ['local', 'state', 'national', 'international'] }
  }],

  // Medical Information
  medicalHistory: [{
    condition: String,
    description: String,
    date: Date,
    status: { type: String, enum: ['active', 'resolved', 'chronic'] }
  }],
  injuries: [{
    type: String,
    description: String,
    date: Date,
    recoveryStatus: { type: String, enum: ['recovering', 'recovered', 'chronic'] }
  }],

  // Gamification
  points: { type: Number, default: 0 },
  badges: [{ name: String, description: String, earnedDate: Date, icon: String }],
  performanceLevel: { type: Number, default: 1 }
}, {
  timestamps: true
});

// Indexes
athleteSchema.index(
  { email: 1 },
  { unique: true, sparse: true, partialFilterExpression: { email: { $type: 'string' } } }
);
athleteSchema.index({ sport: 1, category: 1 });

// Virtuals
athleteSchema.virtual('bmi').get(function() {
  if (!this.height || !this.weight) return null;
  const heightInMeters = this.height / 100;
  return Number((this.weight / (heightInMeters * heightInMeters)).toFixed(2));
});

// Password hashing
athleteSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Methods
athleteSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

athleteSchema.set('toJSON', { virtuals: true, transform: (doc, ret) => { delete ret.password; return ret; } });

module.exports = mongoose.model('Athlete', athleteSchema);
