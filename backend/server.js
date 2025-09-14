const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const assessmentRoutes = require('./routes/assessments');
const videoRoutes = require('./routes/videos');
const dashboardRoutes = require('./routes/dashboard');
const sportsRoutes = require('./routes/sports');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();

// Email transporter setup with your Gmail credentials
const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify email connection
emailTransporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email server connection failed:', error);
    logger.error('Email server connection failed:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
    logger.info('Email server is ready to send messages');
  }
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 20,                   // Increased from 5 to 20 attempts
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // Changed from 1 hour to 15 minutes
  max: 10,                   // Increased from 3 to 10 attempts
  message: 'Too many OTP requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', generalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/auth/forgot-password', otpLimiter);
app.use('/api/auth/resend-otp', otpLimiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
}

// Health check endpoint
app.get('/health', (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    memory: process.memoryUsage(),
    version: process.version
  };
  res.status(200).json(healthCheck);
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/sports', sportsRoutes);

// OTP Model (simple in-memory storage for demo - use database in production)
const otpStorage = new Map();

// Generate OTP endpoint
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email, purpose = 'password-reset' } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Valid email is required'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP (in production, use database)
    otpStorage.set(email, { otp, expiresAt, purpose, attempts: 0 });

    // Send OTP email
    const mailOptions = {
      from: `"SAI Sports Platform" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Verification Code - SAI Sports Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #667eea; margin: 0;">SAI Sports Talent Assessment</h2>
            <p style="color: #666; margin: 5px 0;">AI-Powered Sports Talent Identification</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="color: white; margin: 0 0 15px 0; font-size: 16px;">Your verification code is:</p>
            <div style="background: white; padding: 15px; border-radius: 8px; display: inline-block;">
              <h1 style="margin: 0; color: #667eea; letter-spacing: 8px; font-size: 32px;">${otp}</h1>
            </div>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            This verification code will expire in <strong>10 minutes</strong>. 
            Please do not share this code with anyone for security reasons.
          </p>
          
          <p style="color: #666; line-height: 1.6;">
            If you didn't request this code, please ignore this email or contact our support team 
            if you have any concerns about your account security.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 25px 0;">
          
          <div style="text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 5px 0;">
              SAI Sports Talent Assessment Platform<br>
              Transforming sports talent identification with AI
            </p>
          </div>
        </div>
      `,
    };

    await emailTransporter.sendMail(mailOptions);

    console.log(`OTP sent to ${email}: ${otp}`);
    logger.info(`OTP sent to ${email} for ${purpose}`);

    res.json({
      success: true,
      message: 'Verification code sent successfully',
      // For development only - remove in production
      ...(process.env.NODE_ENV === 'development' && { debug_otp: otp })
    });

  } catch (error) {
    console.error('OTP sending error:', error);
    logger.error('OTP sending error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to send verification code. Please try again later.'
    });
  }
});

// Verify OTP endpoint
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required'
      });
    }

    // Get stored OTP data
    const otpData = otpStorage.get(email);
    
    if (!otpData) {
      return res.status(400).json({
        success: false,
        message: 'No verification code found for this email'
      });
    }

    // Check if OTP is expired
    if (new Date() > otpData.expiresAt) {
      otpStorage.delete(email);
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired'
      });
    }

    // Check if OTP matches
    if (otpData.otp !== otp) {
      // Increment attempts
      otpData.attempts += 1;
      
      if (otpData.attempts >= 3) {
        otpStorage.delete(email);
        return res.status(400).json({
          success: false,
          message: 'Too many failed attempts. Please request a new verification code.'
        });
      }
      
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code',
        attemptsRemaining: 3 - otpData.attempts
      });
    }

    // OTP is valid - remove it from storage
    otpStorage.delete(email);

    res.json({
      success: true,
      message: 'Verification code verified successfully'
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    logger.error('OTP verification error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to verify code. Please try again later.'
    });
  }
});

// Resend OTP endpoint
app.post('/api/auth/resend-otp', async (req, res) => {
  try {
    const { email, purpose = 'password-reset' } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Valid email is required'
      });
    }

    // Remove any existing OTP for this email
    otpStorage.delete(email);

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Store new OTP
    otpStorage.set(email, { otp, expiresAt, purpose, attempts: 0 });

    // Send new OTP email
    const mailOptions = {
      from: `"SAI Sports Platform" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your New Verification Code - SAI Sports Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #667eea; margin: 0;">SAI Sports Talent Assessment</h2>
            <p style="color: #666; margin: 5px 0;">AI-Powered Sports Talent Identification</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="color: white; margin: 0 0 15px 0; font-size: 16px;">Your new verification code is:</p>
            <div style="background: white; padding: 15px; border-radius: 8px; display: inline-block;">
              <h1 style="margin: 0; color: #667eea; letter-spacing: 8px; font-size: 32px;">${otp}</h1>
            </div>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            This new verification code will expire in <strong>10 minutes</strong>. 
            Please do not share this code with anyone for security reasons.
          </p>
          
          <p style="color: #666; line-height: 1.6;">
            If you didn't request this code, please ignore this email or contact our support team.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 25px 0;">
          
          <div style="text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 5px 0;">
              SAI Sports Talent Assessment Platform<br>
              Transforming sports talent identification with AI
            </p>
          </div>
        </div>
      `,
    };

    await emailTransporter.sendMail(mailOptions);

    console.log(`New OTP sent to ${email}: ${otp}`);
    logger.info(`New OTP sent to ${email} for ${purpose}`);

    res.json({
      success: true,
      message: 'New verification code sent successfully',
      // For development only - remove in production
      ...(process.env.NODE_ENV === 'development' && { debug_otp: otp })
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    logger.error('Resend OTP error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to send new verification code. Please try again later.'
    });
  }
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Database connection
const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false);
    
    console.log('🔄 Connecting to MongoDB...');
    logger.info('Attempting to connect to MongoDB...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB Connected Successfully!');
    console.log(`📍 Database: ${conn.connection.name}`);
    console.log(`📊 Host: ${conn.connection.host}`);
    logger.info(`MongoDB Connected: ${conn.connection.host} - Database: ${conn.connection.name}`);
    
    // Database event listeners
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
    
  } catch (error) {
    console.log('❌ MongoDB Connection Failed!');
    console.error('Database connection error:', error.message);
    logger.error('Database connection error:', error);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    
    const server = app.listen(PORT, () => {
      console.log('\n🚀 SERVER STARTED SUCCESSFULLY!');
      console.log('='.repeat(50));
      console.log(`🌐 Server URL: http://localhost:${PORT}`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📡 Port: ${PORT}`);
      console.log(`📧 Email: ${process.env.EMAIL_USER}`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
      console.log('='.repeat(50));
      logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      logger.info(`${signal} received`);
      console.log(`\n${signal} received, shutting down gracefully...`);
      
      server.close(() => {
        logger.info('HTTP server closed');
        mongoose.connection.close(false, () => {
          logger.info('MongoDB connection closed');
          process.exit(0);
        });
      });
      
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;