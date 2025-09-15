import React, { useState, useRef } from 'react';
import './VideoPlayer.css';

const VideoPlayer = ({ video, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef(null);

  const handleVideoLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleVideoError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const getVideoUrl = () => {
    console.log('Video object:', video);
    console.log('Video URL:', video.videoUrl);
    console.log('Video ID:', video._id);
    
    // If video has a direct URL (Cloudinary or external), use it directly
    if (video.videoUrl && video.videoUrl.startsWith('http')) {
      console.log('Using direct HTTP URL:', video.videoUrl);
      return video.videoUrl;
    }
    
    // For local files, construct the direct file path (without /api prefix)
    if (video.videoUrl && video.videoUrl.startsWith('/uploads/')) {
      const baseUrl = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : 'http://localhost:5000';
      const url = `${baseUrl}${video.videoUrl}`;
      console.log('Using local file URL:', url);
      return url;
    }
    
    // Try streaming endpoint
    const streamUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/videos/${video._id}/stream`;
    console.log('Using streaming URL:', streamUrl);
    return streamUrl;
  };

  return (
    <div className="video-player-overlay" onClick={onClose}>
      <div className="video-player-container" onClick={(e) => e.stopPropagation()}>
        <div className="video-player-header">
          <h3>{video.title}</h3>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="video-player-content">
          {isLoading && (
            <div className="video-loading">
              <div className="spinner"></div>
              <p>Loading video...</p>
            </div>
          )}
          
          {hasError && (
            <div className="video-error">
              <i className="fas fa-exclamation-triangle"></i>
              <p>Failed to load video</p>
              <p style={{fontSize: '0.8rem', color: '#ccc', marginTop: '10px'}}>
                URL: {getVideoUrl()}
              </p>
              <button 
                className="retry-btn"
                onClick={() => {
                  setHasError(false);
                  setIsLoading(true);
                  if (videoRef.current) {
                    videoRef.current.load();
                  }
                }}
              >
                Retry
              </button>
              <button 
                className="retry-btn"
                style={{marginLeft: '10px', background: '#28a745'}}
                onClick={() => {
                  const url = getVideoUrl();
                  window.open(url, '_blank');
                }}
              >
                Open in New Tab
              </button>
            </div>
          )}
          
          <video
            ref={videoRef}
            controls
            preload="metadata"
            onLoadedData={handleVideoLoad}
            onError={(e) => {
              console.error('Video error:', e);
              console.error('Video error details:', e.target.error);
              handleVideoError();
            }}
            onLoadStart={() => console.log('Video load started')}
            onCanPlay={() => console.log('Video can play')}
            style={{ display: hasError ? 'none' : 'block' }}
            crossOrigin="anonymous"
          >
            <source src={getVideoUrl()} type="video/mp4" />
            <source src={getVideoUrl()} type="video/webm" />
            <source src={getVideoUrl()} type="video/ogg" />
            Your browser does not support the video tag.
          </video>
        </div>
        
        <div className="video-player-info">
          <div className="video-meta">
            <span><i className="fas fa-calendar"></i> {new Date(video.createdAt).toLocaleDateString()}</span>
            <span><i className="fas fa-tag"></i> {video.sport}</span>
            <span><i className="fas fa-eye"></i> {video.views || 0} views</span>
            {video.videoType && (
              <span className={`video-type-badge ${video.videoType}`}>
                <i className={`fas ${video.videoType === 'gesture_practice' ? 'fa-brain' : video.videoType === 'assignment_submission' ? 'fa-upload' : 'fa-video'}`}></i>
                {video.videoType === 'gesture_practice' ? 'Practice' : 
                 video.videoType === 'assignment_submission' ? 'Assignment' : 
                 'Regular'}
              </span>
            )}
          </div>
          {video.description && (
            <p className="video-description">{video.description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
