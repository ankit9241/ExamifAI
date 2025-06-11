import React, { useEffect, useRef, useState } from "react";
import "./Camera.css";

const Camera = () => {
  const [cameraError, setCameraError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const streamData = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 320 },
            height: { ideal: 240 },
            facingMode: "user"
          }
        });
        setStream(streamData);

        if (videoRef.current) {
          videoRef.current.srcObject = streamData;
        }
      } catch (e) {
        setCameraError(true);
        setErrorMessage("Camera access required for exam monitoring");
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="exam-camera">
      {cameraError ? (
        <div className="camera-error">
          <div className="error-icon">⚠️</div>
          <div className="error-message">{errorMessage}</div>
        </div>
      ) : (
        <div className="camera-feed">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="camera-video"
          />
          <div className="camera-status">
            <span className="status-dot"></span>
            <span className="status-text">Camera Active</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Camera;
