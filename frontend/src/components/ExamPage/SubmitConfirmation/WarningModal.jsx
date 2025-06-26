import React from "react";
import "./SubmitConfirmationModal.css";

const WarningModal = ({ open, onClose, title, message, buttonText }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 style={{ color: '#c0392b' }}>{title}</h2>
        <p style={{ color: '#222', fontWeight: 500 }}>{message}</p>
        <div className="modal-actions">
          <button className="modal-btn confirm" style={{ background: '#c0392b', color: '#fff' }} onClick={onClose}>
            {buttonText || 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WarningModal; 