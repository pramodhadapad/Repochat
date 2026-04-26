const fs = require('fs-extra');
const path = require('path');
const unzipper = require('unzipper');
const Repo = require('../models/Repo');
const IndexService = require('./IndexService');

class UploadService {
  constructor() {
    this.uploadDir = path.join(__dirname, '..', 'tmp', 'uploads');
    this.extractDir = path.join(__dirname, '..', 'tmp', 'extracted');
    
    // Ensure directories exist
    fs.ensureDirSync(this.uploadDir);
    fs.ensureDirSync(this.extractDir);
  }

  /**
   * Processes an array of files uploaded as a folder-based project.
   */
  async processFolderUpload(files, projectName, userId) {
    const uniqueId = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const targetPath = path.join(this.extractDir, uniqueId);
    await fs.ensureDir(targetPath);

    try {
      for (const file of files) {
        // Multi-file upload from directory preserves relative path in originalname
        // Normalize slashes for Windows compatibility
        const relativePath = file.originalname.replace(/\\/g, '/');
        const fullFilePath = path.join(targetPath, ...relativePath.split('/'));
        
        // Ensure parent directory exists for this specific file
        await fs.ensureDir(path.dirname(fullFilePath));
        
        // Move the file from its temp multer location to the reconstructed location
        await fs.move(file.path, fullFilePath, { overwrite: true });
      }

      // Create a Repo record in the DB
      const repo = await Repo.create({
        userId,
        name: projectName,
        localPath: targetPath,
        type: 'local_upload',
        status: 'indexing',
        owner: 'Local Upload'
      });

      console.log(`[UploadService] Created repo record: ${repo._id} for user: ${userId}`);

      // Start Indexing
      IndexService.startIndexing(repo._id, targetPath).catch(err => {
        console.error(`[UploadService] Folder indexing failed for ${repo._id}:`, err);
      });

      return repo;
    } catch (err) {
      console.error('[UploadService] Folder processing error:', err);
      // Cleanup
      if (await fs.exists(targetPath)) await fs.remove(targetPath);
      throw err;
    }
  }

  /**
   * Processes a uploaded ZIP archive as a folder-based project (DEPRECATED).
   */
  async processZipUpload(file, userId) {
    // Kept for backward compatibility if needed, but not used by new routes
    const uniqueId = Date.now() + '-' + Math.round(Math.random() * 1e9);
    // Placeholder for extraction logic (removed for brevity as it's deprecated)
    return null;
  }

  /**
   * Processes a single document upload.
   */
  async processSingleFileUpload(file, userId) {
    const uniqueId = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const targetPath = path.join(this.extractDir, uniqueId);
    await fs.ensureDir(targetPath);
    
    const finalFilePath = path.join(targetPath, file.originalname);
    await fs.move(file.path, finalFilePath);

    const repo = await Repo.create({
      userId,
      name: file.originalname,
      localPath: targetPath,
      type: 'document_upload',
      status: 'indexing',
      owner: 'Document Upload'
    });

    console.log(`[UploadService] Created single-file repo: ${repo._id} for user: ${userId}`);

    // Start Indexing
    IndexService.startIndexing(repo._id, targetPath).catch(err => {
      console.error(`[UploadService] Document indexing failed for ${repo._id}:`, err);
    });

    return repo;
  }
}

module.exports = new UploadService();
