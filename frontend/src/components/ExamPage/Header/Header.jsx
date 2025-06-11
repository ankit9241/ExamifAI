// Header.jsx
import React from "react";
import "./Header.css";

const Header = ({ timeLeft, subjectCode }) => {
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="header">
      <div className="subject-code">
        <span className="code-value"><b>Subject:  BO CDA {subjectCode || "N/A"}</b></span>
      </div>
      <div className="timer">Time Left - {formatTime(timeLeft)}</div>
    </div>
  );
};

export default Header;
