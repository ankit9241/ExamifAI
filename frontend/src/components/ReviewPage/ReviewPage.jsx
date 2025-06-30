import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { examService } from "../../services/api.jsx";
import "./ReviewPage.css";

const ReviewPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [attempt, setAttempt] = useState(null);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAttemptAndExam = async () => {
      try {
        const { attemptId, examId } = location.state;
        if (!attemptId) throw new Error('Attempt ID not found');
        const attemptRes = await examService.getAttemptById(attemptId);
        if (!attemptRes) throw new Error('Attempt not found');
        setAttempt(attemptRes);
        if (attemptRes.answers) {
          console.log('ReviewPage: attempt.answers =', attemptRes.answers);
        }
        let examObj = attemptRes.exam && attemptRes.exam.questions ? attemptRes.exam : null;
        if (!examObj) {
          const eid = examId || (attemptRes.exam && (attemptRes.exam._id || attemptRes.exam));
          if (!eid) throw new Error('Exam ID not found');
          examObj = await examService.getExamById(eid);
        }
        setExam(examObj);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };
    loadAttemptAndExam();
  }, [location.state]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!attempt || !exam) return <div>Attempt or Exam not found</div>;

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} min ${remainingSeconds} sec`;
  };

  const attemptedCount = attempt.answers.filter(
    a =>
      a.selectedAnswer !== undefined &&
      a.selectedAnswer !== null &&
      a.selectedAnswer !== '' &&
      a.selectedAnswer !== 'Not Answered' &&
      a.selectedAnswer !== -1
  ).length;

  // Calculate score
  const calculateScore = () => {
    let correctCount = 0;
    exam.questions.forEach((question, index) => {
      const answer = attempt.answers.find(a => (a.questionIndex !== undefined ? a.questionIndex : a.question) === index);
      const selectedOption = answer?.selectedOption !== undefined ? answer.selectedOption : answer?.selectedAnswer;
      
      // Determine the student's selected option index
      let studentSelectedIndex = -1;
      if (selectedOption !== undefined && selectedOption !== null && selectedOption !== '' && selectedOption !== 'Not Answered') {
        if (typeof selectedOption === 'number') {
          studentSelectedIndex = selectedOption;
        } else {
          studentSelectedIndex = question.options.findIndex(option => option === selectedOption);
        }
      }
      
      if (studentSelectedIndex === question.correctAnswer) {
        correctCount++;
      }
    });
    return correctCount;
  };

  const score = calculateScore();
  const totalQuestions = exam.questions.length;
  const percentageScore = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const isPassed = percentageScore >= 35; // Assuming 35% is passing score

  // Calculate time taken in seconds, fallback to endTime-startTime if needed
  const timeTakenSeconds = attempt.timeTaken ||
    (attempt.endTime && attempt.startTime
      ? Math.floor((new Date(attempt.endTime) - new Date(attempt.startTime)) / 1000)
      : 0);

  // Helper to get student name and exam title robustly
  const getStudentName = (attempt) => attempt.studentName || attempt.user?.name || 'N/A';
  const getExamTitle = (attempt, exam) => attempt.examName || exam?.title || attempt.exam?.title || 'N/A';
  const getStatusClass = (status) => status ? status.toLowerCase().replace(/\s/g, '_') : '';

  return (
    <div className="review-page">
      <div className="review-content">
        <div className="review-layout-row">
          <button 
            className="review-back-button"
            onClick={() => navigate('/home')}
          >
            <span className="icon">←</span> Back to Course
          </button>
          <div className="review-header-premium review-header-modern">
            <div className="review-header-content">
              <div className="review-exam-title">
                {exam.title || 'Exam Review'}
              </div>
              <div className="review-details-grid">
                <div className="review-details-row">
                  <span className="review-detail-pill score-pill">
                    <span className="icon">📊</span> Score: <b>{score} / {totalQuestions} ({percentageScore}%)</b>
                  </span>
                  <span className={`review-detail-pill status-pill ${isPassed ? 'passed' : 'failed'}`}>
                    <span className="icon">{isPassed ? '✅' : '❌'}</span> {isPassed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
                <div className="review-details-row">
                  <span className="review-detail-pill time-pill">
                    <span className="icon">⏱️</span> Time Taken: <b>{formatTime(timeTakenSeconds)}</b>
                  </span>
                  <span className="review-detail-pill attempted-pill">
                    <span className="icon">📝</span> Attempted: <b>{attemptedCount} / {totalQuestions}</b>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="answer-section-container premium">
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
              
              const isCorrect = studentSelectedIndex === question.correctAnswer;
              
              // Debug logging
              console.log(`Question ${index + 1}:`, {
                selectedOption,
                studentSelectedIndex,
                correctAnswer: question.correctAnswer,
                isCorrect,
                options: question.options,
                correctAnswerText: question.options[question.correctAnswer],
                questionText: question.questionText || question.question
              });
              
              return (
                <div key={index} className="answer-card">
                  <div className="question-header">
                    <h3>Question {index + 1}</h3>
                    <span className={`attempt-status ${studentSelectedIndex !== -1 ? (isCorrect ? 'correct' : 'incorrect') : 'not-attempted'}`}>
                      {studentSelectedIndex !== -1 ? (isCorrect ? 'Correct' : 'Incorrect') : 'Not Attempted'}
                    </span>
                  </div>
                  <p className="question-text">{question.questionText || question.question}</p>
                  <div className="options-list">
                    {question.options.map((option, optIndex) => (
                      <div
                        key={optIndex}
                        className={`option ${optIndex === question.correctAnswer ? 'correct-answer' : ''} ${optIndex === studentSelectedIndex ? 'student-answer' : ''}`}
                      >
                        <span className="option-label">Option {optIndex + 1}:</span>
                        <span className="option-text">{option}</span>
                        {optIndex === question.correctAnswer && 
                         question.correctAnswer !== undefined && 
                         question.correctAnswer >= 0 && 
                         question.correctAnswer < question.options.length && (
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
                        {studentSelectedIndex !== -1
                          ? question.options[studentSelectedIndex]
                          : 'Not Answered'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Correct Answer:</span>
                      <span className="value">
                        {question.correctAnswer !== undefined && 
                         question.correctAnswer >= 0 && 
                         question.correctAnswer < question.options.length
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
    </div>
  );
};

export default ReviewPage;
