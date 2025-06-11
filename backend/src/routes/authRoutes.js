const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');

router.post('/register', async (req, res) => {
  try {
    console.log('Registration attempt:', { email: req.body.email, rollNo: req.body.rollNo });
    
    const { name, email, password, role, rollNo } = req.body;
    
    if (!name || !email || !password || !rollNo) {
      console.log('Missing required fields:', { name: !!name, email: !!email, password: !!password, rollNo: !!rollNo });
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { rollNo }] });
    if (existingUser) {
      console.log('User already exists:', { email: existingUser.email, rollNo: existingUser.rollNo });
      return res.status(400).json({ 
        message: existingUser.email === email ? 'Email exists' : 'Roll number exists' 
      });
    }

    const user = new User({ 
      name, 
      email, 
      password, 
      rollNo, 
      role: role || 'student' 
    });
    
    console.log('Saving new user:', { email, rollNo, role });
    await user.save();
    console.log('User saved successfully:', { id: user._id });
    
    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '24h' }
    );
    
    res.status(201).json({ 
      token, 
      user: user.toJSON() 
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ 
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt:', { email: req.body.email });
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('Missing credentials:', { email: !!email, password: !!password });
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('User not found:', { email });
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Invalid password for user:', { email });
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    console.log('Login successful:', { email, userId: user._id });
    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '24h' }
    );
    
    res.json({ 
      token, 
      user: user.toJSON() 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

router.get('/verify-token', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Check if token has expired
    if (user.tokenExpiry && new Date() > user.tokenExpiry) {
      return res.status(401).json({ message: 'Session expired' });
    }

    res.json({ valid: true, user: user.toJSON() });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router; 