import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import './Dashboard.css';

const SAIOfficialDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [videos, setVideos] = useState([]);
  // const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [filters, setFilters] = useState({
    sport: '',
    category: '',
    status: '',
    radius: 100
  });
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [moderationModal, setModerationModal] = useState(false);
  const [moderationData, setModerationData] = useState({
    status: '',
    notes: ''
  });

  const fetchNearbyVideos = useCallback(async () => {
    if (!userLocation) return;
    
    try {
      const params = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        radius: filters.radius
      };
      
      if (filters.sport) params.sport = filters.sport;
      if (filters.category) params.category = filters.category;
      if (filters.status) params.status = filters.status;

      const response = await axios.get(`${process.env.REACT_APP_API_URL}/videos/nearby`, { params });
      setVideos(response.data.videos || []);
    } catch (error) {
      console.error('Error fetching nearby videos:', error);
    }
  }, [userLocation, filters.radius, filters.sport, filters.category, filters.status]);

  useEffect(() => {
    if (user) {
      getCurrentLocation();
      fetchDashboardData();
    }
  }, [user]);

  useEffect(() => {
    if (userLocation) {
      fetchNearbyVideos();
    }
  }, [userLocation, fetchNearbyVideos]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setUserLocation({ latitude: 28.6139, longitude: 77.2090 }); // Delhi default
        }
      );
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch dashboard stats if needed
      // const statsRes = await axios.get(`${process.env.REACT_APP_API_URL}/dashboard/stats`);
      // setStats(statsRes.data.stats || {});
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleModerateVideo = async (videoId, status, notes) => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/videos/${videoId}/moderate`, {
        status,
        moderationNotes: notes
      });
      
      setModerationModal(false);
      setSelectedVideo(null);
      setModerationData({ status: '', notes: '' });
      fetchNearbyVideos(); // Refresh videos
      alert(`Video ${status} successfully!`);
    } catch (error) {
      console.error('Error moderating video:', error);
      alert('Error moderating video. Please try again.');
    }
  };

  const renderOverview = () => (
    <div className="overview-content">
      <div className="welcome-section">
        <h2>Welcome, {user?.name}</h2>
        <p>Monitor and moderate sports talent content across your region.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-video"></i>
          </div>
          <div className="stat-info">
            <h3>{videos.length}</h3>
            <p>Total Videos</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-info">
            <h3>{videos.filter(v => v.status === 'pending').length}</h3>
            <p>Pending Review</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-info">
            <h3>{videos.filter(v => v.status === 'approved').length}</h3>
            <p>Approved</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-info">
            <h3>{new Set(videos.map(v => v.uploadedBy?._id)).size}</h3>
            <p>Active Athletes</p>
          </div>
        </div>
      </div>

      <div className="recent-activity">
        <h3>Recent Submissions</h3>
        {videos.filter(v => v.status === 'pending').slice(0, 5).map(video => (
          <div key={video._id} className="activity-item">
            <div className="activity-thumbnail">
              {video.thumbnailUrl ? (
                <img src={video.thumbnailUrl} alt="Video thumbnail" />
              ) : (
                <div className="thumbnail-placeholder">
                  <i className="fas fa-play"></i>
                </div>
              )}
            </div>
            <div className="activity-info">
              <h4>{video.title}</h4>
              <p>by {video.uploadedBy?.name} • {video.sport}</p>
              <small>{video.location?.city}, {video.location?.state}</small>
            </div>
            <div className="activity-status">
              <span className="status-badge pending">Pending Review</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderVideoModeration = () => (
    <div className="moderation-content">
      <div className="moderation-header">
        <h2>Video Moderation</h2>
        <div className="filters">
          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="flagged">Flagged</option>
          </select>
          <select
            value={filters.sport}
            onChange={(e) => setFilters({...filters, sport: e.target.value})}
          >
            <option value="">All Sports</option>
            <option value="athletics">Athletics</option>
            <option value="football">Football</option>
            <option value="cricket">Cricket</option>
            <option value="basketball">Basketball</option>
            <option value="badminton">Badminton</option>
            <option value="swimming">Swimming</option>
            <option value="wrestling">Wrestling</option>
            <option value="boxing">Boxing</option>
          </select>
          <input
            type="number"
            placeholder="Radius (km)"
            value={filters.radius}
            onChange={(e) => setFilters({...filters, radius: e.target.value})}
            min="1"
            max="500"
          />
        </div>
      </div>

      <div className="videos-grid moderation-grid">
        {videos.map(video => (
          <div key={video._id} className="video-card moderation-card">
            <div className="video-thumbnail">
              {video.thumbnailUrl ? (
                <img src={video.thumbnailUrl} alt="Video thumbnail" />
              ) : (
                <div className="thumbnail-placeholder">
                  <i className="fas fa-play"></i>
                </div>
              )}
              <div className="video-duration">
                {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
              </div>
            </div>
            <div className="video-details">
              <div className="athlete-info">
                <div className="athlete-avatar">
                  {video.uploadedBy?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4>{video.uploadedBy?.name}</h4>
                  <p className="athlete-type">{video.uploadedBy?.userType}</p>
                </div>
              </div>
              <h3 className="video-title">{video.title}</h3>
              <p className="video-meta">{video.sport} • {video.category} • {video.skillLevel}</p>
              <p className="video-location">
                <i className="fas fa-map-marker-alt"></i>
                {video.location?.city}, {video.location?.state}
              </p>
              {video.description && (
                <p className="video-description">{video.description}</p>
              )}
              
              <div className="video-stats">
                <span><i className="fas fa-eye"></i> {video.views || 0}</span>
                <span><i className="fas fa-heart"></i> {video.likeCount || 0}</span>
                <span><i className="fas fa-comment"></i> {video.commentCount || 0}</span>
              </div>

              <div className="moderation-info">
                <div className="current-status">
                  <span className={`status-badge ${video.status}`}>
                    {video.status}
                  </span>
                  <small>Uploaded: {new Date(video.createdAt).toLocaleDateString()}</small>
                </div>
                
                {video.moderatedBy && (
                  <div className="moderation-history">
                    <small>
                      Moderated by: {video.moderatedBy.name} on {new Date(video.moderatedAt).toLocaleDateString()}
                    </small>
                    {video.moderationNotes && (
                      <p className="moderation-notes">{video.moderationNotes}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="moderation-actions">
                <button 
                  className="action-btn approve-btn"
                  onClick={() => {
                    setSelectedVideo(video);
                    setModerationData({ status: 'approved', notes: '' });
                    setModerationModal(true);
                  }}
                  disabled={video.status === 'approved'}
                >
                  <i className="fas fa-check"></i>
                  Approve
                </button>
                <button 
                  className="action-btn reject-btn"
                  onClick={() => {
                    setSelectedVideo(video);
                    setModerationData({ status: 'rejected', notes: '' });
                    setModerationModal(true);
                  }}
                  disabled={video.status === 'rejected'}
                >
                  <i className="fas fa-times"></i>
                  Reject
                </button>
                <button 
                  className="action-btn flag-btn"
                  onClick={() => {
                    setSelectedVideo(video);
                    setModerationData({ status: 'flagged', notes: '' });
                    setModerationModal(true);
                  }}
                >
                  <i className="fas fa-flag"></i>
                  Flag
                </button>
              </div>

              {video.tags && video.tags.length > 0 && (
                <div className="video-tags">
                  {video.tags.map((tag, index) => (
                    <span key={index} className="tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="analytics-content">
      <h2>Regional Analytics</h2>
      
      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>Sport Distribution</h3>
          <div className="chart-placeholder">
            <p>Chart showing sport popularity in the region</p>
          </div>
        </div>
        
        <div className="analytics-card">
          <h3>Monthly Submissions</h3>
          <div className="chart-placeholder">
            <p>Monthly video submission trends</p>
          </div>
        </div>
        
        <div className="analytics-card">
          <h3>Top Performing Athletes</h3>
          <div className="leaderboard">
            {videos
              .sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
              .slice(0, 5)
              .map((video, index) => (
                <div key={video._id} className="leaderboard-item">
                  <span className="rank">#{index + 1}</span>
                  <span className="name">{video.uploadedBy?.name}</span>
                  <span className="score">{video.likeCount || 0} likes</span>
                </div>
              ))}
          </div>
        </div>
        
        <div className="analytics-card">
          <h3>Regional Coverage</h3>
          <div className="coverage-stats">
            <div className="coverage-item">
              <label>Cities Covered</label>
              <span>{new Set(videos.map(v => v.location?.city)).size}</span>
            </div>
            <div className="coverage-item">
              <label>States Covered</label>
              <span>{new Set(videos.map(v => v.location?.state)).size}</span>
            </div>
            <div className="coverage-item">
              <label>Average Distance</label>
              <span>{filters.radius}km</span>
            </div>
          </div>
        </div>
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
          <p className="user-type sai-official">SAI Official</p>
          <p>{user?.department}</p>
          <p><i className="fas fa-map-marker-alt"></i> {user?.city}, {user?.state}</p>
        </div>
      </div>

      <div className="profile-details">
        <div className="detail-section">
          <h3>Official Information</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Employee ID</label>
              <span>{user?.employeeId || 'Not specified'}</span>
            </div>
            <div className="detail-item">
              <label>Department</label>
              <span>{user?.department || 'Not specified'}</span>
            </div>
            <div className="detail-item">
              <label>Access Level</label>
              <span className="access-level">{user?.accessLevel || 'basic'}</span>
            </div>
            <div className="detail-item">
              <label>Email</label>
              <span>{user?.email}</span>
            </div>
            <div className="detail-item">
              <label>Phone</label>
              <span>{user?.phone}</span>
            </div>
            <div className="detail-item">
              <label>Specialization</label>
              <span>{user?.specialization}</span>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h3>Moderation Statistics</h3>
          <div className="moderation-stats">
            <div className="stat-item">
              <label>Videos Reviewed</label>
              <span>{videos.filter(v => v.moderatedBy?._id === user?.id).length}</span>
            </div>
            <div className="stat-item">
              <label>Approved</label>
              <span>{videos.filter(v => v.moderatedBy?._id === user?.id && v.status === 'approved').length}</span>
            </div>
            <div className="stat-item">
              <label>Rejected</label>
              <span>{videos.filter(v => v.moderatedBy?._id === user?.id && v.status === 'rejected').length}</span>
            </div>
          </div>
        </div>
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
              <h2>SAI Official Dashboard</h2>
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
                  className={`nav-item ${activeTab === 'moderation' ? 'active' : ''}`}
                  onClick={() => setActiveTab('moderation')}
                >
                  <i className="fas fa-shield-alt"></i>
                  Video Moderation
                </button>
              </li>
              <li>
                <button
                  className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
                  onClick={() => setActiveTab('analytics')}
                >
                  <i className="fas fa-chart-bar"></i>
                  Analytics
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
            </ul>
          </nav>

          <main className="dashboard-content">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'moderation' && renderVideoModeration()}
            {activeTab === 'analytics' && renderAnalytics()}
            {activeTab === 'profile' && renderProfile()}
          </main>
        </div>
      </div>

      {/* Moderation Modal */}
      {moderationModal && selectedVideo && (
        <div className="modal-overlay">
          <div className="modal moderation-modal">
            <div className="modal-header">
              <h3>Moderate Video</h3>
              <button 
                className="close-btn"
                onClick={() => setModerationModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="video-info">
                <h4>{selectedVideo.title}</h4>
                <p>by {selectedVideo.uploadedBy?.name}</p>
                <p>{selectedVideo.sport} • {selectedVideo.category}</p>
              </div>
              
              <div className="moderation-form">
                <div className="form-group">
                  <label>Action</label>
                  <select
                    value={moderationData.status}
                    onChange={(e) => setModerationData({...moderationData, status: e.target.value})}
                  >
                    <option value="">Select Action</option>
                    <option value="approved">Approve</option>
                    <option value="rejected">Reject</option>
                    <option value="flagged">Flag for Review</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Notes (Optional)</label>
                  <textarea
                    value={moderationData.notes}
                    onChange={(e) => setModerationData({...moderationData, notes: e.target.value})}
                    placeholder="Add moderation notes..."
                    rows="3"
                  />
                </div>
              </div>
              
              <div className="modal-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setModerationModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => handleModerateVideo(selectedVideo._id, moderationData.status, moderationData.notes)}
                  disabled={!moderationData.status}
                >
                  Confirm Action
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SAIOfficialDashboard;
