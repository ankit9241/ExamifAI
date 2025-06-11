import React from "react";
import "./Sidebar.css";
import Camera from "./Camera";

const Sidebar = () => {
  return (
    <div className="exam-sidebar">
      <div className="sidebar-content">
        <Camera />
        <div className="sidebar-info">
          <div className="info-section">
            <h3>Exam Guidelines</h3>
            <ul>
              <li>Keep your face visible in the camera</li>
              <li>Do not leave the exam window</li>
              <li>Do not use any external devices</li>
              <li>Answer all questions before submitting</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
