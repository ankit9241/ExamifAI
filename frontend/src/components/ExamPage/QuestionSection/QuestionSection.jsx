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
  onFinalSubmit
}) => {
  if (!question || !question.options) {
    return <div>Loading question...</div>;
  }

  const isLastQuestion = questionNumber === totalQuestions;

  return (
    <div className="question-container">
      <div className="question-header">
        <h3 id="question-number">Question {questionNumber}</h3>
      </div>
      <div className="question-box">
        <p>{question.question}</p>
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
  );
};

export default QuestionSection;
