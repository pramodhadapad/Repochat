const express = require('express');
const router = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { findOrCreateUser, generateTokens } = require('../services/AuthService');
const { protect, redirectIfAuth } = require('../middleware/auth.middleware');

// Rate Limiting: DISABLED

// Passport Config
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    console.log('[AUTH] Google strategy verify callback triggered.');
    console.log('[AUTH] Google Profile ID:', profile.id, '| Name:', profile.displayName);
    try {
      const { user } = await findOrCreateUser({
        id: profile.id,
        displayName: profile.displayName,
        emails: profile.emails,
        photos: profile.photos
      }, 'google');
      console.log('[AUTH] User found/created:', user._id, user.email);
      return done(null, user);
    } catch (err) {
      console.error('[AUTH] Google Auth Service FAILED:', err.message);
      return done(err, null);
    }
  }
));

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL || "http://localhost:5000/api/auth/github/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    console.log('[AUTH] GitHub strategy verify callback triggered.');
    console.log('[AUTH] GitHub Profile ID:', profile.id, '| Name:', profile.displayName || profile.username);
    try {
      const { user } = await findOrCreateUser(profile, 'github');
      console.log('[AUTH] User found/created via GitHub:', user._id, user.email);
      return done(null, user);
    } catch (err) {
      console.error('[AUTH] GitHub Auth Service FAILED:', err.message);
      return done(err, null);
    }
  }
));

/**
 * @route GET /api/auth/google
 * @desc Initiate Google OAuth redirect
 */
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

/**
 * @route GET /api/auth/google/callback
 * @desc Google OAuth callback, issues JWT and redirects to frontend
 */
router.get('/google/callback', (req, res, next) => {
  console.log('[AUTH] /google/callback hit.');
  const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  passport.authenticate('google', { session: false }, async (err, user, info) => {
    console.log('[AUTH] Google Passport callback: err=', err, 'user=', user ? user._id : null, 'info=', info);

    if (err) {
      console.error('[AUTH] Google Auth Callback Error:', err);
      return res.redirect(`${frontendUrl}?error=auth_failed`);
    }
    if (!user) {
      console.error('[AUTH] Google Auth: No user returned. Info:', info);
      return res.redirect(`${frontendUrl}?error=no_user`);
    }

    try {
      const { accessToken, refreshToken } = await generateTokens(user);
      console.log('[AUTH] Google JWT generated, redirecting to dashboard.');
      
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.redirect(`${frontendUrl}/dashboard?token=${accessToken}`);
    } catch (tokenErr) {
      console.error('[AUTH] Google Token Generation Error:', tokenErr);
      return res.redirect(`${frontendUrl}?error=token_failed`);
    }
  })(req, res, next);
});

/**
 * @route GET /api/auth/github
 * @desc Initiate GitHub OAuth redirect
 */
router.get('/github', passport.authenticate('github', { scope: ['user:email'], session: false }));

/**
 * @route GET /api/auth/github/callback
 * @desc GitHub OAuth callback
 */
router.get('/github/callback', (req, res, next) => {
  console.log('[AUTH] /github/callback hit.');
  const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  passport.authenticate('github', { session: false }, async (err, user, info) => {
    console.log('[AUTH] GitHub Passport callback: err=', err, 'user=', user ? user._id : null, 'info=', info);

    if (err) {
      console.error('[AUTH] GitHub Auth Callback Error:', err);
      return res.redirect(`${frontendUrl}?error=auth_failed`);
    }
    if (!user) {
      console.error('[AUTH] GitHub Auth: No user returned. Info:', info);
      return res.redirect(`${frontendUrl}?error=no_user`);
    }

    try {
      const { accessToken, refreshToken } = await generateTokens(user);
      console.log('[AUTH] GitHub JWT generated, redirecting to dashboard.');
      
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.redirect(`${frontendUrl}/dashboard?token=${accessToken}`);
    } catch (tokenErr) {
      console.error('[AUTH] GitHub Token Generation Error:', tokenErr);
      return res.redirect(`${frontendUrl}?error=token_failed`);
    }
  })(req, res, next);
});

/**
 * @route POST /api/auth/google
 * @desc Login with Google OAuth (frontend sends the google access token)
 * @access Public
 */
router.post('/google', async (req, res) => {
  const { googleToken, profile } = req.body;

  if (!profile) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      message: 'Google profile data is required'
    });
  }

  try {
    // Find or create user
    const { user, isNewUser } = await findOrCreateUser(profile);
    
    // Generate Tokens
    const { accessToken, refreshToken } = await generateTokens(user);

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      jwt: accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      },
      isNewUser: isNewUser
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Authentication failed'
    });
  }
});

/**
 * @route GET /api/auth/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile', protect, (req, res) => {
  res.status(200).json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
      apiKey: !!req.user.apiKey // Only send whether they HAVE a key, not the key itself
    }
  });
});

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token
 * @access Public
 */
router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'No refresh token provided' });
  }

  try {
    const secret = process.env.JWT_SECRET;
    const decoded = jwt.verify(refreshToken, secret);
    
    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Invalid refresh token' });
    }

    // Generate new tokens (token rotation for extra security)
    const tokens = await generateTokens(user);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({ jwt: tokens.accessToken });
  } catch (error) {
    console.error('Refresh Token Error:', error);
    res.status(403).json({ error: 'FORBIDDEN', message: 'Refresh token expired or invalid' });
  }
});

/**
 * @route POST /api/auth/logout
 * @desc Logout user (clear cookies & tokens)
 * @access Private
 */
router.post('/logout', protect, async (req, res) => {
  try {
    req.user.refreshToken = undefined;
    await req.user.save();
    
    res.clearCookie('refreshToken');
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to logout' });
  }
});

module.exports = router;
