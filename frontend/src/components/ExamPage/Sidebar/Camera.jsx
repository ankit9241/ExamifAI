import React, { useState, useEffect } from "react";
import "./Camera.css";
import FaceRecognition from "./FaceRecognition";

const Camera = ({ onFaceStatusChange, mode }) => {
  // mode: 'register' or 'recognition'
  // onFaceStatusChange: (status) => void
  const [faceStatus, setFaceStatus] = useState('ok'); // 'ok', 'no-face', 'wrong-face'
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (onFaceStatusChange) onFaceStatusChange(faceStatus);
  }, [faceStatus, onFaceStatusChange]);

  if (mode === 'register' && !registered) {
    return (
      <div className="exam-camera">
        <FaceRecognition mode="register" onRegistered={() => setRegistered(true)} />
      </div>
    );
  }

  // After registration, or in recognition mode
  return (
    <div className="exam-camera">
      <FaceRecognition mode="recognition" onFaceStatusChange={setFaceStatus} />
      {/* Optionally, show a warning overlay here if faceStatus is not 'ok' */}
    </div>
  );
};

export default Camera;
