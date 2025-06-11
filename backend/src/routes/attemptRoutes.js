const express = require('express');
const router = express.Router();
const Attempt = require('../models/AttemptModel');
const Exam = require('../models/ExamModel');
const { auth, adminAuth } = require('../../middleware/authMiddleware');

// Get all attempts for a user
router.get('/user/:userId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.userId) {
      return res.status(403).json({ message: 'Not authorized to view these attempts' });
    }
    const attempts = await Attempt.find({ user: req.params.userId })
      .populate('exam', 'title subject')
      .populate('user', 'name email')
      .sort({ endTime: -1 });
    res.json(attempts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get attempts by exam ID
router.get('/exam/:examId', auth, async (req, res) => {
  try {
    // If user is admin, return all attempts for the exam
    const query = { exam: req.params.examId };
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    }

    const attempts = await Attempt.find(query)
      .populate('user', 'name rollNo')
      .sort({ endTime: -1 });

    // Return empty array if no attempts found
    res.json(attempts || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get attempt by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.id)
      .populate('exam', 'title subject questions')
      .populate('user', 'name email');
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }
    if (req.user.role !== 'admin' && attempt.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this attempt' });
    }
    res.json(attempt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Start new attempt
router.post('/start', auth, async (req, res) => {
  try {
    const { examId } = req.body;
    const exam = await Exam.findById(examId);
    if (!exam || !exam.isActive) {
      return res.status(400).json({ message: 'Exam not available' });
    }
    const existingAttempt = await Attempt.findOne({
      user: req.user._id,
      exam: examId,
      status: 'in_progress'
    });
    if (existingAttempt) {
      return res.status(200).json(existingAttempt);
    }
    const attempt = new Attempt({
      user: req.user._id,
      exam: examId,
      startTime: new Date(),
      status: 'in_progress',
      answers: []
    });
    await attempt.save();
    res.status(201).json(attempt);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Save progress
router.post('/:id/progress', auth, async (req, res) => {
  try {
    const { answers, currentIndex, timeLeft } = req.body;
    const attempt = await Attempt.findById(req.params.id);
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }
    if (attempt.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this attempt' });
    }
    if (attempt.status !== 'in_progress') {
      return res.status(400).json({ message: 'Attempt already completed' });
    }
    attempt.answers = answers;
    attempt.lastSavedIndex = currentIndex;
    attempt.timeLeft = timeLeft;
    await attempt.save();
    res.json(attempt);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update attempt
router.put('/:id', auth, async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.id);
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }
    if (attempt.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this attempt' });
    }
    if (attempt.status !== 'in_progress') {
      return res.status(400).json({ message: 'Cannot update completed attempt' });
    }

    const { answers, lastSavedIndex, timeLeft } = req.body;
    if (answers) attempt.answers = answers;
    if (lastSavedIndex !== undefined) attempt.lastSavedIndex = lastSavedIndex;
    if (timeLeft !== undefined) attempt.timeLeft = timeLeft;

    await attempt.save();
    res.json(attempt);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Submit attempt
router.post('/:id/submit', auth, async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.id);
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }
    if (attempt.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to submit this attempt' });
    }
    if (attempt.status !== 'in_progress') {
      return res.status(400).json({ message: 'Attempt already submitted' });
    }

    const { answers, endTime } = req.body;
    attempt.answers = answers;
    attempt.endTime = endTime || new Date();
    attempt.status = 'completed';

    // Calculate time taken in minutes
    const startTime = new Date(attempt.startTime);
    const endTimeDate = new Date(attempt.endTime);
    const timeDiffMs = endTimeDate - startTime;
    attempt.timeTaken = Math.round(timeDiffMs / (1000 * 60)); // Convert to minutes and round

    // Calculate score
    const exam = await Exam.findById(attempt.exam);
    if (exam) {
      let totalScore = 0;
      let totalMarks = 0;
      answers.forEach(answer => {
        const question = exam.questions[answer.questionIndex];
        if (question && answer.selectedOption === question.correctAnswer) {
          totalScore += question.marks;
        }
        totalMarks += question.marks;
      });
      attempt.score = totalScore;
      attempt.totalMarksObtained = totalScore;
      attempt.status = totalScore >= exam.passingMarks ? 'Pass' : 'Fail';
    }

    await attempt.save();
    res.json(attempt);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Abandon attempt
router.post('/:id/abandon', auth, async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.id);
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }
    if (attempt.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to abandon this attempt' });
    }
    if (attempt.status !== 'in_progress') {
      return res.status(400).json({ message: 'Attempt already completed or abandoned' });
    }
    attempt.status = 'abandoned';
    await attempt.save();
    res.json(attempt);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete attempt (admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.id);
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }
    await Attempt.findByIdAndDelete(req.params.id);
    res.json({ message: 'Attempt deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Save assignment attempt status
router.post('/assignment-status', auth, async (req, res) => {
  try {
    const { assignmentId, subjectId, status } = req.body;
    const userId = req.user._id;
    if (!assignmentId || !subjectId || !status) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    let attempt = await Attempt.findOne({
      user: userId,
      assignment: assignmentId,
      subject: subjectId
    });
    if (attempt) {
      attempt.status = status;
      await attempt.save();
    } else {
      attempt = new Attempt({
        user: userId,
        assignment: assignmentId,
        subject: subjectId,
        status: status,
        startTime: new Date(),
        answers: []
      });
      await attempt.save();
    }
    res.json({ success: true, attempt });
  } catch (err) {
    console.error('Error saving attempt status:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get user's assignment attempts
router.get('/user-assignments/:subjectId', auth, async (req, res) => {
  try {
    const attempts = await Attempt.find({
      user: req.user._id,
      subject: req.params.subjectId
    });
    res.json(attempts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new attempt
router.post('/', auth, async (req, res) => {
  try {
    const {
      user,
      exam,
      answers,
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
    } = req.body;
    const existingAttempt = await Attempt.findOne({
      user: user,
      exam: exam
    });
    if (existingAttempt) {
      return res.status(400).json({ 
        message: 'You have already attempted this exam. Only one attempt is allowed.' 
      });
    }
    const attempt = new Attempt({
      user,
      exam,
      answers,
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
    const savedAttempt = await attempt.save();
    res.status(201).json(savedAttempt);
  } catch (err) {
    console.error('Error creating attempt:', err);
    res.status(400).json({ message: err.message });
  }
});

module.exports = router; 