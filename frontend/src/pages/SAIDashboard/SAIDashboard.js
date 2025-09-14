import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import Leaderboard from '../../components/Leaderboard/Leaderboard';
import './SAIDashboard.css';

const SAIDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [athletes, setAthletes] = useState([]);
  const [pendingAssessments, setPendingAssessments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  // const [error, setError] = useState('');
  
  const [filters, setFilters] = useState({
    athletePage: 1,
    athleteSearch: '',
    athleteState: '',
    assessmentPage: 1,
    assessmentType: '',
    timeframe: '30'
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/dashboard/stats');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.userType === 'sai_official') {
      fetchDashboardData();
    }
  }, [user]);

  const fetchAthletes = useCallback(async () => {
    try {
      const response = await axios.get('/api/dashboard/athletes', {
        params: {
          page: filters.athletePage,
          search: filters.athleteSearch,
          state: filters.athleteState
        }
      });
      if (response.data.success) {
        setAthletes(response.data.athletes);
      }
    } catch (error) {
      console.error('Error fetching athletes:', error);
    }
  }, [filters.athletePage, filters.athleteSearch, filters.athleteState]);

  const fetchPendingAssessments = useCallback(async () => {
    try {
      const response = await axios.get('/api/dashboard/pending-assessments', {
        params: {
          page: filters.assessmentPage,
          testType: filters.assessmentType
        }
      });
      if (response.data.success) {
        setPendingAssessments(response.data.assessments);
      }
    } catch (error) {
      console.error('Error fetching pending assessments:', error);
    }
  }, [filters.assessmentPage, filters.assessmentType]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await axios.get('/api/dashboard/analytics', {
        params: {
          timeframe: filters.timeframe
        }
      });
      if (response.data.success) {
        setAnalytics(response.data.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  }, [filters.timeframe]);

  useEffect(() => {
    if (activeTab === 'athletes') {
      fetchAthletes();
    } else if (activeTab === 'assessments') {
      fetchPendingAssessments();
    } else if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab, filters, fetchAthletes, fetchPendingAssessments, fetchAnalytics]);

  const handleVerifyAssessment = async (assessmentId, status, notes = '') => {
    try {
      const response = await axios.put(`/api/assessments/${assessmentId}/verify`, {
        status,
        notes
      });
      
      if (response.data.success) {
        fetchPendingAssessments();
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error verifying assessment:', error);
    }
  };

  // const handleBulkVerify = async (assessmentIds, status) => {
  //   try {
  //     const response = await axios.post('/api/dashboard/bulk-verify', {
  //       assessmentIds,
  //       status
  //     });
      
  //     if (response.data.success) {
  //       fetchPendingAssessments();
  //       fetchDashboardData();
  //     }
  //   } catch (error) {
  //     console.error('Error bulk verifying:', error);
  //   }
  // };

  // const handleAwardBadge = async (athleteId, badgeData) => {
  //   try {
  //     const response = await axios.post(`/api/users/${athleteId}/award-badge`, badgeData);
      
  //     if (response.data.success) {
  //       fetchAthletes();
  //     }
  //   } catch (error) {
  //     console.error('Error awarding badge:', error);
  //   }
  // };

  if (user?.userType !== 'sai_official') {
    return (
      <div className="sai-dashboard">
        <div className="access-denied">
          <i className="fas fa-shield-alt"></i>
          <h2>Access Denied</h2>
          <p>This dashboard is only accessible to SAI Officials.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="sai-dashboard">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading SAI Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sai-dashboard">
      <div className="dashboard-header">
        <h1>
          <i className="fas fa-tachometer-alt"></i>
          SAI Officials Dashboard
        </h1>
        <p>Sports Authority of India - Talent Assessment Platform</p>
      </div>

      <div className="dashboard-nav">
        <button
          className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <i className="fas fa-chart-pie"></i>
          Overview
        </button>
        <button
          className={`nav-btn ${activeTab === 'athletes' ? 'active' : ''}`}
          onClick={() => setActiveTab('athletes')}
        >
          <i className="fas fa-users"></i>
          Athletes
        </button>
        <button
          className={`nav-btn ${activeTab === 'assessments' ? 'active' : ''}`}
          onClick={() => setActiveTab('assessments')}
        >
          <i className="fas fa-clipboard-check"></i>
          Assessments
        </button>
        <button
          className={`nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <i className="fas fa-chart-line"></i>
          Analytics
        </button>
        <button
          className={`nav-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          <i className="fas fa-trophy"></i>
          Leaderboard
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            {stats && (
              <>
                <div className="stats-grid">
                  <div className="stat-card primary">
                    <div className="stat-icon">
                      <i className="fas fa-users"></i>
                    </div>
                    <div className="stat-info">
                      <h3>{stats.totalAthletes.toLocaleString()}</h3>
                      <p>Total Athletes</p>
                    </div>
                  </div>
                  
                  <div className="stat-card secondary">
                    <div className="stat-icon">
                      <i className="fas fa-chalkboard-teacher"></i>
                    </div>
                    <div className="stat-info">
                      <h3>{stats.totalCoaches.toLocaleString()}</h3>
                      <p>Total Coaches</p>
                    </div>
                  </div>
                  
                  <div className="stat-card success">
                    <div className="stat-icon">
                      <i className="fas fa-clipboard-list"></i>
                    </div>
                    <div className="stat-info">
                      <h3>{stats.totalAssessments.toLocaleString()}</h3>
                      <p>Total Assessments</p>
                    </div>
                  </div>
                  
                  <div className="stat-card warning">
                    <div className="stat-icon">
                      <i className="fas fa-hourglass-half"></i>
                    </div>
                    <div className="stat-info">
                      <h3>{stats.pendingVerifications.toLocaleString()}</h3>
                      <p>Pending Verifications</p>
                    </div>
                  </div>
                  
                  <div className="stat-card info">
                    <div className="stat-icon">
                      <i className="fas fa-check-circle"></i>
                    </div>
                    <div className="stat-info">
                      <h3>{stats.verifiedToday.toLocaleString()}</h3>
                      <p>Verified Today</p>
                    </div>
                  </div>
                </div>

                <div className="overview-sections">
                  <div className="section">
                    <h3>Assessment Distribution</h3>
                    <div className="assessment-types">
                      {stats.assessmentsByType.map((type, index) => (
                        <div key={index} className="assessment-type-card">
                          <h4>{type._id.replace('_', ' ').toUpperCase()}</h4>
                          <div className="type-stats">
                            <span className="count">{type.count}</span>
                            <span className="avg-score">Avg: {Math.round(type.averageScore)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="section">
                    <h3>Top Performers</h3>
                    <div className="top-performers">
                      {stats.topPerformers.slice(0, 5).map((performer, index) => (
                        <div key={index} className="performer-card">
                          <div className="performer-rank">#{index + 1}</div>
                          <div className="performer-info">
                            <h4>{performer.athlete.name}</h4>
                            <p>{performer.athlete.city}, {performer.athlete.state}</p>
                          </div>
                          <div className="performer-stats">
                            <span className="score">{performer.averageScore}%</span>
                            <span className="assessments">{performer.totalAssessments} tests</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'athletes' && (
          <div className="athletes-tab">
            <div className="tab-header">
              <h2>Athlete Management</h2>
              <div className="filters">
                <input
                  type="text"
                  placeholder="Search athletes..."
                  value={filters.athleteSearch}
                  onChange={(e) => setFilters(prev => ({ ...prev, athleteSearch: e.target.value }))}
                  className="search-input"
                />
                <select
                  value={filters.athleteState}
                  onChange={(e) => setFilters(prev => ({ ...prev, athleteState: e.target.value }))}
                  className="filter-select"
                >
                  <option value="">All States</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Maharashtra">Maharashtra</option>
                </select>
              </div>
            </div>
            
            <div className="athletes-grid">
              {athletes.map((athlete) => (
                <div key={athlete._id} className="athlete-card">
                  <div className="athlete-header">
                    <h3>{athlete.name}</h3>
                    <div className="athlete-level">L{athlete.level}</div>
                  </div>
                  
                  <div className="athlete-info">
                    <p><i className="fas fa-map-marker-alt"></i> {athlete.city}, {athlete.state}</p>
                    <p><i className="fas fa-star"></i> {athlete.specialization}</p>
                    <p><i className="fas fa-envelope"></i> {athlete.email}</p>
                  </div>
                  
                  <div className="athlete-stats">
                    <div className="stat">
                      <span className="value">{athlete.points}</span>
                      <span className="label">Points</span>
                    </div>
                    <div className="stat">
                      <span className="value">{athlete.assessmentStats.total}</span>
                      <span className="label">Tests</span>
                    </div>
                    <div className="stat">
                      <span className="value">{athlete.assessmentStats.verified}</span>
                      <span className="label">Verified</span>
                    </div>
                  </div>
                  
                  <div className="athlete-actions">
                    <button 
                      className="btn-secondary"
                      onClick={() => {/* View profile */}}
                    >
                      View Profile
                    </button>
                    <button 
                      className="btn-primary"
                      onClick={() => {/* Award badge modal */}}
                    >
                      Award Badge
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'assessments' && (
          <div className="assessments-tab">
            <div className="tab-header">
              <h2>Assessment Verification</h2>
              <div className="filters">
                <select
                  value={filters.assessmentType}
                  onChange={(e) => setFilters(prev => ({ ...prev, assessmentType: e.target.value }))}
                  className="filter-select"
                >
                  <option value="">All Test Types</option>
                  <option value="vertical_jump">Vertical Jump</option>
                  <option value="shuttle_run">Shuttle Run</option>
                  <option value="sit_ups">Sit Ups</option>
                  <option value="endurance_run_800m">800m Run</option>
                  <option value="endurance_run_1500m">1500m Run</option>
                </select>
              </div>
            </div>
            
            <div className="assessments-list">
              {pendingAssessments.map((assessment) => (
                <div key={assessment._id} className="assessment-card">
                  <div className="assessment-header">
                    <h3>{assessment.assessmentType.replace('_', ' ').toUpperCase()}</h3>
                    <span className="test-date">
                      {new Date(assessment.testDate).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="assessment-athlete">
                    <h4>{assessment.athlete.name}</h4>
                    <p>{assessment.athlete.city}, {assessment.athlete.state}</p>
                    <p>{assessment.athlete.specialization}</p>
                  </div>
                  
                  <div className="assessment-details">
                    <div className="detail">
                      <span className="label">Score:</span>
                      <span className="value">{assessment.normalizedScore}%</span>
                    </div>
                    <div className="detail">
                      <span className="label">Confidence:</span>
                      <span className="value">{Math.round(assessment.aiAnalysis.confidence * 100)}%</span>
                    </div>
                  </div>
                  
                  <div className="assessment-actions">
                    <button 
                      className="btn-success"
                      onClick={() => handleVerifyAssessment(assessment._id, 'verified')}
                    >
                      <i className="fas fa-check"></i>
                      Verify
                    </button>
                    <button 
                      className="btn-warning"
                      onClick={() => handleVerifyAssessment(assessment._id, 'flagged')}
                    >
                      <i className="fas fa-flag"></i>
                      Flag
                    </button>
                    <button 
                      className="btn-danger"
                      onClick={() => handleVerifyAssessment(assessment._id, 'rejected')}
                    >
                      <i className="fas fa-times"></i>
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-tab">
            <div className="tab-header">
              <h2>Platform Analytics</h2>
              <div className="filters">
                <select
                  value={filters.timeframe}
                  onChange={(e) => setFilters(prev => ({ ...prev, timeframe: e.target.value }))}
                  className="filter-select"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="365">Last year</option>
                </select>
              </div>
            </div>
            
            {analytics && (
              <div className="analytics-content">
                <div className="analytics-section">
                  <h3>Geographic Distribution</h3>
                  <div className="geo-stats">
                    {analytics.geographicDistribution.slice(0, 10).map((state, index) => (
                      <div key={index} className="geo-item">
                        <span className="state-name">{state._id}</span>
                        <span className="athlete-count">{state.athleteCount} athletes</span>
                        <span className="avg-points">Avg: {Math.round(state.averagePoints)} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="analytics-section">
                  <h3>Performance Distribution</h3>
                  <div className="performance-chart">
                    {analytics.performanceDistribution.map((bucket, index) => (
                      <div key={index} className="performance-bar">
                        <div className="bar-label">
                          {bucket._id === 'Other' ? '100+' : `${bucket._id}-${bucket._id + 19}`}%
                        </div>
                        <div 
                          className="bar-fill"
                          style={{ 
                            height: `${(bucket.count / Math.max(...analytics.performanceDistribution.map(b => b.count))) * 100}%` 
                          }}
                        ></div>
                        <div className="bar-count">{bucket.count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="leaderboard-tab">
            <Leaderboard userType="athlete" showFilters={true} />
          </div>
        )}
      </div>
    </div>
  );
};

export default SAIDashboard;
