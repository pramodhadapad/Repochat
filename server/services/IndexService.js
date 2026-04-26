const fs = require('fs');
const path = require('path');
const { walkFiles } = require('./RepoCloner');
const { parseFile } = require('./CodeParser');
const embeddingService = require('./EmbeddingService');
const vectorIndexer = require('./VectorIndexer');
const Repo = require('../models/Repo');
const User = require('../models/User');

/**
 * Main service to index an entire repository.
 */
class IndexService {
  /**
   * Indexes a repository.
   * @param {object} repo - The Mongoose repo document.
   * @param {object} user - The user document for API keys.
   */
  async indexRepository(repo, user) {
    try {
      const files = walkFiles(repo.localPath);
      let totalLines = 0;
      let allChunks = [];

      for (const filePath of files) {
        // Handle potential permission issues or missing files
        if (!fs.existsSync(filePath)) continue;

        const relativePath = path.relative(repo.localPath, filePath);
        const chunks = parseFile(filePath, relativePath);
        
        if (chunks.length > 0) {
            allChunks = allChunks.concat(chunks);
            const lines = chunks.reduce((acc, c) => acc + (c.endLine - c.startLine + 1), 0);
            totalLines += lines;
        }
      }

      const embeddings = [];
      console.log(`[INDEX] Generating embeddings for ${allChunks.length} chunks...`);
      
      const BATCH_SIZE = 50;
      for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
        const batch = allChunks.slice(i, i + BATCH_SIZE);
        
        const batchPromises = batch.map(async (chunk, index) => {
          try {
            return await embeddingService.generateEmbedding(chunk.content, user);
          } catch (e) {
            console.warn(`[INDEX] Failed to generate embedding for chunk ${i + index}: ${e.message}. Using mock fallback.`);
            return embeddingService.getDeterministicMockVector(chunk.content);
          }
        });

        const batchVectors = await Promise.all(batchPromises);
        embeddings.push(...batchVectors);

        console.log(`[INDEX] Chunks processed: ${Math.min(i + BATCH_SIZE, allChunks.length)}/${allChunks.length}`);
      }

      await vectorIndexer.indexChunks(repo._id, allChunks, embeddings);

      repo.status = 'ready';
      repo.fileCount = files.length;
      repo.lineCount = totalLines;
      repo.indexedAt = new Date();
      await repo.save();

      console.log(`Indexing complete for repo: ${repo.name}`);
    } catch (error) {
      console.error(`Indexing failed for repo ${repo._id}:`, error);
      repo.status = 'failed';
      await repo.save();
      throw error;
    }
  }

  /**
   * Helper to start indexing from a local path (used by UploadService).
   */
  async startIndexing(repoId, localPath) {
    const repo = await Repo.findById(repoId);
    const user = await User.findById(repo.userId);
    
    repo.localPath = localPath;
    await repo.save();

    return this.indexRepository(repo, user);
  }
}

module.exports = new IndexService();
