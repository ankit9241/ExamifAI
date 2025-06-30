/* global faceapi */
import React, { useEffect, useRef, useState } from 'react';
import './FaceRecognition.css';

const FaceRecognition = ({ mode = 'recognition', onRegistered, onFaceStatusChange }) => {
  const videoRef = useRef();
  const [status, setStatus] = useState("Initializing...");
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [registeredDescriptor, setRegisteredDescriptor] = useState(null);

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

  // Registration: capture and store descriptor
  const handleRegister = async () => {
    const faceapi = window.faceapi;
    setStatus("Please look at the camera...");
    if (!videoRef.current) return;
    const detection = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();
    if (detection && detection.descriptor) {
      localStorage.setItem('registeredFaceDescriptor', JSON.stringify(Array.from(detection.descriptor)));
      setRegisteredDescriptor(detection.descriptor);
      setStatus("Face registered successfully!");
      if (onRegistered) onRegistered();
    } else {
      setStatus("No face detected. Please try again.");
    }
  };

  // Recognition: compare live face to registered descriptor
  useEffect(() => {
    if (!modelsLoaded || mode !== 'recognition') return;
    const faceapi = window.faceapi;
    let interval;
    let storedDescriptor = registeredDescriptor;
    if (!storedDescriptor) {
      const descStr = localStorage.getItem('registeredFaceDescriptor');
      if (descStr) {
        storedDescriptor = new Float32Array(JSON.parse(descStr));
        setRegisteredDescriptor(storedDescriptor);
      }
    }
    if (!storedDescriptor) return;
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
      const distance = faceapi.euclideanDistance(detection.descriptor, storedDescriptor);
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
    <div className="premium-face-card">
      <video
        ref={videoRef}
        autoPlay
        muted
        className="premium-face-video"
      />
      {displayStatus && (
        <div className={`premium-face-status ${statusClass}`}>{displayStatus}</div>
      )}
      {mode === 'register' && (
        <button className="premium-register-btn" onClick={handleRegister}>
          Register Face
        </button>
      )}
    </div>
  );
};

export default FaceRecognition; 