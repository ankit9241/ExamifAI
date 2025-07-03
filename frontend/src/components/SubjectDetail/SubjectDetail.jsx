import { useNavigate, useParams } from "react-router-dom";
import "./SubjectDetail.css";
import { useState, useEffect } from "react";
import { api } from '../../services/api';

const formatDate = (dateString) =>
  new Date(dateString).toLocaleString("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
  });

function CourseAssignments() {
  const navigate = useNavigate();
  const { subjectId } = useParams();
  const [assignments, setAssignments] = useState([]);
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load exams and subject details in a single effect
  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please log in to view exams');
          return;
        }

        // Get subject details
        const subjectResponse = await api.get(`/api/subjects/${subjectId}`);
        setSubjectName(subjectResponse.data.name);
        setSubjectCode(subjectResponse.data.code || subjectResponse.data.subjectCode);

        // Get exams with attempt status in a single request
        const response = await api.get(`/api/exams/subject/${subjectId}`);
        
        // Format exams with attempt status
        const formattedExams = response.data.map(exam => ({
          id: exam._id,
          title: exam.title,
          openTime: exam.startDate,
          closeTime: exam.endDate,
          duration: exam.duration,
          totalQuestions: exam.questions.length,
          description: exam.description,
          attempted: exam.attemptStatus === 'completed' || exam.attemptStatus === 'attempted',
          score: exam.score,
          attemptDate: exam.attemptDate
        }));

        setAssignments(formattedExams);
      } catch (error) {
        // If 404 and message is 'No exams found for this subject', treat as empty list
        if (error.response && error.response.status === 404 && error.response.data && error.response.data.message && error.response.data.message.includes('No exams found')) {
          setAssignments([]);
        } else if (error.response?.status === 401) {
          setError('Your session has expired. Please log in again.');
        } else {
          setError('Failed to load data. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [subjectId]);

  const handleTitleClick = (item) => {
    navigate("/exam-details", {
      state: {
        courseName: subjectName,
        subjectCode: subjectCode,
        examId: item.id,
        openTime: item.openTime,
        closeTime: item.closeTime,
        duration: item.duration,
        totalQuestions: item.totalQuestions,
        description: item.description
      },
    });
  };

  const toggleAttempted = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to update status');
        return;
      }

      const assignment = assignments.find(a => a.id === id);
      if (!assignment) {
        setError('Assignment not found');
        return;
      }

      const newStatus = !assignment.attempted ? 'completed' : 'attempted';
      
      const response = await api.post('/attempts/assignment-status', {
        assignmentId: id,
        subjectId: subjectId,
        status: newStatus
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        // Update local state after successful save
        setAssignments(prev =>
          prev.map(item =>
            item.id === id ? { ...item, attempted: !item.attempted } : item
          )
        );
      }
    } catch (error) {
      // Only log actual errors, not expected error responses
      if (!error.response || error.response.status !== 400) {
        console.error('Error updating attempt status:', error);
      }
      setError('Failed to update status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const completedCount = assignments.filter(a => a.attempted).length;

  if (loading) {
    return (
      <div className="assignment-container">
        <div className="loading-message">Loading exams...</div>
      </div>
    );
  }

  return (
    <div className="assignment-container">
      {error && (
        <div className="error-message" style={{ 
          color: 'red', 
          padding: '10px', 
          margin: '10px 0',
          backgroundColor: '#ffebee',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}
      <div className="subject-header">
        <div className="subject-info">
          <h1>{subjectName}</h1>
        </div>
        <div className="subject-stats">
          <div className="stat-item">
            <span className="stat-label">Total Assignments</span>
            <span className="stat-value">{assignments.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Completed</span>
            <span className="stat-value">{completedCount}</span>
          </div>
        </div>
      </div>
      <h2 className="assignment-header">Assessment: Assignment/Exams/Quiz</h2>
      {assignments.length === 0 ? (
        <div className="no-assignments" style={{ 
          textAlign: 'center', 
          padding: '20px',
          color: '#666'
        }}>
          No assignments or exams available for this subject.
        </div>
      ) : (
        assignments.map((item) => (
          <div className="assignment-card" key={item.id}>
            <div className="card-header">
              <div className="left-section">
                <div
                  className="icon-box"
                  onClick={() => !loading && toggleAttempted(item.id)}
                  style={{ 
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1,
                    backgroundColor: item.attempted ? '#4caf50' : '#f36ca0'
                  }}
                  title={item.attempted ? "Mark as not done" : "Mark as done"}
                >
                  ✓
                </div>
                <div
                  className="assignment-title"
                  onClick={() => handleTitleClick(item)}
                  style={{ cursor: "pointer" }}
                >
                  {item.title}
                </div>
              </div>
              <button
                className={`mark-done-button ${item.attempted ? "done" : ""}`}
                onClick={() => !loading && toggleAttempted(item.id)}
                disabled={loading}
              >
                {loading ? "Updating..." : (item.attempted ? "Done" : "Mark as done")}
              </button>
            </div>
            <div className="card-body">
              {item.description && <p className="description">{item.description}</p>}
              {item.duration && (
                <p>
                  <strong>Duration:</strong> {item.duration} minutes
                </p>
              )}
              {item.totalQuestions && (
                <p>
                  <strong>Total Questions:</strong> {item.totalQuestions}
                </p>
              )}
              <p>
                <strong>Opened:</strong> {formatDate(item.openTime)}
              </p>
              <p>
                <strong>Closed:</strong> {formatDate(item.closeTime)}
              </p>
              {item.attempted && item.attemptDate && (
                <p>
                  <strong>Attempted on:</strong> {formatDate(item.attemptDate)}
                </p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default CourseAssignments;
