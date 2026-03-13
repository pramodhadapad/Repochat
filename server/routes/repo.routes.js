const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { cacheResponse, clearCachePattern } = require('../middleware/cache.middleware');
const { cloneRepo, cleanupRepo } = require('../services/RepoCloner');
const Repo = require('../models/Repo');
const upload = require('../middleware/upload.middleware');
const UploadService = require('../services/UploadService');
const IndexService = require('../services/IndexService');
const VectorIndexer = require('../services/VectorIndexer');
const fs = require('fs');
const path = require('path');

/**
 * Helper: Re-clone a repo if its local files are missing (e.g. after Render restart)
 */
async function ensureRepoFiles(repo, user) {
  if (!repo.localPath || !fs.existsSync(repo.localPath)) {
    if (repo.url) {
      console.log(`[AUTO-RECLONE] Files missing for "${repo.name}". Re-cloning from ${repo.url}...`);
      try {
        const cloneInfo = await cloneRepo(repo.url);
        repo.localPath = cloneInfo.localPath;
        repo.status = 'indexing';
        await repo.save();
        // Re-index in background
        IndexService.indexRepository(repo, user).catch(err => {
          console.error(`[AUTO-RECLONE] Background reindex failed:`, err);
        });
        return false; // Files are being re-cloned, not ready yet
      } catch (err) {
        console.error(`[AUTO-RECLONE] Re-clone failed:`, err.message);
        return false;
      }
    }
    return false;
  }
  return true; // Files exist
}

/**
 * @route GET /api/repo
 * @desc Get all repos for the current user
 * @access Private
 */
router.get('/', protect, cacheResponse(300), async (req, res) => {
  try {
    const repos = await Repo.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ repos });
  } catch (error) {
    console.error('List Repos Error:', error);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

router.post('/clone', protect, async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      message: 'Git URL is required'
    });
  }

  if (!req.user?.apiKey) {
    return res.status(400).json({
      error: 'API_KEY_REQUIRED',
      message: 'Please add your LLM API key in Dashboard (Backend Security Setup) before importing a repository.'
    });
  }

  try {
    let repo = await Repo.findOne({ userId: req.user._id, url: url });
    if (repo && repo.status === 'ready') {
      return res.status(200).json({
        repoId: repo._id,
        name: repo.name,
        status: repo.status,
        message: 'Repo already indexed and ready.'
      });
    }

    const cloneInfo = await cloneRepo(url);

    if (!repo) {
      repo = await Repo.create({
        userId: req.user._id,
        url: url,
        name: cloneInfo.name,
        owner: cloneInfo.owner,
        localPath: cloneInfo.localPath,
        status: 'indexing'
      });
    } else {
      repo.status = 'indexing';
      repo.localPath = cloneInfo.localPath;
      await repo.save();
    }

    await clearCachePattern(`:${req.user._id.toString()}:/api/repo`);

    IndexService.indexRepository(repo, req.user).catch(err => {
      console.error(`Background indexing failed for ${repo.name}:`, err);
    });

    res.status(202).json({
      repoId: repo._id,
      name: repo.name,
      status: 'indexing',
      message: 'Cloning started. Indexing in progress...',
      estimatedTime: '30 seconds'
    });
  } catch (error) {
    console.error('Repo Clone Route Error:', error);
    res.status(500).json({
      error: 'REPO_CLONE_FAILED',
      message: error.message || 'Could not clone this Git URL.'
    });
  }
});

/**
 * @route POST /api/repo/upload-folder
 */
router.post('/upload-folder', protect, upload.array('project'), async (req, res) => {
  console.log(`[Upload] Folder upload request from user ${req.user._id}`);

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'NO_FILES', message: 'No files uploaded.' });
  }

  if (!req.user?.apiKey) {
    return res.status(400).json({
      error: 'API_KEY_REQUIRED',
      message: 'Please add your LLM API key before uploading.'
    });
  }

  const { projectName } = req.body;
  if (!projectName) {
    return res.status(400).json({ error: 'MISSING_PROJECT_NAME', message: 'Project name is required.' });
  }

  try {
    const repo = await UploadService.processFolderUpload(req.files, projectName, req.user._id);
    await clearCachePattern(`:${req.user._id.toString()}:/api/repo`);
    res.status(200).json({
      repoId: repo._id,
      name: repo.name,
      status: repo.status,
      message: `✅ Folder "${projectName}" uploaded successfully! Indexing started...`
    });
  } catch (error) {
    console.error('[Upload] Folder Upload Error:', error);
    res.status(500).json({ error: 'UPLOAD_FAILED', message: error.message || 'Failed to process project folder.' });
  }
});

/**
 * @route POST /api/repo/upload-file
 */
router.post('/upload-file', protect, upload.single('document'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'NO_FILE', message: 'No file uploaded.' });
  }

  if (!req.user?.apiKey) {
    return res.status(400).json({
      error: 'API_KEY_REQUIRED',
      message: 'Please add your LLM API key before uploading.'
    });
  }

  try {
    const repo = await UploadService.processSingleFileUpload(req.file, req.user._id);
    await clearCachePattern(`:${req.user._id.toString()}:/api/repo`);
    res.status(200).json({
      repoId: repo._id,
      name: repo.name,
      status: repo.status,
      message: `✅ File "${req.file.originalname}" uploaded successfully! Indexing started...`
    });
  } catch (error) {
    console.error('[Upload] File Upload Error:', error);
    res.status(500).json({ error: 'UPLOAD_FAILED', message: error.message || 'Failed to process document.' });
  }
});

/**
 * @route GET /api/repo/:id
 */
router.get('/:id', protect, cacheResponse(300), async (req, res) => {
  try {
    const repo = await Repo.findOne({ _id: req.params.id, userId: req.user._id });
    if (!repo) {
      return res.status(404).json({ error: 'REPO_NOT_FOUND', message: 'Repo not found.' });
    }
    res.status(200).json(repo);
  } catch (error) {
    console.error('Get Repo Error:', error);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch repo metadata' });
  }
});

/**
 * @route DELETE /api/repo/:id
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const repo = await Repo.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!repo) {
      return res.status(404).json({ error: 'REPO_NOT_FOUND', message: 'Repo not found' });
    }

    if (repo.localPath) cleanupRepo(repo.localPath);
    await VectorIndexer.deleteCollection(repo._id);
    await clearCachePattern(`:${req.user._id.toString()}:/api/repo`);

    res.status(200).json({ message: 'Repo deleted successfully' });
  } catch (error) {
    console.error('Delete Repo Error:', error);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to delete repo' });
  }
});

/**
 * @route POST /api/repo/:id/reindex
 */
router.post('/:id/reindex', protect, async (req, res) => {
  try {
    if (!req.user?.apiKey) {
      return res.status(400).json({ error: 'API_KEY_REQUIRED', message: 'Please add your LLM API key first.' });
    }

    const repoId = req.params.id;
    if (!repoId || !mongoose.Types.ObjectId.isValid(repoId)) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Invalid repository ID.' });
    }

    const repo = await Repo.findOne({ _id: repoId, userId: req.user._id });
    if (!repo) {
      return res.status(404).json({ error: 'REPO_NOT_FOUND', message: 'Repository not found' });
    }

    // Auto re-clone if files missing and URL exists
    if (!repo.localPath || !fs.existsSync(repo.localPath)) {
      if (repo.url) {
        console.log(`[REINDEX] Files missing, re-cloning from ${repo.url}...`);
        const cloneInfo = await cloneRepo(repo.url);
        repo.localPath = cloneInfo.localPath;
      } else {
        return res.status(400).json({
          error: 'REPO_PATH_MISSING',
          message: 'Uploaded files are no longer on disk. Please delete this repo and upload again.'
        });
      }
    }

    repo.status = 'indexing';
    await repo.save();

    try {
      await clearCachePattern(`:${req.user._id.toString()}:/api/repo`);
    } catch (cacheErr) {
      console.warn('Reindex: cache clear failed:', cacheErr.message);
    }

    IndexService.indexRepository(repo, req.user).catch(err => {
      console.error(`Reindex failed for ${repo.name}:`, err);
    });

    res.status(202).json({ repoId: repo._id, status: 'indexing', message: 'Re-indexing started.' });
  } catch (error) {
    console.error('Reindex Error:', error);
    res.status(500).json({ error: 'SERVER_ERROR', message: error.message || 'Failed to start re-indexing' });
  }
});

/**
 * @route GET /api/repo/:id/file
 */
router.get('/:id/file', protect, async (req, res) => {
  const { path: filePath } = req.query;

  if (!filePath) {
    return res.status(400).json({ error: 'File path is required' });
  }

  try {
    const repo = await Repo.findOne({ _id: req.params.id, userId: req.user._id });
    if (!repo) return res.status(404).json({ error: 'Repo not found' });

    // Auto re-clone if files missing
    const filesExist = await ensureRepoFiles(repo, req.user);
    if (!filesExist) {
      return res.status(202).json({ error: 'RECLONING', message: 'Repository files are being restored. Please wait a moment and try again.' });
    }

    const fullPath = path.join(repo.localPath, filePath);
    if (!fullPath.startsWith(repo.localPath)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    res.status(200).json({ content });
  } catch (error) {
    console.error('Read File Error:', error);
    res.status(500).json({ error: 'Failed to read file' });
  }
});

const ReadmeGenerator = require('../services/ReadmeGenerator');

/**
 * @route POST /api/repo/:id/readme
 */
router.post('/:id/readme', protect, async (req, res) => {
  try {
    const repo = await Repo.findOne({ _id: req.params.id, userId: req.user._id });
    if (!repo) return res.status(404).json({ error: 'Repo not found' });

    const readmeContent = await ReadmeGenerator.generateReadme(repo._id, req.user);
    repo.hasReadme = true;
    await repo.save();

    res.status(200).json({ content: readmeContent });
  } catch (error) {
    console.error('README Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate README' });
  }
});

/**
 * @route GET /api/repo/:id/heatmap
 */
router.get('/:id/heatmap', protect, async (req, res) => {
  try {
    const Message = require('../models/Message');
    const heatmap = await Message.aggregate([
      { $match: { repoId: new mongoose.Types.ObjectId(req.params.id), fileRef: { $ne: null } } },
      { $group: { _id: "$fileRef.path", count: { $sum: 1 } } }
    ]);

    const result = heatmap.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    res.status(200).json(result);
  } catch (error) {
    console.error('Heatmap Error:', error);
    res.status(500).json({ error: 'Failed to fetch heatmap data' });
  }
});

const CommitService = require('../services/CommitService');

/**
 * @route GET /api/repo/:id/commits/summary
 */
router.get('/:id/commits/summary', protect, async (req, res) => {
  try {
    const repo = await Repo.findOne({ _id: req.params.id, userId: req.user._id });
    if (!repo) return res.status(404).json({ error: 'Repo not found' });

    const summary = await CommitService.summarizeCommits(repo.localPath, req.user);
    res.status(200).json({ summary });
  } catch (error) {
    console.error('Commit Summary Route Error:', error);
    res.status(500).json({ error: 'Failed to summarize commits' });
  }
});

/**
 * @route GET /api/repo/:id/tree
 * — Auto re-clones if files are missing after Render restart
 */
router.get('/:id/tree', protect, async (req, res) => {
  try {
    const repo = await Repo.findOne({ _id: req.params.id, userId: req.user._id });
    if (!repo || !repo.localPath) {
      return res.status(404).json({ error: 'Repo not found or not cloned locally' });
    }

    // Auto re-clone if files missing (Render filesystem reset)
    const filesExist = await ensureRepoFiles(repo, req.user);
    if (!filesExist) {
      return res.status(202).json({
        tree: [],
        recloning: true,
        message: repo.url
          ? 'Repository files were lost after server restart. Re-cloning automatically... Please wait 30 seconds and refresh.'
          : 'Uploaded files were lost after server restart. Please delete this repo and upload again.'
      });
    }

    const buildTree = (dir) => {
      const result = [];
      const list = fs.readdirSync(dir);
      list.forEach(file => {
        if (file === '.git' || file === 'node_modules' || file === '.next' || file === 'dist') return;
        const fullPath = path.join(dir, file);
        try {
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            result.push({ name: file, type: 'directory', children: buildTree(fullPath) });
          } else {
            const relPath = fullPath.substring(repo.localPath.length + 1).replace(/\\/g, '/');
            result.push({ name: file, type: 'file', path: relPath });
          }
        } catch (e) { }
      });
      return result.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'directory' ? -1 : 1;
      });
    };

    const tree = buildTree(repo.localPath);
    res.status(200).json({ tree });
  } catch (error) {
    console.error('Get File Tree Error:', error);
    res.status(500).json({ error: 'Failed to generate file tree' });
  }
});

/**
 * @route POST /api/repo/:id/snippets
 */
router.post('/:id/snippets', protect, async (req, res) => {
  const { title, code, language } = req.body;
  if (!code) return res.status(400).json({ error: 'Code snippet content is required' });

  try {
    const repo = await Repo.findOne({ _id: req.params.id, userId: req.user._id });
    if (!repo) return res.status(404).json({ error: 'Repo not found' });

    repo.snippets.push({ title: title || 'Untitled Snippet', code, language: language || 'plaintext' });
    await repo.save();

    res.status(201).json({ snippet: repo.snippets[repo.snippets.length - 1] });
  } catch (error) {
    console.error('Add Snippet Error:', error);
    res.status(500).json({ error: 'Failed to save snippet' });
  }
});

/**
 * @route DELETE /api/repo/:id/snippets/:snippetId
 */
router.delete('/:id/snippets/:snippetId', protect, async (req, res) => {
  try {
    const repo = await Repo.findOne({ _id: req.params.id, userId: req.user._id });
    if (!repo) return res.status(404).json({ error: 'Repo not found' });

    repo.snippets = repo.snippets.filter(s => s._id.toString() !== req.params.snippetId);
    await repo.save();

    res.status(200).json({ message: 'Snippet deleted' });
  } catch (error) {
    console.error('Delete Snippet Error:', error);
    res.status(500).json({ error: 'Failed to delete snippet' });
  }
});

module.exports = router;
