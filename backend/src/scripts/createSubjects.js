require('dotenv').config();
const mongoose = require('mongoose');
const Subject = require('../models/SubjectModel');

const subjects = [
  {
    name: "BO CDA 102: Mathematics-II",
    code: "102",
    description: "Mathematics-II course",
    duration: 60,
    passingMarks: 35,
    totalQuestions: 50
  },
  {
    name: "BO CDA 104: Programming & Data Structures with Python",
    code: "104",
    description: "Programming & Data Structures with Python course",
    duration: 60,
    passingMarks: 35,
    totalQuestions: 50
  },
  {
    name: "BO CDA 105: Foundation of Data Analytics",
    code: "105",
    description: "Foundation of Data Analytics course",
    duration: 60,
    passingMarks: 35,
    totalQuestions: 50
  },
  {
    name: "BO CDA 106: Numerical Methods for Data Science",
    code: "106",
    description: "Numerical Methods for Data Science course",
    duration: 60,
    passingMarks: 35,
    totalQuestions: 50
  }
];

const createSubjects = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing subjects
    await Subject.deleteMany({});
    console.log('Cleared existing subjects');

    // Optional: Set a default admin ID if needed
    const adminId = '68404e678f9fd5d82902d1b1'; // Replace with your actual admin ID if needed

    // Add createdBy field to each subject if adminId is provided
    const subjectsWithAdmin = subjects.map(subject => ({
      ...subject,
      createdBy: adminId
    }));

    // Insert subjects
    const result = await Subject.insertMany(subjectsWithAdmin);
    console.log('Subjects created successfully:', result);

  } catch (error) {
    console.error('Error creating subjects:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

createSubjects(); 