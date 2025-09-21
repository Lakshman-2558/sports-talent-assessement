const jwt = require('jsonwebtoken');
const Athlete = require('../models/Athlete');
const Coach = require('../models/Coach');
const Official = require('../models/Official');
const logger = require('../utils/logger');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token; expected payload: { userId, role }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log('🔍 JWT DEBUG - Decoded token:', {
      decoded: decoded,
      userId: decoded.userId,
      role: decoded.role
    });

    const { userId, role } = decoded;
    if (!userId || !role) {
      console.log('❌ JWT DEBUG - Missing userId or role:', { userId, role });
      return res.status(401).json({ success: false, message: 'Invalid token payload' });
    }

    // Load account from the corresponding model
    let user = null;
    let modelName = null;
    if (role === 'athlete') {
      user = await Athlete.findById(userId).select('-password');
      modelName = 'Athlete';
    } else if (role === 'coach') {
      user = await Coach.findById(userId).select('-password');
      modelName = 'Coach';
    } else if (role === 'sai_official') {
      user = await Official.findById(userId).select('-password');
      modelName = 'Official';
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid - user not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated'
      });
    }

    // Add user to request object with compatible shape
    req.user = {
      ...user.toObject(),
      id: user._id,
      userType: role,
      _modelName: modelName
    };
    
    console.log('🔍 AUTH DEBUG - User authenticated:', {
      userId: req.user.id,
      userType: req.user.userType,
      role: role,
      modelName: modelName,
      email: req.user.email
    });
    
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }

    logger.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    if (!roles.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

// SAI Official access level authorization
const authorizeAccessLevel = (...levels) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    if (req.user.userType !== 'sai_official') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. SAI Official access required'
      });
    }

    if (!levels.includes(req.user.accessLevel)) {
      return res.status(403).json({
        success: false,
        message: `Insufficient access level. Required: ${levels.join(', ')}`
      });
    }

    next();
  };
};

module.exports = { auth, authorize, authorizeAccessLevel };
