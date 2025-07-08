/* global faceapi */
import React, { useEffect, useRef, useState } from 'react';
import './FaceRecognition.css';
import { userService } from '../../../services/api';

const FaceRecognition = ({ mode = 'recognition', onRegistered, onFaceStatusChange }) => {
  const videoRef = useRef();
  const [status, setStatus] = useState("Initializing...");
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [registeredDescriptor, setRegisteredDescriptor] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState("");

  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const userFaceKey = userInfo && userInfo._id ? `registeredFaceDescriptor_${userInfo._id}` : 'registeredFaceDescriptor';

  // Load models
  useEffect(() => {
    const waitForFaceApi = (callback) => {
      const check = () => {
        if (window.faceapi) {
          callback(window.faceapi);
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    };
    waitForFaceApi((faceapi) => {
      setStatus("Loading face detection models...");
      Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models')
      ]).then(() => {
        setModelsLoaded(true);
        setStatus("Models loaded. Starting camera...");
        startVideo();
      }).catch((err) => {
        console.error("Model loading failed:", err);
        setStatus("Model loading failed.");
      });
    });
  }, []);

  // Start camera
  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error("Camera access error:", err);
        setStatus("Camera access denied.");
      });
  };

  // Registration: capture and store averaged descriptor from 3 captures
  const handleRegister = async () => {
    if (isRegistering) return;
    setIsRegistering(true);
    setRegisterError("");
    const faceapi = window.faceapi;
    setStatus("Look straight at the camera...");
    let found = false;
    for (let t = 0; t < 4; t++) { // Try for up to 4 seconds
      await new Promise(res => setTimeout(res, 1000));
      if (!videoRef.current) { setIsRegistering(false); return; }
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (detection && detection.descriptor && detection.detection && detection.detection.score >= 0.5) {
        try {
          await userService.saveFaceDescriptor(Array.from(detection.descriptor));
          localStorage.setItem(userFaceKey, JSON.stringify(Array.from(detection.descriptor)));
          setRegisteredDescriptor(Array.from(detection.descriptor));
          setStatus("Face registered successfully!");
          if (onRegistered) onRegistered();
          setIsRegistering(false);
          found = true;
          break;
        } catch (err) {
          setStatus("Failed to save face data. Please try again.");
          setRegisterError("Failed to save face data. Please try again.");
          setIsRegistering(false);
          return;
        }
      }
    }
    if (!found) {
      setStatus("Could not detect your face. Please try again.");
      setRegisterError("Could not detect your face. Make sure your face is well-lit, centered, and unobstructed.");
      setIsRegistering(false);
    }
  };

  // Recognition: detect multiple faces and handle accordingly
  useEffect(() => {
    if (!modelsLoaded || mode !== 'recognition') return;
    const faceapi = window.faceapi;
    let interval;
    let storedDescriptor = registeredDescriptor;
    if (!storedDescriptor) {
      const descStr = localStorage.getItem(userFaceKey);
      if (descStr) {
        storedDescriptor = JSON.parse(descStr);
        setRegisteredDescriptor(storedDescriptor);
      }
    }
    async function fetchDescriptorFromBackend() {
      try {
        const profile = await userService.getProfile();
        if (Array.isArray(profile.faceDescriptor) && profile.faceDescriptor.length === 128) {
          localStorage.setItem(userFaceKey, JSON.stringify(profile.faceDescriptor));
          setRegisteredDescriptor(profile.faceDescriptor);
          storedDescriptor = profile.faceDescriptor;
        }
      } catch (err) {}
    }
    if (!storedDescriptor || !Array.isArray(storedDescriptor) || storedDescriptor.length !== 128) {
      fetchDescriptorFromBackend();
      return;
    }
    setStatus("Detecting face...");
    interval = setInterval(async () => {
      if (!videoRef.current) return;
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();
      if (!detections || detections.length === 0) {
        setStatus("No face detected");
        if (onFaceStatusChange) onFaceStatusChange('no-face');
        return;
      }
      if (detections.length > 1) {
        setStatus("Multiple faces detected!");
        if (onFaceStatusChange) onFaceStatusChange('multiple-faces');
        return;
      }
      // Only one face detected, check confidence
      const detection = detections[0];
      if (!detection.detection || detection.detection.score < 0.5) {
        setStatus("No face detected");
        if (onFaceStatusChange) onFaceStatusChange('no-face');
        return;
      }
      const distance = faceapi.euclideanDistance(detection.descriptor, new Float32Array(storedDescriptor));
      if (distance < 0.7) {
        setStatus("Face recognized");
        if (onFaceStatusChange) onFaceStatusChange('ok');
      } else {
        setStatus("Wrong face detected");
        if (onFaceStatusChange) onFaceStatusChange('wrong-face');
      }
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [modelsLoaded, mode, registeredDescriptor]);

  // Determine status color class
  let statusClass = 'face-status-loading';
  if (status.toLowerCase().includes('recognized')) statusClass = 'face-status-ok';
  else if (status.toLowerCase().includes('no face')) statusClass = 'face-status-no-face';
  else if (status.toLowerCase().includes('wrong')) statusClass = 'face-status-wrong';
  else if (status.toLowerCase().includes('multiple')) statusClass = 'face-status-multiple';

  // Capitalize first letter for premium look
  const displayStatus = status ? status.charAt(0).toUpperCase() + status.slice(1) : '';

  // Show a prominent warning if multiple faces detected
  const showMultipleWarning = status.toLowerCase().includes('multiple');

  return (
    <div className="premium-face-card-premium">
      <video
        ref={videoRef}
        autoPlay
        muted
        className="premium-face-video-premium"
      />
      {displayStatus && (
        <div className={`premium-face-status-premium ${statusClass}`}>{displayStatus}</div>
      )}
      {showMultipleWarning && (
        <div style={{
          background: '#ffebee',
          color: '#c62828',
          border: '2px solid #c62828',
          borderRadius: '10px',
          padding: '1rem',
          margin: '1rem 0',
          fontWeight: 700,
          fontSize: '1.1rem',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(198,40,40,0.08)'
        }}>
          Multiple faces detected! Only one person should be in front of the camera.
        </div>
      )}
      {mode === 'register' && (
        <button className="premium-register-btn-premium" onClick={handleRegister} disabled={isRegistering}>
          {isRegistering ? 'Registering...' : 'Register Face'}
        </button>
      )}
      {registerError && (
        <div style={{color:'#c62828',marginTop:'0.7rem',fontWeight:600}}>{registerError}</div>
      )}
      <div className="premium-face-instructions-premium">
        Please ensure your face is clearly visible, well-lit, and centered in the frame.<br />
        <span className="highlight">Do not wear hats, sunglasses, or masks.</span>
      </div>
    </div>
  );
};

export default FaceRecognition; 