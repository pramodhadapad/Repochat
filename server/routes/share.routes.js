const express = require('express');
const router = express.Router();
const ShareService = require('../services/ShareService');
const { protect } = require('../middleware/auth.middleware');

/**
 * @route POST /api/share/create
 * @desc Generate a shareable collaboration link
 * @access Private
 */
router.post('/create', protect, async (req, res) => {
  const { repoId } = req.body;
  
  if (!repoId) {
    return res.status(400).json({ error: 'Repository ID is required' });
  }

  try {
    const shareId = await ShareService.createShareLink(repoId, req.user._id);
    res.status(200).json({ shareId });
  } catch (error) {
    console.error('Share Create Error:', error);
    res.status(500).json({ error: 'Failed to create share link' });
  }
});

/**
 * @route GET /api/share/:shareId
 * @desc Resolve share ID to repository and session
 * @access Private
 */
router.get('/:shareId', protect, async (req, res) => {
  try {
    const share = await ShareService.resolveShareId(req.params.shareId);
    res.status(200).json(share);
  } catch (error) {
    console.error('Share Resolve Error:', error);
    if (error.message === 'SHARE_NOT_FOUND') {
      return res.status(404).json({ error: 'Collaboration link not found' });
    }
    res.status(500).json({ error: 'Failed to resolve share link' });
  }
});

module.exports = router;
