const mongoose = require('mongoose');

const AttemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
  assignment: { type: String },
  subject: { type: String },
  answers: [{
    questionIndex: { type: Number, required: true },
    selectedOption: { type: Number },
    isCorrect: { type: Boolean },
    marksObtained: { type: Number }
  }],
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  score: { type: Number },
  totalMarksObtained: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['in_progress', 'completed', 'abandoned', 'attempted', 'Pass', 'Fail'],
    default: 'in_progress'
  },
  studentName: { type: String },
  studentEmail: { type: String },
  examName: { type: String },
  totalQuestions: { type: Number },
  answeredQuestions: { type: Number },
  timeTaken: { type: Number },
  lastSavedIndex: { type: Number, default: 0 },
  timeLeft: { type: Number },
  violationCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = AttemptSchema; 