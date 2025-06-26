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
        <div className="review-header-premium">
          <div className="review-header-title">{exam.title || 'Exam Review'}</div>
          <div className="review-header-details">
            <span>Time Taken: <b>{formatTime(timeTakenSeconds)}</b></span>
            <span>Questions Attempted: <b>{attemptedCount} / {exam.questions.length}</b></span>
          </div>
        </div>
        <div className="answer-section-container premium">
          <div className="answers-grid">
            {exam.questions.map((question, index) => {
              const answer = attempt.answers.find(a => (a.questionIndex !== undefined ? a.questionIndex : a.question) === index);
              // Support both selectedOption (number) and selectedAnswer (string or number)
              const selectedOption = answer?.selectedOption !== undefined ? answer.selectedOption : answer?.selectedAnswer;
              const isCorrect = selectedOption === question.correctAnswer;
              return (
                <div key={index} className="answer-card">
                  <div className="question-header">
                    <h3>Question {index + 1}</h3>
                  </div>
                  <p className="question-text">{question.question}</p>
                  <div className="options-list">
                    {question.options.map((option, optIndex) => (
                      <div
                        key={optIndex}
                        className={`option ${optIndex === question.correctAnswer ? 'correct-answer' : ''} ${optIndex === selectedOption ? 'student-answer' : ''}`}
                      >
                        <span className="option-label">Option {optIndex + 1}:</span>
                        <span className="option-text">{option}</span>
                        {optIndex === selectedOption && (
                          <span className="correct-indicator">✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="answer-details">
                    <div className="detail-item">
                      <span className="label">Student's Answer:</span>
                      <span className="value">
                        {selectedOption !== undefined && selectedOption !== null && selectedOption !== '' && selectedOption !== 'Not Answered'
                          ? (typeof selectedOption === 'number' && question.options[selectedOption] !== undefined
                              ? question.options[selectedOption]
                              : selectedOption)
                          : 'Not Answered'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <button className="back-button premium" onClick={() => navigate("/")}>⬅ Back to Course</button>
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;
