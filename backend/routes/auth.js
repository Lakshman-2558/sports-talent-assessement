const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
// Removed central User model – use role-specific models for accounts
const Athlete = require('../models/Athlete');
const Coach = require('../models/Coach');
const Official = require('../models/Official');
const OTP = require('../models/OTP');
const { auth } = require('../middleware/auth');
const logger = require('../utils/logger');
const { sendOTPEmail, sendPasswordResetEmail } = require('../utils/emailService');

const router = express.Router();

// Generate JWT Token with role
const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Helper: find account by role and email
const getModelByRole = (role) => {
  if (role === 'athlete') return Athlete;
  if (role === 'coach') return Coach;
  if (role === 'sai_official') return Official;
  return null;
};

const findAccountByEmail = async (email) => {
  const normalized = (email || '').trim().toLowerCase();
  const [ath, coach, off] = await Promise.all([
    Athlete.findOne({ email: normalized }).select('+password'),
    Coach.findOne({ email: normalized }).select('+password'),
    Official.findOne({ email: normalized }).select('+password')
  ]);
  if (ath) return { doc: ath, role: 'athlete' };
  if (coach) return { doc: coach, role: 'coach' };
  if (off) return { doc: off, role: 'sai_official' };
  return null;
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('userType').isIn(['athlete', 'coach', 'sai_official']).withMessage('Invalid user type'),
  body('phone').isMobilePhone().withMessage('Please provide a valid phone number'),
  body('dateOfBirth').isISO8601().withMessage('Please provide a valid date of birth'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Please select a valid gender'),
  body('state').trim().isLength({ min: 2 }).withMessage('State is required'),
  body('city').trim().isLength({ min: 2 }).withMessage('City is required'),
  body('specialization').optional().trim().isLength({ min: 2 }).withMessage('Specialization is required for coaches'),
  body('sport').optional().trim().isLength({ min: 2 }).withMessage('Sport is required for athletes')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      name, email, password, userType, phone, dateOfBirth,
      gender, state, city, specialization, sport, height, weight,
      bloodGroup, emergencyContact, experience, certifications,
      employeeId, department
    } = req.body;

    const normalizedEmail = (email || '').trim().toLowerCase();

    // Check if email exists in any role collection
    const existing = await findAccountByEmail(normalizedEmail);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Account already exists with this email'
      });
    }

    // Create role-specific account
    let accountDoc;
    if (userType === 'athlete') {
      accountDoc = await Athlete.create({
        name, email: normalizedEmail, password, phone, dateOfBirth, gender, state, city,
        sport: sport || specialization, height, weight, bloodGroup, emergencyContact
      });
    } else if (userType === 'coach') {
      accountDoc = await Coach.create({
        name, email: normalizedEmail, password, phone, dateOfBirth, gender, state, city,
        specialization: Array.isArray(specialization) ? specialization : (specialization ? [specialization] : []),
        experience: experience || 0,
        certifications: Array.isArray(certifications) ? certifications : []
      });
    } else if (userType === 'sai_official') {
      accountDoc = await Official.create({
        name, email: normalizedEmail, password, phone, dateOfBirth, gender, state, city,
        employeeId, department
      });
    }

    // Generate token
    const token = generateToken(accountDoc._id, userType);

    // Update last login
    accountDoc.lastLogin = new Date();
    await accountDoc.save();

    logger.info(`New account registered: ${email} (${userType})`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: accountDoc._id,
        name: accountDoc.name,
        email: accountDoc.email,
        userType: userType,
        isVerified: accountDoc.isVerified
      }
    });

  } catch (error) {
    // Duplicate key error (e.g., email unique index)
    if (error && (error.code === 11000 || error.code === 11001)) {
      logger.warn('Registration duplicate email:', error.keyValue || {});
      return res.status(400).json({
        success: false,
        message: 'Account already exists with this email'
      });
    }

    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').exists().withMessage('Password is required'),
  body('userType').isIn(['athlete', 'coach', 'sai_official']).withMessage('Invalid user type')
], async (req, res) => {
  try {
    console.log('🔐 Login attempt received:', {
      email: req.body.email,
      userType: req.body.userType,
      time: new Date().toISOString()
    });

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, userType } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    console.log('🔍 Searching for user:', { email, userType });

    // Find account in the role-specific collection
    const Model = getModelByRole(userType);
    const user = await Model.findOne({ 
      email: normalizedEmail,
      isActive: true 
    }).select('+password');

    console.log('👤 User found:', user ? 'Yes - ' + user.email : 'No');
    
    if (!user) {
      // Check if exists with different role
      const existing = await findAccountByEmail(normalizedEmail);
      if (existing) {
        console.log('⚠️ User exists but with different type:', existing.role);
        return res.status(401).json({
          success: false,
          message: `User exists but registered as ${existing.role}, not ${userType}`
        });
      }
      
      console.log('❌ No user found with these credentials');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or user type'
      });
    }

    console.log('🔑 Comparing password...');
    const isPasswordValid = await user.comparePassword(password);
    console.log('✅ Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id, userType);
    console.log('✅ Token generated successfully');

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    logger.info(`User logged in: ${email} (${userType})`);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: userType,
        isVerified: user.isVerified,
        profileImage: user.profileImage,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('💥 Login error:', error);
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send OTP for password reset
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    // Check if account exists in any role
    const existing = await findAccountByEmail(email);
    if (!existing || !existing.doc.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Email not found in our system'
      });
    }

    // Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database
    await OTP.findOneAndUpdate(
      { email: normalizedEmail, purpose: 'password-reset' },
      { 
        otp: otpCode, 
        expiresAt,
        verified: false,
        attempts: 0
      },
      { upsert: true, new: true }
    );

    // Send OTP email
    await sendOTPEmail(normalizedEmail, otpCode);

    logger.info(`OTP sent for password reset: ${email}`);

    res.json({
      success: true,
      message: 'OTP sent successfully to your email',
      // For development only
      ...(process.env.NODE_ENV === 'development' && { debug_otp: otpCode })
    });

  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again later.'
    });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP for password reset
// @access  Public
router.post('/verify-otp', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, otp } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    // Find OTP record
    const otpRecord = await OTP.findOne({ 
      email: normalizedEmail, 
      purpose: 'password-reset' 
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'No OTP requested for this email'
      });
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ email: normalizedEmail, purpose: 'password-reset' });
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Check if OTP matches
    if (otpRecord.otp !== otp) {
      // Increment attempts
      otpRecord.attempts += 1;
      await otpRecord.save();

      if (otpRecord.attempts >= 3) {
        await OTP.deleteOne({ email: normalizedEmail, purpose: 'password-reset' });
        return res.status(400).json({
          success: false,
          message: 'Too many failed attempts. Please request a new OTP.'
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
        attemptsRemaining: 3 - otpRecord.attempts
      });
    }

    // OTP is valid - mark as verified
    otpRecord.verified = true;
    await otpRecord.save();

    logger.info(`OTP verified successfully: ${email}`);

    res.json({
      success: true,
      message: 'OTP verified successfully'
    });

  } catch (error) {
    logger.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP. Please try again later.'
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with verified OTP
// @access  Public
router.post('/reset-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, otp, newPassword } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    // Find OTP record
    const otpRecord = await OTP.findOne({ 
      email: normalizedEmail, 
      purpose: 'password-reset' 
    });

    if (!otpRecord || !otpRecord.verified) {
      return res.status(400).json({
        success: false,
        message: 'OTP not verified. Please verify OTP first.'
      });
    }

    // Check if OTP matches
    if (otpRecord.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ email: normalizedEmail, purpose: 'password-reset' });
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Find account in any role
    const existing = await findAccountByEmail(normalizedEmail);
    if (!existing || !existing.doc.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // IMPORTANT: Hash the new password before saving
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password by loading doc and saving to trigger pre-save hooks
    const doc = await existing.doc.constructor.findById(existing.doc._id).select('+password');
    doc.password = hashedPassword;
    await doc.save();

    // Delete OTP record
    await OTP.deleteOne({ email: normalizedEmail, purpose: 'password-reset' });

    // Send confirmation email
    await sendPasswordResetEmail(normalizedEmail, doc.name);

    logger.info(`Password reset successfully: ${email}`);

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    logger.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password. Please try again later.'
    });
  }
});

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP
// @access  Public
router.post('/resend-otp', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    // Check if account exists in any role
    const existing = await findAccountByEmail(normalizedEmail);
    if (!existing || !existing.doc.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Email not found in our system'
      });
    }

    // Generate new OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save new OTP to database
    await OTP.findOneAndUpdate(
      { email: normalizedEmail, purpose: 'password-reset' },
      { 
        otp: otpCode, 
        expiresAt,
        verified: false,
        attempts: 0
      },
      { upsert: true, new: true }
    );

    // Send new OTP email
    await sendOTPEmail(normalizedEmail, otpCode);

    logger.info(`OTP resent: ${email}`);

    res.json({
      success: true,
      message: 'New OTP sent successfully to your email',
      // For development only
      ...(process.env.NODE_ENV === 'development' && { debug_otp: otpCode })
    });

  } catch (error) {
    logger.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP. Please try again later.'
    });
  }
});

// @route   GET /api/auth/debug/email-exists
// @desc    Debug which collection holds the given email and counts of blank/null emails
// @access  Development only
router.get('/debug/email-exists', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, message: 'Debug endpoint disabled in production' });
    }

    const email = (req.query.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email query param is required' });
    }

    const [ath, coach, off, athBlank, coachBlank, offBlank] = await Promise.all([
      Athlete.findOne({ email }).select('_id email name'),
      Coach.findOne({ email }).select('_id email name'),
      Official.findOne({ email }).select('_id email name'),
      Athlete.countDocuments({ $or: [ { email: null }, { email: '' } ] }),
      Coach.countDocuments({ $or: [ { email: null }, { email: '' } ] }),
      Official.countDocuments({ $or: [ { email: null }, { email: '' } ] })
    ]);

    res.json({
      success: true,
      email,
      exists: {
        athlete: Boolean(ath),
        coach: Boolean(coach),
        official: Boolean(off)
      },
      records: {
        athlete: ath,
        coach: coach,
        official: off
      },
      blanks: {
        athletes: athBlank,
        coaches: coachBlank,
        officials: offBlank
      }
    });
  } catch (error) {
    logger.error('Debug email-exists error:', error);
    res.status(500).json({ success: false, message: 'Server error in debug endpoint' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const role = req.user.userType;
    const Model = getModelByRole(role);
    const user = await Model.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: role,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        state: user.state,
        city: user.city,
        specialization: user.specialization,
        sport: user.sport,
        profileImage: user.profileImage,
        isVerified: user.isVerified,
        points: user.points,
        badges: user.badges,
        level: user.level,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('phone').optional().isMobilePhone(),
  body('state').optional().trim().isLength({ min: 2 }),
  body('city').optional().trim().isLength({ min: 2 }),
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

    const role = req.user.userType;
    const Model = getModelByRole(role);
    const user = await Model.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update allowed fields
    const allowedFields = ['name', 'phone', 'state', 'city', 'specialization', 'sport'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    await user.save();

    logger.info(`Profile updated for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: role,
        phone: user.phone,
        state: user.state,
        city: user.city,
        specialization: user.specialization,
        sport: user.sport
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

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', auth, (req, res) => {
  logger.info(`User logged out: ${req.user.email}`);
  
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

module.exports = router;