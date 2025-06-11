import React from "react";
import "./SubmitConfirmationModal.css";

const SubmitConfirmationModal = ({ open, onConfirm, onCancel, answeredCount, totalQuestions, isSubmitting }) => {
  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Confirm Submission</h2>
        <p>Are you sure you want to submit your exam? This action cannot be undone.</p>
        <p className="question-stats">
          You have answered {answeredCount} out of {totalQuestions} questions.
        </p>
        <div className="modal-actions">
          <button className="modal-btn cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="modal-btn confirm" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Exam'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitConfirmationModal;