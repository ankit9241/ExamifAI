const jwt = require('jsonwebtoken');
const User = require('../src/models/UserModel');

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware to check if user is admin
const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      console.log('Checking admin role for user:', {
        id: req.user._id,
        email: req.user.email,
        role: req.user.role
      });
      
      if (req.user.role !== 'admin') {
        console.log('User is not an admin');
        return res.status(403).json({ message: 'Admin access required' });
      }
      console.log('User is an admin, proceeding');
      next();
    });
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = { auth, adminAuth }; 