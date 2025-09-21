const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Official model now includes authentication + profile fields
const officialSchema = new mongoose.Schema({
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

  // Official-specific
  employeeId: { type: String, index: true },
  department: { type: String, trim: true },
  designation: { type: String, trim: true },
  officeLocation: { type: String, trim: true },

  accessLevel: { type: String, enum: ['basic', 'advanced', 'admin'], default: 'basic' },
  permissions: [{ type: String }],
  reportingManager: { type: String, trim: true },
  areasOfResponsibility: [{ type: String, trim: true }]
}, {
  timestamps: true
});

officialSchema.index({ email: 1 }, { unique: true });

// Password hashing
officialSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

officialSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

officialSchema.set('toJSON', { virtuals: true, transform: (doc, ret) => { delete ret.password; return ret; } });

module.exports = mongoose.model('Official', officialSchema);
