import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx';
import { FaEllipsisV } from 'react-icons/fa';
import "./AdminSubjectDetails.css";

const formatDate = (dateString) => {
  if (!dateString) return "Not set";
  const date = new Date(dateString);
  return isNaN(date.getTime())
    ? "Invalid Date"
    : date.toLocaleString("en-IN", {
        dateStyle: "full",
        timeStyle: "short",
      });
};

const AdminSubjectDetails = ({ subjectId }) => {
  const navigate = useNavigate();
  const [subject, setSubject] = useState(null);
  const [exams, setExams] = useState([]);
  const [showCreateExam, setShowCreateExam] = useState(false);
  const [uploadMethod, setUploadMethod] = useState('excel'); // Changed default to excel
  const [excelQuestions, setExcelQuestions] = useState([]);
  const [excelFile, setExcelFile] = useState(null);
  const [excelFileName, setExcelFileName] = useState('');
  const [manualQuestion, setManualQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: ''
  });
  const [questions, setQuestions] = useState([]);
  const [editingExamId, setEditingExamId] = useState(null);
  const [editedExam, setEditedExam] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  useEffect(() => {
    // Validate and format subject ID
    if (!subjectId) {
      console.error('Subject ID is missing');
      alert('Subject ID is missing. Please try again.');
      return;
    }

    // Load subject data
    const fetchSubject = async () => {
      try {
        console.log('Fetching subject with ID:', subjectId);
        const response = await fetch(`http://localhost:5000/api/subjects/${subjectId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Server response:', errorData);
          throw new Error(errorData.message || 'Failed to fetch subject');
        }

        const subjectData = await response.json();
        console.log('Fetched subject data:', subjectData); // Add logging
        setSubject(subjectData);
      } catch (error) {
        console.error('Error loading subject:', error);
        alert('Error loading subject details. Please try again.');
      }
    };

    fetchSubject();

    // Load existing exams for this subject
    const fetchExams = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/exams/subject/${subjectId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          // If 404 and message is 'No exams found for this subject', treat as empty list
          if (response.status === 404 && errorData.message && errorData.message.includes('No exams found')) {
            setExams([]);
            return;
          }
          throw new Error(errorData.message || 'Failed to fetch exams');
        }

        const data = await response.json();
        console.log('Fetched exams data:', data); // Add logging
        
        // Debug: Log each exam's date fields
        data.forEach((exam, index) => {
          console.log(`Exam ${index + 1} (${exam.title}):`);
          console.log('  startDate:', exam.startDate);
          console.log('  endDate:', exam.endDate);
          console.log('  startDate type:', typeof exam.startDate);
          console.log('  endDate type:', typeof exam.endDate);
        });
        
        setExams(data);
      } catch (error) {
        console.error('Error loading exams:', error);
        if (error.message === 'Failed to fetch') {
          alert('Unable to connect to the server. Please make sure the backend server is running.');
        } else {
          alert(error.message || 'Error loading exams. Please try again.');
        }
        setExams([]);
      }
    };

    fetchExams();
  }, [subjectId]);

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeMenuId && !event.target.closest('.menu-container')) {
        setActiveMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuId]);

  const toggleMenu = (examId, event) => {
    event.stopPropagation();
    setActiveMenuId(activeMenuId === examId ? null : examId);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
        setExcelFile(file);
        setExcelFileName(file.name);
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const workbook = XLSX.read(event.target.result, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const data = XLSX.utils.sheet_to_json(worksheet);
                
                console.log('Raw Excel data:', data);
                
                if (data.length === 0) {
                    alert('The Excel file is empty');
                    return;
                }

                const formattedQuestions = data.map((row, index) => {
                    // Validate required fields
                    if (!row.question || !row.option1 || !row.option2 || !row.option3 || !row.option4) {
                        throw new Error(`Row ${index + 1}: Missing required fields (question, option1, option2, option3, option4)`);
                    }

                    // Process correct answer - handle different formats
                    let correctAnswerIndex = -1;
                    const correctAnswerValue = row.correctAnswer;
                    
                    if (correctAnswerValue === undefined || correctAnswerValue === null || correctAnswerValue === '') {
                        throw new Error(`Row ${index + 1}: Correct answer is missing`);
                    }

                    // Try different formats for correct answer
                    if (typeof correctAnswerValue === 'number') {
                        // If it's already a number (1-4), convert to 0-based index
                        if (correctAnswerValue >= 1 && correctAnswerValue <= 4) {
                            correctAnswerIndex = correctAnswerValue - 1;
                        } else {
                            throw new Error(`Row ${index + 1}: Correct answer number must be between 1 and 4`);
                        }
                    } else if (typeof correctAnswerValue === 'string') {
                        // If it's a string, try to parse it
                        const trimmedValue = correctAnswerValue.trim().toUpperCase();
                        
                        // Handle letter format (A, B, C, D)
                        if (['A', 'B', 'C', 'D'].includes(trimmedValue)) {
                            correctAnswerIndex = ['A', 'B', 'C', 'D'].indexOf(trimmedValue);
                        } else {
                            // Try to parse as number
                            const numValue = parseInt(trimmedValue);
                            if (!isNaN(numValue) && numValue >= 1 && numValue <= 4) {
                                correctAnswerIndex = numValue - 1;
                            } else {
                                throw new Error(`Row ${index + 1}: Invalid correct answer format. Use 1-4 or A-D`);
                            }
                        }
                    } else {
                        throw new Error(`Row ${index + 1}: Invalid correct answer format. Use 1-4 or A-D`);
                    }

                    return {
                        question: row.question.trim(),
                        options: [
                            row.option1.trim(),
                            row.option2.trim(),
                            row.option3.trim(),
                            row.option4.trim()
                        ],
                        correctAnswer: correctAnswerIndex
                    };
                });

                console.log('Formatted questions:', formattedQuestions);
                console.log('Sample question structure:', formattedQuestions[0]);
                console.log('Correct answer validation:', formattedQuestions.map((q, i) => ({
                  questionIndex: i,
                  correctAnswer: q.correctAnswer,
                  correctAnswerText: q.options[q.correctAnswer],
                  options: q.options
                })));

                setExcelQuestions(formattedQuestions);
                setQuestions(formattedQuestions);
            } catch (error) {
                console.error('Error reading Excel file:', error);
                alert(`Error reading Excel file: ${error.message}`);
                // Reset file selection on error
                setExcelFile(null);
                setExcelFileName('');
                setExcelQuestions([]);
                setQuestions([]);
            }
        };
        reader.readAsBinaryString(file);
    }
  };

  const removeExcelFile = () => {
    setExcelFile(null);
    setExcelFileName('');
    setExcelQuestions([]);
    setQuestions([]);
  };

  const handleManualQuestionChange = (e, index) => {
    const { name, value } = e.target;
    if (name === 'option') {
      const newOptions = [...manualQuestion.options];
      newOptions[index] = value;
      setManualQuestion({ ...manualQuestion, options: newOptions });
    } else {
      setManualQuestion({ ...manualQuestion, [name]: value });
    }
  };

  const addManualQuestion = () => {
    // For the first question, require all fields
    if (questions.length === 0) {
      if (!manualQuestion.question || !manualQuestion.options.every(opt => opt) || !manualQuestion.correctAnswer) {
        alert('Please fill in all fields for the first question');
        return;
      }
    }

    // Add the question if there's any content
    if (manualQuestion.question || manualQuestion.options.some(opt => opt)) {
      setQuestions([...questions, manualQuestion]);
    }

    // Reset the form
    setManualQuestion({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: ''
    });
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    
    if (questions.length === 0) {
      alert('Please add at least one question before creating the exam');
      return;
    }

    // Validate that all questions have valid correct answers
    const invalidQuestions = questions.filter((q, index) => 
      q.correctAnswer === undefined || 
      q.correctAnswer === null || 
      q.correctAnswer < 0 || 
      q.correctAnswer >= q.options.length
    );

    if (invalidQuestions.length > 0) {
      alert(`Questions ${invalidQuestions.map(q => questions.indexOf(q) + 1).join(', ')} have invalid correct answers. Please fix them before creating the exam.`);
      return;
    }

    try {
      const formData = new FormData(e.target);
      
      // Debug: Log the raw form data
      console.log('Raw form data:');
      console.log('startDate:', formData.get('startDate'));
      console.log('endDate:', formData.get('endDate'));
      
      const examData = {
        title: formData.get('title'),
        description: formData.get('description'),
        subject: subjectId,
        startDate: new Date(formData.get('startDate')).toISOString(),
        endDate: new Date(formData.get('endDate')).toISOString(),      
        duration: parseInt(formData.get('duration')),
        maxAttempts: parseInt(formData.get('maxAttempts')),
        questions: questions.map(q => ({
          questionText: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          marks: 1 // Each question worth 1 mark by default
        })),
        totalMarks: questions.length, // Total marks equals number of questions
        passingMarks: 35, // Default passing marks
        isActive: true
      };

      // Debug: Log the processed exam data
      console.log('Creating exam with data:', examData);
      console.log('startDate ISO:', examData.startDate);
      console.log('endDate ISO:', examData.endDate);
      console.log('Questions being sent to backend:', examData.questions);
      if (examData.questions.length > 0) {
        console.log('First question structure being sent:', examData.questions[0]);
      }

      const response = await fetch('http://localhost:5000/api/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(examData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create exam');
      }

      const newExam = await response.json();
      console.log('Created exam:', newExam);
      
      // Update state
      setExams(prevExams => [...prevExams, newExam]);
      
      // Reset form
      setShowCreateExam(false);
      setQuestions([]);
      setExcelQuestions([]);
      setManualQuestion({
        question: '',
        options: ['', '', '', ''],
        correctAnswer: ''
      });

      // Show success message
      alert('Exam created successfully!');
    } catch (error) {
      console.error('Error creating exam:', error);
      alert(error.message || 'Error creating exam. Please try again.');
    }
  };

  const handleViewResults = (examId) => {
    console.log('Viewing results for exam:', examId);
    if (!examId) {
      alert('Invalid exam ID');
      return;
    }
    navigate(`/admin/exam-results/${examId}`);
  };

  const handleDeleteExam = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/exams/${examId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete exam');
      }

      // Remove the deleted exam from state
      setExams(prevExams => prevExams.filter(exam => exam._id !== examId));
      alert('Exam deleted successfully');
    } catch (error) {
      console.error('Error deleting exam:', error);
      alert(error.message || 'Error deleting exam. Please try again.');
    }
  };

  const handleSaveEdit = async (examId) => {
    try {
      // Debug: Log the original edited exam data
      console.log('Original editedExam:', editedExam);
      
      // Convert datetime-local values to ISO strings
      const examDataToUpdate = {
        ...editedExam,
        startDate: new Date(editedExam.startDate).toISOString(),
        endDate: new Date(editedExam.endDate).toISOString(),
        maxAttempts: parseInt(editedExam.maxAttempts) || 1
      };

      // Debug: Log the processed update data
      console.log('Updating exam with data:', examDataToUpdate);
      console.log('startDate ISO:', examDataToUpdate.startDate);
      console.log('endDate ISO:', examDataToUpdate.endDate);

      const response = await fetch(`http://localhost:5000/api/exams/${examId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(examDataToUpdate)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update exam');
      }

      const updatedExam = await response.json();
      console.log('Updated exam response:', updatedExam);
      
      setExams(prevExams => 
        prevExams.map(exam => 
          exam._id === examId ? { ...exam, ...updatedExam } : exam
        )
      );
      setEditingExamId(null);
      setEditedExam(null);
      alert('Exam updated successfully');
    } catch (error) {
      console.error('Error updating exam:', error);
      alert(error.message || 'Error updating exam. Please try again.');
    }
  };

  const handleEditExam = (exam) => {
    setEditingExamId(exam._id);
    // Format dates to YYYY-MM-DDTHH:mm format
    const formatDateTime = (dateString) => {
      if (!dateString) return '';
      try {
        // Parse date string and ensure it's in the correct format
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          // If invalid, return current date in correct format
          return new Date().toISOString().slice(0, 16);
        }
        return date.toISOString().slice(0, 16);
      } catch (error) {
        console.error('Error formatting date:', error);
        // Return current date as fallback
        return new Date().toISOString().slice(0, 16);
      }
    };

    const startDate = formatDateTime(exam.startDate || new Date().toISOString());
    const endDate = formatDateTime(exam.endDate || new Date().toISOString());

    setEditedExam({
      title: exam.title,
      description: exam.description,
      duration: exam.duration,
      startDate,
      endDate,
      maxAttempts: exam.maxAttempts || 1
    });
  };

  const handleCancelEdit = () => {
    setEditingExamId(null);
    setEditedExam(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditedExam(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getExamStatus = (exam) => {
    const now = new Date();
    const startDate = new Date(exam.startDate);
    const endDate = new Date(exam.endDate);

    // Check if exam is active
    if (!exam.isActive) {
      return 'inactive';
    }

    // Check if exam is in draft (no questions)
    if (!exam.questions || exam.questions.length === 0) {
      return 'draft';
    }

    // Check time-based status
    if (now < startDate) {
      return 'upcoming';
    } else if (now >= startDate && now <= endDate) {
      return 'active';
    } else {
      return 'completed';
    }
  };

  if (!subject) {
    return <div>Loading...</div>;
  }

  return (
    <div className="admin-subject-details">
      <div className="subject-header">
        <h1>{subject.name}</h1>
        <button className="create-exam-btn" onClick={() => setShowCreateExam(true)}>
          Create New Exam
        </button>
      </div>

      {showCreateExam && (
        <div className="create-exam-modal">
          <div className="create-exam-content">
            <h2>Create New Exam</h2>
            <form onSubmit={handleCreateExam}>
              <div className="form-group">
                <label htmlFor="title">Exam Title</label>
                <input type="text" id="title" name="title" required />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  required
                  placeholder="Enter exam description"
                ></textarea>
              </div>
              <div className="form-group">
                <label htmlFor="startDate">Start Date</label>
                <input 
                  type="datetime-local" 
                  id="startDate" 
                  name="startDate" 
                  required 
                  max="9999-12-31T23:59"
                  min="2000-01-01T00:00"
                />
              </div>
              <div className="form-group">
                <label htmlFor="endDate">End Date</label>
                <input 
                  type="datetime-local" 
                  id="endDate" 
                  name="endDate" 
                  required 
                  max="9999-12-31T23:59"
                  min="2000-01-01T00:00"
                />
              </div>
              <div className="form-group">
                <label htmlFor="duration">Duration (minutes)</label>
                <input 
                  type="number" 
                  id="duration" 
                  name="duration" 
                  required 
                  min="1"
                  step="1"
                  onKeyDown={(e) => {
                    // Prevent decimal input
                    if (e.key === '.') {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="maxAttempts">Maximum Attempts Allowed</label>
                <input 
                  type="number" 
                  id="maxAttempts" 
                  name="maxAttempts" 
                  required 
                  min="1"
                  defaultValue="1"
                  step="1"
                  onKeyDown={(e) => {
                    // Prevent decimal input
                    if (e.key === '.') {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    // Ensure only whole numbers
                    const value = e.target.value;
                    if (value.includes('.')) {
                      e.target.value = Math.floor(value);
                    }
                  }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="uploadMethod">Question Upload Method</label>
                <select
                  id="uploadMethod"
                  name="uploadMethod"
                  value={uploadMethod}
                  onChange={(e) => setUploadMethod(e.target.value)}
                  className="upload-method-select"
                >
                  <option value="excel">Upload Excel File</option>
                  <option value="manual">Add Questions Manually</option>
                </select>
              </div>

              {uploadMethod === 'excel' ? (
                <div className="excel-upload">
                  <div className="excel-instructions">
                    <h4>Excel File Format Instructions:</h4>
                    <p>Your Excel file should have the following columns:</p>
                    <ul>
                      <li><strong>question</strong> - The question text</li>
                      <li><strong>option1</strong> - First option</li>
                      <li><strong>option2</strong> - Second option</li>
                      <li><strong>option3</strong> - Third option</li>
                      <li><strong>option4</strong> - Fourth option</li>
                      <li><strong>correctAnswer</strong> - Correct answer (use 1-4 or A-D)</li>
                    </ul>
                    <p><strong>Note:</strong> For correct answer, you can use either numbers (1, 2, 3, 4) or letters (A, B, C, D).</p>
                  </div>
                  {!excelFile ? (
                    <div className="file-upload" onClick={() => document.getElementById('excelFile').click()}>
                      <input
                        type="file"
                        id="excelFile"
                        accept=".xlsx, .xls"
                        onChange={handleFileUpload}
                      />
                      <label className="file-upload-label">
                        <i className="fas fa-file-excel"></i>
                        <span>Click to upload Excel file</span>
                        <span className="help-text">Supported formats: .xlsx, .xls</span>
                      </label>
                    </div>
                  ) : (
                    <div className="excel-preview">
                      <i className="fas fa-file-excel"></i>
                      <div className="excel-preview-info">
                        <h4>{excelFileName}</h4>
                        <p>{excelQuestions.length} questions loaded</p>
                      </div>
                      <button
                        type="button"
                        className="remove-file-btn"
                        onClick={removeExcelFile}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="manual-questions">
                  <h3>Add Questions Manually</h3>
                  <div className="manual-question-form">
                    <div className="form-group">
                      <label htmlFor="question">Question</label>
                      <textarea
                        id="question"
                        name="question"
                        value={manualQuestion.question}
                        onChange={(e) => handleManualQuestionChange(e)}
                        
                        placeholder="Enter your question"
                      ></textarea>
                    </div>
                    <div className="form-group">
                      <label>Options</label>
                      <div className="options-grid">
                        {manualQuestion.options.map((option, index) => (
                          <div key={index} className="form-group">
                            <label htmlFor={`option${index + 1}`}>Option {index + 1}</label>
                            <input
                              type="text"
                              id={`option${index + 1}`}
                              name="option"
                              value={option}
                              onChange={(e) => handleManualQuestionChange(e, index)}
                            
                              placeholder={`Enter option ${index + 1}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="correctAnswer">Correct Answer</label>
                      <select
                        id="correctAnswer"
                        name="correctAnswer"
                        value={manualQuestion.correctAnswer}
                        onChange={(e) => handleManualQuestionChange(e)}
                        
                      >
                        <option value="">Select correct answer</option>
                        {manualQuestion.options.map((option, index) => (
                          <option key={index} value={index}>
                            Option {index + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      className="add-question-btn"
                      onClick={addManualQuestion}
                    >
                      Add Question
                    </button>
                  </div>
                  {questions.length > 0 && (
                    <div className="questions-list">
                      <h3>Added Questions ({questions.length})</h3>
                      {questions.map((q, index) => (
                        <div key={`question-${index}`} className="question-item">
                          <h4>Question {index + 1}</h4>
                          <p>{q.question}</p>
                          <div className="options">
                            {q.options.map((option, optIndex) => (
                              <div
                                key={`option-${index}-${optIndex}`}
                                className={`option ${optIndex === q.correctAnswer ? 'correct-answer' : ''}`}
                              >
                                {option}
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            className="remove-question-btn"
                            onClick={() => removeQuestion(index)}
                          >
                            Remove Question
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={questions.length === 0}
                >
                  Create Exam
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowCreateExam(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="assignments-list">
        <h2>Available Exams</h2>
        {exams.length === 0 ? (
          <p className="no-exams">No exams available. Create a new exam to get started.</p>
        ) : (
          exams.map((exam) => (
            <div 
              key={`exam-${exam._id}`} 
              className={`assignment-card ${editingExamId === exam._id ? 'editing' : ''}`}
            >
              <div className="assignment-header">
                {editingExamId === exam._id ? (
                  <input
                    type="text"
                    name="title"
                    value={editedExam.title}
                    onChange={handleEditChange}
                    className="edit-input"
                    placeholder="Exam Title"
                  />
                ) : (
                  <h3>{exam.title}</h3>
                )}
                <div className="exam-actions">
                  {editingExamId === exam._id ? (
                    <>
                      <button
                        className="save-btn"
                        onClick={() => handleSaveEdit(exam._id)}
                      >
                        Save
                      </button>
                      <button
                        className="cancel-btn"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="view-results-btn"
                        onClick={() => handleViewResults(exam._id)}
                      >
                        View Results
                      </button>
                      <div className="menu-container">
                        <button
                          className="menu-trigger"
                          onClick={(e) => toggleMenu(exam._id, e)}
                          title="More options"
                        >
                          <FaEllipsisV />
                        </button>
                        {activeMenuId === exam._id && (
                          <div className="menu-dropdown">
                            <button
                              className="menu-item"
                              onClick={() => {
                                handleEditExam(exam);
                                setActiveMenuId(null);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="menu-item delete"
                              onClick={() => {
                                handleDeleteExam(exam._id);
                                setActiveMenuId(null);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="assignment-details">
                {editingExamId === exam._id ? (
                  <>
                    <textarea
                      name="description"
                      value={editedExam.description}
                      onChange={handleEditChange}
                      className="edit-textarea"
                      placeholder="Enter exam description..."
                    />
                    <div className="exam-info editing">
                      <div className="edit-field">
                        <label>Duration (minutes)</label>
                        <input
                          type="number"
                          name="duration"
                          value={editedExam.duration}
                          onChange={handleEditChange}
                          className="edit-input"
                          min="1"
                        />
                      </div>
                      <div className="edit-field">
                        <label>Start Date</label>
                        <input
                          type="datetime-local"
                          name="startDate"
                          value={editedExam.startDate || new Date().toISOString().slice(0, 16)}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (!value) return;
                            // Always store in ISO format
                            handleEditChange(e);
                          }}
                          min="2000-01-01T00:00"
                          max="2099-12-31T23:59"
                          className="edit-input"
                          required
                        />
                      </div>
                      <div className="edit-field">
                        <label>End Date</label>
                        <input
                          type="datetime-local"
                          name="endDate"
                          value={editedExam.endDate || new Date().toISOString().slice(0, 16)}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (!value) return;
                            // Always store in ISO format
                            handleEditChange(e);
                          }}
                          min="2000-01-01T00:00"
                          max="2099-12-31T23:59"
                          className="edit-input"
                          required
                        />
                      </div>
                      <div className="edit-field">
                        <label>Max Attempts</label>
                        <input
                          type="number"
                          name="maxAttempts"
                          value={editedExam.maxAttempts}
                          onChange={handleEditChange}
                          className="edit-input"
                          min="1"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="description">{exam.description}</p>
                    <div className="exam-info">
                      <p><strong>Duration:</strong> {exam.duration} minutes</p>
                      <p><strong>Start:</strong> {formatDate(exam.startDate)}</p>
                      <p><strong>End:</strong> {formatDate(exam.endDate)}</p>
                      <p><strong>Questions:</strong> {exam.questions.length}</p>
                      <p><strong>Status:</strong> <span className={`status ${getExamStatus(exam)}`}>{getExamStatus(exam)}</span></p>
                      <p><strong>Max Attempts:</strong> {exam.maxAttempts}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminSubjectDetails; 