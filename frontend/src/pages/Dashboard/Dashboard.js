import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [assessments, setAssessments] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [assessmentsRes, statsRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/assessments/my-assessments`),
        axios.get(`${process.env.REACT_APP_API_URL}/dashboard/stats`)
      ]);
      
      setAssessments(assessmentsRes.data.assessments || []);
      setStats(statsRes.data.stats || {});
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => (
    <div className="overview-content">
      <div className="welcome-section">
        <h2>Welcome back, {user?.name}!</h2>
        <p>Here's your performance overview and recent activity.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-video"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.totalAssessments || 0}</h3>
            <p>Total Assessments</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-trophy"></i>
          </div>
          <div className="stat-info">
            <h3>{user?.points || 0}</h3>
            <p>Points Earned</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-medal"></i>
          </div>
          <div className="stat-info">
            <h3>{user?.badges?.length || 0}</h3>
            <p>Badges Earned</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-chart-line"></i>
          </div>
          <div className="stat-info">
            <h3>{user?.level || 1}</h3>
            <p>Current Level</p>
          </div>
        </div>
      </div>

      <div className="recent-assessments">
        <h3>Recent Assessments</h3>
        {assessments.slice(0, 3).map(assessment => (
          <div key={assessment._id} className="assessment-item">
            <div className="assessment-icon">
              <i className="fas fa-play-circle"></i>
            </div>
            <div className="assessment-info">
              <h4>{assessment.displayName}</h4>
              <p>Completed on {new Date(assessment.testDate).toLocaleDateString()}</p>
            </div>
            <div className="assessment-status">
              <span className={`status-badge ${assessment.verificationStatus}`}>
                {assessment.verificationStatus}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAssessments = () => (
    <div className="assessments-content">
      <div className="assessments-header">
        <h2>My Assessments</h2>
        <button className="btn btn-primary">
          <i className="fas fa-plus"></i>
          New Assessment
        </button>
      </div>

      <div className="assessments-list">
        {assessments.map(assessment => (
          <div key={assessment._id} className="assessment-card">
            <div className="assessment-thumbnail">
              {assessment.videoThumbnail ? (
                <img src={assessment.videoThumbnail} alt="Assessment thumbnail" />
              ) : (
                <div className="thumbnail-placeholder">
                  <i className="fas fa-video"></i>
                </div>
              )}
            </div>
            <div className="assessment-details">
              <h4>{assessment.displayName}</h4>
              <p>Date: {new Date(assessment.testDate).toLocaleDateString()}</p>
              <p>Duration: {assessment.videoDuration ? `${assessment.videoDuration}s` : 'N/A'}</p>
              <div className="assessment-metrics">
                {assessment.normalizedScore && (
                  <span className="metric">
                    Score: {assessment.normalizedScore}/100
                  </span>
                )}
                {assessment.percentile && (
                  <span className="metric">
                    Percentile: {assessment.percentile}%
                  </span>
                )}
              </div>
            </div>
            <div className="assessment-status-section">
              <span className={`status-badge ${assessment.verificationStatus}`}>
                {assessment.verificationStatus}
              </span>
              {assessment.aiAnalysis?.confidence && (
                <div className="confidence-score">
                  Confidence: {Math.round(assessment.aiAnalysis.confidence * 100)}%
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="profile-content">
      <div className="profile-header">
        <div className="profile-avatar">
          {user?.profileImage ? (
            <img src={user.profileImage} alt="Profile" />
          ) : (
            <div className="avatar-placeholder">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="profile-info">
          <h2>{user?.name}</h2>
          <p className={`user-type ${user?.userType}`}>
            {user?.userType === 'athlete' && 'Athlete'}
            {user?.userType === 'coach' && 'Coach'}
            {user?.userType === 'sai_official' && 'SAI Official'}
          </p>
          <p>{user?.specialization}</p>
        </div>
      </div>

      <div className="profile-details">
        <div className="detail-section">
          <h3>Personal Information</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Email</label>
              <span>{user?.email}</span>
            </div>
            <div className="detail-item">
              <label>Phone</label>
              <span>{user?.phone}</span>
            </div>
            <div className="detail-item">
              <label>Age</label>
              <span>{user?.age} years</span>
            </div>
            <div className="detail-item">
              <label>Gender</label>
              <span>{user?.gender}</span>
            </div>
            <div className="detail-item">
              <label>Location</label>
              <span>{user?.city}, {user?.state}</span>
            </div>
            <div className="detail-item">
              <label>Member Since</label>
              <span>{new Date(user?.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {user?.badges && user.badges.length > 0 && (
          <div className="detail-section">
            <h3>Achievements</h3>
            <div className="badges-grid">
              {user.badges.map((badge, index) => (
                <div key={index} className="badge-item">
                  <div className="badge-icon">
                    <i className={badge.icon || 'fas fa-medal'}></i>
                  </div>
                  <div className="badge-info">
                    <h4>{badge.name}</h4>
                    <p>{badge.description}</p>
                    <small>Earned: {new Date(badge.earnedDate).toLocaleDateString()}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="dashboard-layout">
          <nav className="dashboard-nav">
            <div className="nav-header">
              <h2>Dashboard</h2>
            </div>
            <ul className="nav-menu">
              <li>
                <button
                  className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  <i className="fas fa-tachometer-alt"></i>
                  Overview
                </button>
              </li>
              <li>
                <button
                  className={`nav-item ${activeTab === 'assessments' ? 'active' : ''}`}
                  onClick={() => setActiveTab('assessments')}
                >
                  <i className="fas fa-video"></i>
                  Assessments
                </button>
              </li>
              <li>
                <button
                  className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  <i className="fas fa-user"></i>
                  Profile
                </button>
              </li>
              {user?.userType === 'sai_official' && (
                <li>
                  <button
                    className={`nav-item ${activeTab === 'athletes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('athletes')}
                  >
                    <i className="fas fa-users"></i>
                    Athletes
                  </button>
                </li>
              )}
            </ul>
          </nav>

          <main className="dashboard-content">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'assessments' && renderAssessments()}
            {activeTab === 'profile' && renderProfile()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
