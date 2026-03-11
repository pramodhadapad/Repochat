const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to protect routes & ensure user is authenticated.
 */
const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Not authorized, no token provided'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');

    // Get user from token & attach to request
    req.user = await User.findById(decoded.userId);
    
    if (!req.user) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'User not found'
      });
    }

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Not authorized, token failed'
    });
  }
};

/**
 * Middleware to redirect users to dashboard if they are already authenticated.
 * Used on login/register routes to prevent account switching without logout.
 */
const redirectIfAuth = (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;
  const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  if (refreshToken) {
    console.log('[AUTH] User already has a session cookie. Redirecting to dashboard.');
    return res.redirect(`${frontendUrl}/dashboard?message=already_logged_in`);
  }

  next();
};

module.exports = { protect, redirectIfAuth };
