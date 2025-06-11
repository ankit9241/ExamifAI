import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ReviewPage.css";

const ReviewPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAttemptData = async () => {
      try {
        const { attemptId, examId } = location.state;
        if (!attemptId) {
          throw new Error('Attempt ID not found');
        }

        const response = await examService.getAttemptById(attemptId);
        if (!response) {
          throw new Error('Attempt not found');
        }

        setAttempt(response);
        setLoading(false);
      } catch (error) {
        console.error('Error loading attempt:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    loadAttemptData();
  }, [location.state]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!attempt) {
    return <div>Attempt not found</div>;
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} min ${remainingSeconds} sec`;
  };

  return (
    <div className="review-page">
      <div className="review-content">
        <h1>Exam Review</h1>
        <div className="review-header">
          <div className="exam-status">
            <span className="status-icon">📋</span>
            Review of your submitted answers
          </div>
          <div className="time-taken">
            ⏱️ Time Taken: {formatTime(attempt.timeTaken)}
          </div>
          <div className="total-questions">
            ✅ Attempted: {attempt.answeredQuestions} / {attempt.totalQuestions}
          </div>
          <div className="score">
            🎯 Score: {attempt.score}%
          </div>
          <div className="status">
            {attempt.status === 'completed' ? '✅ Completed' : '❌ Incomplete'}
          </div>
        </div>

        <div className="answer-section-container">
          <div className="answers-grid">
            {attempt.answers.map((answer, index) => (
              <div key={index} className="answer-item">
                <div className="question-number">Q{index + 1}</div>
                <div className="answer-details">
                  <div className="selected-answer">
                    Your Answer: {answer.selectedAnswer}
                  </div>
                  <div className={`result ${answer.isCorrect ? 'correct' : 'incorrect'}`}>
                    {answer.isCorrect ? '✅ Correct' : '❌ Incorrect'}
                  </div>
                  {answer.marksObtained > 0 && (
                    <div className="marks">Marks: {answer.marksObtained}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button className="back-button" onClick={() => navigate("/")}>
            ⬅ Back to Course
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;
