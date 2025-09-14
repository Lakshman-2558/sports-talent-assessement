import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './SportsCategory.css';

const SportsCategory = () => {
  const { isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const sportsCategories = [
    {
      id: 'athletics',
      name: 'Athletics',
      icon: 'fas fa-running',
      description: 'Track and field events including sprints, distance running, jumping, and throwing',
      tests: ['100m Sprint', '800m Run', '1500m Run', 'Long Jump', 'High Jump', 'Shot Put'],
      color: '#e74c3c'
    },
    {
      id: 'swimming',
      name: 'Swimming',
      icon: 'fas fa-swimmer',
      description: 'Aquatic sports focusing on speed, endurance, and technique in water',
      tests: ['50m Freestyle', '100m Freestyle', '200m Individual Medley', 'Endurance Test'],
      color: '#3498db'
    },
    {
      id: 'gymnastics',
      name: 'Gymnastics',
      icon: 'fas fa-child',
      description: 'Artistic and rhythmic gymnastics emphasizing flexibility, strength, and coordination',
      tests: ['Flexibility Test', 'Balance Beam', 'Floor Exercise', 'Strength Assessment'],
      color: '#9b59b6'
    },
    {
      id: 'weightlifting',
      name: 'Weightlifting',
      icon: 'fas fa-dumbbell',
      description: 'Olympic weightlifting and powerlifting focusing on maximum strength',
      tests: ['Deadlift', 'Squat', 'Bench Press', 'Clean & Jerk', 'Snatch'],
      color: '#e67e22'
    },
    {
      id: 'boxing',
      name: 'Boxing',
      icon: 'fas fa-fist-raised',
      description: 'Combat sport emphasizing speed, power, and defensive techniques',
      tests: ['Punch Power', 'Speed Test', 'Endurance Round', 'Footwork Assessment'],
      color: '#34495e'
    },
    {
      id: 'wrestling',
      name: 'Wrestling',
      icon: 'fas fa-hand-rock',
      description: 'Grappling sport focusing on technique, strength, and mental toughness',
      tests: ['Grip Strength', 'Takedown Test', 'Endurance Match', 'Flexibility'],
      color: '#27ae60'
    },
    {
      id: 'badminton',
      name: 'Badminton',
      icon: 'fas fa-table-tennis',
      description: 'Racquet sport requiring speed, agility, and precision',
      tests: ['Shuttle Run', 'Reaction Time', 'Smash Power', 'Court Coverage'],
      color: '#f39c12'
    },
    {
      id: 'football',
      name: 'Football',
      icon: 'fas fa-futbol',
      description: 'Team sport emphasizing endurance, skill, and tactical awareness',
      tests: ['Sprint Test', 'Ball Control', 'Passing Accuracy', 'Endurance Run'],
      color: '#2ecc71'
    }
  ];

  const fitnessTests = [
    {
      id: 'vertical_jump',
      name: 'Vertical Jump',
      icon: 'fas fa-arrow-up',
      description: 'Measures explosive leg power and jumping ability',
      duration: '2-3 minutes',
      equipment: 'Measuring tape, wall'
    },
    {
      id: 'shuttle_run',
      name: 'Shuttle Run',
      icon: 'fas fa-exchange-alt',
      description: 'Tests agility, speed, and change of direction',
      duration: '3-5 minutes',
      equipment: 'Cones, stopwatch'
    },
    {
      id: 'sit_ups',
      name: 'Sit-ups Test',
      icon: 'fas fa-user',
      description: 'Evaluates core strength and muscular endurance',
      duration: '1 minute',
      equipment: 'Mat, timer'
    },
    {
      id: 'endurance_run',
      name: 'Endurance Run',
      icon: 'fas fa-heartbeat',
      description: 'Measures cardiovascular fitness and stamina',
      duration: '5-15 minutes',
      equipment: 'Track, stopwatch'
    },
    {
      id: 'height_weight',
      name: 'Height & Weight',
      icon: 'fas fa-weight',
      description: 'Basic anthropometric measurements',
      duration: '2 minutes',
      equipment: 'Scale, measuring tape'
    },
    {
      id: 'flexibility',
      name: 'Flexibility Test',
      icon: 'fas fa-expand-arrows-alt',
      description: 'Assesses joint mobility and muscle flexibility',
      duration: '5 minutes',
      equipment: 'Sit-and-reach box'
    }
  ];

  const filteredSports = selectedCategory === 'all' 
    ? sportsCategories 
    : sportsCategories.filter(sport => sport.id === selectedCategory);

  return (
    <div className="sports-category-page">
      <div className="container">
        {/* Header Section */}
        <section className="page-header">
          <h1>Sports Categories</h1>
          <p>Explore different sports and their specific assessment tests designed by SAI experts</p>
        </section>

        {/* Category Filter */}
        <section className="category-filter">
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              All Sports
            </button>
            {sportsCategories.map(category => (
              <button
                key={category.id}
                className={`filter-btn ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <i className={category.icon}></i>
                {category.name}
              </button>
            ))}
          </div>
        </section>

        {/* Sports Grid */}
        <section className="sports-grid">
          {filteredSports.map(sport => (
            <div key={sport.id} className="sport-card" style={{'--sport-color': sport.color}}>
              <div className="sport-header">
                <div className="sport-icon">
                  <i className={sport.icon}></i>
                </div>
                <h3>{sport.name}</h3>
              </div>
              <p className="sport-description">{sport.description}</p>
              <div className="sport-tests">
                <h4>Assessment Tests:</h4>
                <ul>
                  {sport.tests.map((test, index) => (
                    <li key={index}>{test}</li>
                  ))}
                </ul>
              </div>
              <div className="sport-actions">
                {isAuthenticated ? (
                  <Link to={`/video-assessment?sport=${sport.id}`} className="btn btn-primary">
                    Start Assessment
                  </Link>
                ) : (
                  <Link to="/register" className="btn btn-secondary">
                    Register to Start
                  </Link>
                )}
                <button className="btn btn-outline">Learn More</button>
              </div>
            </div>
          ))}
        </section>

        {/* Fitness Tests Section */}
        <section className="fitness-tests-section">
          <h2>Standard Fitness Assessment Tests</h2>
          <p>These standardized tests are used across all sports to evaluate fundamental fitness parameters</p>
          
          <div className="fitness-tests-grid">
            {fitnessTests.map(test => (
              <div key={test.id} className="fitness-test-card">
                <div className="test-icon">
                  <i className={test.icon}></i>
                </div>
                <div className="test-info">
                  <h4>{test.name}</h4>
                  <p>{test.description}</p>
                  <div className="test-details">
                    <span className="test-duration">
                      <i className="fas fa-clock"></i>
                      {test.duration}
                    </span>
                    <span className="test-equipment">
                      <i className="fas fa-tools"></i>
                      {test.equipment}
                    </span>
                  </div>
                </div>
                <div className="test-action">
                  {isAuthenticated ? (
                    <Link to={`/video-assessment?test=${test.id}`} className="btn btn-sm btn-primary">
                      Start Test
                    </Link>
                  ) : (
                    <Link to="/register" className="btn btn-sm btn-secondary">
                      Register
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Assessment Process */}
        <section className="assessment-process">
          <h2>How It Works</h2>
          <div className="process-steps">
            <div className="process-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Choose Your Sport</h4>
                <p>Select the sport category that matches your specialization or interest</p>
              </div>
            </div>
            <div className="process-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Record Your Performance</h4>
                <p>Use your smartphone to record the required fitness tests following our guidelines</p>
              </div>
            </div>
            <div className="process-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>AI Analysis</h4>
                <p>Our AI system analyzes your video for accuracy, form, and performance metrics</p>
              </div>
            </div>
            <div className="process-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Get Results</h4>
                <p>Receive detailed performance analysis, benchmarking, and improvement suggestions</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        {!isAuthenticated && (
          <section className="cta-section">
            <div className="cta-content">
              <h2>Ready to Showcase Your Talent?</h2>
              <p>Join thousands of athletes who are already using our platform to get discovered by SAI</p>
              <Link to="/register" className="btn btn-primary btn-large">
                Register Now
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default SportsCategory;
