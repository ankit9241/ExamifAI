const express = require('express');
const router = express.Router();
const User = require('../models/UserModel');
const { auth, adminAuth } = require('../../middleware/authMiddleware');

// Get all users (admin only)
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Check if user exists by email
router.get('/check/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    res.json({ exists: !!user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    res.json(req.user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'password'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({ message: 'Invalid updates' });
    }

    updates.forEach(update => req.user[update] = req.body[update]);
    await req.user.save();
    res.json(req.user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Clear all users (admin only)
router.delete('/clear/all', auth, adminAuth, async (req, res) => {
  try {
    await User.deleteMany({});
    res.json({ message: 'All users cleared successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Save face descriptor for current user
router.post('/face', auth, async (req, res) => {
  try {
    const { faceDescriptor } = req.body;
    if (!Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
      return res.status(400).json({ message: 'Invalid face descriptor' });
    }
    req.user.faceDescriptor = faceDescriptor;
    await req.user.save();
    res.json({ message: 'Face descriptor saved successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Clear all users' faceDescriptors (admin only)
router.delete('/face/clear/all', auth, adminAuth, async (req, res) => {
  try {
    await User.updateMany({}, { $unset: { faceDescriptor: 1 } });
    res.json({ message: 'All face descriptors cleared successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 