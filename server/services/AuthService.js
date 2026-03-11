const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Generates an Access Token and a Refresh Token for the given user.
 * @param {object} user - The Mongoose user document.
 * @returns {Promise<object>} - Object containing accessToken and refreshToken.
 */
async function generateTokens(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is missing in environment variables.');

  const accessToken = jwt.sign(
    { userId: user._id, email: user.email },
    secret,
    { expiresIn: '24h' } // Access token good for 24 hours
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    secret,
    { expiresIn: '7d' } // Long-lived refresh token
  );

  // Store refresh token in database for validation/revocation
  user.refreshToken = refreshToken;
  await user.save();

  return { accessToken, refreshToken };
}

/**
 * Finds or creates a user based on profile data from various providers.
 * @param {object} profile - The profile data from passport.
 * @param {string} provider - 'google' or 'github'.
 * @returns {Promise<object>} - The user document and a boolean indicating if they are new.
 */
async function findOrCreateUser(profile, provider = 'google') {
  const { id, displayName, userName, emails, photos } = profile;
  
  // GitHub might use 'username' if displayName is missing
  const name = displayName || userName || profile.username || 'User';
  
  const email = emails && emails[0] ? emails[0].value : null;
  const avatar = photos && photos[0] ? (photos[0].value || photos[0]) : null;

  if (!email && provider === 'google') {
      throw new Error('Email is required for Google authentication');
  }

  // 1. Try finding by provider-specific ID
  const query = provider === 'google' ? { googleId: id } : { githubId: id };
  let user = await User.findOne(query);
  let isNewUser = false;

  // 2. If not found by ID, try finding by email to link accounts
  if (!user && email) {
    user = await User.findOne({ email });
    if (user) {
        console.log(`[AUTH] Linking ${provider} account to existing user: ${email}`);
        if (provider === 'google') user.googleId = id;
        if (provider === 'github') user.githubId = id;
    }
  }

  if (!user) {
    // 3. Create new user if still not found
    const userData = {
      name,
      email,
      avatar,
      lastLoginAt: new Date()
    };
    if (provider === 'google') userData.googleId = id;
    if (provider === 'github') userData.githubId = id;

    user = await User.create(userData);
    isNewUser = true;
    console.log(`[AUTH] Created new user via ${provider}:`, user.email || user._id);
  } else {
    // Update profile info and last login
    user.name = name;
    if (avatar) user.avatar = avatar;
    user.lastLoginAt = new Date();
    await user.save();
    console.log(`[AUTH] Updated existing user via ${provider}:`, user.email || user._id);
  }

  return { user, isNewUser };
}

module.exports = { generateTokens, findOrCreateUser };
