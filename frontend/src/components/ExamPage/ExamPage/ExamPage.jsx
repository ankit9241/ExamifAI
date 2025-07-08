import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { examService } from "../../../services/api.jsx";
import Header from "../Header/Header";
import Sidebar from "../Sidebar/Sidebar";
import QuestionSection from "../QuestionSection/QuestionSection";
import SubmitConfirmationModal from "../SubmitConfirmation/SubmitConfirmationModal";
import QuestionNavigation from "../QuestionNavigation/QuestionNavigation";
import "./ExamPage.css";
import useFullscreen from './useFullscreen';
import WarningModal from '../SubmitConfirmation/WarningModal';
import FaceRecognition from "../Sidebar/FaceRecognition";

const calculateScore = (answers, questions) => {
  if (!answers || !questions) {
    return 0;
  }

  let totalScore = 0;
  questions.forEach((question, index) => {
    const answer = answers[index];
    const correctAnswer = question.correctAnswer;
    
    // Skip if no answer or no correct answer
    if (!answer || correctAnswer === undefined) return;
    
    // Convert both to string and lowercase for comparison
    const answerStr = String(answer).toLowerCase();
    const correctAnswerStr = String(correctAnswer).toLowerCase();
    
    if (answerStr === correctAnswerStr) {
      totalScore += question.marks || 1;
    }
  });
  return totalScore;
};

const ExamPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const videoRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3600);
  const [cameraError, setCameraError] = useState("");
  const [cameraAccessGranted, setCameraAccessGranted] = useState(false);
  const [examQuestions, setExamQuestions] = useState([]);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [examStartTime, setExamStartTime] = useState(null);
  const [examEndTime, setExamEndTime] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examId, setExamId] = useState(null);
  const [activeAttemptId, setActiveAttemptId] = useState(null);
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [examDetails, setExamDetails] = useState(null);
  const { isFullscreen, enter } = useFullscreen();
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const violationTimeoutRef = useRef(null);
  const [faceStatus, setFaceStatus] = useState('ok'); // 'ok', 'no-face', 'wrong-face'
  const [faceRegistered, setFaceRegistered] = useState(() => {
    // Check if face is already registered in localStorage
    return !!localStorage.getItem('registeredFaceDescriptor');
  });
  const [hasStarted, setHasStarted] = useState(false);

  // Helper functions
  const validateExamData = (examData) => {
    if (!examData || !examData._id || !examData.title || !examData.subject) {
      throw new Error('Invalid exam data. Please contact support.');
    }
    if (!examData.isActive) {
      throw new Error('Exam is not currently available. Please check back later.');
    }
    return true;
  };

  const loadSavedProgress = async () => {
    try {
      const savedProgress = localStorage.getItem(`exam_progress_${examId}`);
      if (savedProgress) {
        const { answers, currentQuestionIndex, timeLeft } = JSON.parse(savedProgress);
        setSelectedAnswers(answers);
        setCurrentIndex(currentQuestionIndex);
        setTimeLeft(timeLeft);
      }
    } catch (error) {
      console.error('Error loading saved progress:', error);
    }
  };

  const saveProgress = () => {
    try {
      const progress = {
        answers: selectedAnswers,
        currentQuestionIndex: currentIndex,
        timeLeft
      };
      localStorage.setItem(`exam_progress_${examId}`, JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const loadExamData = async () => {
    try {
      setLoading(true);
      setError(null);

      const examId = location.state?.examId;
      if (!examId) {
        throw new Error('Exam ID is missing.');
      }

      // Get exam details
      const examDetails = await examService.getExamById(examId);
      if (!examDetails || !examDetails.isActive) {
        throw new Error('Exam not available');
      }

      // Debug: Log the exam details and questions
      console.log('Exam details loaded:', examDetails);
      console.log('Questions array:', examDetails.questions);
      if (examDetails.questions && examDetails.questions.length > 0) {
        console.log('First question structure:', examDetails.questions[0]);
      }

      // Set exam data
      setExam(examDetails);
      setExamQuestions(examDetails.questions || []);
      setTimeLeft(examDetails.duration * 60);
      setExamStartTime(new Date());
      setExamEndTime(new Date(new Date().getTime() + (examDetails.duration * 60 * 1000)));
    } catch (error) {
      console.error('Error during exam data loading:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExamData();
  }, [navigate, location.state?.examId]);

  useEffect(() => {
    const saveInterval = setInterval(saveProgress, 30000); // Save every 30 seconds
    return () => clearInterval(saveInterval);
  }, [selectedAnswers, currentIndex, timeLeft, examId]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!examStartTime || !examEndTime) return;
      const now = new Date();
      const remainingTime = Math.max(0, Math.floor((examEndTime - now) / 1000));
      setTimeLeft(remainingTime);

      if (remainingTime === 0 && !isSubmitting) {
        clearInterval(timer);
        handleSubmit();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [examStartTime, examEndTime, isSubmitting]);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraAccessGranted(true);
      } catch (err) {
        setCameraError(
          "Camera access is required for this exam. Please return to the exam details page and allow camera access."
        );
        setCameraAccessGranted(false);
      }
    };

    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    enter();
  }, [enter]);

  // Set hasStarted to true after first question is loaded
  useEffect(() => {
    if (examQuestions.length > 0 && !hasStarted) {
      setHasStarted(true);
    }
  }, [examQuestions, hasStarted]);

  // Tab/window switch and shortcut prevention
  useEffect(() => {
    function handleViolation() {
      if (hasStarted) {
        setTabSwitchCount((count) => count + 1);
        setShowTabWarning(true);
      }
    }
    function handleVisibilityChange() {
      if (document.hidden) {
        handleViolation();
      }
    }
    function handleKeyDown(e) {
      // Block shortcuts
      if (
        (e.ctrlKey && (e.key === 't' || e.key === 'w')) || // Ctrl+T, Ctrl+W
        (e.key === 'F12') || (e.key === 'F11') ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) // Dev tools
      ) {
        e.preventDefault();
        handleViolation();
      }
    }
    function handleContextMenu(e) {
      e.preventDefault();
      handleViolation();
    }
    function handleFullscreenChange() {
      // If not in fullscreen, count as violation only if hasStarted
      if (!document.fullscreenElement &&
          !document.webkitFullscreenElement &&
          !document.mozFullScreenElement &&
          !document.msFullscreenElement) {
        handleViolation();
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [hasStarted]);

  // Auto-submit after 3 violations
  useEffect(() => {
    if (tabSwitchCount >= 3) {
      if (!violationTimeoutRef.current) {
        violationTimeoutRef.current = setTimeout(() => {
          handleSubmit();
        }, 2000); // 2 seconds delay before auto-submit
      }
    }
    return () => {
      if (violationTimeoutRef.current && tabSwitchCount < 3) {
        clearTimeout(violationTimeoutRef.current);
        violationTimeoutRef.current = null;
      }
    };
  }, [tabSwitchCount]);

  // Handle submission
  const handleSubmit = async () => {
    if (isSubmitting) {
      console.log('Submission already in progress');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get user info
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      if (!userInfo || !userInfo._id) {
        throw new Error('User not authenticated');
      }

      // Format answers according to schema
      const formattedAnswers = examQuestions.map((question, index) => {
        const answerIndex = selectedAnswers[index];
        const answer = answerIndex !== undefined && answerIndex >= 0 && answerIndex < question.options.length 
          ? question.options[answerIndex] 
          : 'Not Answered';
        
        return {
          question: index,
          selectedAnswer: answer,
          isCorrect: answerIndex === question.correctAnswer,
          marksObtained: answerIndex === question.correctAnswer ? question.marks : 0
        };
      });

      // Calculate score
      const score = calculateScore(
        formattedAnswers.map(a => a.selectedAnswer),
        examQuestions
      );

      // Prepare submission data
      const submissionData = {
        user: userInfo._id,
        exam: exam._id,
        answers: formattedAnswers.map((answer, index) => ({
          question: index,
          selectedAnswer: answer.selectedAnswer || 'Not Answered'
        })),
        score: score.toFixed(1),
        startTime: examStartTime?.toISOString(),
        endTime: new Date().toISOString(),
        status: 'completed',
        studentName: userInfo.name,
        studentEmail: userInfo.email,
        examName: exam.title,
        totalQuestions: examQuestions.length,
        answeredQuestions: Object.keys(selectedAnswers).length,
        timeTaken: exam.duration * 60 - timeLeft,
        violationCount: tabSwitchCount
      };

      // Submit the exam using exam service
      const response = await examService.submitExam(submissionData);
      
      if (response && response._id) {
        // Clear exam data from localStorage
        localStorage.removeItem('questions');
        localStorage.removeItem('examProgress');
        
        navigate('/review', { 
          state: { 
            attemptId: response._id,
            examId: exam._id,
            subjectId: exam.subject?._id,
            score: score.toFixed(1),
            status: score >= 40 ? 'Pass' : 'Fail',
            examName: exam.title,
            studentName: userInfo.name,
            totalQuestions: examQuestions.length,
            answeredQuestions: Object.keys(selectedAnswers).length
          }
        });
      } else {
        throw new Error('Failed to create new submission');
      }
    } catch (error) {
      console.error('Error submitting exam:', error);
      setError('Failed to submit exam. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle submission confirmation
  const handleConfirmSubmit = () => {
    if (!isSubmitting) {
      setShowModal(false);
      handleSubmit();
    }
  };

  const handleCancelSubmit = () => {
    setShowModal(false);
  };

  // Helper functions
  const getAnsweredCount = () => {
    return Object.keys(selectedAnswers).length;
  };

  const handleClearChoice = (index) => {
    setSelectedAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[index];
      return newAnswers;
    });
  };

  // Navigation handlers
  const handleNext = () => {
    if (currentIndex < examQuestions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setShowModal(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleQuestionClick = (index) => {
    setCurrentIndex(index);
  };

  // Render
  if (loading) {
    return <div>Loading exam...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  // ENFORCE REGISTRATION BEFORE EXAM
  if (!faceRegistered) {
    return (
      <div className="face-registration-overlay">
        <h2>Face Registration Required</h2>
        <FaceRecognition mode="register" onRegistered={() => setFaceRegistered(true)} />
        <div className="face-registration-desc">
          Please register your face before starting the exam. This is required for exam monitoring and security.
        </div>
      </div>
    );
  }

  // Determine mode for Sidebar/Camera
  const sidebarMode = faceRegistered ? 'recognition' : 'register';

  // Show warning if face is not detected, wrong face, or multiple faces
  const showFaceWarning = faceStatus === 'no-face' || faceStatus === 'wrong-face' || faceStatus === 'multiple-faces';
  const warningMessage = faceStatus === 'no-face'
    ? 'No face detected. Please keep your face visible in the camera.'
    : faceStatus === 'wrong-face'
      ? 'Unrecognized face detected! Only the registered student is allowed.'
      : faceStatus === 'multiple-faces'
        ? 'Multiple faces detected! Only one person should be in front of the camera.'
        : '';

  return (
    <div className="exam-page">
      {/* Highlighted Violation Counter in top-center */}
      <div style={{
        position: 'fixed',
        top: 18,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 2001,
        background: tabSwitchCount === 0
          ? 'linear-gradient(90deg, #e3f0ff 0%, #f8fafc 100%)'
          : (tabSwitchCount < 3
              ? 'linear-gradient(90deg, #fffbe6 0%, #ffe082 100%)'
              : 'linear-gradient(90deg, #ffeaea 0%, #ffb3b3 100%)'),
        color: tabSwitchCount === 0 ? '#2a6bb1' : (tabSwitchCount < 3 ? '#b26a00' : '#c0392b'),
        border: tabSwitchCount === 0 ? '2px solid #90caf9' : (tabSwitchCount < 3 ? '2px solid #ffd600' : '2px solid #e53935'),
        borderRadius: 16,
        padding: '10px 32px',
        fontWeight: 700,
        fontSize: '1.25rem',
        boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
        transition: 'color 0.2s, background 0.2s',
        pointerEvents: 'none',
        minWidth: 180,
        textAlign: 'center',
        letterSpacing: '0.03em',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
      }}>
        <span style={{fontSize: '1.6rem', marginRight: 8, color: tabSwitchCount === 0 ? '#1976d2' : (tabSwitchCount < 3 ? '#ff9800' : '#d32f2f')}}>
          {tabSwitchCount === 0 ? '🛈' : '⚠️'}
        </span>
        Violations: <span style={{marginLeft: 8, fontWeight: 900}}>{tabSwitchCount}</span>
      </div>
      {!isFullscreen && (
        <WarningModal
          open={!isFullscreen}
          onClose={enter}
          title="Fullscreen Required"
          message={"The exam must be taken in fullscreen mode. Please re-enter fullscreen to continue."}
          buttonText="Re-enter Fullscreen"
        />
      )}
      <Header timeLeft={timeLeft} subjectCode={exam?.subject?.code || ''} />
      {examQuestions.length > 0 && (
        <QuestionNavigation
          onNext={handleNext}
          onPrev={handlePrev}
          currentIndex={currentIndex}
          totalQuestions={examQuestions.length}
          answeredCount={getAnsweredCount()}
          questions={examQuestions}
          setIndex={handleQuestionClick}
          selected={Object.entries(selectedAnswers).reduce((acc, [key, val]) => {
            acc[key] = val !== undefined;
            return acc;
          }, {})}
          onFinalSubmitClick={() => setShowModal(true)}
        />
      )}
      <div className="exam-content">
        <Sidebar
          onFaceStatusChange={status => {
            setFaceStatus(status);
            if (status === 'ok' && !faceRegistered) setFaceRegistered(true);
          }}
          mode={sidebarMode}
        />
        <div className={`main-content${showFaceWarning ? ' blurred' : ''}`} style={{ position: 'relative' }}>
          {cameraError ? (
            <div className="camera-error">{cameraError}</div>
          ) : (
            <>
              {examQuestions[currentIndex] ? (
                <>
                  <QuestionSection
                    question={examQuestions[currentIndex]}
                    selectedAnswer={selectedAnswers[currentIndex]}
                    onAnswerSelect={(answer) => {
                      setSelectedAnswers((prev) => ({
                        ...prev,
                        [currentIndex]: answer,
                      }));
                    }}
                    questionNumber={currentIndex + 1}
                    isSubmitted={false}
                    onClearChoice={handleClearChoice}
                    onNext={handleNext}
                    onPrevious={handlePrev}
                    totalQuestions={examQuestions.length}
                    onFinalSubmit={() => setShowModal(true)}
                    showFaceWarning={showFaceWarning}
                    warningMessage={warningMessage}
                    blurred={showFaceWarning}
                  />
                </>
              ) : (
                <div>No question available</div>
              )}
            </>
          )}
        </div>
      </div>
      <SubmitConfirmationModal
        open={showModal}
        onConfirm={handleConfirmSubmit}
        onCancel={handleCancelSubmit}
        answeredCount={getAnsweredCount()}
        totalQuestions={examQuestions.length}
        isSubmitting={isSubmitting}
      />
      {showTabWarning && tabSwitchCount < 3 && (
        <WarningModal
          open={showTabWarning}
          onClose={() => setShowTabWarning(false)}
          title="Warning: Exam Policy Violation"
          message={tabSwitchCount === 1
            ? 'You switched tabs, minimized, pressed F11, double-clicked the window, or tried a blocked shortcut. Please do not leave the exam window, use F11, double-click, or use shortcuts.'
            : `You have violated the policy ${tabSwitchCount} times. On the 3rd violation, your exam will be auto-submitted. (Violations include switching tabs, F11, double-click, or using shortcuts.)`}
          buttonText="Continue Exam"
        />
      )}
    </div>
  );
};

export default ExamPage;
