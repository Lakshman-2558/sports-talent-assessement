import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import './GestureRecorder.css';

const GestureRecorder = ({ sport, onRecordingComplete, onViolation }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const poseRef = useRef(null);
  const cameraRef = useRef(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [violations, setViolations] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [currentRules, setCurrentRules] = useState([]);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [compositeStream, setCompositeStream] = useState(null);

  // Sport-specific rules configuration
  const sportRules = useMemo(() => ({
    athletics: {
      sprint: [
        { name: 'proper_stance', check: checkSprintStance },
        { name: 'arm_swing', check: checkArmSwing },
        { name: 'knee_lift', check: checkKneeLift }
      ],
      long_jump: [
        { name: 'approach_angle', check: checkApproachAngle },
        { name: 'takeoff_position', check: checkTakeoffPosition }
      ]
    },
    football: [
      { name: 'ball_control', check: checkBallControl },
      { name: 'body_position', check: checkBodyPosition }
    ],
    basketball: [
      { name: 'shooting_form', check: checkShootingForm },
      { name: 'dribbling_posture', check: checkDribblingPosture }
    ]
  }), []);

  const stopRecording = useCallback((dueToViolations = false) => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsAnalyzing(false);
      
      // Stop composite stream if exists
      if (compositeStream) {
        compositeStream.getTracks().forEach(track => track.stop());
        setCompositeStream(null);
      }
      
      // Stop camera stream
      if (cameraRef.current) {
        const stream = videoRef.current.srcObject;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }
    }
  }, [isRecording, compositeStream]);

  const handleViolation = useCallback((ruleName) => {
    const newViolations = violations + 1;
    setViolations(newViolations);
    
    // Play beep sound
    playBeepSound();
    
    // Notify parent component
    if (onViolation) {
      onViolation(ruleName, newViolations);
    }

    // Stop recording after 3 violations
    if (newViolations >= 3) {
      stopRecording(true); // true indicates stopped due to violations
    }
  }, [violations, onViolation, stopRecording]);

  const checkGestureRules = useCallback((landmarks) => {
    currentRules.forEach(rule => {
      const isViolation = rule.check(landmarks);
      if (isViolation) {
        handleViolation(rule.name);
      }
    });
  }, [currentRules, handleViolation]);

  const onPoseResults = useCallback((results) => {
    if (!canvasRef.current || !videoRef.current || !results.poseLandmarks) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const video = videoRef.current;
    
    // Set canvas size to match video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    // Draw the video frame first
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Draw pose landmarks on top
    drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
      color: '#00FF00',
      lineWidth: 3
    });
    drawLandmarks(ctx, results.poseLandmarks, {
      color: '#FF0000',
      lineWidth: 2,
      radius: 4
    });

    // Add violation indicators if any
    if (violations > 0) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.fillRect(0, 0, canvas.width, 30);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px Arial';
      ctx.fillText(`Violations: ${violations}/3`, 10, 20);
    }

    // Add attempt counter
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(canvas.width - 120, 0, 120, 30);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px Arial';
    ctx.fillText(`Attempt: ${attempts}`, canvas.width - 110, 20);

    // Check rules if recording
    if (isRecording && currentRules.length > 0) {
      checkGestureRules(results.poseLandmarks);
    }
  }, [isRecording, currentRules, checkGestureRules, violations, attempts]);

  const initializeMediaPipeCallback = useCallback(async () => {
    try {
      // Initialize basic camera first
      if (videoRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false
        });
        videoRef.current.srcObject = stream;
      }

      // Try to initialize MediaPipe with fallback
      try {
        const pose = new Pose({
          locateFile: (file) => {
            // Use local files if available, fallback to CDN
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
          }
        });

        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('MediaPipe initialization timeout')), 10000);
          
          pose.setOptions({
            modelComplexity: 0, // Use lighter model
            smoothLandmarks: true,
            enableSegmentation: false,
            smoothSegmentation: false,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.5
          });

          pose.onResults((results) => {
            clearTimeout(timeout);
            onPoseResults(results);
            resolve();
          });

          poseRef.current = pose;

          if (videoRef.current) {
            const camera = new Camera(videoRef.current, {
              onFrame: async () => {
                if (poseRef.current && isAnalyzing && videoRef.current) {
                  try {
                    await poseRef.current.send({ image: videoRef.current });
                  } catch (error) {
                    console.warn('MediaPipe processing error:', error);
                  }
                }
              },
              width: 640,
              height: 480
            });
            cameraRef.current = camera;
            camera.start();
          }
        });
      } catch (poseError) {
        console.warn('MediaPipe pose detection unavailable, continuing with basic video recording:', poseError);
        // Continue with basic video recording without pose detection
      }
    } catch (error) {
      console.error('Camera initialization error:', error);
      alert('Camera access is required for gesture recording. Please allow camera permissions and try again.');
    }
  }, [isAnalyzing, onPoseResults]);

  const cleanup = useCallback(() => {
    try {
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
    } catch (error) {
      console.warn('Error stopping camera:', error);
    }
    
    try {
      if (poseRef.current) {
        poseRef.current.close();
        poseRef.current = null;
      }
    } catch (error) {
      console.warn('Error closing pose instance:', error);
    }
  }, []);

  useEffect(() => {
    initializeMediaPipeCallback();
    return cleanup;
  }, [initializeMediaPipeCallback, cleanup]);

  useEffect(() => {
    // Set rules based on sport
    let rules = [];
    if (sportRules[sport]) {
      if (Array.isArray(sportRules[sport])) {
        // Direct array (football, basketball)
        rules = sportRules[sport];
      } else if (sportRules[sport].sprint) {
        // Object with categories (athletics)
        rules = sportRules[sport].sprint;
      }
    }
    // Fallback to athletics sprint if no rules found
    if (rules.length === 0) {
      rules = sportRules.athletics.sprint;
    }
    setCurrentRules(rules || []);
  }, [sport, sportRules]);


  const playBeepSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800; // Beep frequency
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const startRecording = async () => {
    try {
      // Get canvas stream instead of camera stream to record with overlays
      const canvas = canvasRef.current;
      if (!canvas) return;

      const canvasStream = canvas.captureStream(30); // 30 FPS
      
      // Get audio stream separately
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });

      // Combine canvas video stream with audio
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioStream.getAudioTracks()
      ]);

      setCompositeStream(combinedStream);

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      mediaRecorderRef.current = mediaRecorder;
      setRecordedChunks([]);
      setViolations(0);
      setAttempts(prev => prev + 1);
      setIsRecording(true);
      setIsAnalyzing(true);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks(prev => [...prev, event.data]);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        if (onRecordingComplete) {
          onRecordingComplete(blob, attempts, violations);
        }
        
        // Clean up streams
        combinedStream.getTracks().forEach(track => track.stop());
        audioStream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };


  return (
    <div className="gesture-recorder">
      <div className="video-container">
        <video
          ref={videoRef}
          className="video-feed"
          autoPlay
          muted
          playsInline
        />
        <canvas
          ref={canvasRef}
          className="pose-overlay"
          width={640}
          height={480}
        />
      </div>
      
      <div className="recording-controls">
        <div className="stats">
          <span className="attempts">Attempts: {attempts}</span>
          <span className="violations">Violations: {violations}/3</span>
        </div>
        
        <div className="buttons">
          {!isRecording ? (
            <button 
              className="start-btn"
              onClick={startRecording}
              disabled={violations >= 3}
            >
              Start Recording
            </button>
          ) : (
            <button 
              className="stop-btn"
              onClick={() => stopRecording(false)}
            >
              Stop Recording
            </button>
          )}
        </div>
        
        {violations >= 3 && (
          <div className="violation-warning">
            Maximum violations reached. Recording stopped.
          </div>
        )}
      </div>
      
      <div className="rules-display">
        <h4>Active Rules for {sport}:</h4>
        <ul>
          {Array.isArray(currentRules) && currentRules.map((rule, index) => (
            <li key={index}>{rule.name.replace('_', ' ')}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// Rule checking functions for different sports
function checkSprintStance(landmarks) {
  // Check if athlete maintains proper sprint stance
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  
  // Calculate torso angle - should be slightly forward
  const shoulderMidpoint = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2
  };
  const hipMidpoint = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2
  };
  
  const torsoAngle = Math.atan2(
    shoulderMidpoint.y - hipMidpoint.y,
    shoulderMidpoint.x - hipMidpoint.x
  ) * 180 / Math.PI;
  
  // Violation if torso is too upright (> 10 degrees) or too forward (< -30 degrees)
  return torsoAngle > 10 || torsoAngle < -30;
}

function checkArmSwing(landmarks) {
  // Check proper arm swing mechanics
  const leftWrist = landmarks[15];
  const leftElbow = landmarks[13];
  
  // Calculate arm angles
  const leftArmAngle = Math.atan2(
    leftWrist.y - leftElbow.y,
    leftWrist.x - leftElbow.x
  ) * 180 / Math.PI;
  
  // Violation if arms are not swinging properly (too wide or too narrow)
  return Math.abs(leftArmAngle) > 45;
}

function checkKneeLift(landmarks) {
  // Check knee lift height
  const leftKnee = landmarks[25];
  const rightKnee = landmarks[26];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  
  const leftKneeHeight = leftHip.y - leftKnee.y;
  const rightKneeHeight = rightHip.y - rightKnee.y;
  
  // Violation if knee lift is insufficient
  return Math.max(leftKneeHeight, rightKneeHeight) < 0.1;
}

function checkApproachAngle(landmarks) {
  // Placeholder for long jump approach angle check
  return false;
}

function checkTakeoffPosition(landmarks) {
  // Placeholder for long jump takeoff position check
  return false;
}

function checkBallControl(landmarks) {
  // Placeholder for football ball control check
  return false;
}

function checkBodyPosition(landmarks) {
  // Placeholder for football body position check
  return false;
}

function checkShootingForm(landmarks) {
  // Placeholder for basketball shooting form check
  return false;
}

function checkDribblingPosture(landmarks) {
  // Placeholder for basketball dribbling posture check
  return false;
}

export default GestureRecorder;
