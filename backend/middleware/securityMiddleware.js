const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased for development
  message: 'Too many requests from this IP, please try again later'
});

// Specific limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased for development
  message: 'Too many login attempts, please try again later'
});

// Security headers middleware
const securityHeaders = helmet();

module.exports = {
  limiter,
  authLimiter,
  securityHeaders
}; 