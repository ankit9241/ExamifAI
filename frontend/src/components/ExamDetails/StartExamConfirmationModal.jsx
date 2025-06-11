import React from 'react';
import './StartExamConfirmationModal.css';

const StartExamConfirmationModal = ({ isOpen, onClose, onConfirm, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Confirm Exam Start</h2>
        <div className="modal-body">
          <p>Are you sure you want to start the exam?</p>
          <div className="warning-section">
            <h4>Important Reminders:</h4>
            <ul>
              <li>You must complete the exam in one sitting</li>
              <li>Timer will continue running even if you leave the page</li>
              <li>Exam will auto-submit when time is up</li>
              <li>Ensure you have a stable internet connection</li>
              <li>Make sure your camera and microphone are working</li>
            </ul>
          </div>
        </div>
        <div className="modal-footer">
          <button 
            className="cancel-btn" 
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            className="confirm-btn" 
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Starting..." : "Start Exam"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartExamConfirmationModal; 