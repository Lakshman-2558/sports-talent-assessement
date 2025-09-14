const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Sports categories and test types
const sportsData = {
  categories: [
    {
      id: 'athletics',
      name: 'Athletics',
      description: 'Track and field events',
      tests: ['vertical_jump', 'shuttle_run', 'endurance_run_800m', 'endurance_run_1500m']
    },
    {
      id: 'fitness',
      name: 'General Fitness',
      description: 'Basic fitness assessments',
      tests: ['sit_ups', 'flexibility', 'strength_test', 'height_weight']
    },
    {
      id: 'team_sports',
      name: 'Team Sports',
      description: 'Team-based sports assessments',
      tests: ['agility_test', 'coordination_test', 'reaction_time']
    }
  ],
  testTypes: [
    {
      id: 'vertical_jump',
      name: 'Vertical Jump',
      description: 'Measures explosive leg power',
      unit: 'cm',
      category: 'athletics',
      instructions: [
        'Stand with feet shoulder-width apart',
        'Jump as high as possible',
        'Land softly on both feet',
        'Perform 3 attempts'
      ]
    },
    {
      id: 'shuttle_run',
      name: 'Shuttle Run',
      description: 'Tests agility and speed',
      unit: 'seconds',
      category: 'athletics',
      instructions: [
        'Set up cones 10 meters apart',
        'Run back and forth between cones',
        'Touch each cone before turning',
        'Complete 5 round trips'
      ]
    },
    {
      id: 'sit_ups',
      name: 'Sit Ups',
      description: 'Measures core strength and endurance',
      unit: 'repetitions',
      category: 'fitness',
      instructions: [
        'Lie on back with knees bent',
        'Hands behind head or crossed on chest',
        'Lift shoulders off ground',
        'Perform for 60 seconds'
      ]
    },
    {
      id: 'endurance_run_800m',
      name: '800m Endurance Run',
      description: 'Tests cardiovascular endurance',
      unit: 'minutes:seconds',
      category: 'athletics',
      instructions: [
        'Run 800 meters at steady pace',
        'Maintain consistent speed',
        'Record total time',
        'Cool down with walking'
      ]
    },
    {
      id: 'endurance_run_1500m',
      name: '1500m Endurance Run',
      description: 'Tests long-distance endurance',
      unit: 'minutes:seconds',
      category: 'athletics',
      instructions: [
        'Run 1500 meters at steady pace',
        'Pace yourself for distance',
        'Record total time',
        'Cool down properly'
      ]
    },
    {
      id: 'flexibility',
      name: 'Flexibility Test',
      description: 'Measures range of motion',
      unit: 'cm',
      category: 'fitness',
      instructions: [
        'Sit with legs extended',
        'Reach forward as far as possible',
        'Hold position for 2 seconds',
        'Measure reach distance'
      ]
    },
    {
      id: 'strength_test',
      name: 'Strength Test',
      description: 'Tests upper body strength',
      unit: 'repetitions',
      category: 'fitness',
      instructions: [
        'Perform push-ups with proper form',
        'Lower chest to ground',
        'Push up to full extension',
        'Count maximum repetitions'
      ]
    },
    {
      id: 'height_weight',
      name: 'Height & Weight',
      description: 'Basic anthropometric measurements',
      unit: 'cm/kg',
      category: 'fitness',
      instructions: [
        'Measure height without shoes',
        'Weigh in light clothing',
        'Record both measurements',
        'Calculate BMI if needed'
      ]
    }
  ]
};

// @route   GET /api/sports/categories
// @desc    Get all sports categories
// @access  Public
router.get('/categories', (req, res) => {
  try {
    res.json({
      success: true,
      categories: sportsData.categories
    });
  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving categories'
    });
  }
});

// @route   GET /api/sports/tests
// @desc    Get all test types
// @access  Public
router.get('/tests', (req, res) => {
  try {
    const { category } = req.query;
    
    let tests = sportsData.testTypes;
    
    if (category) {
      tests = tests.filter(test => test.category === category);
    }
    
    res.json({
      success: true,
      tests
    });
  } catch (error) {
    logger.error('Get tests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving tests'
    });
  }
});

// @route   GET /api/sports/tests/:id
// @desc    Get specific test details
// @access  Public
router.get('/tests/:id', (req, res) => {
  try {
    const test = sportsData.testTypes.find(t => t.id === req.params.id);
    
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }
    
    res.json({
      success: true,
      test
    });
  } catch (error) {
    logger.error('Get test details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving test details'
    });
  }
});

// @route   GET /api/sports/standards
// @desc    Get performance standards for tests
// @access  Public
router.get('/standards', (req, res) => {
  try {
    const { testType, age, gender } = req.query;
    
    // Mock performance standards - in production, this would come from database
    const standards = {
      vertical_jump: {
        male: {
          '16-18': { excellent: 65, good: 55, average: 45, poor: 35 },
          '19-25': { excellent: 70, good: 60, average: 50, poor: 40 },
          '26-35': { excellent: 65, good: 55, average: 45, poor: 35 }
        },
        female: {
          '16-18': { excellent: 55, good: 45, average: 35, poor: 25 },
          '19-25': { excellent: 60, good: 50, average: 40, poor: 30 },
          '26-35': { excellent: 55, good: 45, average: 35, poor: 25 }
        }
      },
      shuttle_run: {
        male: {
          '16-18': { excellent: 9.5, good: 10.5, average: 11.5, poor: 12.5 },
          '19-25': { excellent: 9.0, good: 10.0, average: 11.0, poor: 12.0 },
          '26-35': { excellent: 9.5, good: 10.5, average: 11.5, poor: 12.5 }
        },
        female: {
          '16-18': { excellent: 10.5, good: 11.5, average: 12.5, poor: 13.5 },
          '19-25': { excellent: 10.0, good: 11.0, average: 12.0, poor: 13.0 },
          '26-35': { excellent: 10.5, good: 11.5, average: 12.5, poor: 13.5 }
        }
      }
    };
    
    let result = standards;
    
    if (testType && standards[testType]) {
      result = standards[testType];
      
      if (gender && result[gender]) {
        result = result[gender];
        
        if (age) {
          const ageGroup = getAgeGroup(parseInt(age));
          if (result[ageGroup]) {
            result = result[ageGroup];
          }
        }
      }
    }
    
    res.json({
      success: true,
      standards: result
    });
  } catch (error) {
    logger.error('Get standards error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving standards'
    });
  }
});

// @route   POST /api/sports/calculate-score
// @desc    Calculate normalized score for a test result
// @access  Private
router.post('/calculate-score', auth, (req, res) => {
  try {
    const { testType, value, age, gender } = req.body;
    
    if (!testType || value === undefined || !age || !gender) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: testType, value, age, gender'
      });
    }
    
    // Mock score calculation - in production, use actual algorithms
    const ageGroup = getAgeGroup(age);
    const normalizedScore = calculateNormalizedScore(testType, value, ageGroup, gender);
    const percentile = calculatePercentile(normalizedScore);
    const grade = getGrade(normalizedScore);
    
    res.json({
      success: true,
      result: {
        testType,
        rawValue: value,
        normalizedScore,
        percentile,
        grade,
        ageGroup,
        gender
      }
    });
  } catch (error) {
    logger.error('Calculate score error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error calculating score'
    });
  }
});

// Helper functions
function getAgeGroup(age) {
  if (age >= 16 && age <= 18) return '16-18';
  if (age >= 19 && age <= 25) return '19-25';
  if (age >= 26 && age <= 35) return '26-35';
  return '19-25'; // default
}

function calculateNormalizedScore(testType, value, ageGroup, gender) {
  // Mock calculation - replace with actual scoring algorithms
  const baseScore = Math.random() * 40 + 60; // 60-100
  return Math.round(baseScore);
}

function calculatePercentile(score) {
  // Convert normalized score to percentile
  return Math.round(score * 0.9); // Approximate conversion
}

function getGrade(score) {
  if (score >= 90) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 80) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 70) return 'C+';
  if (score >= 65) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

module.exports = router;
