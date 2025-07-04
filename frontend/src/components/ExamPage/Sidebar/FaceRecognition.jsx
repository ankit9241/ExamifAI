/* global faceapi */
import React, { useEffect, useRef, useState } from 'react';
import './FaceRecognition.css';
import { userService } from '../../../services/api';

const FaceRecognition = ({ mode = 'recognition', onRegistered, onFaceStatusChange }) => {
  const videoRef = useRef();
  const [status, setStatus] = useState("Initializing...");
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [registeredDescriptor, setRegisteredDescriptor] = useState(null);

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

  // Registration: capture and store single descriptor (center)
  const handleRegister = async () => {
    const faceapi = window.faceapi;
    setStatus("Look straight at the camera...");
    for (let t = 2.5; t > 0; t -= 0.5) {
      setStatus(`Look straight at the camera... (Capturing in ${t.toFixed(1)}s...)`);
      await new Promise(res => setTimeout(res, 500));
    }
    if (!videoRef.current) return;
    const detection = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();
    if (detection && detection.descriptor) {
      try {
        await userService.saveFaceDescriptor(Array.from(detection.descriptor)); // Save as single array
        // Also save to localStorage for immediate recognition use
        localStorage.setItem(userFaceKey, JSON.stringify(Array.from(detection.descriptor)));
        setRegisteredDescriptor(Array.from(detection.descriptor));
        setStatus("Face registered successfully!");
        if (onRegistered) onRegistered();
      } catch (err) {
        setStatus("Failed to save face data. Please try again.");
      }
    } else {
      setStatus("Could not detect your face. Please try again.");
    }
  };

  // Recognition: compare live face to stored descriptor (center only)
  useEffect(() => {
    if (!modelsLoaded || mode !== 'recognition') return;
    const faceapi = window.faceapi;
    let interval;
    let storedDescriptor = registeredDescriptor;
    // Try to get from localStorage first
    if (!storedDescriptor) {
      const descStr = localStorage.getItem(userFaceKey);
      if (descStr) {
        storedDescriptor = JSON.parse(descStr);
        setRegisteredDescriptor(storedDescriptor);
      }
    }
    // If still not found, fetch from backend (database)
    async function fetchDescriptorFromBackend() {
      try {
        const profile = await userService.getProfile();
        if (Array.isArray(profile.faceDescriptor) && profile.faceDescriptor.length === 128) {
          localStorage.setItem(userFaceKey, JSON.stringify(profile.faceDescriptor));
          setRegisteredDescriptor(profile.faceDescriptor);
          storedDescriptor = profile.faceDescriptor;
        }
      } catch (err) {
        // Could not fetch from backend
      }
    }
    if (!storedDescriptor || !Array.isArray(storedDescriptor) || storedDescriptor.length !== 128) {
      fetchDescriptorFromBackend();
      return;
    }
    setStatus("Detecting face...");
    interval = setInterval(async () => {
      if (!videoRef.current) return;
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (!detection) {
        setStatus("No face detected");
        if (onFaceStatusChange) onFaceStatusChange('no-face');
        return;
      }
      // Compare to the stored descriptor
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

  // Capitalize first letter for premium look
  const displayStatus = status ? status.charAt(0).toUpperCase() + status.slice(1) : '';

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
      {mode === 'register' && (
        <button className="premium-register-btn-premium" onClick={handleRegister}>
          Register Face
        </button>
      )}
      <div className="premium-face-instructions-premium">
        Please ensure your face is clearly visible, well-lit, and centered in the frame.<br />
        <span className="highlight">Do not wear hats, sunglasses, or masks.</span>
      </div>
    </div>
  );
};

export default FaceRecognition; 