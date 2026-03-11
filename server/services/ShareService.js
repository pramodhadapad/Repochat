const Share = require('../models/Share');
const { v4: uuidv4 } = require('uuid');

/**
 * Manages unique share slugs and resolves collaboration links.
 */
class ShareService {
  /**
   * Generates a unique shareable collaboration link for a repository.
   * @param {string} repoId - The repository ID.
   * @param {string} userId - The ID of the user creating the share.
   * @returns {Promise<string>} - The unique share ID.
   */
  async createShareLink(repoId, userId) {
    const shareId = uuidv4().slice(0, 12); // Shortened UUID for a manageable slug
    
    await Share.create({
      shareId,
      repoId,
      userId,
      createdAt: new Date()
    });

    return shareId;
  }

  /**
   * Resolves a share ID to its associated repository and session.
   * @param {string} shareId - The unique share ID.
   * @returns {Promise<object>} - The share record with repository details.
   */
  async resolveShareId(shareId) {
    const share = await Share.findOne({ shareId }).populate('repoId');
    if (!share) {
      throw new Error('SHARE_NOT_FOUND');
    }
    
    share.viewCount += 1;
    await share.save();
    
    return share;
  }
}

module.exports = new ShareService();
