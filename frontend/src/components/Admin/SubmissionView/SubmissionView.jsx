import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { attemptService, examService } from "../../../services/api";
import "./SubmissionView.css";

const SubmissionView = () => {
  const navigate = useNavigate();
  const { attemptId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [exam, setExam] = useState(null);

  useEffect(() => {
    const loadSubmission = async () => {
      try {
        if (!attemptId) {
          setError('No attempt ID provided');
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        // Fetch attempt details
        const attemptData = await attemptService.getAttemptById(attemptId);
        setAttempt(attemptData);

        // The exam data is already populated in the attempt response
        if (!attemptData.exam || !attemptData.exam._id) {
          throw new Error('Invalid exam data in attempt');
        }

        setExam(attemptData.exam);
        setLoading(false);
      } catch (error) {
        console.error('Error loading submission:', error);
        setError(error.message || 'Failed to load submission details');
        setLoading(false);
      }
    };

    loadSubmission();
  }, [attemptId]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading submission details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h2>Error Loading Submission</h2>
        <p>{error}</p>
        <button 
          className="retry-button"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!attempt || !exam) {
    return (
      <div className="error-container">
        <div className="error-icon">❌</div>
        <h2>Submission Not Found</h2>
        <p>The requested submission could not be found.</p>
        <button 
          className="back-button"
          onClick={() => navigate(-1)}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="submission-view">
      <div className="submission-header">
        <div className="header-left">
          <button 
            className="back-button" 
            onClick={() => navigate(-1)}
          >
            ← Back to Results
          </button>
          <h1>Student Submission</h1>
        </div>
        <button 
          className="print-button"
          onClick={handlePrint}
        >
          Print Submission
        </button>
      </div>

      {/* Student Info Section */}
      <div className="info-section">
        <div className="student-info">
          <h2>Student Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Name:</span>
              <span className="value">{attempt.studentName}</span>
            </div>
            <div className="info-item">
              <span className="label">Email:</span>
              <span className="value">{attempt.studentEmail}</span>
            </div>
            <div className="info-item">
              <span className="label">Start Time:</span>
              <span className="value">{formatDate(attempt.startTime)}</span>
            </div>
            <div className="info-item">
              <span className="label">End Time:</span>
              <span className="value">{formatDate(attempt.endTime)}</span>
            </div>
            <div className="info-item">
              <span className="label">Time Taken:</span>
              <span className="value">{attempt.timeTaken} minutes</span>
            </div>
          </div>
        </div>

        {/* Recreated Exam Information section with new class name */}
        <div className="exam-details-info">
          <h2>Exam Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Exam Title:</span>
              <span className="value">{attempt.examName}</span>
            </div>
            <div className="info-item">
              <span className="label">Total Questions:</span>
              <span className="value">{exam.questions.length}</span>
            </div>
            <div className="info-item">
              <span className="label">Answered Questions:</span>
              <span className="value">{attempt.answers.length}</span>
            </div>
            <div className="info-item">
              <span className="label">Score:</span>
              <span className="value">{attempt.score}%</span>
            </div>
            <div className="info-item">
              <span className="label">Status:</span>
              <span className={`status-badge ${attempt.status.toLowerCase()}`}>
                {attempt.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Answers Section */}
      <div className="answers-section">
        <h2>Question-wise Answers</h2>
        <div className="answers-grid">
          {exam.questions.map((question, index) => {
            const answer = attempt.answers.find(a => a.questionIndex === index);
            const isCorrect = answer?.selectedOption === question.correctAnswer;
            
            return (
              <div key={index} className="answer-card">
                <div className="question-header">
                  <h3>Question {index + 1}</h3>
                  <span className={`answer-status ${isCorrect ? 'correct' : 'incorrect'}`}>
                    {isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                </div>
                <p className="question-text">{question.question}</p>
                <div className="options-list">
                  {question.options.map((option, optIndex) => (
                    <div 
                      key={optIndex} 
                      className={`option ${optIndex === question.correctAnswer ? 'correct-answer' : ''} 
                        ${optIndex === answer?.selectedOption ? 'student-answer' : ''}`}
                    >
                      <span className="option-label">Option {optIndex + 1}:</span>
                      <span className="option-text">{option}</span>
                      {optIndex === question.correctAnswer && (
                        <span className="correct-indicator">✓</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="answer-details">
                  <div className="detail-item">
                    <span className="label">Student's Answer:</span>
                    <span className="value">
                      {answer?.selectedOption !== undefined 
                        ? question.options[answer.selectedOption] 
                        : 'Not Answered'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Correct Answer:</span>
                    <span className="value">
                      {question.correctAnswer !== undefined && question.options && question.options[question.correctAnswer] !== undefined
                        ? question.options[question.correctAnswer]
                        : 'Not Available'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SubmissionView; 