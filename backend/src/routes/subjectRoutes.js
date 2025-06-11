const express = require('express');
const router = express.Router();
const Subject = require('../models/SubjectModel');
const { auth, adminAuth } = require('../../middleware/authMiddleware');
const mongoose = require('mongoose');

// Get all subjects
router.get('/', auth, async (req, res) => {
  try {
    const subjects = await Subject.find()
      .populate('createdBy', 'name email')
      .lean();
    
    if (subjects.length === 0) {
      return res.json([]);
    }
    
    res.json(subjects);
  } catch (err) {
    console.error('Error in GET /subjects:', err);
    res.status(500).json({ 
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Get subject by ID or code
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('GET /subjects/:id - ID:', id);
    
    let subject;
    
    // Check if id is a MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      subject = await Subject.findById(id)
        .populate('createdBy', 'name email')
        .lean();
    } else {
      // If not a valid ObjectId, try to find by code
      subject = await Subject.findOne({ code: id })
        .populate('createdBy', 'name email')
        .lean();
    }
    
    if (!subject) {
      console.log('Subject not found:', id);
      return res.status(404).json({ message: 'Subject not found' });
    }
    
    console.log('Found subject:', { id: subject._id, name: subject.name, code: subject.code });
    res.json(subject);
  } catch (err) {
    console.error('Error in GET /subjects/:id:', err);
    res.status(500).json({ 
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Create new subject (admin only)
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    console.log('POST /subjects - Request body:', req.body);
    
    const subject = new Subject({
      ...req.body,
      createdBy: req.user._id
    });
    
    await subject.save();
    console.log('Created new subject:', { id: subject._id, name: subject.name, code: subject.code });
    
    res.status(201).json(subject);
  } catch (err) {
    console.error('Error in POST /subjects:', err);
    res.status(400).json({ 
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Update subject (admin only)
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('PUT /subjects/:id - ID:', id);
    console.log('Update data:', req.body);
    
    let subject;
    
    // Check if id is a MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      subject = await Subject.findByIdAndUpdate(
        id,
        req.body,
        { new: true, runValidators: true }
      ).populate('createdBy', 'name email');
    } else {
      // If not a valid ObjectId, try to find by code
      subject = await Subject.findOneAndUpdate(
        { code: id },
        req.body,
        { new: true, runValidators: true }
      ).populate('createdBy', 'name email');
    }
    
    if (!subject) {
      console.log('Subject not found:', id);
      return res.status(404).json({ message: 'Subject not found' });
    }
    
    console.log('Updated subject:', { id: subject._id, name: subject.name, code: subject.code });
    res.json(subject);
  } catch (err) {
    console.error('Error in PUT /subjects/:id:', err);
    res.status(400).json({ 
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Delete subject (admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('DELETE /subjects/:id - ID:', id);
    
    let subject;
    
    // Check if id is a MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      subject = await Subject.findByIdAndDelete(id);
    } else {
      // If not a valid ObjectId, try to find by code
      subject = await Subject.findOneAndDelete({ code: id });
    }
    
    if (!subject) {
      console.log('Subject not found:', id);
      return res.status(404).json({ message: 'Subject not found' });
    }
    
    console.log('Deleted subject:', { id: subject._id, name: subject.name, code: subject.code });
    res.json({ message: 'Subject deleted successfully' });
  } catch (err) {
    console.error('Error in DELETE /subjects/:id:', err);
    res.status(500).json({ 
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

module.exports = router; 