const express = require('express');
const router = express.Router();
const Exam = require('../models/ExamModel');
const Subject = require('../models/SubjectModel');
const { auth, adminAuth } = require('../../middleware/authMiddleware');
const mongoose = require('mongoose');
const Attempt = require('../models/AttemptModel');

// Cleanup endpoint for development - remove all existing attempts
router.delete('/cleanup', auth, adminAuth, async (req, res) => {
  try {
    await Attempt.deleteMany({});
    res.status(200).json({ message: 'All attempts have been removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get exams by subject ID
router.get('/subject/:subjectId', auth, async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    // Find the subject first
    let subject;
    if (mongoose.Types.ObjectId.isValid(subjectId)) {
      subject = await Subject.findById(subjectId);
    } else {
      subject = await Subject.findOne({ code: subjectId });
    }

    if (!subject) {
      return res.status(404).json({ 
        message: 'Subject not found',
        receivedId: subjectId
      });
    }

    // Get all exams for the subject (questions are embedded, not a separate collection)
    const exams = await Exam.find({ subject: subject._id })
      .populate('subject', 'name code')
      .populate('createdBy', 'name email')
      .lean();

    if (!exams || exams.length === 0) {
      return res.status(404).json({ message: 'No exams found for this subject' });
    }

    // Get attempts for the current user
    const attempts = await Attempt.find({
      exam: { $in: exams.map(exam => exam._id) },
      user: req.user._id
    }).lean();

    // Combine exam data with attempt status
    const examsWithAttempts = exams.map(exam => {
      const attempt = attempts.find(a => a.exam.toString() === exam._id.toString());
      return {
        ...exam,
        attemptStatus: attempt ? attempt.status : null,
        attemptDate: attempt ? attempt.submittedAt : null,
        score: attempt ? attempt.score : null
      };
    });

    console.log(`Found ${examsWithAttempts.length} exams for subject:`, subjectId);
    
    // Debug: Log each exam's date fields
    examsWithAttempts.forEach((exam, index) => {
      console.log(`Exam ${index + 1} (${exam.title}):`);
      console.log('  startDate:', exam.startDate);
      console.log('  endDate:', exam.endDate);
      console.log('  startDate type:', typeof exam.startDate);
      console.log('  endDate type:', typeof exam.endDate);
    });
    
    res.json(examsWithAttempts);
  } catch (error) {
    console.error('Error in getExamsBySubject:', error);
    res.status(500).json({ 
      message: 'Error fetching exams', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get all exams
router.get('/', auth, async (req, res) => {
  try {
    const exams = await Exam.find()
      .populate('subject', 'name code')
      .populate('createdBy', 'name email');
    res.json(exams);
  } catch (err) {
    console.error('Error in GET / route:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get exam by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('subject', 'name code')
      .populate('createdBy', 'name email');
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    res.json(exam);
  } catch (err) {
    console.error('Error in GET /:id route:', err);
    res.status(500).json({ message: err.message });
  }
});

// Submit exam
router.post('/submit', auth, async (req, res) => {
  try {
    console.log('Received submission:', req.body);
    
    const { user, exam, answers, score, startTime, endTime, status, studentName, studentEmail, examName, totalQuestions, answeredQuestions, timeTaken } = req.body;

    if (!user || !exam || !answers || !score || !startTime || !endTime || !status) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Ensure all answers have valid format
    const formattedAnswers = answers.map((answer, index) => ({
      question: index, // Use index instead of _id since questions don't have IDs
      selectedAnswer: answer.selectedAnswer || 'Not Answered' // Ensure we always have a string
    }));

    // Create new attempt record
    const attempt = new Attempt({
      user,
      exam,
      answers: formattedAnswers, // Use the formatted answers
      score,
      startTime,
      endTime,
      status,
      studentName,
      studentEmail,
      examName,
      totalQuestions,
      answeredQuestions,
      timeTaken
    });

    console.log('Saving attempt:', attempt);
    const savedAttempt = await attempt.save();
    res.status(201).json(savedAttempt);
  } catch (error) {
    console.error('Error in POST /submit route:', error);
    if (error.code === 11000) { // Duplicate key error
      return res.status(400).json({ 
        message: 'An attempt for this exam already exists. Please try again.' 
      });
    }
    res.status(500).json({ 
      message: error.message, 
      details: error.errors ? Object.values(error.errors).map(e => e.message) : [] 
    });
  }
});

// Create new exam (admin only)
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    console.log('Creating exam with data:', req.body);
    console.log('startTime from request:', req.body.startTime);
    console.log('endTime from request:', req.body.endTime);
    
    const exam = new Exam({
      ...req.body,
      createdBy: req.user._id
    });
    
    console.log('Exam object before save:', exam);
    await exam.save();
    console.log('Exam saved successfully:', exam);
    
    res.status(201).json(exam);
  } catch (err) {
    console.error('Error in POST / route:', err);
    res.status(400).json({ 
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Update exam (admin only)
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    console.log('Updating exam with data:', req.body);
    console.log('startTime from request:', req.body.startTime);
    console.log('endTime from request:', req.body.endTime);
    
    const exam = await Exam.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    
    console.log('Exam updated successfully:', exam);
    res.json(exam);
  } catch (err) {
    console.error('Error in PUT /:id route:', err);
    res.status(400).json({ message: err.message });
  }
});

// Delete exam (admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    res.json({ message: 'Exam deleted successfully' });
  } catch (err) {
    console.error('Error in DELETE /:id route:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 