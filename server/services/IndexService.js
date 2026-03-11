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
      
      for (let i = 0; i < allChunks.length; i++) {
        const chunk = allChunks[i];
        try {
          const vector = await embeddingService.generateEmbedding(chunk.content, user);
          embeddings.push(vector);
          if (i % 20 === 0 && i > 0) {
            console.log(`[INDEX] Chunks processed: ${i}/${allChunks.length}`);
          }
        } catch (e) {
          console.warn(`[INDEX] Failed to generate embedding for chunk ${i}: ${e.message}. Using mock fallback.`);
          embeddings.push(embeddingService.getDeterministicMockVector(chunk.content));
        }
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
