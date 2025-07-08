import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { examService, attemptService, userService } from "../../services/api";
import StartExamConfirmationModal from "./StartExamConfirmationModal";
import "./ExamDetails.css";
import FaceRecognition from '../ExamPage/Sidebar/FaceRecognition';

const ExamDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const courseName = location.state?.courseName || "";
  const examId = location.state?.examId || "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [exam, setExam] = useState(null);
  const [inProgressAttempt, setInProgressAttempt] = useState(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [allAttempts, setAllAttempts] = useState([]);
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const userFaceKey = userInfo && userInfo._id ? `registeredFaceDescriptor_${userInfo._id}` : 'registeredFaceDescriptor';
  const [faceRegistered, setFaceRegistered] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('');

  // Move openTime and closeTime here, after exam is initialized
  const openTime = location.state?.openTime
    ? new Date(location.state.openTime)
    : (exam?.startDate ? new Date(exam.startDate) : null);
  const closeTime = location.state?.closeTime
    ? new Date(location.state.closeTime)
    : (exam?.endDate ? new Date(exam.endDate) : null);
  const duration = location.state?.duration || 120; // Default to 2 hours
  const totalQuestions = location.state?.totalQuestions || 0;
  const description = location.state?.description || "";
  const now = new Date();

  useEffect(() => {
    const fetchExamDetails = async () => {
      try {
        if (!examId) return;
        const examData = await examService.getExamById(examId);
        setExam(examData);
        // Fetch all attempts for this exam by the current user
        if (userInfo && userInfo._id) {
          const attempts = await attemptService.getAttemptsByExam(examId);
          // Filter attempts for this user
          const userAttempts = attempts.filter(a => a.user && a.user._id === userInfo._id);
          setAllAttempts(userAttempts);
          // Set inProgressAttempt and latest completed attempt
          const inProgress = userAttempts.find(a => a.status === 'in_progress');
          setInProgressAttempt(inProgress || null);
          // Find the latest completed attempt
          const completedAttempts = userAttempts.filter(a => a.status === 'completed');
          if (completedAttempts.length > 0) {
            // Sort by endTime descending
            completedAttempts.sort((a, b) => new Date(b.endTime) - new Date(a.endTime));
            setAttempt(completedAttempts[0]);
          } else {
            setAttempt(null);
          }
        }
      } catch (error) {
        console.error('Error fetching exam details:', error);
        setError('Error loading exam details');
      }
    };

    fetchExamDetails();
  }, [examId]);

  // Check camera/mic permissions on mount
  useEffect(() => {
    // Check if permissions already granted
    navigator.permissions?.query({ name: 'camera' }).then((result) => {
      if (result.state === 'granted') setPermissionsGranted(true);
    }).catch(() => {});
    // Microphone check (optional, not all browsers support)
    navigator.permissions?.query({ name: 'microphone' }).then((result) => {
      if (result.state === 'granted') setPermissionsGranted(true);
    }).catch(() => {});
  }, []);

  // Check face registration from backend on mount
  useEffect(() => {
    const checkFaceRegistration = async () => {
      try {
        const profile = await userService.getProfile();
        setFaceRegistered(Array.isArray(profile.faceDescriptor) && profile.faceDescriptor.length > 0);
      } catch (err) {
        setFaceRegistered(false);
      }
    };
    checkFaceRegistration();
  }, []);

  const handleRequestPermissions = async () => {
    try {
      setPermissionStatus('Requesting...');
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setPermissionsGranted(true);
      setPermissionStatus('Permissions granted!');
    } catch (err) {
      setPermissionsGranted(false);
      setPermissionStatus('Permission denied. Please allow camera and microphone access.');
    }
  };

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
        startTime: exam.startDate,
        endTime: exam.endDate
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
      startTime: exam?.startDate,
      endTime: exam?.endDate,
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
    if (attempt.startDate && attempt.endTime) {
      const start = new Date(attempt.startDate);
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

  const formatTimeTaken = (attempt) => {
    let seconds = 0;
    if (attempt.timeTaken && !isNaN(Number(attempt.timeTaken))) {
      seconds = Math.floor(Number(attempt.timeTaken));
      if (seconds > 1000) {
        // already in seconds
      } else {
        seconds = seconds * 60;
      }
    } else if (
      (attempt.startDate || attempt.startTime) &&
      attempt.endTime
    ) {
      const start = attempt.startDate ? new Date(attempt.startDate) : new Date(attempt.startTime);
      const end = new Date(attempt.endTime);
      seconds = Math.floor((end - start) / 1000);
    }
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min} min ${sec} sec`;
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
        <div className="exam-details two-column-grid">
          <div className="detail-item">
            <span className="detail-label">Subject Code: <span className="detail-value">BO CDA {exam?.subject?.code || 'Loading...'}</span></span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Exam Duration: <span className="detail-value">{duration} minutes</span></span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Total Questions: <span className="detail-value">{totalQuestions}</span></span>
          </div>
          {exam?.maxAttempts && (
            <div className="detail-item">
              <span className="detail-label">Maximum Attempt: <span className="detail-value">{exam.maxAttempts}</span></span>
            </div>
          )}
        </div>

        {inProgressAttempt ? (
          <div className="attempt-info-section">
            <h3>Exam in Progress</h3>
            <div className="attempt-details">
              <div className="detail-item">
                <span className="detail-label">Started On: <span className="detail-value">{formatDate(inProgressAttempt.startDate)}</span></span>
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
        ) : (allAttempts.length >= (exam?.maxAttempts || 1)) ? (
          <>
            <div className="detail-item" style={{ marginTop: 16, color: 'red', fontWeight: 500 }}>
              You have reached the maximum number of attempts for this exam.
            </div>
            {attempt && (
              <button 
                className="review-btn"
                style={{ marginTop: 12 }}
                onClick={() => navigate(`/review`, { 
                  state: { 
                    attemptId: attempt._id,
                    subjectId: exam?.subject?._id
                  } 
                })}
              >
                {closeTime && now > closeTime ? 'View Result' : 'Review Your Answers'}
              </button>
            )}
          </>
        ) : (
          <>
            {exam?.maxAttempts > 1 && (
              <div className="detail-item" style={{ marginBottom: 12, color: '#555', fontWeight: 500 }}>
                <span>Note: <b>Your last attempt will be considered as your final attempt for result purposes.</b></span>
              </div>
            )}
            {attempt && (
              <div className="attempt-info-section" style={{ marginBottom: 16 }}>
                <h3>Your Previous Attempt</h3>
                <div className="attempt-details">
                  <div className="detail-item">
                    <span className="detail-label">Last Attempted On: <span className="detail-value">{formatDate(attempt.endTime)}</span></span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Time Taken: <span className="detail-value">{formatTimeTaken(attempt)}</span></span>
                  </div>
                  {closeTime && now <= closeTime ? (
                    <div className="detail-item">
                      <span className="detail-label">Result: <span className="detail-value in-progress">Will be available after {formatDate(closeTime)}</span></span>
                    </div>
                  ) : (
                    <>
                      <div className="detail-item">
                        <span className="detail-label">Status: <span className={`detail-value ${attempt.status.toLowerCase()}`}>{attempt.status}</span></span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Score: <span className="detail-value">{attempt.score}%</span></span>
                      </div>
                    </>
                  )}
                </div>
                <div style={{ margin: '12px 0', color: closeTime && now <= closeTime ? '#b8860b' : 'green', fontWeight: 500 }}>
                  {closeTime && now <= closeTime
                    ? `You can review your attempt now. Result will be available after ${formatDate(closeTime)}.`
                    : 'The exam has ended. You can view your result.'}
                </div>
                <button 
                  className="review-btn"
                  onClick={() => navigate(`/review`, { 
                    state: { 
                      attemptId: attempt._id,
                      subjectId: exam?.subject?._id
                    } 
                  })}
                >
                  {closeTime && now <= closeTime ? 'Review Attempt' : 'View Result'}
                </button>
              </div>
            )}
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
                  <strong>Full-Screen Mode:</strong> Do not switch tabs, exit full-screen mode, press <b>F11</b>, or double-click the window during the exam. These actions are considered violations.
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
            {!faceRegistered && (
              <div className="face-registration-section">
                <h3>Face Registration Required</h3>
                <FaceRecognition mode="register" onRegistered={() => {
                  setFaceRegistered(true);
                }} />
                <div style={{marginTop:8, color:'#b8860b', fontWeight:500}}>
                  Please register your face before starting the exam.
                </div>
              </div>
            )}
            {!permissionsGranted && (
              <div className="permission-section">
                <h3>Camera & Microphone Access</h3>
                <button className="request-permission-btn" onClick={handleRequestPermissions} style={{marginBottom:8}}>
                  Allow Camera & Microphone Access
                </button>
                <div style={{color: permissionsGranted ? 'green' : 'red', fontWeight:500}}>{permissionStatus}</div>
              </div>
            )}
            {examNotStarted ? (
              <div className="exam-status-message exam-status-info">
                <p>This exam will be available from {formatDate(openTime)}</p>
              </div>
            ) : examClosed ? (
              <div className="exam-status-message exam-status-error">
                <p>This exam is no longer available</p>
              </div>
            ) : (
              <button
                className="start-exam-btn"
                onClick={handleStartExamClick}
                disabled={loading || !faceRegistered || !permissionsGranted}
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
