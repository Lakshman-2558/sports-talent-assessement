import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import VideoPlayer from '../../components/VideoPlayer/VideoPlayer';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Dashboard.css';

const CoachDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [nearbyVideos, setNearbyVideos] = useState([]);
  const [myVideos, setMyVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [filters, setFilters] = useState({ sport: '', category: '', radius: 50 });
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedVideoForPlayer, setSelectedVideoForPlayer] = useState(null);
  const [comment, setComment] = useState('');

  // Get current location
  const getCurrentLocation = useCallback(() => {
    setLocationLoading(true);
    
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        
        setUserLocation(location);
        setLocationLoading(false);
        toast.success('Location detected successfully');
      },
      (error) => {
        console.error('Location error:', error);
        let errorMessage = 'Could not get your location. ';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'Unknown error.';
        }
        
        toast.error(errorMessage);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  }, []);

  // Fetch nearby videos
  const fetchNearbyVideos = useCallback(async (latitude, longitude) => {
    if (!latitude || !longitude) {
      toast.error('Location required to find nearby athletes');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = {
        latitude,
        longitude,
        radius: filters.radius
      };
      
      if (filters.sport) params.sport = filters.sport;
      if (filters.category) params.category = filters.category;

      const response = await axios.get(`${process.env.REACT_APP_API_URL|| ''}/assessments/nearby`, { 
        params,
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 15000
      });
      
      if (response.data.success) {
        setNearbyVideos(response.data.assessments || []);
        if (response.data.assessments.length > 0) {
          toast.success(`Found ${response.data.count} nearby athletes`);
        }
      } else {
        throw new Error(response.data.message || 'Failed to fetch nearby videos');
      }
    } catch (error) {
      console.error('Error fetching nearby videos:', error);
      
      if (error.code === 'ECONNABORTED') {
        toast.error('Request timeout. Please try again.');
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please contact support.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to load nearby videos');
      }
      
      setNearbyVideos([]);
    } finally {
      setLoading(false);
    }
  }, [filters.radius, filters.sport, filters.category]);

  // Fetch coach's own videos
  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_URL|| ''}/assessments/my-videos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setMyVideos(response.data.videos || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const handleLikeVideo = async (videoId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${process.env.REACT_APP_API_URL|| ''}/assessments/${videoId}/like`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setNearbyVideos(prev => prev.map(video => 
          video._id === videoId 
            ? { ...video, likeCount: response.data.likeCount, likes: response.data.liked ? [...video.likes, user.id] : video.likes.filter(id => id !== user.id) }
            : video
        ));
      }
    } catch (error) {
      console.error('Error liking video:', error);
      toast.error('Failed to like video');
    }
  };

  const handleAddComment = async (videoId) => {
    if (!comment.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${process.env.REACT_APP_API_URL|| ''}/assessments/${videoId}/comment`, {
        comment: comment.trim()
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setNearbyVideos(prev => prev.map(video => 
          video._id === videoId 
            ? { ...video, commentCount: (video.commentCount || 0) + 1, comments: [...video.comments, response.data.comment] }
            : video
        ));
        setComment('');
        setSelectedVideo(null);
        toast.success('Comment added successfully!');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleVerifyVideo = async (videoId, verificationStatus, notes = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${process.env.REACT_APP_API_URL|| ''}/assessments/${videoId}/verify`, {
        verificationStatus,
        verificationNotes: notes
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setNearbyVideos(prev => prev.map(video => 
          video._id === videoId 
            ? { ...video, verificationStatus, verifiedBy: user.id, verifiedAt: new Date() }
            : video
        ));
        toast.success(`Video ${verificationStatus} successfully!`);
      }
    } catch (error) {
      console.error('Error verifying video:', error);
      toast.error('Failed to verify video');
    }
  };

  useEffect(() => {
    if (user) {
      getCurrentLocation();
      fetchDashboardData();
    }
  }, [user, getCurrentLocation]);

  useEffect(() => {
    if (userLocation) {
      fetchNearbyVideos(userLocation.latitude, userLocation.longitude);
    }
  }, [userLocation, fetchNearbyVideos]);

  const renderOverview = () => (
    <div className="overview-content">
      <div className="welcome-section">
        <h2>Welcome back, Coach {user?.name}!</h2>
        <p>Discover talented athletes in your area and provide guidance through video analysis.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-video"></i>
          </div>
          <div className="stat-info">
            <h3>{nearbyVideos.length}</h3>
            <p>Nearby Athletes</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-info">
            <h3>{myVideos.length}</h3>
            <p>My Videos</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-comment"></i>
          </div>
          <div className="stat-info">
            <h3>{nearbyVideos.reduce((sum, v) => sum + (v.commentCount || 0), 0)}</h3>
            <p>Comments Given</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-map-marker-alt"></i>
          </div>
          <div className="stat-info">
            <h3>{filters.radius}km</h3>
            <p>Search Radius</p>
          </div>
        </div>
      </div>

      <div className="recent-activity">
        <h3>Recent Athlete Videos</h3>
        {nearbyVideos.slice(0, 3).map(video => (
          <div key={video._id} className="activity-item" onClick={() => setSelectedVideoForPlayer(video)}>
            <div className="activity-thumbnail">
              {video.videoThumbnail ? (
                <img src={video.videoThumbnail} alt="Video thumbnail" />
              ) : (
                <div className="thumbnail-placeholder">
                  <i className="fas fa-play"></i>
                </div>
              )}
            </div>
            <div className="activity-info">
              <h4>{video.assessmentType?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</h4>
              <p>by {video.athlete?.name}</p>
              <small>{new Date(video.testDate).toLocaleDateString()}</small>
            </div>
            <div className="activity-distance">
              <i className="fas fa-map-marker-alt"></i>
              <span>Location recorded</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderNearbyAthletes = () => (
    <div className="athletes-content">
      <div className="athletes-header">
        <h2>Nearby Athletes</h2>
        
        {locationLoading ? (
          <div className="location-loading">
            <span className="spinner-border spinner-border-sm"></span>
            Detecting your location...
          </div>
        ) : userLocation && (
          <div className="location-badge">
            <i className="fas fa-map-marker-alt"></i>
            Searching within {filters.radius}km of your location
          </div>
        )}

        <div className="filters">
          <select value={filters.sport} onChange={(e) => setFilters({...filters, sport: e.target.value})}>
            <option value="">All Sports</option>
            <option value="athletics">Athletics</option>
            <option value="football">Football</option>
            <option value="cricket">Cricket</option>
            <option value="basketball">Basketball</option>
          </select>
          
          <select value={filters.category} onChange={(e) => setFilters({...filters, category: e.target.value})}>
            <option value="">All Categories</option>
            <option value="training">Training</option>
            <option value="performance">Performance</option>
            <option value="technique">Technique</option>
          </select>
          
          <div className="radius-slider">
            <label>Radius: {filters.radius}km</label>
            <input
              type="range"
              min="1"
              max="100"
              value={filters.radius}
              onChange={(e) => setFilters({...filters, radius: e.target.value})}
            />
          </div>
          
          <button 
            onClick={() => userLocation && fetchNearbyVideos(userLocation.latitude, userLocation.longitude)}
            className="refresh-btn"
            disabled={loading}
          >
            <i className={`fas fa-sync ${loading ? 'fa-spin' : ''}`}></i>
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-section">
          <div className="spinner-border text-primary"></div>
          <p>Searching for nearby athletes...</p>
        </div>
      ) : nearbyVideos.length > 0 ? (
        <div className="videos-grid">
          {nearbyVideos.map(video => (
            <div key={video._id} className="video-card coach-view">
              <div className="video-thumbnail">
                {video.videoThumbnail ? (
                  <img src={video.videoThumbnail} alt="Video thumbnail" />
                ) : (
                  <div className="thumbnail-placeholder">
                    <i className="fas fa-play"></i>
                  </div>
                )}
                {video.videoDuration && (
                  <div className="video-duration">
                    {Math.floor(video.videoDuration / 60)}:{(video.videoDuration % 60).toString().padStart(2, '0')}
                  </div>
                )}
              </div>
              
              <div className="video-details">
                <div className="athlete-info">
                  <div className="athlete-avatar">
                    {video.athlete?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4>{video.athlete?.name}</h4>
                    <p className="athlete-specialization">{video.athlete?.specialization}</p>
                  </div>
                </div>
                
                <h3 className="video-title">{video.assessmentType?.split('_').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}</h3>
                
                <p className="video-meta">
                  {new Date(video.testDate).toLocaleDateString()} • 
                  {video.verificationStatus && (
                    <span className={`verification-status ${video.verificationStatus}`}>
                      {video.verificationStatus.toUpperCase()}
                    </span>
                  )}
                </p>

                {video.location && (
                  <p className="video-location">
                    <i className="fas fa-map-marker-alt"></i>
                    Location recorded
                  </p>
                )}

                <div className="video-stats">
                  <span><i className="fas fa-eye"></i> {video.views || 0}</span>
                  <span><i className="fas fa-heart"></i> {video.likeCount || 0}</span>
                  <span><i className="fas fa-comment"></i> {video.commentCount || 0}</span>
                </div>

                <div className="video-actions">
                  <button 
                    className="action-btn watch-btn"
                    onClick={() => setSelectedVideoForPlayer(video)}
                  >
                    <i className="fas fa-play"></i>
                    Watch
                  </button>
                  
                  <button 
                    className={`action-btn like-btn ${video.likes?.includes(user.id) ? 'liked' : ''}`}
                    onClick={() => handleLikeVideo(video._id)}
                  >
                    <i className="fas fa-heart"></i>
                    {video.likeCount || 0}
                  </button>
                  
                  <button 
                    className="action-btn comment-btn"
                    onClick={() => setSelectedVideo(video)}
                  >
                    <i className="fas fa-comment"></i>
                    {video.commentCount || 0}
                  </button>
                  
                  {user.role === 'coach' && (
                    <div className="verification-buttons">
                      <button 
                        className={`action-btn verify-btn ${video.verificationStatus === 'verified' ? 'verified' : ''}`}
                        onClick={() => handleVerifyVideo(video._id, 'verified')}
                      >
                        <i className="fas fa-check"></i>
                        Verify
                      </button>
                      <button 
                        className={`action-btn flag-btn ${video.verificationStatus === 'flagged' ? 'flagged' : ''}`}
                        onClick={() => handleVerifyVideo(video._id, 'flagged')}
                      >
                        <i className="fas fa-flag"></i>
                        Flag
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-videos-message">
          <i className="fas fa-users-slash"></i>
          <h3>No Athletes Found Nearby</h3>
          <p>Try increasing your search radius or check back later for new assessments.</p>
          <button 
            onClick={() => userLocation && fetchNearbyVideos(userLocation.latitude, userLocation.longitude)}
            className="retry-btn"
          >
            <i className="fas fa-sync"></i> Try Again
          </button>
        </div>
      )}
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
          <h2>Coach {user?.name}</h2>
          <p className="user-type coach">Coach</p>
          <p>{user?.specialization}</p>
          <p><i className="fas fa-map-marker-alt"></i> {user?.city}, {user?.state}</p>
        </div>
      </div>

      <div className="profile-details">
        <div className="detail-section">
          <h3>Professional Information</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Experience</label>
              <span>{user?.experience ? `${user.experience} years` : 'Not specified'}</span>
            </div>
            <div className="detail-item">
              <label>Specialization</label>
              <span>{user?.specialization}</span>
            </div>
            <div className="detail-item">
              <label>Email</label>
              <span>{user?.email}</span>
            </div>
            <div className="detail-item">
              <label>Phone</label>
              <span>{user?.phone || 'Not provided'}</span>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h3>Coaching Stats</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-video"></i>
              </div>
              <div className="stat-info">
                <h3>{nearbyVideos.length}</h3>
                <p>Athletes Nearby</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-comment"></i>
              </div>
              <div className="stat-info">
                <h3>{nearbyVideos.reduce((sum, v) => sum + (v.commentCount || 0), 0)}</h3>
                <p>Comments Given</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="stat-info">
                <h3>{nearbyVideos.filter(v => v.verifiedBy === user.id).length}</h3>
                <p>Videos Verified</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading && activeTab === 'athletes') {
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
              <h2>Coach Dashboard</h2>
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
                  className={`nav-item ${activeTab === 'athletes' ? 'active' : ''}`}
                  onClick={() => setActiveTab('athletes')}
                >
                  <i className="fas fa-users"></i>
                  Nearby Athletes
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
            {activeTab === 'athletes' && renderNearbyAthletes()}
            {activeTab === 'profile' && renderProfile()}
          </main>
        </div>
      </div>

      {/* Comment Modal */}
      {selectedVideo && (
        <div className="modal-overlay">
          <div className="modal comment-modal">
            <div className="modal-header">
              <h3>Add Comment to {selectedVideo.assessmentType?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</h3>
              <button className="close-btn" onClick={() => setSelectedVideo(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="video-info">
                <p>by {selectedVideo.athlete?.name}</p>
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your feedback and guidance..."
                rows="4"
              />
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setSelectedVideo(null)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={() => handleAddComment(selectedVideo._id)}>
                  Add Comment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {selectedVideoForPlayer && (
        <VideoPlayer 
          video={selectedVideoForPlayer} 
          onClose={() => setSelectedVideoForPlayer(null)} 
        />
      )}
    </div>
  );
};

export default CoachDashboard;