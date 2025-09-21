const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Coach model now includes authentication + profile fields
const coachSchema = new mongoose.Schema({
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

  // Professional Information
  specialization: [{ type: String, trim: true }],
  experience: { type: Number, min: 0 }, // years
  coachingLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'elite', 'international']
  },

  certifications: [{
    name: String,
    issuedBy: String,
    issuedDate: Date,
    expiryDate: Date,
    certificateNumber: String,
    isActive: { type: Boolean, default: true }
  }],

  education: [{ degree: String, institution: String, year: Number, field: String }],

  // Employment Information
  currentEmployment: {
    organization: String,
    position: String,
    startDate: Date,
    employmentType: { type: String, enum: ['full-time', 'part-time', 'contract', 'freelance'] }
  },
  previousExperience: [{
    organization: String,
    position: String,
    startDate: Date,
    endDate: Date,
    description: String
  }],

  // Athletes
  athletes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Athlete' }],
  maxAthletes: { type: Number, default: 20, min: 1 },
  isAcceptingAthletes: { type: Boolean, default: true },

  // Programs
  trainingPrograms: [{
    name: String,
    description: String,
    duration: String,
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
    price: Number,
    isActive: { type: Boolean, default: true }
  }],

  // Availability and Scheduling
  availability: {
    monday: { available: { type: Boolean, default: true }, timeSlots: [{ start: String, end: String }] },
    tuesday: { available: { type: Boolean, default: true }, timeSlots: [{ start: String, end: String }] },
    wednesday: { available: { type: Boolean, default: true }, timeSlots: [{ start: String, end: String }] },
    thursday: { available: { type: Boolean, default: true }, timeSlots: [{ start: String, end: String }] },
    friday: { available: { type: Boolean, default: true }, timeSlots: [{ start: String, end: String }] },
    saturday: { available: { type: Boolean, default: true }, timeSlots: [{ start: String, end: String }] },
    sunday: { available: { type: Boolean, default: false }, timeSlots: [{ start: String, end: String }] }
  },

  // Ratings and Reviews
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  reviews: [{
    athlete: { type: mongoose.Schema.Types.ObjectId, ref: 'Athlete' },
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    date: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

coachSchema.index(
  { email: 1 },
  { unique: true, sparse: true, partialFilterExpression: { email: { $type: 'string' } } }
);
coachSchema.index({ 'rating.average': -1 });

// Password hashing
coachSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

coachSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

coachSchema.set('toJSON', { virtuals: true, transform: (doc, ret) => { delete ret.password; return ret; } });

module.exports = mongoose.model('Coach', coachSchema);