import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { examService, attemptService } from "../../services/api";
import StartExamConfirmationModal from "./StartExamConfirmationModal";
import "./ExamDetails.css";

const ExamDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const courseName = location.state?.courseName || "";
  const examId = location.state?.examId || "";
  const openTime = location.state?.openTime
    ? new Date(location.state.openTime)
    : null;
  const closeTime = location.state?.closeTime
    ? new Date(location.state.closeTime)
    : null;
  const duration = location.state?.duration || 120; // Default to 2 hours
  const totalQuestions = location.state?.totalQuestions || 0;
  const description = location.state?.description || "";
  const now = new Date();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [exam, setExam] = useState(null);
  const [inProgressAttempt, setInProgressAttempt] = useState(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  useEffect(() => {
    const fetchExamDetails = async () => {
      try {
        if (!examId) return;
        const examData = await examService.getExamById(examId);
        setExam(examData);
      } catch (error) {
        console.error('Error fetching exam details:', error);
        setError('Error loading exam details');
      }
    };

    fetchExamDetails();
  }, [examId]);

  useEffect(() => {
    const checkAttempt = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (!userInfo || !examId) return;

        const attempts = await attemptService.getAttemptsByUser(userInfo._id);
        
        // Find all attempts for this exam
        const examAttempts = attempts.filter(a => {
          const attemptExamId = typeof a.exam === 'object' ? a.exam._id : a.exam;
          return attemptExamId === examId;
        });

        if (examAttempts.length > 0) {
          // Find in-progress attempt
          const inProgress = examAttempts.find(a => a.status === 'in_progress');
          if (inProgress) {
            setInProgressAttempt(inProgress);
          }

          // Sort completed attempts by date, most recent first
          const completedAttempts = examAttempts.filter(a => a.status !== 'in_progress')
            .sort((a, b) => new Date(b.endTime) - new Date(a.endTime));
          
          if (completedAttempts.length > 0) {
            setAttempt(completedAttempts[0]);
          }
        }
      } catch (error) {
        console.error('Error checking attempt:', error);
      }
    };

    checkAttempt();
  }, [examId]);

  const handleStartExamClick = () => {
    setShowConfirmationModal(true);
  };

  const handleConfirmStart = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!examId) {
        throw new Error('No exam ID provided');
      }

      // Get user info
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo) {
        throw new Error('Please log in to start the exam');
      }

      // Check for existing attempts
      const attempts = await attemptService.getAttemptsByUser(userInfo._id);
      const existingCompletedAttempt = attempts.find(a => {
        const attemptExamId = typeof a.exam === 'object' ? a.exam._id : a.exam;
        return attemptExamId === examId && a.status !== 'in_progress';
      });

      if (existingCompletedAttempt) {
        setError('You have already completed this exam. Only one attempt is allowed.');
        setLoading(false);
        setShowConfirmationModal(false);
        return;
      }

      // Fetch exam details
      const exam = await examService.getExamById(examId);
      if (!exam) {
        throw new Error('Exam not found');
      }

      // Store exam questions in localStorage
      localStorage.setItem("questions", JSON.stringify(exam.questions));
      
      const examState = { 
        courseName,
        subjectCode: exam.subject.code,
        examId: exam._id,
        duration: exam.duration,
        totalQuestions: exam.questions.length,
        examTitle: exam.title,
        subjectName: exam.subject.name,
        startTime: exam.startTime,
        endTime: exam.endTime
      };
      
      // Navigate to exam page
      navigate("/exam", { state: examState, replace: true });
      
    } catch (error) {
      console.error('Error starting exam:', error);
      setError(error.message || 'Error starting exam. Please try again.');
    } finally {
      setLoading(false);
      setShowConfirmationModal(false);
    }
  };

  const handleResumeExam = () => {
    if (!inProgressAttempt) return;

    const examState = {
      courseName,
      subjectCode: exam?.subject?.code,
      examId: exam?._id,
      duration: exam?.duration,
      totalQuestions: exam?.questions?.length,
      examTitle: exam?.title,
      subjectName: exam?.subject?.name,
      startTime: exam?.startTime,
      endTime: exam?.endTime,
      attemptId: inProgressAttempt._id
    };

    navigate("/exam", { state: examState, replace: true });
  };

  const handleReviewExam = () => {
    if (!attempt) return;

    // Store exam questions in localStorage
    localStorage.setItem("questions", JSON.stringify(exam?.questions));
    
    // Convert answers array to object format for review page
    const answersObj = {};
    attempt.answers?.forEach(answer => {
      if (answer.questionIndex !== undefined) {
        answersObj[answer.questionIndex] = answer.selectedOption;
      }
    });
    localStorage.setItem("submittedAnswers", JSON.stringify(answersObj));

    // Calculate time taken
    if (attempt.startTime && attempt.endTime) {
      const start = new Date(attempt.startTime);
      const end = new Date(attempt.endTime);
      const diff = (end - start) / 1000; // Convert to seconds
      localStorage.setItem("timeTaken", diff.toString());
    }

    navigate("/review");
  };

  // Validate exam timing
  const examNotStarted = openTime && now < openTime;
  const examClosed = closeTime && now > closeTime;

  // Add validation for required data
  useEffect(() => {
    if (!examId) {
      setError('No exam ID provided');
    }
  }, [examId]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="exam-details-container">
      <div className="exam-info-card">
        <h2>Exam Information</h2>
        {error && (
          <div className="error-message" style={{ 
            color: 'red', 
            padding: '10px', 
            margin: '10px 0',
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            borderRadius: '4px'
          }}>
            {error}
          </div>
        )}
        <div className="exam-details">
          <div className="detail-item">
            <span className="detail-label">Subject Code: <span className="detail-value">BO CDA {exam?.subject?.code || 'Loading...'}</span></span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Exam Duration: <span className="detail-value">{duration} minutes</span></span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Total Questions: <span className="detail-value">{totalQuestions}</span></span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Exam Type: <span className="detail-value">Multiple Choice Questions</span></span>
          </div>
        </div>

        {inProgressAttempt ? (
          <div className="attempt-info-section">
            <h3>Exam in Progress</h3>
            <div className="attempt-details">
              <div className="detail-item">
                <span className="detail-label">Started On: <span className="detail-value">{formatDate(inProgressAttempt.startTime)}</span></span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status: <span className="detail-value in-progress">In Progress</span></span>
              </div>
            </div>
            <button 
              className="resume-exam-btn"
              onClick={handleResumeExam}
            >
              Resume Exam
            </button>
          </div>
        ) : attempt ? (
          <div className="attempt-info-section">
            <h3>Your Submission</h3>
            <div className="attempt-details">
              <div className="detail-item">
                <span className="detail-label">Submitted On: <span className="detail-value">{formatDate(attempt.endTime)}</span></span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Time Taken: <span className="detail-value">{attempt.timeTaken} minutes</span></span>
              </div>
              {closeTime && now > closeTime && (
                <>
                  <div className="detail-item">
                    <span className="detail-label">Status: <span className={`detail-value ${attempt.status.toLowerCase()}`}>{attempt.status}</span></span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Score: <span className="detail-value">{attempt.score}%</span></span>
                  </div>
                </>
              )}
              {closeTime && now <= closeTime && (
                <div className="detail-item">
                  <span className="detail-label">Result: <span className="detail-value in-progress">Will be available after {formatDate(closeTime)}</span></span>
                </div>
              )}
            </div>
            <button 
              className="review-btn"
              onClick={() => navigate(`/review`, { state: { attemptId: attempt._id } })}
            >
              Review Your Answers
            </button>
          </div>
        ) : (
          <>
            <div className="instructions">
              <h3>Read the Instructions carefully:</h3>
              <ul>
                <li>
                  <strong>Face Recognition:</strong> Verify your identity before
                  starting the exam.
                </li>
                <li>
                  <strong>Eye Movement & Camera Monitoring:</strong> Avoid looking
                  away from the screen or having others in the room.
                </li>
                <li>
                  <strong>Full-Screen Mode:</strong> Do not switch tabs or exit
                  full-screen mode during the exam.
                </li>
                <li>
                  <strong>AI Proctoring:</strong> Continuous monitoring for
                  suspicious behavior.
                </li>
                <li>
                  <strong>No External Devices:</strong> Do not use any external
                  devices or materials during the exam.
                </li>
                <li>
                  <strong>Audio/Video Recording:</strong> Your audio and video will
                  be recorded throughout the exam.
                </li>
                <li>
                  <strong>Quiet Environment:</strong> Ensure you are in a
                  distraction-free, quiet area.
                </li>
              </ul>
            </div>
            {examNotStarted ? (
              <div className="exam-not-started">
                <p>This exam will be available from {formatDate(openTime)}</p>
              </div>
            ) : examClosed ? (
              <div className="exam-closed">
                <p>This exam is no longer available</p>
              </div>
            ) : (
              <button
                className="start-exam-btn"
                onClick={handleStartExamClick}
                disabled={loading}
              >
                {loading ? "Starting..." : "Start Exam"}
              </button>
            )}
          </>
        )}
      </div>

      <StartExamConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        onConfirm={handleConfirmStart}
        loading={loading}
      />
    </div>
  );
};

export default ExamDetails;
