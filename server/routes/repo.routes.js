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
    // 1. Check if repo already indexed for this user
    let repo = await Repo.findOne({ userId: req.user._id, url: url });
    if (repo && repo.status === 'ready') {
        return res.status(200).json({
            repoId: repo._id,
            name: repo.name,
            status: repo.status,
            message: 'Repo already indexed and ready.'
        });
    }

    // 2. Clone repo
    const cloneInfo = await cloneRepo(url);

    // 3. Save initial metadata
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

    // Invalidate user cache for repos
    await clearCachePattern(`:${req.user._id.toString()}:/api/repo`);

    // Trigger background indexing process
    // We don't await this as it can take time
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
 * @desc Upload a ZIP file of a project to study
 * @access Private
 */
router.post('/upload-folder', protect, upload.array('project'), async (req, res) => {
  console.log(`[Upload] Folder upload request from user ${req.user._id}`);
  
  if (!req.files || req.files.length === 0) {
    console.log('[Upload] No files received');
    return res.status(400).json({ 
      error: 'NO_FILES',
      message: 'No files uploaded. Please select a valid folder.' 
    });
  }

  console.log(`[Upload] Received ${req.files.length} files`);

  if (!req.user?.apiKey) {
    console.log('[Upload] User missing API key');
    return res.status(400).json({
      error: 'API_KEY_REQUIRED',
      message: 'Please add your LLM API key in Dashboard (Backend Security Setup) before uploading.'
    });
  }

  const { projectName } = req.body;
  if (!projectName) {
    console.log('[Upload] Missing project name');
    return res.status(400).json({
      error: 'MISSING_PROJECT_NAME',
      message: 'Project name is required.'
    });
  }

  try {
    console.log(`[Upload] Processing folder: "${projectName}" with ${req.files.length} files`);
    const repo = await UploadService.processFolderUpload(req.files, projectName, req.user._id);
    
    await clearCachePattern(`:${req.user._id.toString()}:/api/repo`);

    console.log(`[Upload] Successfully created repo: ${repo._id}`);
    res.status(200).json({
      repoId: repo._id,
      name: repo.name,
      status: repo.status,
      message: `✅ Folder "${projectName}" uploaded successfully! Indexing started...`
    });
  } catch (error) {
    console.error('[Upload] Folder Upload Error:', error);
    res.status(500).json({ 
      error: 'UPLOAD_FAILED',
      message: error.message || 'Failed to process project folder. Please check file types and sizes.' 
    });
  }
});

/**
 * @route POST /api/repo/upload-file
 * @desc Upload a single document to study
 * @access Private
 */
router.post('/upload-file', protect, upload.single('document'), async (req, res) => {
  console.log(`[Upload] File upload request from user ${req.user._id}`);
  
  if (!req.file) {
    console.log('[Upload] No file received');
    return res.status(400).json({ 
      error: 'NO_FILE',
      message: 'No file uploaded. Please select a valid file.' 
    });
  }

  console.log(`[Upload] Received file: "${req.file.originalname}" (${req.file.size} bytes)`);

  if (!req.user?.apiKey) {
    console.log('[Upload] User missing API key');
    return res.status(400).json({
      error: 'API_KEY_REQUIRED',
      message: 'Please add your LLM API key in Dashboard (Backend Security Setup) before uploading.'
    });
  }

  try {
    console.log(`[Upload] Processing file: "${req.file.originalname}"`);
    const repo = await UploadService.processSingleFileUpload(req.file, req.user._id);

    await clearCachePattern(`:${req.user._id.toString()}:/api/repo`);

    console.log(`[Upload] Successfully created repo: ${repo._id}`);
    res.status(200).json({
      repoId: repo._id,
      name: repo.name,
      status: repo.status,
      message: `✅ File "${req.file.originalname}" uploaded successfully! Indexing started...`
    });
  } catch (error) {
    console.error('[Upload] File Upload Error:', error);
    res.status(500).json({ 
      error: 'UPLOAD_FAILED',
      message: error.message || 'Failed to process document. Please check file type and size.' 
    });
  }
});

/**
 * @route GET /api/repo/:id
 * @desc Get repo metadata and status
 * @access Private
 */
router.get('/:id', protect, cacheResponse(300), async (req, res) => {
  try {
    const repo = await Repo.findOne({ _id: req.params.id, userId: req.user._id });
    if (!repo) {
      return res.status(404).json({
        error: 'REPO_NOT_FOUND',
        message: 'Repo not found or not owned by you.'
      });
    }
    res.status(200).json(repo);
  } catch (error) {
    console.error('Get Repo Error:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to fetch repo metadata'
    });
  }
});

/**
 * @route DELETE /api/repo/:id
 * @desc Delete a repo from dashboard
 * @access Private
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const repo = await Repo.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!repo) {
      return res.status(404).json({
        error: 'REPO_NOT_FOUND',
        message: 'Repo not found'
      });
    }

    // Cleanup local files if they exist
    if (repo.localPath) {
        cleanupRepo(repo.localPath);
    }

    // Delete vectors from ChromaDB
    await VectorIndexer.deleteCollection(repo._id);

    // Clear cache
    await clearCachePattern(`:${req.user._id.toString()}:/api/repo`);

    res.status(200).json({ message: 'Repo deleted successfully' });
  } catch (error) {
    console.error('Delete Repo Error:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to delete repo'
    });
  }
});

/**
 * @route POST /api/repo/:id/reindex
 * @desc Retry indexing for a repo that previously failed (e.g. after setting API key)
 * @access Private
 */
router.post('/:id/reindex', protect, async (req, res) => {
  console.log(`[REINDEX] Request received for repo ID: ${req.params.id} by user: ${req.user?._id}`);
  try {
    if (!req.user?.apiKey) {
      console.warn('[REINDEX] Missing API key for user:', req.user?._id);
      return res.status(400).json({
        error: 'API_KEY_REQUIRED',
        message: 'Please add your LLM API key in Dashboard (Backend Security Setup) and try again.'
      });
    }

    const repoId = req.params.id;
    if (!repoId || !mongoose.Types.ObjectId.isValid(repoId)) {
      return res.status(400).json({
        error: 'BAD_REQUEST',
        message: 'Invalid repository ID.'
      });
    }

    const repo = await Repo.findOne({ _id: repoId, userId: req.user._id });
    if (!repo) {
      console.warn('[REINDEX] Repo NOT FOUND or not owned by user:', repoId);
      return res.status(404).json({
        error: 'REPO_NOT_FOUND',
        message: 'Repository not found'
      });
    }

    if (repo.status !== 'failed') {
      console.warn('[REINDEX] Repo NOT in failed state:', repo.status);
      return res.status(400).json({
        error: 'INVALID_STATE',
        message: 'Only failed repositories can be re-indexed. Current status: ' + repo.status
      });
    }

    if (!repo.localPath || !fs.existsSync(repo.localPath)) {
      console.warn('[REINDEX] Local path MISSING:', repo.localPath);
      return res.status(400).json({
        error: 'REPO_PATH_MISSING',
        message: 'Repository files are no longer on disk. Please delete this repo and import it again.'
      });
    }
    console.log('[REINDEX] Validations passed. Starting re-indexing...');

    repo.status = 'indexing';
    await repo.save();
    try {
      await clearCachePattern(`:${req.user._id.toString()}:/api/repo`);
    } catch (cacheErr) {
      console.warn('Reindex: cache clear failed (non-fatal):', cacheErr.message);
    }

    IndexService.indexRepository(repo, req.user).catch(err => {
      console.error(`Reindex failed for ${repo.name}:`, err);
    });

    res.status(202).json({
      repoId: repo._id,
      status: 'indexing',
      message: 'Re-indexing started. This may take a minute.'
    });
  } catch (error) {
    console.error('Reindex Error:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message || 'Failed to start re-indexing'
    });
  }
});

/**
 * @route GET /api/repo/:id/file
 * @desc Get content of a specific file in the repo
 * @access Private
 */
router.get('/:id/file', protect, async (req, res) => {
  const { path: filePath } = req.query;
  
  if (!filePath) {
    return res.status(400).json({ error: 'File path is required' });
  }

  try {
    const repo = await Repo.findOne({ _id: req.params.id, userId: req.user._id });
    if (!repo) {
      return res.status(404).json({ error: 'Repo not found' });
    }

    const fullPath = path.join(repo.localPath, filePath);
    
    // Security check: ensure path is within repo directory
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
 * @desc Generate a README for a repository
 * @access Private
 */
router.post('/:id/readme', protect, async (req, res) => {
  try {
    const repo = await Repo.findOne({ _id: req.params.id, userId: req.user._id });
    if (!repo) {
      return res.status(404).json({ error: 'Repo not found' });
    }

    const readmeContent = await ReadmeGenerator.generateReadme(repo._id, req.user);
    
    // Update repo metadata if needed, or just return content
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
 * @desc Get file interaction counts for heatmap visualization
 * @access Private
 */
router.get('/:id/heatmap', protect, async (req, res) => {
  try {
    const Message = require('../models/Message');
    const heatmap = await Message.aggregate([
      { $match: { repoId: new mongoose.Types.ObjectId(req.params.id), fileRef: { $ne: null } } },
      { $group: { _id: "$fileRef.path", count: { $sum: 1 } } }
    ]);
    
    // Convert to simple path -> count object
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
 * @desc Get AI generated summary of recent commits
 * @access Private
 */
router.get('/:id/commits/summary', protect, async (req, res) => {
  try {
    const repo = await Repo.findOne({ _id: req.params.id, userId: req.user._id });
    if (!repo) {
      return res.status(404).json({ error: 'Repo not found' });
    }

    const summary = await CommitService.summarizeCommits(repo.localPath, req.user);
    res.status(200).json({ summary });
  } catch (error) {
    console.error('Commit Summary Route Error:', error);
    res.status(500).json({ error: 'Failed to summarize commits' });
  }
});

/**
 * @route GET /api/repo/:id/tree
 * @desc Get the hierarchical file tree of the repository
 * @access Private
 */
router.get('/:id/tree', protect, async (req, res) => {
  try {
    const repo = await Repo.findOne({ _id: req.params.id, userId: req.user._id });
    if (!repo || !repo.localPath) {
      return res.status(404).json({ error: 'Repo not found or not cloned locally' });
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
            result.push({
              name: file,
              type: 'directory',
              children: buildTree(fullPath)
            });
          } else {
            // Get relative path using cross-platform slash
            const relPath = fullPath.substring(repo.localPath.length + 1).replace(/\\/g, '/');
            result.push({
              name: file,
              type: 'file',
              path: relPath
            });
          }
        } catch (e) {
            // skip unreadable files
        }
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
 * @desc Add a code snippet to a repo
 * @access Private
 */
router.post('/:id/snippets', protect, async (req, res) => {
  const { title, code, language } = req.body;
  
  if (!code) {
    return res.status(400).json({ error: 'Code snippet content is required' });
  }

  try {
    const repo = await Repo.findOne({ _id: req.params.id, userId: req.user._id });
    if (!repo) {
      return res.status(404).json({ error: 'Repo not found' });
    }

    const newSnippet = {
      title: title || 'Untitled Snippet',
      code,
      language: language || 'plaintext'
    };

    repo.snippets.push(newSnippet);
    await repo.save();

    res.status(201).json({ snippet: repo.snippets[repo.snippets.length - 1] });
  } catch (error) {
    console.error('Add Snippet Error:', error);
    res.status(500).json({ error: 'Failed to save snippet' });
  }
});

/**
 * @route DELETE /api/repo/:id/snippets/:snippetId
 * @desc Delete a code snippet from a repo
 * @access Private
 */
router.delete('/:id/snippets/:snippetId', protect, async (req, res) => {
  try {
    const repo = await Repo.findOne({ _id: req.params.id, userId: req.user._id });
    if (!repo) {
      return res.status(404).json({ error: 'Repo not found' });
    }

    repo.snippets = repo.snippets.filter(s => s._id.toString() !== req.params.snippetId);
    await repo.save();

    res.status(200).json({ message: 'Snippet deleted' });
  } catch (error) {
    console.error('Delete Snippet Error:', error);
    res.status(500).json({ error: 'Failed to delete snippet' });
  }
});

module.exports = router;

