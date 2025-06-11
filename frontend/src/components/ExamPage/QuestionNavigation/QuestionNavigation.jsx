import React from "react";
import "./QuestionNavigation.css";

const QuestionNavigation = ({
  questions,
  currentIndex,
  setIndex,
  selected,
  onFinalSubmitClick,
}) => {
  return (
    <div className="question-navigation-container">
      <div className="question-navigation-title">Question Navigation :-</div>
      <div className="question-buttons-wrapper">
        <div className="question-buttons">
          {questions.map((_, idx) => (
            <button
              key={idx}
              className={`
                question-button
                ${idx === currentIndex ? "active" : ""}
                ${selected[idx] !== undefined && selected[idx] !== null ? "answered" : ""}
              `}
              onClick={() => setIndex(idx)}
            >
              {idx + 1}
            </button>
          ))}
        </div>
        <button className="final-submit-button" onClick={onFinalSubmitClick}>
          Final Submit
        </button>
      </div>
    </div>
  );
};

export default QuestionNavigation;
