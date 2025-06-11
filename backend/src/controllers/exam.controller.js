const Exam = require('../models/ExamModel');
const asyncHandler = require('express-async-handler');

// @desc    Create a new exam
// @route   POST /api/exams
// @access  Private/Admin
const createExam = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        subjectId,
        startDate,
        endDate,
        duration,
        questions,
        passingMarks
    } = req.body;

    const exam = await Exam.create({
        title,
        description,
        subjectId,
        startDate,
        endDate,
        duration,
        questions,
        passingMarks,
        createdBy: req.user._id
    });

    res.status(201).json(exam);
});

// @desc    Get all exams
// @route   GET /api/exams
// @access  Private/Admin
const getExams = asyncHandler(async (req, res) => {
    const exams = await Exam.find({})
        .populate('subjectId', 'name')
        .populate('createdBy', 'name');
    res.json(exams);
});

// @desc    Get exam by ID
// @route   GET /api/exams/:id
// @access  Public
const getExamById = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.id)
        .populate('subjectId', 'name')
        .populate('createdBy', 'name');

    if (exam) {
        res.json(exam);
    } else {
        res.status(404);
        throw new Error('Exam not found');
    }
});

// @desc    Get exams by subject
// @route   GET /api/exams/subject/:subjectId
// @access  Public
const getExamsBySubject = asyncHandler(async (req, res) => {
    const exams = await Exam.find({ subjectId: req.params.subjectId })
        .populate('subjectId', 'name')
        .populate('createdBy', 'name');
    res.json(exams);
});

// @desc    Update exam
// @route   PUT /api/exams/:id
// @access  Private/Admin
const updateExam = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        startDate,
        endDate,
        duration,
        questions,
        passingMarks,
        isActive
    } = req.body;

    const exam = await Exam.findById(req.params.id);

    if (exam) {
        exam.title = title || exam.title;
        exam.description = description || exam.description;
        exam.startDate = startDate || exam.startDate;
        exam.endDate = endDate || exam.endDate;
        exam.duration = duration || exam.duration;
        exam.questions = questions || exam.questions;
        exam.passingMarks = passingMarks || exam.passingMarks;
        exam.isActive = isActive !== undefined ? isActive : exam.isActive;

        const updatedExam = await exam.save();
        res.json(updatedExam);
    } else {
        res.status(404);
        throw new Error('Exam not found');
    }
});

// @desc    Delete exam
// @route   DELETE /api/exams/:id
// @access  Private/Admin
const deleteExam = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.id);

    if (exam) {
        await exam.deleteOne();
        res.json({ message: 'Exam removed' });
    } else {
        res.status(404);
        throw new Error('Exam not found');
    }
});

module.exports = {
    createExam,
    getExams,
    getExamById,
    updateExam,
    deleteExam,
    getExamsBySubject
}; 