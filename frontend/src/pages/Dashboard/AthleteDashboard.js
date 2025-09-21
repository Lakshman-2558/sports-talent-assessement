import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import VideoPlayer from '../../components/VideoPlayer/VideoPlayer';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Dashboard.css';

// Helper function to format duration in seconds to MM:SS format
const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

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
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_URL || ''}/assessments/my-assessments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📊 API Response:', response.data);
      console.log('🔍 Assessments data:', response.data.assessments);
      
      if (response.data.success && Array.isArray(response.data.assessments)) {
        // Log the first assessment to see its structure
        if (response.data.assessments.length > 0) {
          console.log('📋 First assessment structure:', response.data.assessments[0]);
          console.log('🎥 Video URL field:', response.data.assessments[0].videoUrl);
          console.log('🆔 Assessment ID:', response.data.assessments[0]._id);
        }
        
        // Map assessments to match the expected video format
        const formattedVideos = response.data.assessments.map(assessment => ({
          ...assessment,
          title: assessment.assessmentType 
            ? assessment.assessmentType.split('_').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')
            : 'Assessment',
          url: assessment.videoUrl,
          createdAt: assessment.testDate || assessment.createdAt || new Date()
        }));
        
        console.log('✅ Formatted videos:', formattedVideos);
        setVideos(formattedVideos);
      } else {
        throw new Error(response.data.message || 'Failed to load assessments');
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      alert(error.response?.data?.message || 'Failed to load assessments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewVideo = (video) => {
    console.log('🎬 Selected video:', video);
    setSelectedVideo(video);
  };

  const handleDeleteVideo = async (assessmentId, e) => {
    if (e) e.stopPropagation(); // Prevent event bubbling
    
    if (!window.confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) {
      return;
    }
  
    console.log('=== Starting Delete Process ===');
    console.log('Assessment ID:', assessmentId);
    console.log('Current User:', JSON.stringify(user, null, 2));
    
    const assessmentToDelete = videos.find(v => v._id === assessmentId);
    if (!assessmentToDelete) {
      console.error('❌ Assessment not found in local state');
      toast.error('Assessment not found. Please refresh the page and try again.');
      return;
    }
    
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Authentication error. Please log in again.');
      return;
    }
    
    // Decode the token to get user info
    let decodedToken;
    try {
      const tokenPayload = token.split('.')[1];
      decodedToken = JSON.parse(atob(tokenPayload));
      console.log('🔍 Decoded Token:', decodedToken);
    } catch (error) {
      console.error('Error decoding token:', error);
      toast.error('Authentication error. Please log in again.');
      return;
    }
    
    // Get user ID from token (should match what's in the JWT)
    const userIdFromToken = decodedToken.userId || decodedToken.id;
    if (!userIdFromToken) {
      console.error('No user ID found in token');
      toast.error('Authentication error. Please log in again.');
      return;
    }
    
    // Get the athlete ID from the assessment - handle both populated and non-populated athlete fields
    const athleteId = assessmentToDelete.athlete?._id || assessmentToDelete.athlete;
    
    console.log('🔍 ID Comparison:', {
      tokenUserId: userIdFromToken,
      assessmentAthleteId: athleteId?.toString(),
      areEqual: userIdFromToken === athleteId?.toString(),
      tokenData: decodedToken
    });
    
    // Only allow deletion if the user is the owner or an admin
    const isOwner = userIdFromToken === athleteId?.toString();
    const isAdmin = decodedToken.role === 'admin' || user?.role === 'admin' || user?.user?.role === 'admin';
    
    console.log('🔍 Ownership Check:', {
      isOwner,
      isAdmin,
      tokenUserId: userIdFromToken,
      assessmentAthleteId: athleteId?.toString(),
      userRole: decodedToken.role,
      tokenData: decodedToken
    });
    
    if (!isOwner && !isAdmin) {
      const message = '❌ You are not authorized to delete this assessment. Only the owner or an admin can delete it.';
      console.error(message);
      toast.error(message);
      return;
    }
    
    setDeleteLoading(prev => ({ ...prev, [assessmentId]: true }));
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
  
      // Ensure we have the base API URL from environment variables
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const apiUrl = `${baseUrl}/assessments/${assessmentId}`;
      
      console.log('🚀 Sending DELETE request to:', apiUrl);
      console.log('🔑 Using token:', token ? 'Token exists' : 'No token found');
      
      // Get the token from localStorage again to ensure it's fresh
      const authToken = localStorage.getItem('token');
      if (!authToken) {
        throw new Error('No authentication token found');
      }
      
      // Make the request with explicit headers
      const response = await axios({
        method: 'delete',
        url: apiUrl,
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        withCredentials: true
      });
      
      console.log('📥 Delete Response:', {
        status: response.status,
        data: response.data,
        headers: response.headers
      });
      
      if (response.status === 200 && response.data.success) {
        // Remove the deleted video from the local state
        setVideos(prevVideos => prevVideos.filter(v => v._id !== assessmentId));
        toast.success('🎉 Assessment deleted successfully!');
      } else {
        const errorMessage = response.data?.message || `Failed to delete assessment (Status: ${response.status})`;
        console.error('❌ Delete failed:', errorMessage);
        toast.error(`❌ ${errorMessage}`);
      }
    } catch (error) {
      console.error('🔥 Error deleting assessment:', error);
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Failed to delete assessment. Please check your connection and try again.';
      toast.error(`❌ ${errorMessage}`);
      
      // Log more details about the error
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
      } else if (error.request) {
        console.error('No response received. Request details:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
    } finally {
      setDeleteLoading(prev => ({ ...prev, [assessmentId]: false }));
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
          <div key={video._id} className="video-item" onClick={() => handleViewVideo(video)} style={{cursor: 'pointer'}}>
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
              <p>{video.sport || 'Fitness'} • {video.category || 'Assessment'}</p>
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

  const renderMyVideos = () => {
    if (loading) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          textAlign: 'center'
        }}>
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p style={{ marginTop: '15px', color: '#6c757d' }}>Loading your assessments...</p>
        </div>
      );
    }

    return (
      <div style={{ padding: '20px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <h2 style={{ margin: 0 }}>My Assessments</h2>
          <button 
            onClick={() => navigate('/gesture-recording')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#007bff',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
          >
            <i className="fas fa-video"></i> Start Gesture Analysis
          </button>
        </div>

        {videos.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
            marginTop: '20px'
          }}>
            {videos.map((video) => {
              const thumbnailUrl = video.thumbnailUrl || 
                                 (video.videoThumbnail && 
                                  (video.videoThumbnail.startsWith('http') ? 
                                   video.videoThumbnail : 
                                   `${process.env.REACT_APP_API_URL || ''}${video.videoThumbnail}`)) ||
                                 'https://via.placeholder.com/300x200?text=No+Thumbnail';

              return (
                <div key={video._id} style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  ':hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }
                }}>
                  <div style={{ position: 'relative', paddingTop: '56.25%' }}>
                    <img 
                      src={thumbnailUrl}
                      alt={video.title || 'Assessment thumbnail'}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/300x200?text=No+Thumbnail';
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {video.duration || video.videoDuration ? 
                        formatDuration(video.duration || video.videoDuration) : 'N/A'}
                    </div>
                  </div>
                  <div style={{ padding: '12px' }}>
                    <h3 style={{
                      margin: '0 0 8px 0',
                      fontSize: '16px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {video.title || 'Untitled Assessment'}
                    </h3>
                    <p style={{
                      margin: '0 0 12px 0',
                      color: '#6c757d',
                      fontSize: '14px'
                    }}>
                      {video.testDate || video.createdAt ? 
                        new Date(video.testDate || video.createdAt).toLocaleDateString() : 
                        'Date not available'}
                    </p>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <button 
                        onClick={() => handleViewVideo(video)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#f8f9fa',
                          border: '1px solid #dee2e6',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: '#212529',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <i className="fas fa-play"></i> View
                      </button>
                      <button 
                        onClick={(e) => handleDeleteVideo(video._id, e)}
                        disabled={deleteLoading[video._id]}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: deleteLoading[video._id] ? '#6c757d' : '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: deleteLoading[video._id] ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          opacity: deleteLoading[video._id] ? 0.7 : 1
                        }}
                      >
                        {deleteLoading[video._id] ? (
                          <>
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-trash"></i> Delete
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            marginTop: '20px'
          }}>
            <i className="fas fa-video-slash" style={{
              fontSize: '48px',
              color: '#6c757d',
              marginBottom: '16px',
              opacity: 0.5
            }}></i>
            <h3 style={{ margin: '0 0 8px 0', color: '#343a40' }}>No Assessments Found</h3>
            <p style={{ margin: '0 0 20px 0', color: '#6c757d' }}>
              You haven't uploaded any assessments yet. Your assessments will appear here once submitted.
            </p>
            <button 
              onClick={() => navigate('/upload')}
              style={{
                padding: '8px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s'
              }}
            >
              <i className="fas fa-upload"></i> Upload Your First Assessment
            </button>
          </div>
        )}
      </div>
    );
  };

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
          <p>{user?.specialization || 'Sports Athlete'}</p>
          <p><i className="fas fa-map-marker-alt"></i> {user?.city || 'Unknown'}, {user?.state || 'Unknown'}</p>
        </div>
      </div>

      <div className="profile-details">
        <div className="detail-section">
          <h3>Personal Information</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Email</label>
              <span>{user?.email || 'Not provided'}</span>
            </div>
            <div className="detail-item">
              <label>Phone</label>
              <span>{user?.phone || 'Not provided'}</span>
            </div>
            <div className="detail-item">
              <label>Age</label>
              <span>{user?.age ? `${user.age} years` : 'Not specified'}</span>
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

        <div className="detail-section">
          <h3>Performance Stats</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-video"></i>
              </div>
              <div className="stat-info">
                <h3>{videos.length}</h3>
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
                <i className="fas fa-chart-line"></i>
              </div>
              <div className="stat-info">
                <h3>{user?.level || 1}</h3>
                <p>Current Level</p>
              </div>
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