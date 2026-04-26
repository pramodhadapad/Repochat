const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Validates a Git URL.
 * Only allows public GitHub, GitLab, and Bitbucket URLs.
 */
function validateGitUrl(url) {
  // Relaxed regex: allow any http/https URL that looks like a git repo
  const pattern = /^https?:\/\/[\w.-]+(\.[\w.-]+)+[\w\d._~:/?#[\]@!$&'()*+,;=.-]+$/;
  if (!pattern.test(url)) {
    throw new Error('Invalid URL. Please paste a valid HTTP or HTTPS Git repository link.');
  }
}

/**
 * Clones a Git repository to a temporary directory.
 * @param {string} url - The Git URL to clone.
 * @returns {Promise<object>} - Object containing localPath and repo info.
 */
async function cloneRepo(url) {
  validateGitUrl(url);

  const repoId = uuidv4();
  const localPath = path.join(process.cwd(), 'tmp', repoId);

  // Ensure tmp directory exists
  if (!fs.existsSync(path.join(process.cwd(), 'tmp'))) {
    fs.mkdirSync(path.join(process.cwd(), 'tmp'));
  }

  try {
    await git.clone({
      fs,
      http,
      dir: localPath,
      url: url,
      singleBranch: true,
      depth: 1
    });

    const repoName = url.split('/').pop().replace('.git', '');
    const owner = url.split('/').slice(-2, -1)[0];

    return {
      repoId,
      localPath,
      name: repoName,
      owner
    };
  } catch (error) {
    console.error('Clone Error:', error);
    // Cleanup if failed
    if (fs.existsSync(localPath)) {
      fs.rmSync(localPath, { recursive: true, force: true });
    }
    throw new Error('FAILED_TO_CLONE_REPO');
  }
}

/**
 * Recursively gets all files in a directory.
 * @param {string} dir - Directory to walk.
 * @param {string[]} fileList - Initial file list.
 * @returns {string[]} - Array of absolute file paths.
 */
function walkFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== '.git' && file !== 'node_modules') {
          walkFiles(filePath, fileList);
      }
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

/**
 * Cleans up a cloned repository directory.
 * @param {string} localPath - The path to the directory to remove.
 */
function cleanupRepo(localPath) {
  try {
    if (fs.existsSync(localPath)) {
      fs.rmSync(localPath, { recursive: true, force: true });
    }
  } catch (err) {
    console.error(`[Cleanup] Failed to remove dir ${localPath}:`, err.message);
  }
}

module.exports = { cloneRepo, walkFiles, cleanupRepo };
