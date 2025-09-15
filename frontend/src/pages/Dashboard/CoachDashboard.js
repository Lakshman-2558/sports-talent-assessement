import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import VideoPlayer from '../../components/VideoPlayer/VideoPlayer';
import './Dashboard.css';

const CoachDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [nearbyVideos, setNearbyVideos] = useState([]);
  const [myVideos, setMyVideos] = useState([]);
  // const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [filters, setFilters] = useState({
    sport: '',
    category: '',
    radius: 50
  });
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedVideoForPlayer, setSelectedVideoForPlayer] = useState(null);
  const [comment, setComment] = useState('');

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

      const response = await axios.get(`${process.env.REACT_APP_API_URL}/videos/nearby`, { params });
      setNearbyVideos(response.data.videos || []);
    } catch (error) {
      console.error('Error fetching nearby videos:', error);
    }
  }, [userLocation, filters.radius, filters.sport, filters.category]);

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
      const videosRes = await axios.get(`${process.env.REACT_APP_API_URL}/videos/my-videos`);
      setMyVideos(videosRes.data.videos || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleLikeVideo = async (videoId) => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/videos/${videoId}/like`);
      fetchNearbyVideos(); // Refresh to get updated like count
    } catch (error) {
      console.error('Error liking video:', error);
    }
  };

  const handleAddComment = async (videoId) => {
    if (!comment.trim()) return;
    
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/videos/${videoId}/comment`, {
        comment: comment.trim()
      });
      
      if (response.data.success) {
        // Update the video in nearbyVideos
        setNearbyVideos(prev => prev.map(video => 
          video._id === videoId 
            ? { ...video, commentCount: (video.commentCount || 0) + 1 }
            : video
        ));
        setComment('');
        setSelectedVideo(null);
        alert('Comment added successfully!');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    }
  };

  const handleVerifyVideo = async (videoId, verificationStatus, notes = '') => {
    try {
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/videos/${videoId}/verify`, {
        verificationStatus,
        verificationNotes: notes
      });
      
      if (response.data.success) {
        // Update the video in nearbyVideos
        setNearbyVideos(prev => prev.map(video => 
          video._id === videoId 
            ? { ...video, verificationStatus, verifiedBy: user.id, verifiedAt: new Date() }
            : video
        ));
        alert(`Video ${verificationStatus} successfully!`);
      }
    } catch (error) {
      console.error('Error verifying video:', error);
      alert('Failed to verify video');
    }
  };

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
            <div className="activity-distance">
              <i className="fas fa-map-marker-alt"></i>
              <span>~{Math.round(Math.random() * 30 + 5)}km away</span>
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
        <div className="filters">
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
          <select
            value={filters.category}
            onChange={(e) => setFilters({...filters, category: e.target.value})}
          >
            <option value="">All Categories</option>
            <option value="training">Training</option>
            <option value="performance">Performance</option>
            <option value="technique">Technique</option>
            <option value="assessment">Assessment</option>
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

      <div className="videos-grid">
        {nearbyVideos.length > 0 ? nearbyVideos.map(video => (
          <div key={video._id} className="video-card coach-view">
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
                  <p className="athlete-specialization">{video.uploadedBy?.specialization}</p>
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
              
              <div className="video-actions">
                <button 
                  className="action-btn watch-btn"
                  onClick={() => setSelectedVideoForPlayer(video)}
                  style={{ marginRight: '10px' }}
                >
                  <i className="fas fa-play"></i>
                  Watch
                </button>
                <button 
                  className="action-btn like-btn"
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
                {video.videoType === 'assignment_submission' && (
                  <div className="verification-buttons">
                    <button 
                      className={`action-btn verify-btn ${video.verificationStatus === 'approved' ? 'approved' : ''}`}
                      onClick={() => handleVerifyVideo(video._id, 'approved')}
                      title="Approve this assessment video"
                    >
                      <i className="fas fa-check-circle"></i>
                      Approve
                    </button>
                    <button 
                      className={`action-btn verify-btn ${video.verificationStatus === 'rejected' ? 'rejected' : ''}`}
                      onClick={() => handleVerifyVideo(video._id, 'rejected')}
                      title="Reject this assessment video"
                    >
                      <i className="fas fa-times-circle"></i>
                      Reject
                    </button>
                    {video.verificationStatus && video.verificationStatus !== 'pending' && (
                      <span className={`verification-status ${video.verificationStatus}`}>
                        {video.verificationStatus?.toUpperCase() || ''}
                      </span>
                    )}
                  </div>
                )}
                <button className="action-btn share-btn">
                  <i className="fas fa-share"></i>
                  Share
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
        )) : (
          <div className="no-videos-message" style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#6c757d',
            gridColumn: '1 / -1'
          }}>
            <i className="fas fa-users" style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.5 }}></i>
            <h3>No Athletes Found</h3>
            <p>No athlete videos found in your area. Try adjusting your search radius or filters.</p>
          </div>
        )}
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
              <span>{user?.phone}</span>
            </div>
          </div>
        </div>

        {user?.certifications && user.certifications.length > 0 && (
          <div className="detail-section">
            <h3>Certifications</h3>
            <div className="certifications-list">
              {user.certifications.map((cert, index) => (
                <div key={index} className="certification-item">
                  <h4>{cert.name}</h4>
                  <p>Issued by: {cert.issuedBy}</p>
                  <p>Date: {new Date(cert.issuedDate).toLocaleDateString()}</p>
                  {cert.expiryDate && (
                    <p>Expires: {new Date(cert.expiryDate).toLocaleDateString()}</p>
                  )}
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
              <h3>Add Comment</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedVideo(null)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="video-info">
                <h4>{selectedVideo.title}</h4>
                <p>by {selectedVideo.uploadedBy?.name}</p>
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your feedback and guidance..."
                rows="4"
              />
              <div className="modal-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setSelectedVideo(null)}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => handleAddComment(selectedVideo._id)}
                >
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
