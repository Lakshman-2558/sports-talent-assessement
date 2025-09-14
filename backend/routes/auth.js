const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { auth } = require('../middleware/auth');
const logger = require('../utils/logger');
const { sendOTPEmail, sendPasswordResetEmail } = require('../utils/emailService');

const router = express.Router();

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
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
  body('specialization').trim().isLength({ min: 2 }).withMessage('Specialization is required')
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
      gender, state, city, specialization, height, weight,
      bloodGroup, emergencyContact, experience, certifications,
      employeeId, department
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Check if SAI official employee ID already exists
    if (userType === 'sai_official' && employeeId) {
      const existingOfficial = await User.findOne({ employeeId });
      if (existingOfficial) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID already exists'
        });
      }
    }

    // Create user object
    const userData = {
      name,
      email,
      password,
      userType,
      phone,
      dateOfBirth,
      gender,
      state,
      city,
      specialization
    };

    // Add type-specific fields
    if (userType === 'athlete') {
      if (height) userData.height = height;
      if (weight) userData.weight = weight;
      if (bloodGroup) userData.bloodGroup = bloodGroup;
      if (emergencyContact) userData.emergencyContact = emergencyContact;
    } else if (userType === 'coach') {
      if (experience) userData.experience = experience;
      if (certifications) userData.certifications = certifications;
    } else if (userType === 'sai_official') {
      if (employeeId) userData.employeeId = employeeId;
      if (department) userData.department = department;
    }

    // Create user
    const user = new User(userData);
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    logger.info(`New user registered: ${email} (${userType})`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
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

    console.log('🔍 Searching for user:', { email, userType });

    // Find user with password field
    const user = await User.findOne({ 
      email, 
      userType,
      isActive: true 
    }).select('+password');

    console.log('👤 User found:', user ? 'Yes - ' + user.email : 'No');
    
    if (!user) {
      // Check if user exists with different userType
      const userWithDifferentType = await User.findOne({ email, isActive: true });
      if (userWithDifferentType) {
        console.log('⚠️ User exists but with different type:', userWithDifferentType.userType);
        return res.status(401).json({
          success: false,
          message: `User exists but registered as ${userWithDifferentType.userType}, not ${userType}`
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
    const token = generateToken(user._id);
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
        userType: user.userType,
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

    // Check if user exists
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
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
      { email, purpose: 'password-reset' },
      { 
        otp: otpCode, 
        expiresAt,
        verified: false,
        attempts: 0
      },
      { upsert: true, new: true }
    );

    // Send OTP email
    await sendOTPEmail(email, otpCode);

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

    // Find OTP record
    const otpRecord = await OTP.findOne({ 
      email, 
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
      await OTP.deleteOne({ email, purpose: 'password-reset' });
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
        await OTP.deleteOne({ email, purpose: 'password-reset' });
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

    // Find OTP record
    const otpRecord = await OTP.findOne({ 
      email, 
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
      await OTP.deleteOne({ email, purpose: 'password-reset' });
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Find user
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // IMPORTANT: Hash the new password before saving
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password using findByIdAndUpdate to trigger middleware if any
    await User.findByIdAndUpdate(
      user._id,
      { password: hashedPassword },
      { new: true }
    );

    // Delete OTP record
    await OTP.deleteOne({ email, purpose: 'password-reset' });

    // Send confirmation email
    await sendPasswordResetEmail(email, user.name);

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

    // Check if user exists
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
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
      { email, purpose: 'password-reset' },
      { 
        otp: otpCode, 
        expiresAt,
        verified: false,
        attempts: 0
      },
      { upsert: true, new: true }
    );

    // Send new OTP email
    await sendOTPEmail(email, otpCode);

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

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        state: user.state,
        city: user.city,
        specialization: user.specialization,
        profileImage: user.profileImage,
        isVerified: user.isVerified,
        points: user.points,
        badges: user.badges,
        level: user.level,
        age: user.age,
        displayName: user.displayName,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
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

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update allowed fields
    const allowedFields = ['name', 'phone', 'state', 'city', 'specialization'];
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
        userType: user.userType,
        phone: user.phone,
        state: user.state,
        city: user.city,
        specialization: user.specialization
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