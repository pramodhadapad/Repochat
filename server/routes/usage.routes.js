const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const UsageTracker = require('../services/UsageTracker');
const UsageLog = require('../models/UsageLog');

/**
 * @route GET /api/usage
 * @desc Get usage summary (today, this month) for the authenticated user
 * @access Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const summary = await UsageTracker.getUsageSummary(req.user._id);
    res.status(200).json(summary);
  } catch (error) {
    console.error('[Usage API] Error getting summary:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to retrieve usage summary'
    });
  }
});

/**
 * @route GET /api/usage/history
 * @desc Get paginated audit log of recent API calls
 * @access Private
 */
router.get('/history', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const logs = await UsageLog.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('repoId', 'name') // Optionally populate repo name
      .select('-errorMessage'); // Hide raw error messages for cleaner UI

    const total = await UsageLog.countDocuments({ userId: req.user._id });

    res.status(200).json({
      logs,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[Usage API] Error getting history:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to retrieve usage history'
    });
  }
});

module.exports = router;
