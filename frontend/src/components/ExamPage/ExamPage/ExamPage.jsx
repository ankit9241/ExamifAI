import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { examService, attemptService } from "../../../services/api.jsx";
import Header from "../Header/Header";
import Sidebar from "../Sidebar/Sidebar";
import QuestionSection from "../QuestionSection/QuestionSection";
import SubmitConfirmationModal from "../SubmitConfirmation/SubmitConfirmationModal";
import QuestionNavigation from "../QuestionNavigation/QuestionNavigation";
import "./ExamPage.css";

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

  // const handleExistingAttempt = async (existingAttempt) => {
  //   const confirmAction = window.confirm(
  //     'You have an existing attempt in progress.\n\n' +
  //     '1. Resume Attempt: Continue with your existing attempt\n' +
  //     '2. Abandon Attempt: Start a new attempt (your existing attempt will be marked as abandoned)\n\n' +
  //     'Choose an option:'
  //   );
  // 
  //   if (confirmAction) {
  //     // User chose to abandon existing attempt
  //     try {
  //       await attemptService.updateAttempt(existingAttempt._id, { status: 'abandoned' });
  //       return false; // Proceed to create new attempt
  //     } catch (error) {
  //       console.error('Error abandoning attempt:', error);
  //       throw new Error('Failed to abandon existing attempt. Please try again.');
  //     }
  //   } else {
  //     // User chose to resume existing attempt
  //     setActiveAttemptId(existingAttempt._id);
  //     setExamStartTime(new Date(existingAttempt.startTime));
  //     setExamEndTime(new Date(existingAttempt.endTime));
  //     setSelectedAnswers(existingAttempt.answers || {});
  //     setCurrentIndex(existingAttempt.lastSavedIndex || 0);
  //     setExamDetails(existingAttempt.examDetails || exam);
  //     setTimeLeft(Math.floor((new Date(existingAttempt.endTime) - new Date()) / 1000));
  //     setIsExamStarted(true);
  //     return existingAttempt;
  //   }
  // };
  // 
  // const startNewAttempt = async (examId) => {
  //   try {
  //     // Get user info
  //     const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  //     if (!userInfo || !userInfo._id) {
  //       throw new Error('User not authenticated');
  //     }
  // 
  //     // Get exam details
  //     const exam = await examService.getExamById(examId);
  //     if (!exam) {
  //       throw new Error('Exam not found');
  //     }
  // 
  //     // Get exam attempts for this user
  //     const attempts = await attemptService.getAttemptsByExam(examId);
  //     
  //     // Check for existing in-progress attempt
  //     const existingAttempt = attempts.find(
  //       a => a.user && 
  //            a.user._id === userInfo._id && 
  //            a.status === 'in_progress'
  //     );
  // 
  //     if (existingAttempt) {
  //       const result = await handleExistingAttempt(existingAttempt);
  //       if (result) {
  //         return result; // Return existing attempt if user chose to resume
  //       }
  //     }
  // 
  //     // Check if max attempts reached
  //     if (exam.maxAttempts && attempts.length >= exam.maxAttempts) {
  //       throw new Error(`You have reached the maximum number of attempts (${exam.maxAttempts}) for this exam.`);
  //     }
  // 
  //     // Start new attempt
  //     const newAttempt = await attemptService.startAttempt(examId);
  //     setActiveAttemptId(newAttempt._id);
  //     setExamStartTime(new Date());
  //     setExamEndTime(new Date(new Date().getTime() + (exam.duration * 60 * 1000)));
  //     return newAttempt;
  //   } catch (error) {
  //     console.error('Error starting attempt:', error);
  //     throw error;
  //   }
  // };
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

      // Check if there's an existing attempt for this user and exam
      const userAttempts = await attemptService.getAttemptsByUser(userInfo._id);
      const existingAttempt = userAttempts.find(attempt => attempt.exam === exam._id);
      
      if (existingAttempt) {
        // If there's an existing attempt, update it regardless of status
        console.log('Updating existing attempt:', existingAttempt._id);
        
        // Prepare update data
        const updateData = {
          answers: formattedAnswers.map((answer, index) => ({
            question: index,
            selectedAnswer: answer.selectedAnswer || 'Not Answered'
          })),
          score: score.toFixed(1),
          endTime: new Date().toISOString(),
          status: 'completed',
          answeredQuestions: Object.keys(selectedAnswers).length,
          timeTaken: exam.duration * 60 - timeLeft,
          studentName: userInfo.name,
          studentEmail: userInfo.email,
          examName: exam.title,
          totalQuestions: examQuestions.length
        };

        // Update the existing attempt
        const response = await attemptService.updateAttempt(existingAttempt._id, updateData);
        
        if (response && response._id) {
          // Clear exam data from localStorage
          localStorage.removeItem('questions');
          localStorage.removeItem('examProgress');
          
          navigate('/review', { 
            state: { 
              attemptId: response._id,
              examId: exam._id,
              score: score.toFixed(1),
              status: score >= 40 ? 'Pass' : 'Fail',
              examName: exam.title,
              studentName: userInfo.name,
              totalQuestions: examQuestions.length,
              answeredQuestions: Object.keys(selectedAnswers).length
            }
          });
        } else {
          throw new Error('Failed to update existing attempt');
        }
        return; // Exit early since we've already handled the submission
      }

// If no attempt exists, create a new one
      console.log('Creating new attempt');
      
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
        timeTaken: exam.duration * 60 - timeLeft
      };

      // Submit the exam using exam service
      const response = await examService.submitAttempt(existingAttempt._id, submissionData);
      
      if (response && response._id) {
        // Clear exam data from localStorage
        localStorage.removeItem('questions');
        localStorage.removeItem('examProgress');
        
        navigate('/review', { 
          state: { 
            attemptId: response._id,
            examId: exam._id,
            score: score.toFixed(1),
            status: score >= 40 ? 'Pass' : 'Fail',
            examName: exam.title,
            studentName: userInfo.name,
            totalQuestions: examQuestions.length,
            answeredQuestions: Object.keys(selectedAnswers).length
          }
        });
      } else {
        throw new Error('Failed to create new attempt');
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

  return (
    <div className="exam-page">
      <Header timeLeft={timeLeft} />
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
        <Sidebar />
        <div className="main-content">
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
                      console.log('Selected answer:', answer);
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
    </div>
  );
};

export default ExamPage;
