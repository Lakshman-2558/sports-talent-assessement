import React from 'react';
import { Link } from 'react-router-dom';
import './About.css';

const About = () => {
  return (
    <div className="about-page">
        {/* Hero Section */}
        <section className="about-hero">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-text">🏛️ GOVERNMENT OF INDIA</span>
              <span className="badge-subtext">SPORTS AUTHORITY OF INDIA</span>
            </div>
            
            <h1>About SAI Talent Platform</h1>
            <div className="hero-subtitle">
              <span className="highlight-text">Revolutionizing</span> sports talent identification across India through 
              <span className="highlight-text"> AI-powered</span> assessment technology
            </div>
            
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-number">1M+</div>
                <div className="stat-label">Athletes Assessed</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">28</div>
                <div className="stat-label">States Covered</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">95%</div>
                <div className="stat-label">Accuracy Rate</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">24/7</div>
                <div className="stat-label">Platform Access</div>
              </div>
            </div>
            
            <div className="hero-achievements">
              <div className="achievement-badge">
                <span className="achievement-icon">🏆</span>
                <span className="achievement-text">National Excellence Award 2024</span>
              </div>
              <div className="achievement-badge">
                <span className="achievement-icon">🌟</span>
                <span className="achievement-text">Digital India Initiative</span>
              </div>
              <div className="achievement-badge">
                <span className="achievement-icon">🚀</span>
                <span className="achievement-text">AI Innovation Leader</span>
              </div>
            </div>
            
            <div className="hero-mission-brief">
              <div className="mission-icon">🎯</div>
              <div className="mission-text">
                <strong>Our Vision:</strong> To democratize sports talent assessment and create equal opportunities 
                for every aspiring athlete across India, regardless of their geographical location or economic background.
              </div>
            </div>
          </div>
          
          {/* Floating Elements */}
          <div className="hero-decorations">
            <div className="floating-element trophy">🏆</div>
            <div className="floating-element medal">🥇</div>
            <div className="floating-element star">⭐</div>
            <div className="floating-element rocket">🚀</div>
            <div className="floating-element target">🎯</div>
            <div className="floating-element india">🇮🇳</div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="mission-section">
          <div className="content-wrapper">
            <div className="text-content">
              <h2>Our Mission</h2>
              <p>
                The Sports Authority of India (SAI) is committed to democratizing sports talent assessment 
                across the nation. Our AI-powered platform breaks down geographical barriers and provides 
                equal opportunities for aspiring athletes from every corner of India to showcase their potential.
              </p>
              <p>
                By leveraging cutting-edge artificial intelligence and machine learning technologies, we ensure 
                that talent identification is fair, accurate, and accessible to all, regardless of location 
                or economic background.
              </p>
            </div>
            <div className="image-content">
              <div className="mission-graphic">
                {/* Central rotating circle with trophy */}
                <div className="mission-circle">
                  🏆
                </div>
                
                {/* Orbiting rings */}
                <div className="orbit-ring orbit-ring-1"></div>
                <div className="orbit-ring orbit-ring-2"></div>
                
                {/* Floating mission icons */}
                <div className="mission-icon">🎯</div>
                <div className="mission-icon">⚡</div>
                <div className="mission-icon">🌟</div>
                <div className="mission-icon">🚀</div>
                
                {/* Connecting lines */}
                <div className="connection-line line-1"></div>
                <div className="connection-line line-2"></div>
                
                {/* Floating stats bubbles */}
                <div className="floating-stats">
                  <div className="stat-bubble">1M+ Athletes</div>
                  <div className="stat-bubble">28 States</div>
                  <div className="stat-bubble">AI Powered</div>
                  <div className="stat-bubble">24/7 Access</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Statement */}
        <section className="problem-section">
          <h2>The Challenge We Address</h2>
          <div className="problem-timeline">
            <div className="timeline-line"></div>
            <div className="problem-grid">
            <div className="problem-item">
              <div className="problem-icon">
                <i className="fas fa-map-marked-alt"></i>
              </div>
              <h3>Geographic Barriers</h3>
              <p>Many talented athletes in rural and remote areas lack access to standardized assessment facilities and opportunities to showcase their abilities.</p>
            </div>
            <div className="problem-item">
              <div className="problem-icon">
                <i className="fas fa-balance-scale"></i>
              </div>
              <h3>Inconsistent Evaluation</h3>
              <p>Traditional assessment methods often lack standardization and can be influenced by subjective factors, leading to unfair evaluations.</p>
            </div>
            <div className="problem-item">
              <div className="problem-icon">
                <i className="fas fa-clock"></i>
              </div>
              <h3>Limited Scalability</h3>
              <p>Manual assessment processes are time-consuming and cannot efficiently handle the large number of aspiring athletes across India.</p>
            </div>
            <div className="problem-item">
              <div className="problem-icon">
                <i className="fas fa-rupee-sign"></i>
              </div>
              <h3>Economic Constraints</h3>
              <p>High costs associated with traveling to assessment centers and specialized equipment create barriers for economically disadvantaged athletes.</p>
            </div>
            </div>
          </div>
        </section>

        {/* Solution Section */}
        <section className="solution-section">
          <h2>Our Innovative Solution</h2>
          <div className="solution-content">
            <div className="solution-features">
              <div className="feature-item">
                <div className="feature-number">01</div>
                <div className="feature-content">
                  <h3>Mobile-First Platform</h3>
                  <p>Athletes can record their performance using just a smartphone, making the platform accessible even in remote areas with basic internet connectivity.</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-number">02</div>
                <div className="feature-content">
                  <h3>AI-Powered Analysis</h3>
                  <p>Advanced computer vision and machine learning algorithms analyze videos to provide accurate, objective, and consistent performance measurements.</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-number">03</div>
                <div className="feature-content">
                  <h3>Cheat Detection</h3>
                  <p>Sophisticated AI models detect anomalies, manipulations, and ensure the authenticity of recorded performances for fair assessment.</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-number">04</div>
                <div className="feature-content">
                  <h3>Offline Capabilities</h3>
                  <p>Preliminary analysis can be performed on-device without continuous internet, enabling assessments in low-connectivity areas.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Impact Section */}
        <section className="impact-section">
          <h2>Expected Impact</h2>
          <div className="impact-grid">
            <div className="impact-card">
              <div className="impact-icon">
                <i className="fas fa-users"></i>
              </div>
              <h3>Democratization</h3>
              <p>Equal access to talent assessment for athletes from all backgrounds and locations across India.</p>
            </div>
            <div className="impact-card">
              <div className="impact-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <h3>Scalability</h3>
              <p>Ability to assess thousands of athletes simultaneously, dramatically increasing the reach of talent identification programs.</p>
            </div>
            <div className="impact-card">
              <div className="impact-icon">
                <i className="fas fa-eye"></i>
              </div>
              <h3>Transparency</h3>
              <p>Objective, data-driven assessments that eliminate bias and provide clear, measurable performance metrics.</p>
            </div>
            <div className="impact-card">
              <div className="impact-icon">
                <i className="fas fa-rocket"></i>
              </div>
              <h3>Efficiency</h3>
              <p>Streamlined talent identification process that reduces time and costs while improving accuracy and reach.</p>
            </div>
          </div>
        </section>

        {/* Technology Section */}
        <section className="technology-section">
          <h2>Technology Stack</h2>
          <div className="tech-content">
            <div className="tech-category">
              <h3>Artificial Intelligence</h3>
              <div className="tech-items">
                <span>Computer Vision</span>
                <span>Machine Learning</span>
                <span>Deep Learning</span>
                <span>TensorFlow.js</span>
              </div>
            </div>
            <div className="tech-category">
              <h3>Frontend</h3>
              <div className="tech-items">
                <span>React.js</span>
                <span>Progressive Web App</span>
                <span>Responsive Design</span>
                <span>WebRTC</span>
              </div>
            </div>
            <div className="tech-category">
              <h3>Backend</h3>
              <div className="tech-items">
                <span>Node.js</span>
                <span>Express.js</span>
                <span>MongoDB</span>
                <span>Cloud Storage</span>
              </div>
            </div>
            <div className="tech-category">
              <h3>Security</h3>
              <div className="tech-items">
                <span>End-to-End Encryption</span>
                <span>JWT Authentication</span>
                <span>Data Privacy</span>
                <span>GDPR Compliance</span>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="team-section">
          <h2>Our Team</h2>
          <div className="team-grid">
            <div className="team-member">
              <div className="member-avatar">
                <i className="fas fa-user-tie"></i>
              </div>
              <h4>SAI Technical Team</h4>
              <p>Sports Technology Experts</p>
              <span>Platform Development & Sports Science</span>
            </div>
            <div className="team-member">
              <div className="member-avatar">
                <i className="fas fa-brain"></i>
              </div>
              <h4>AI Research Team</h4>
              <p>Machine Learning Engineers</p>
              <span>Computer Vision & Algorithm Development</span>
            </div>
            <div className="team-member">
              <div className="member-avatar">
                <i className="fas fa-medal"></i>
              </div>
              <h4>Sports Experts</h4>
              <p>Former Athletes & Coaches</p>
              <span>Assessment Standards & Validation</span>
            </div>
            <div className="team-member">
              <div className="member-avatar">
                <i className="fas fa-shield-alt"></i>
              </div>
              <h4>Security Team</h4>
              <p>Cybersecurity Specialists</p>
              <span>Data Protection & Platform Security</span>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="cta-content">
            <h2>Join the Revolution</h2>
            <p>Be part of India's digital transformation in sports talent identification</p>
            <div className="cta-buttons">
              <Link to="/register" className="btn btn-primary btn-large">
                Get Started Today
              </Link>
              <Link to="/contact" className="btn btn-secondary btn-large">
                Contact Us
              </Link>
            </div>
          </div>
        </section>
    </div>
  );
};

export default About;
