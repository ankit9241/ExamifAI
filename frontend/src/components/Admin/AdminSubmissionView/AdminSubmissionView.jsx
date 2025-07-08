import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { attemptService, examService } from '../../../services/api';
import './AdminSubmissionView.css';

const AdminSubmissionView = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exam, setExam] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch exam details
        const examData = await examService.getExamById(examId);
        setExam(examData);

        // Fetch all submissions for this exam
        const submissionsData = await attemptService.getAttemptsByExam(examId);
        setSubmissions(submissionsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load exam submissions');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [examId]);

  const handleViewDetails = (submission) => {
    setSelectedSubmission(submission);
    setShowDetails(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateTimeTaken = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffInMinutes = Math.round((end - start) / (1000 * 60));
    return diffInMinutes;
  };

  if (loading) {
    return (
      <div className="admin-submission-view">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-submission-view">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="admin-submission-view">
      <div className="header-section">
        <h1>Exam Submissions</h1>
        <div className="exam-info">
          <h2>{exam?.title}</h2>
          <p className="subject-code">Subject: BO CDA {exam?.subject?.code}</p>
        </div>
      </div>

      <div className="submissions-container">
        <div className="submissions-list">
          <h3>Student Submissions ({submissions.length})</h3>
          <div className="submissions-table">
            <table>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Submitted On</th>
                  <th>Time Taken</th>
                  <th>Violations</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission._id}>
                    <td>{submission.studentName}</td>
                    <td>{submission.studentEmail}</td>
                    <td>
                      <span className={`status ${submission.status.toLowerCase()}`}>
                        {submission.status}
                      </span>
                    </td>
                    <td>{submission.score}%</td>
                    <td>{formatDate(submission.endTime)}</td>
                    <td>{calculateTimeTaken(submission.startTime, submission.endTime)} mins</td>
                    <td>{submission.violationCount !== undefined ? submission.violationCount : 0}</td>
                    <td>
                      <button
                        className="view-details-btn"
                        onClick={() => handleViewDetails(submission)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showDetails && selectedSubmission && (
          <div className="submission-details">
            <div className="details-header">
              <h3>Submission Details</h3>
              <button 
                className="close-btn"
                onClick={() => setShowDetails(false)}
              >
                ×
              </button>
            </div>
            <div className="details-content">
              <div className="student-info">
                <h4>Student Information</h4>
                <p><strong>Name:</strong> {selectedSubmission.studentName}</p>
                <p><strong>Email:</strong> {selectedSubmission.studentEmail}</p>
              </div>
              <div className="attempt-info">
                <h4>Attempt Information</h4>
                <p><strong>Status:</strong> <span className={`status ${selectedSubmission.status.toLowerCase()}`}>{selectedSubmission.status}</span></p>
                <p><strong>Score:</strong> {selectedSubmission.score}%</p>
                <p><strong>Start Time:</strong> {formatDate(selectedSubmission.startTime)}</p>
                <p><strong>End Time:</strong> {formatDate(selectedSubmission.endTime)}</p>
                <p><strong>Time Taken:</strong> {calculateTimeTaken(selectedSubmission.startTime, selectedSubmission.endTime)} minutes</p>
                <p><strong>Total Violations:</strong> {selectedSubmission.violationCount !== undefined ? selectedSubmission.violationCount : 0}</p>
              </div>
              <div className="answers-section">
                <h4>Answers</h4>
                {selectedSubmission.answers.map((answer, index) => (
                  <div key={index} className="answer-item">
                    <p className="question-number">Question {index + 1}</p>
                    <p className="selected-answer">Selected Answer: {answer.selectedOption + 1}</p>
                    <p className={`answer-status ${answer.isCorrect ? 'correct' : 'incorrect'}`}>
                      {answer.isCorrect ? 'Correct' : 'Incorrect'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSubmissionView; 