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
        
        // Debug: Log exam data
        console.log('Exam data:', examResponse.data);
        console.log('Passing marks:', examResponse.data.passingMarks);
        console.log('Total questions:', examResponse.data.questions.length);

        // Fetch attempts
        const attemptsResponse = await axios.get(`http://localhost:5000/api/attempts/exam/${examId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setAttempts(attemptsResponse.data);
        
        // Debug: Log attempts data
        console.log('Attempts data:', attemptsResponse.data);
        attemptsResponse.data.forEach((attempt, index) => {
          if (attempt.status === 'completed') {
            const correctAnswers = calculateCorrectAnswers(attempt, examResponse.data);
            const percentage = (correctAnswers / examResponse.data.questions.length) * 100;
            console.log(`Attempt ${index + 1}: ${correctAnswers}/${examResponse.data.questions.length} = ${percentage.toFixed(1)}% (Passing: ${examResponse.data.passingMarks}%)`);
          }
        });

        // Calculate statistics
        const totalAttempts = attemptsResponse.data.length;
        const passCount = attemptsResponse.data.filter(a => {
          if (a.status !== 'completed') return false;
          const correctAnswers = calculateCorrectAnswers(a, examResponse.data);
          const percentage = (correctAnswers / examResponse.data.questions.length) * 100;
          return percentage >= examResponse.data.passingMarks;
        }).length;
        const failCount = attemptsResponse.data.filter(a => {
          if (a.status !== 'completed') return false;
          const correctAnswers = calculateCorrectAnswers(a, examResponse.data);
          const percentage = (correctAnswers / examResponse.data.questions.length) * 100;
          return percentage < examResponse.data.passingMarks;
        }).length;
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
          let correctCount = 0;
          let answeredCount = 0;
          completedAttempts.forEach(attempt => {
            const answer = attempt.answers.find(a => (a.questionIndex !== undefined ? a.questionIndex : a.question) === index);
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
            const hasAnswered = studentSelectedIndex !== -1;
            if (hasAnswered) {
              answeredCount++;
              if (studentSelectedIndex === question.correctAnswer) {
                correctCount++;
              }
            }
          });
          const correctRate = answeredCount > 0 ? (correctCount / answeredCount) * 100 : 0;
          return {
            questionNumber: index + 1,
            questionText: question.questionText || question.question,
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

  const formatTimeTaken = (start, end) => {
    if (!start || !end) return 'N/A';
    const diffMs = new Date(end) - new Date(start);
    if (isNaN(diffMs) || diffMs < 0) return 'N/A';
    const totalSeconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes} min ${seconds} sec`;
  };

  const calculateCorrectAnswers = (attempt, exam) => {
    let correctCount = 0;
    exam.questions.forEach((question, index) => {
      const answer = attempt.answers.find(a => (a.questionIndex !== undefined ? a.questionIndex : a.question) === index);
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
      
      const hasAnswered = studentSelectedIndex !== -1;
      
      if (hasAnswered && studentSelectedIndex === question.correctAnswer) {
        correctCount++;
      }
    });
    return correctCount;
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
            <div className="summary-value">{exam.questions.length}</div>
          </div>
          <div className="summary-card">
            <h3>Passing Marks</h3>
            <div className="summary-value">{exam.passingMarks}%</div>
          </div>
          <div className="summary-card">
            <h3>Students Attempted</h3>
            <div className="summary-value">{stats.totalAttempts}</div>
          </div>
          <div className="summary-card">
            <h3>Submission Deadline</h3>
            <div className="summary-value">{formatDate(exam.endDate)}</div>
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
                <th>Attempt</th>
                <th>Score</th>
                <th>Status</th>
                <th>Time Taken</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Group attempts by student */}
              {(() => {
                // Group attempts by user._id
                const grouped = {};
                attempts.forEach((attempt) => {
                  const userId = attempt.user._id;
                  if (!grouped[userId]) grouped[userId] = [];
                  grouped[userId].push(attempt);
                });
                // For each student, sort their attempts by endTime ascending (oldest first)
                Object.values(grouped).forEach(arr => arr.sort((a, b) => new Date(a.endTime || a.startTime) - new Date(b.endTime || b.startTime)));
                // Flatten for rendering, keeping track of attempt number and latest
                let srNo = 1;
                const rows = [];
                Object.values(grouped).forEach((studentAttempts) => {
                  studentAttempts.forEach((attempt, idx) => {
                    const isLatest = idx === studentAttempts.length - 1;
                    const attemptNumber = idx + 1;
                const correctAnswers = calculateCorrectAnswers(attempt, exam);
                    rows.push(
                      <tr key={attempt._id} className={isLatest ? 'latest-attempt-row' : ''}>
                        <td>{srNo++}</td>
                    <td><strong>{attempt.user.name}</strong></td>
                    <td>{attempt.user.rollNo}</td>
                        <td>{attemptNumber}{attemptNumber === 1 ? 'st' : attemptNumber === 2 ? 'nd' : attemptNumber === 3 ? 'rd' : 'th'}</td>
                    <td>{correctAnswers} / {exam.questions.length} ({(correctAnswers / exam.questions.length * 100).toFixed(1)}%)</td>
                    <td>
                      <span className={`status-badge ${attempt.status}`}>
                        {attempt.status === 'in_progress' ? 'In Progress' : 
                         attempt.status === 'completed' ? 
                           (() => {
                             const percentage = (correctAnswers / exam.questions.length) * 100;
                             return percentage >= exam.passingMarks ? 'Pass' : 'Fail';
                           })() : 'Fail'}
                      </span>
                    </td>
                    <td>
                      {attempt.status === 'in_progress' ? 
                        'Ongoing' : 
                        formatTimeTaken(attempt.startTime, attempt.endTime)
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
                        <button 
                          className="delete-btn"
                          onClick={() => handleDeleteAttempt(attempt._id)}
                          title="Delete Attempt"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
                  });
                });
                return rows;
              })()}
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
              <p className="question-text">{insight.questionText}</p>
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