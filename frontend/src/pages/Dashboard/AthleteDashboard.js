import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import VideoPlayer from '../../components/VideoPlayer/VideoPlayer';
import './Dashboard.css';

const AthleteDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState({});
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const videosRes = await axios.get(`${process.env.REACT_APP_API_URL}/videos/my-videos`);
      setVideos(videosRes.data.videos || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return;
    }

    setDeleteLoading(prev => ({ ...prev, [videoId]: true }));
    
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/videos/${videoId}`);
      
      // Remove video from local state
      setVideos(prev => prev.filter(video => video._id !== videoId));
      alert('Video deleted successfully!');
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Failed to delete video. Please try again.');
    } finally {
      setDeleteLoading(prev => ({ ...prev, [videoId]: false }));
    }
  };


  const renderOverview = () => (
    <div className="overview-content">
      <div className="welcome-section">
        <h2>Welcome back, {user?.name}!</h2>
        <p>Track your training progress and share videos with coaches nearby.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-video"></i>
          </div>
          <div className="stat-info">
            <h3>{videos.length}</h3>
            <p>Videos Uploaded</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-eye"></i>
          </div>
          <div className="stat-info">
            <h3>{videos.reduce((sum, v) => sum + (v.views || 0), 0)}</h3>
            <p>Total Views</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-heart"></i>
          </div>
          <div className="stat-info">
            <h3>{videos.reduce((sum, v) => sum + (v.likeCount || 0), 0)}</h3>
            <p>Total Likes</p>
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
      </div>

      <div className="recent-videos">
        <h3>Recent Videos</h3>
        {videos.slice(0, 3).map(video => (
          <div key={video._id} className="video-item">
            <div className="video-thumbnail">
              {video.thumbnailUrl ? (
                <img src={video.thumbnailUrl} alt="Video thumbnail" />
              ) : (
                <div className="thumbnail-placeholder">
                  <i className="fas fa-play"></i>
                </div>
              )}
            </div>
            <div className="video-info">
              <h4>{video.title}</h4>
              <p>{video.sport} • {video.category}</p>
              <small>Uploaded {new Date(video.createdAt).toLocaleDateString()}</small>
            </div>
            <div className="video-stats">
              <span><i className="fas fa-eye"></i> {video.views || 0}</span>
              <span><i className="fas fa-heart"></i> {video.likeCount || 0}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMyVideos = () => (
    <div className="videos-content">
      <div className="videos-header">
        <h2>My Videos</h2>
        <div className="action-buttons">
          <button 
            className="gesture-recording-btn"
            onClick={() => navigate('/gesture-recording')}
          >
            <i className="fas fa-video"></i> Start Gesture Analysis
          </button>
        </div>
        <div className="upload-disabled-notice" style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px',
          color: '#6c757d'
        }}>
          <p style={{ margin: 0 }}><i className="fas fa-info-circle"></i> Traditional video uploads are disabled for athletes. Use the Gesture Analysis feature above for AI-powered form analysis.</p>
        </div>
      </div>

      <div className="videos-grid">
        {videos.length > 0 ? (
          videos.map(video => (
            <div key={video._id} className="video-card">
              <div className="video-thumbnail">
                {video.thumbnailUrl ? (
                  <img src={video.thumbnailUrl} alt="Video thumbnail" />
                ) : (
                  <div className="thumbnail-placeholder">
                    <i className="fas fa-play"></i>
                  </div>
                )}
                <div className="video-duration">
                  {video.duration ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}` : '0:00'}
                </div>
              </div>
              <div className="video-details">
                <h4>{video.title}</h4>
                <p className="video-meta">{video.sport} • {video.category}</p>
                {video.videoType && (
                  <p className="video-type">
                    <i className={`fas ${video.videoType === 'gesture_practice' ? 'fa-brain' : video.videoType === 'assignment_submission' ? 'fa-upload' : 'fa-video'}`}></i>
                    {video.videoType === 'gesture_practice' ? 'Practice Session' : 
                     video.videoType === 'assignment_submission' ? 'Assignment Submission' : 
                     'Regular Upload'}
                  </p>
                )}
                <p className="video-description">{video.description}</p>
                <div className="video-stats">
                  <span><i className="fas fa-eye"></i> {video.views || 0}</span>
                  <span><i className="fas fa-heart"></i> {video.likeCount || 0}</span>
                  <span><i className="fas fa-comment"></i> {video.commentCount || 0}</span>
                </div>
                <div className="video-status">
                  <span className={`status-badge ${video.status || 'pending'}`}>
                    {video.status || 'pending'}
                  </span>
                  <span className="visibility-badge">
                    {video.visibility || 'private'}
                  </span>
                  {video.videoType === 'gesture_practice' && (
                    <span className="practice-badge">
                      <i className="fas fa-graduation-cap"></i> Practice Only
                    </span>
                  )}
                </div>
                <div className="video-actions">
                  <button 
                    className="btn btn-primary view-btn"
                    onClick={() => setSelectedVideo(video)}
                    style={{ marginRight: '10px' }}
                  >
                    <i className="fas fa-play"></i>
                    Watch
                  </button>
                  <button 
                    className="btn btn-secondary delete-btn"
                    onClick={() => handleDeleteVideo(video._id)}
                    disabled={deleteLoading[video._id]}
                  >
                    {deleteLoading[video._id] ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-trash"></i>
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-videos-message" style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#6c757d'
          }}>
            <i className="fas fa-video" style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.5 }}></i>
            <h3>No videos found</h3>
            <p>You haven't uploaded any videos yet. Your recorded videos will appear here once uploaded by coaches or SAI officials.</p>
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
          <h2>{user?.name}</h2>
          <p className="user-type athlete">Athlete</p>
          <p>{user?.specialization}</p>
          <p><i className="fas fa-map-marker-alt"></i> {user?.city}, {user?.state}</p>
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
              <label>Height</label>
              <span>{user?.height ? `${user.height} cm` : 'Not specified'}</span>
            </div>
            <div className="detail-item">
              <label>Weight</label>
              <span>{user?.weight ? `${user.weight} kg` : 'Not specified'}</span>
            </div>
            <div className="detail-item">
              <label>Blood Group</label>
              <span>{user?.bloodGroup || 'Not specified'}</span>
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
              <h2>Athlete Dashboard</h2>
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
                  className={`nav-item ${activeTab === 'videos' ? 'active' : ''}`}
                  onClick={() => setActiveTab('videos')}
                >
                  <i className="fas fa-video"></i>
                  My Videos
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
            {activeTab === 'videos' && renderMyVideos()}
            {activeTab === 'profile' && renderProfile()}
          </main>
        </div>
      </div>

      {selectedVideo && (
        <VideoPlayer 
          video={selectedVideo} 
          onClose={() => setSelectedVideo(null)} 
        />
      )}
    </div>
  );
};

export default AthleteDashboard;
