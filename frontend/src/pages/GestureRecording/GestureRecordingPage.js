import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import GestureRecorder from '../../components/GestureRecorder/GestureRecorder';
import './GestureRecordingPage.css';

const GestureRecordingPage = () => {
  const navigate = useNavigate();
  const [selectedSport, setSelectedSport] = useState('athletics');
  const [selectedCategory, setSelectedCategory] = useState('sprint');
  const [analysisId, setAnalysisId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState(null);

  const sportCategories = {
    athletics: ['sprint', 'long_jump', 'high_jump', 'shot_put'],
    football: ['dribbling', 'passing', 'shooting', 'general'],
    basketball: ['shooting', 'dribbling', 'passing', 'general'],
    swimming: ['freestyle', 'backstroke', 'breaststroke', 'butterfly'],
    cricket: ['batting', 'bowling', 'fielding', 'general'],
    badminton: ['serve', 'smash', 'drop_shot', 'general']
  };

  const handleStartRecording = async () => {
    try {
      const response = await axios.post('/gesture-analysis/start', {
        sport: selectedSport,
        category: selectedCategory
      });

      if (response.data.success) {
        setAnalysisId(response.data.analysisId);
      }
    } catch (error) {
      console.error('Error starting analysis:', error);
      alert('Failed to start gesture analysis. Please try again.');
    }
  };

  const handleViolation = async (ruleName, violationCount) => {
    if (!analysisId) return;

    try {
      await axios.post(`/gesture-analysis/${analysisId}/violation`, {
        attemptNumber: 1,
        timestamp: Date.now(),
        ruleName,
        ruleDescription: `Violation in ${ruleName.replace('_', ' ')}`,
        severity: 'major'
      });
    } catch (error) {
      console.error('Error recording violation:', error);
    }
  };

  const handleRecordingComplete = async (videoBlob, attempts, violations) => {
    if (!analysisId) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // First, complete the gesture analysis
      const analysisResponse = await axios.put(`/gesture-analysis/${analysisId}/complete`, {
        duration: 30, // Placeholder duration
        totalAttempts: attempts,
        recordingMetadata: {
          fps: 30,
          resolution: { width: 640, height: 480 },
          recordingQuality: 'medium'
        }
      });

      if (analysisResponse.data.success) {
        setAnalysisResults(analysisResponse.data.results);
      }

      // Then upload the video
      const formData = new FormData();
      formData.append('video', videoBlob, 'gesture-recording.webm');
      formData.append('title', `${selectedSport} - ${selectedCategory} Practice`);
      formData.append('description', 'Gesture analysis practice session with AI feedback');
      formData.append('sport', selectedSport);
      formData.append('category', 'training');
      formData.append('videoType', 'gesture_practice');
      formData.append('visibility', 'private');
      formData.append('latitude', '0');
      formData.append('longitude', '0');
      formData.append('city', 'Practice Session');
      formData.append('state', 'Virtual');
      formData.append('analysisId', analysisId);

      const uploadResponse = await axios.post('/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      if (uploadResponse.data.success) {
        // Update analysis with video ID
        await axios.put(`/gesture-analysis/${analysisId}/complete`, {
          videoId: uploadResponse.data.video._id,
          duration: 30,
          totalAttempts: attempts
        });

        alert('Video uploaded and analysis completed successfully!');
        navigate('/athlete-dashboard');
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Failed to upload video. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="gesture-recording-page">
      <div className="header">
        <button className="back-btn" onClick={() => navigate('/athlete-dashboard')}>
          ← Back to Dashboard
        </button>
        <h1>Gesture Analysis Recording</h1>
      </div>

      <div className="recording-container">
        {!analysisId ? (
          <div className="setup-panel">
            <h2>Setup Your Recording Session</h2>
            
            <div className="form-group">
              <label htmlFor="sport">Select Sport:</label>
              <select
                id="sport"
                value={selectedSport}
                onChange={(e) => {
                  setSelectedSport(e.target.value);
                  setSelectedCategory(sportCategories[e.target.value][0]);
                }}
              >
                {Object.keys(sportCategories).map(sport => (
                  <option key={sport} value={sport}>
                    {sport.charAt(0).toUpperCase() + sport.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="category">Select Category:</label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {sportCategories[selectedSport].map(category => (
                  <option key={category} value={category}>
                    {category.replace('_', ' ').charAt(0).toUpperCase() + category.replace('_', ' ').slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="info-panel">
              <h3>Recording Guidelines:</h3>
              <ul>
                <li>Ensure good lighting and clear view of your full body</li>
                <li>Position yourself 6-8 feet from the camera</li>
                <li>Follow proper form for the selected sport/category</li>
                <li>Recording will stop automatically after 3 form violations</li>
                <li>You can manually stop recording at any time</li>
              </ul>
            </div>

            <button className="start-session-btn" onClick={handleStartRecording}>
              Start Recording Session
            </button>
          </div>
        ) : (
          <div className="recording-panel">
            {isUploading ? (
              <div className="upload-panel">
                <h2>Uploading Video...</h2>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p>{uploadProgress}% Complete</p>
              </div>
            ) : analysisResults ? (
              <div className="results-panel">
                <h2>Analysis Results</h2>
                <div className="scores">
                  <div className="score-item">
                    <span className="label">Overall Score:</span>
                    <span className="value">{analysisResults.overallScore.toFixed(1)}%</span>
                  </div>
                  <div className="score-item">
                    <span className="label">Form Accuracy:</span>
                    <span className="value">{analysisResults.formAccuracy.toFixed(1)}%</span>
                  </div>
                  <div className="score-item">
                    <span className="label">Consistency:</span>
                    <span className="value">{analysisResults.consistencyScore.toFixed(1)}%</span>
                  </div>
                  <div className="score-item">
                    <span className="label">Total Violations:</span>
                    <span className="value">{analysisResults.totalViolations}</span>
                  </div>
                </div>

                {analysisResults.improvementAreas && analysisResults.improvementAreas.length > 0 && (
                  <div className="improvement-areas">
                    <h3>Areas for Improvement:</h3>
                    {analysisResults.improvementAreas.map((area, index) => (
                      <div key={index} className={`improvement-item ${area.priority}`}>
                        <strong>{area.area}:</strong> {area.suggestion}
                      </div>
                    ))}
                  </div>
                )}

                <button 
                  className="new-session-btn"
                  onClick={() => {
                    setAnalysisId(null);
                    setAnalysisResults(null);
                  }}
                >
                  Start New Session
                </button>
              </div>
            ) : (
              <GestureRecorder
                sport={selectedSport}
                onRecordingComplete={handleRecordingComplete}
                onViolation={handleViolation}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GestureRecordingPage;
