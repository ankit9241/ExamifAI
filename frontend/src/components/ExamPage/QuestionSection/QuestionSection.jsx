import React from "react";
import "./QuestionSection.css";

const QuestionSection = ({
  question,
  selectedAnswer,
  onAnswerSelect,
  questionNumber,
  isSubmitted,
  onClearChoice,
  onNext,
  onPrevious,
  totalQuestions,
  onFinalSubmit,
  showFaceWarning,
  warningMessage,
  blurred
}) => {
  if (!question || !question.options) {
    return <div>Loading question...</div>;
  }

  const isLastQuestion = questionNumber === totalQuestions;

  return (
    <div className={`question-container`} style={{ position: 'relative' }}>
      <div className={blurred ? 'blurred' : ''} style={{ width: '100%', height: '100%' }}>
        <div className="question-header">
          <h3 id="question-number">Question {questionNumber}</h3>
        </div>
        <div className="question-box">
          <p>{question.questionText || question.question}</p>
        </div>
        <div className="options">
          {question.options.map((option, index) => (
            <label
              key={index}
              className={`option-label ${selectedAnswer === index ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name={`question-${questionNumber}`}
                value={index}
                checked={selectedAnswer === index}
                onChange={() => onAnswerSelect(index)}
                disabled={isSubmitted}
              />
              <span className="option-text">{option}</span>
            </label>
          ))}
        </div>
        <div className={`clear-choice-container ${selectedAnswer !== null && !isSubmitted ? 'visible' : ''}`}>
          <button 
            className="clear-choice-btn"
            onClick={() => onClearChoice(questionNumber - 1)}
            style={{ display: selectedAnswer !== null && !isSubmitted ? 'flex' : 'none' }}
          >
            Clear my choice
          </button>
        </div>
        <div className="nav-buttons">
          <button 
            className="btn btn-prev" 
            onClick={onPrevious}
            disabled={questionNumber === 1 || isSubmitted}
          >
            Previous
          </button>
          {isLastQuestion ? (
            <button 
              className="btn btn-submit"
              onClick={onFinalSubmit}
              disabled={isSubmitted}
            >
              Submit Exam
            </button>
          ) : (
            <button 
              className="btn btn-next"
              onClick={onNext}
              disabled={isSubmitted}
            >
              Next
            </button>
          )}
        </div>
      </div>
      {showFaceWarning && (
        <div className="face-warning-question-overlay">
          <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>⚠️</div>
          {warningMessage}
          <div style={{ fontSize: '1rem', marginTop: 16, color: '#b26a00' }}>
            The exam timer is still running. Please resolve the issue to continue.
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionSection;
