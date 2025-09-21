import React, { useState, useRef, useEffect } from 'react';
import './VideoPlayer.css';

const VideoPlayer = ({ video, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [hasAudio, setHasAudio] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const url = getVideoUrl();
    setVideoUrl(url);
    console.log('🎬 Video object:', video);
    console.log('🔗 Video URL:', url);
  }, [video]);

  const getVideoUrl = () => {
    if (!video) return '';
    
    // First check for videoUrl in assessment data
    if (video.videoUrl) {
      console.log('✅ Found video in videoUrl:', video.videoUrl);
      
      // If it's already a full URL, use it directly
      if (video.videoUrl.startsWith('http')) {
        return video.videoUrl;
      }
      
      // If it's a Cloudinary URL or other CDN path, just return it
      if (video.videoUrl.startsWith('https://res.cloudinary.com') || 
          video.videoUrl.startsWith('http://res.cloudinary.com')) {
        return video.videoUrl;
      }
      
      // If it's a relative path, construct the full URL
      if (video.videoUrl.startsWith('/')) {
        const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        // Remove any duplicate /api from baseUrl if present
        const cleanBaseUrl = baseUrl.replace(/\/api$/, '');
        return `${cleanBaseUrl}${video.videoUrl}`;
      }
      
      // For other cases, assume it's a relative path from the API
      return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/${video.videoUrl.replace(/^\//, '')}`;
    }
    
    // Fallback to checking other possible fields (for backward compatibility)
    const possibleVideoFields = [
      'videoPath',       // Server path
      'video',           // Maybe just 'video'
      'videoFile',       // Alternative field name
      'mediaUrl',        // Another possible field
      'assessmentVideo'  // Assessment-specific field
    ];
    
    // Try each possible field
    for (const field of possibleVideoFields) {
      if (video[field] && typeof video[field] === 'string') {
        console.log(`✅ Found video in field: ${field}`, video[field]);
        
        // If it's already a full URL, use it directly
        if (video[field].startsWith('http')) {
          return video[field];
        }
        
        // If it's a relative path, construct the full URL
        if (video[field].startsWith('/')) {
          const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
          // Remove any duplicate /api from baseUrl if present
          const cleanBaseUrl = baseUrl.replace(/\/api$/, '');
          return `${cleanBaseUrl}${video[field]}`;
        }
        
        // If it's a filename without path, construct URL
        const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const cleanBaseUrl = baseUrl.replace(/\/api$/, '');
        return `${cleanBaseUrl}/uploads/assessments/${video[field]}`;
      }
    }
    
    // Fallback: Try streaming endpoint using assessment ID
    if (video._id) {
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const cleanBaseUrl = baseUrl.replace(/\/api$/, '');
      return `${cleanBaseUrl}/api/assessments/${video._id}/video`;
    }
    
    console.warn('❌ No video URL found in assessment data');
    return '';
  };

  const handleVideoLoad = () => {
    setIsLoading(false);
    setHasError(false);
    
    // Check if video has audio tracks
    if (videoRef.current) {
      const hasAudioTracks = videoRef.current.mozHasAudio || 
                            Boolean(videoRef.current.webkitAudioDecodedByteCount) ||
                            Boolean(videoRef.current.audioTracks && videoRef.current.audioTracks.length > 0);
      
      setHasAudio(hasAudioTracks);
      console.log('🔊 Video has audio:', hasAudioTracks);
    }
  };

  const handleVideoError = (error) => {
    console.error('❌ Video loading error:', error);
    console.error('📺 Video element error:', videoRef.current?.error);
    setIsLoading(false);
    setHasError(true);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  const handleOpenInNewTab = () => {
    if (videoUrl) {
      window.open(videoUrl, '_blank');
    }
  };

  if (!video) return null;

  return (
    <div className="video-player-overlay" onClick={onClose}>
      <div className="video-player-container" onClick={(e) => e.stopPropagation()}>
        <div className="video-player-header">
          <h3>{video.title || video.assessmentType || 'Assessment Video'}</h3>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="video-player-content">
          {isLoading && (
            <div className="video-loading">
              <div className="spinner"></div>
              <p>Loading assessment video...</p>
            </div>
          )}
          
          {hasError && (
            <div className="video-error">
              <i className="fas fa-exclamation-triangle"></i>
              <p>Failed to load assessment video</p>
              <p className="error-details">
                Please check if the video file exists on the server.
              </p>
              <div className="error-actions">
                <button className="retry-btn" onClick={handleRetry}>
                  Retry
                </button>
                <button className="new-tab-btn" onClick={handleOpenInNewTab}>
                  Open in New Tab
                </button>
              </div>
              <div className="video-debug">
                <small>Attempted URL: {videoUrl}</small>
                <small>Assessment ID: {video._id}</small>
              </div>
            </div>
          )}
          
          {!hasError && videoUrl && (
            <video
              ref={videoRef}
              controls
              autoPlay
              preload="metadata"
              onLoadedData={handleVideoLoad}
              onError={handleVideoError}
              style={{ display: isLoading ? 'none' : 'block' }}
              crossOrigin="anonymous"
            >
              <source src={videoUrl} type="video/mp4" />
              <source src={videoUrl} type="video/webm" />
              Your browser does not support the video tag.
            </video>
          )}
        </div>
        
        <div className="video-player-info">
          <div className="video-meta">
            <span><i className="fas fa-calendar"></i> {new Date(video.createdAt || video.testDate).toLocaleDateString()}</span>
            {video.sport && <span><i className="fas fa-tag"></i> {video.sport}</span>}
            {video.assessmentType && <span><i className="fas fa-clipboard-check"></i> {video.assessmentType}</span>}
            <span><i className="fas fa-eye"></i> {video.views || 0} views</span>
            {hasAudio && <span><i className="fas fa-volume-up"></i> Has Audio</span>}
            {!hasAudio && <span><i className="fas fa-volume-mute"></i> No Audio</span>}
          </div>
          
          {video.description && (
            <p className="video-description">{video.description}</p>
          )}
          
          <div className="video-debug">
            <small>Assessment ID: {video._id}</small>
            <small>Video Source: {videoUrl}</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;