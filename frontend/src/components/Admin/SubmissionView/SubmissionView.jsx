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

  const formatTimeTaken = (start, end) => {
    if (!start || !end) return 'N/A';
    const diffMs = new Date(end) - new Date(start);
    if (isNaN(diffMs) || diffMs < 0) return 'N/A';
    const totalSeconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes} min ${seconds} sec`;
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper to get student name/email and exam title robustly
  const getStudentName = (attempt) => attempt.studentName || attempt.user?.name || 'N/A';
  const getStudentEmail = (attempt) => attempt.studentEmail || attempt.user?.email || 'N/A';
  const getExamTitle = (attempt, exam) => attempt.examName || exam?.title || attempt.exam?.title || 'N/A';

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
        <div className="student-info premium-card">
          <h2>Student Information</h2>
          <div className="info-grid">
            <div className="info-item"><span className="label">Name:</span><span className="value">{getStudentName(attempt)}</span></div>
            <div className="info-item"><span className="label">Email:</span><span className="value">{getStudentEmail(attempt)}</span></div>
            <div className="info-item"><span className="label">Start Time:</span><span className="value">{formatDate(attempt.startTime)}</span></div>
            <div className="info-item"><span className="label">End Time:</span><span className="value">{formatDate(attempt.endTime)}</span></div>
            <div className="info-item"><span className="label">Time Taken:</span><span className="value">{formatTimeTaken(attempt.startTime, attempt.endTime)}</span></div>
            <div className="info-item"><span className="label">Total Violations:</span><span className="value">{attempt.violationCount !== undefined ? attempt.violationCount : 0}</span></div>
          </div>
        </div>
        <div className="exam-details-info premium-card">
          <h2>Exam Information</h2>
          <div className="info-grid">
            <div className="info-item"><span className="label">Exam Title:</span><span className="value">{getExamTitle(attempt, exam)}</span></div>
            <div className="info-item"><span className="label">Total Questions:</span><span className="value">{exam.questions.length}</span></div>
            <div className="info-item"><span className="label">Answered Questions:</span><span className="value">
              {(() => {
                let answeredCount = 0;
                exam.questions.forEach((question, index) => {
                  const answer = attempt.answers.find(a => (a.questionIndex !== undefined ? a.questionIndex : a.question) === index);
                  const selectedOption = answer?.selectedOption !== undefined ? answer.selectedOption : answer?.selectedAnswer;
                  const hasAnswered = selectedOption !== undefined && selectedOption !== null && selectedOption !== '' && selectedOption !== 'Not Answered' && selectedOption !== -1;
                  
                  if (hasAnswered) {
                    answeredCount++;
                  }
                });
                return answeredCount;
              })()}
            </span></div>
            <div className="info-item"><span className="label">Score:</span><span className="value">
              {(() => {
                let correctCount = 0;
                exam.questions.forEach((question, index) => {
                  const answer = attempt.answers.find(a => (a.questionIndex !== undefined ? a.questionIndex : a.question) === index);
                  const selectedOption = answer?.selectedOption !== undefined ? answer.selectedOption : answer?.selectedAnswer;
                  const hasAnswered = selectedOption !== undefined && selectedOption !== null && selectedOption !== '' && selectedOption !== 'Not Answered' && selectedOption !== -1;
                  
                  if (hasAnswered) {
                    const correctAnswerText = question.correctAnswer !== undefined && question.options && question.options[question.correctAnswer] !== undefined
                      ? question.options[question.correctAnswer]
                      : null;
                    
                    if (selectedOption === correctAnswerText) {
                      correctCount++;
                    }
                  }
                });
                return `${correctCount} / ${exam.questions.length}`;
              })()}
            </span></div>
            <div className="info-item"><span className="label">Status:</span><span className={`status-badge ${attempt.status.toLowerCase()}`}>
              {attempt.status}
            </span></div>
          </div>
        </div>
      </div>

      {/* Answers Section */}
      <div className="answers-section">
        <h2>Question-wise Answers</h2>
        <div className="answers-grid premium">
          {exam.questions.map((question, index) => {
            const answer = attempt.answers.find(a => (a.questionIndex !== undefined ? a.questionIndex : a.question) === index);
            // Support both selectedOption (number) and selectedAnswer (string or number)
            const selectedOption = answer?.selectedOption !== undefined ? answer.selectedOption : answer?.selectedAnswer;
            
            // Determine the student's selected option index
            let studentSelectedIndex = -1;
            if (selectedOption !== undefined && selectedOption !== null && selectedOption !== '' && selectedOption !== 'Not Answered') {
              if (typeof selectedOption === 'number') {
                // If selectedOption is already an index
                studentSelectedIndex = selectedOption;
              } else {
                // If selectedOption is the answer text, find the index
                studentSelectedIndex = question.options.findIndex(option => option === selectedOption);
              }
            }
            
            const hasAnswered = studentSelectedIndex !== -1;
            
            // Get the correct answer text
            const correctAnswerText = question.correctAnswer !== undefined && question.options && question.options[question.correctAnswer] !== undefined
              ? question.options[question.correctAnswer]
              : null;
            
            // Compare the actual answer text
            const isCorrect = hasAnswered && studentSelectedIndex === question.correctAnswer;
            
            return (
              <div key={index} className="answer-card">
                <div className="question-header">
                  <h3>Question {index + 1}</h3>
                  <span className={`answer-status ${hasAnswered ? (isCorrect ? 'correct' : 'incorrect') : 'not-answered'}`}>
                    {hasAnswered ? (isCorrect ? 'Correct' : 'Incorrect') : 'Not Answered'}
                  </span>
                </div>
                <p className="question-text">{question.questionText || question.question}</p>
                <div className="options-list">
                  {question.options.map((option, optIndex) => (
                    <div 
                      key={optIndex} 
                      className={`option ${optIndex === question.correctAnswer ? 'correct-answer' : ''} 
                        ${optIndex === studentSelectedIndex ? 'student-answer' : ''}`}
                    >
                      <span className="option-label">Option {optIndex + 1}:</span>
                      <span className="option-text">{option}</span>
                      {optIndex === question.correctAnswer && (
                        <span className="correct-indicator">✓</span>
                      )}
                      {optIndex === studentSelectedIndex && optIndex !== question.correctAnswer && (
                        <span className="student-indicator">✗</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="answer-details">
                  <div className="detail-item">
                    <span className="label">Student's Answer:</span>
                    <span className="value">
                      {hasAnswered ? question.options[studentSelectedIndex] : 'Not Answered'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Correct Answer:</span>
                    <span className="value">
                      {correctAnswerText || 'Not Available'}
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