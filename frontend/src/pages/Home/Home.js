import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Home.css';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1>AI-Powered Sports Talent Assessment Platform</h1>
              <p>
                Democratizing sports talent identification across India with cutting-edge AI technology.
                Record, analyze, and showcase your athletic potential from anywhere.
              </p>
              <div className="hero-buttons">
                {!isAuthenticated ? (
                  <>
                    <Link to="/register" className="btn btn-primary btn-large">
                      Start Your Journey
                    </Link>
                    <Link to="/about" className="btn btn-secondary btn-large">
                      Learn More
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/dashboard" className="btn btn-primary btn-large">
                      Go to Dashboard
                    </Link>
                    <Link to="/video-assessment" className="btn btn-secondary btn-large">
                      Start Assessment
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="hero-image">
              <div className="hero-graphic">
                <i className="fas fa-trophy hero-icon"></i>
                <div className="floating-elements">
                  <div className="element element-1"><i className="fas fa-running"></i></div>
                  <div className="element element-2"><i className="fas fa-dumbbell"></i></div>
                  <div className="element element-3"><i className="fas fa-medal"></i></div>
                  <div className="element element-4"><i className="fas fa-stopwatch"></i></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Platform Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-video"></i>
              </div>
              <h3>Video Assessment</h3>
              <p>Record fitness tests using your smartphone with AI-powered analysis for accurate performance measurement.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-shield-alt"></i>
              </div>
              <h3>Cheat Detection</h3>
              <p>Advanced AI algorithms ensure fair assessment by detecting anomalies and preventing manipulation.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <h3>Performance Analytics</h3>
              <p>Get detailed insights into your performance with benchmarking against age and gender standards.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-gamepad"></i>
              </div>
              <h3>Gamification</h3>
              <p>Earn badges, compete on leaderboards, and track your progress with engaging game-like features.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-wifi"></i>
              </div>
              <h3>Offline Analysis</h3>
              <p>Perform preliminary analysis on your device without requiring continuous internet connectivity.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-users"></i>
              </div>
              <h3>Multi-User Support</h3>
              <p>Separate portals for athletes, coaches, and SAI officials with role-based access and features.</p>
            </div>
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="user-types">
        <div className="container">
          <h2 className="section-title">Join as</h2>
          <div className="user-types-grid">
            <div className="user-type-card">
              <div className="user-type-icon athlete">
                <i className="fas fa-running"></i>
              </div>
              <h3>Athlete / Student</h3>
              <p>Record your fitness assessments, track progress, and showcase your talent to SAI officials.</p>
              <ul>
                <li>Video recording for fitness tests</li>
                <li>Performance tracking</li>
                <li>Progress analytics</li>
                <li>Achievement badges</li>
              </ul>
              {!isAuthenticated && (
                <Link to="/register?type=athlete" className="btn btn-primary">
                  Join as Athlete
                </Link>
              )}
            </div>
            <div className="user-type-card">
              <div className="user-type-icon coach">
                <i className="fas fa-chalkboard-teacher"></i>
              </div>
              <h3>Coach / Trainer</h3>
              <p>Monitor your athletes' progress, provide guidance, and help them improve their performance.</p>
              <ul>
                <li>Athlete management</li>
                <li>Performance monitoring</li>
                <li>Training recommendations</li>
                <li>Progress reports</li>
              </ul>
              {!isAuthenticated && (
                <Link to="/register?type=coach" className="btn btn-primary">
                  Join as Coach
                </Link>
              )}
            </div>
            <div className="user-type-card">
              <div className="user-type-icon official">
                <i className="fas fa-user-tie"></i>
              </div>
              <h3>SAI Official</h3>
              <p>Access comprehensive athlete data, evaluate talent, and make informed decisions for talent selection.</p>
              <ul>
                <li>Athlete database access</li>
                <li>Performance analytics</li>
                <li>Talent identification</li>
                <li>Report generation</li>
              </ul>
              {!isAuthenticated && (
                <Link to="/register?type=sai_official" className="btn btn-primary">
                  Official Access
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">10,000+</div>
              <div className="stat-label">Athletes Registered</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-label">Coaches Active</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">50+</div>
              <div className="stat-label">SAI Officials</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">99.9%</div>
              <div className="stat-label">Accuracy Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Discover Your Athletic Potential?</h2>
            <p>Join thousands of athletes who are already using our platform to showcase their talent.</p>
            {!isAuthenticated ? (
              <Link to="/register" className="btn btn-primary btn-large">
                Get Started Today
              </Link>
            ) : (
              <Link to="/video-assessment" className="btn btn-primary btn-large">
                Start Your Assessment
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
