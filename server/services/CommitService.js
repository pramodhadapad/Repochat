const git = require('isomorphic-git');
const fs = require('fs');
const path = require('path');
const ChatService = require('./ChatService');

/**
 * Service to summarize git commits using AI.
 */
class CommitService {
  /**
   * Summarizes recent commits for a repository.
   * @param {string} repoPath - Local path to the repository.
   * @param {object} user - User document for AI provider.
   * @param {number} limit - Number of commits to summarize.
   * @returns {Promise<string>} - The AI generated summary.
   */
  async summarizeCommits(repoPath, user, limit = 10) {
    try {
      const commits = await git.log({
        fs,
        dir: repoPath,
        depth: limit
      });

      if (commits.length === 0) {
        return "No commits found in this repository.";
      }

      const commitData = commits.map(c => ({
        hash: c.oid.slice(0, 7),
        author: c.commit.author.name,
        message: c.commit.message,
        timestamp: new Date(c.commit.author.timestamp * 1000).toISOString()
      }));

      const contextString = commitData.map(c => 
        `[${c.hash}] ${c.author}: ${c.message} (${c.timestamp})`
      ).join('\n');

      const prompt = `You are a release manager. Below is a list of recent commits for a repository. 
      Please provide a concise, professional summary of the changes made, grouped by logical categories (e.g., Features, Bug Fixes, Refactor).
      
      Commits:
      ${contextString}
      
      Response (Markdown):`;

      const provider = ChatService.getProvider(user);
      const result = await provider.generateResponse(prompt, user.model);

      return result.answer;
    } catch (error) {
      console.error('Commit Summary Error:', error);
      throw new Error('Failed to summarize commits.');
    }
  }
}

module.exports = new CommitService();
