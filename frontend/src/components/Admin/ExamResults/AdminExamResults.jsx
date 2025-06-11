import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./AdminExamResults.css";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminExamResults = () => {
  const navigate = useNavigate();
  const { examId } = useParams();
  const [exam, setExam] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalAttempts: 0,
    passCount: 0,
    failCount: 0,
    averageTime: 0,
    totalStudents: 0
  });
  const [questionInsights, setQuestionInsights] = useState([]);

  useEffect(() => {
    const fetchExamResults = async () => {
      try {
        if (!examId) {
          setError('No exam ID provided');
          setLoading(false);
          return;
        }

        setLoading(true);
        // Fetch exam details
        const examResponse = await axios.get(`http://localhost:5000/api/exams/${examId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setExam(examResponse.data);

        // Fetch attempts
        const attemptsResponse = await axios.get(`http://localhost:5000/api/attempts/exam/${examId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setAttempts(attemptsResponse.data);

        // Calculate statistics
        const totalAttempts = attemptsResponse.data.length;
        const passCount = attemptsResponse.data.filter(a => a.status === 'completed' && a.score >= examResponse.data.passingScore).length;
        const failCount = attemptsResponse.data.filter(a => a.status === 'completed' && a.score < examResponse.data.passingScore).length;
        const inProgressCount = attemptsResponse.data.filter(a => a.status === 'in_progress').length;
        const averageTime = attemptsResponse.data.reduce((acc, curr) => {
          // Only calculate time for completed attempts
          if (curr.status === 'completed' && curr.endTime) {
            const timeTaken = (new Date(curr.endTime) - new Date(curr.startTime)) / (1000 * 60); // Convert to minutes
            return acc + timeTaken;
          }
          return acc;
        }, 0) / (totalAttempts - inProgressCount) || 0;

        setStats({
          totalAttempts,
          passCount,
          failCount,
          inProgressCount,
          averageTime: Math.round(averageTime),
          totalStudents: examResponse.data.totalStudents || 0
        });

        // Calculate question insights (only for completed attempts)
        const completedAttempts = attemptsResponse.data.filter(a => a.status === 'completed');
        const insights = examResponse.data.questions.map((question, index) => {
          const correctCount = completedAttempts.filter(a => 
            a.answers[index]?.selectedOption === question.correctAnswer
          ).length;
          const correctRate = (correctCount / completedAttempts.length) * 100 || 0;
          return {
            questionNumber: index + 1,
            correctRate: Math.round(correctRate),
            difficulty: correctRate >= 70 ? 'Easy' : correctRate >= 40 ? 'Medium' : 'Hard'
          };
        });
        setQuestionInsights(insights);
      } catch (err) {
        console.error('Error fetching exam results:', err);
        setError(err.response?.data?.message || 'Failed to fetch exam results');
      } finally {
        setLoading(false);
      }
    };

    fetchExamResults();
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

  if (loading) {
    return <div className="loading">Loading exam results...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!exam) {
    return <div className="error">Exam not found</div>;
  }

  const handleDeleteAttempt = async (attemptId) => {
    if (!window.confirm('Are you sure you want to delete this attempt? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/attempts/${attemptId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      // Refresh attempts list
      const updatedAttempts = attempts.filter(a => a._id !== attemptId);
      setAttempts(updatedAttempts);
      toast.success('Attempt deleted successfully');
    } catch (err) {
      console.error('Error deleting attempt:', err);
      toast.error('Failed to delete attempt');
    }
  };

  return (
    <div className="admin-exam-results">
      <div className="results-header">
        <button 
          className="back-button" 
          onClick={() => navigate(`/home/${exam.subject._id}`)}
        >
          ← Back to Subject
        </button>
        <h1>Exam Results</h1>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Assignment Summary Section */}
      <div className="summary-section">
        <div className="summary-header">
          <h2>{exam.title}</h2>
          <span className="subject-code">{exam.subject.name}</span>
        </div>
        
        <div className="summary-grid">
          <div className="summary-card">
            <h3>Total Questions</h3>
            <div className="summary-value">{exam.questions.length}</div>
          </div>
          <div className="summary-card">
            <h3>Total Marks</h3>
            <div className="summary-value">{exam.questions.length * 2}</div>
          </div>
          <div className="summary-card">
            <h3>Students Attempted</h3>
            <div className="summary-value">{stats.totalAttempts}</div>
          </div>
          <div className="summary-card">
            <h3>Submission Deadline</h3>
            <div className="summary-value">{formatDate(exam.endTime)}</div>
          </div>
        </div>
      </div>

      {/* Student Attempts Table */}
      <div className="attempts-section">
        <h2>Student Submissions</h2>
        <div className="table-responsive">
          <table className="attempts-table">
            <thead>
              <tr>
                <th>Sr. No.</th>
                <th>Student Name</th>
                <th>Roll No.</th>
                <th>Score</th>
                <th>Status</th>
                <th>Time Taken</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((attempt, index) => {
                const timeTaken = Math.round((new Date(attempt.endTime) - new Date(attempt.startTime)) / (1000 * 60));
                return (
                  <tr key={attempt._id}>
                    <td>{index + 1}</td>
                    <td>{attempt.user.name}</td>
                    <td>{attempt.user.rollNo}</td>
                    <td>{attempt.score}/{exam.questions.length * 2}</td>
                    <td>
                      <span className={`status-badge ${attempt.status}`}>
                        {attempt.status === 'in_progress' ? 'In Progress' : 
                         attempt.status === 'completed' && attempt.score >= exam.passingScore ? 'Pass' : 'Fail'}
                      </span>
                    </td>
                    <td>
                      {attempt.status === 'in_progress' ? 
                        'Ongoing' : 
                        `${timeTaken} min`
                      }
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="view-submission-btn"
                          onClick={() => navigate(`/admin/submission/${attempt._id}`)}
                        >
                          View Submission
                        </button>
                        <div className="dropdown">
                          <button className="dropdown-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                            </svg>
                          </button>
                          <div className="dropdown-content">
                            <button 
                              className="dropdown-item"
                              onClick={() => handleDeleteAttempt(attempt._id)}
                            >
                              Delete Attempt
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Question Insights Section */}
      <div className="insights-section">
        <h2>Question-wise Analysis</h2>
        <div className="insights-grid">
          {questionInsights.map((insight, index) => (
            <div key={index} className="insight-card">
              <div className="insight-header">
                <h3>Question {index + 1}</h3>
                <span className={`difficulty-badge ${insight.difficulty.toLowerCase()}`}>
                  {insight.difficulty}
                </span>
              </div>
              <p className="question-text">{insight.question}</p>
              <div className="insight-stats">
                <div className="stat">
                  <span className="label">Correct Rate:</span>
                  <span className="value">{insight.correctRate}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminExamResults; 