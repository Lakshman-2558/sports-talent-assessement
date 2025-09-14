const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  userType: {
    type: String,
    required: [true, 'User type is required'],
    enum: ['athlete', 'coach', 'sai_official'],
    default: 'athlete'
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['male', 'female', 'other']
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  specialization: {
    type: String,
    required: [true, 'Specialization is required'],
    trim: true
  },
  profileImage: {
    type: String,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  // Athlete specific fields
  height: {
    type: Number,
    required: false
  },
  weight: {
    type: Number,
    required: false
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: false
  },
  emergencyContact: {
    name: {
      type: String,
      required: false
    },
    phone: {
      type: String,
      required: false
    },
    relationship: {
      type: String,
      required: false
    }
  },
  // Coach specific fields
  experience: {
    type: Number,
    required: false
  },
  certifications: [{
    name: String,
    issuedBy: String,
    issuedDate: Date,
    expiryDate: Date
  }],
  // SAI Official specific fields
  employeeId: {
    type: String,
    required: false,
    unique: true,
    sparse: true
  },
  department: {
    type: String,
    required: false
  },
  accessLevel: {
    type: String,
    enum: ['basic', 'advanced', 'admin'],
    default: function() { return this.userType === 'sai_official' ? 'basic' : undefined; }
  },
  // Gamification fields
  points: {
    type: Number,
    default: 0
  },
  badges: [{
    name: String,
    description: String,
    earnedDate: Date,
    icon: String
  }],
  level: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1, userType: 1 });
userSchema.index({ userType: 1, isActive: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Calculate age
userSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Get full name with title
userSchema.virtual('displayName').get(function() {
  let title = '';
  switch(this.userType) {
    case 'athlete':
      title = 'Athlete';
      break;
    case 'coach':
      title = 'Coach';
      break;
    case 'sai_official':
      title = 'Official';
      break;
  }
  return `${title} ${this.name}`;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
