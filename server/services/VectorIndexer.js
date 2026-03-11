const { chromaClient } = require('../config/chromadb');
const fs = require('fs');
const path = require('path');
const Repo = require('../models/Repo');
const { walkFiles } = require('./RepoCloner');
const { parseFile } = require('./CodeParser');

/**
 * Manages vector indexing in ChromaDB with a Local Keyword Search fallback.
 */
class VectorIndexer {
  constructor() {
    this.localIndexes = new Map(); // repoId -> chunks[] for fallback search
  }

  /**
   * Reloads chunks from disk if available.
   */
  async reloadLocalIndex(repoId) {
    try {
      const repo = await Repo.findById(repoId);
      if (!repo || !repo.localPath || !fs.existsSync(repo.localPath)) {
        console.warn(`[RELOAD] Could not reload index for repo ${repoId}: Path missing.`);
        return [];
      }

      console.info(`[RELOAD] Reloading chunks from disk for repo ${repo.name}...`);
      const files = walkFiles(repo.localPath);
      let allChunks = [];

      for (const filePath of files) {
        const relativePath = path.relative(repo.localPath, filePath);
        const chunks = parseFile(filePath, relativePath);
        if (chunks.length > 0) {
            allChunks = allChunks.concat(chunks);
        }
      }

      this.localIndexes.set(repoId.toString(), allChunks);
      return allChunks;
    } catch (err) {
      console.error(`[RELOAD] Error reloading index: ${err.message}`);
      return [];
    }
  }

  /**
   * Creates or gets a collection for a specific repo.
   */
  async getOrCreateCollection(repoId) {
    const collectionName = `chunks_${repoId.toString().replace(/-/g, '_')}`;
    try {
      if (!chromaClient) return null;
      // We check version as a heartbeat
      await chromaClient.version();
      
      return await chromaClient.getOrCreateCollection({
        name: collectionName,
        metadata: { "hnsw:space": "cosine" }
      });
    } catch (err) {
      if (!err.message.includes('heartbeat')) {
         // console.warn(`[CHROMA] Could not get collection ${collectionName}. Falling back to local index.`);
      }
      return null;
    }
  }

  /**
   * Indexes a set of code chunks.
   */
  async indexChunks(repoId, chunks, embeddings) {
    // Keep in memory for local search fallback even if ChromaDB is alive
    this.localIndexes.set(repoId.toString(), chunks);

    const collection = await this.getOrCreateCollection(repoId);
    if (!collection) {
      console.info(`[INDEX] ChromaDB unavailable. Chunks stored in local memory for repo ${repoId}`);
      return;
    }
    
    try {
      const ids = chunks.map((_, i) => `${repoId}_${i}_${Date.now()}`);
      const documents = chunks.map(c => c.content);
      const metadatas = chunks.map(c => ({
        repoId: repoId.toString(),
        filePath: c.filePath,
        language: c.language,
        startLine: c.startLine,
        endLine: c.endLine,
        type: c.type,
        name: c.name
      }));

      await collection.add({
        ids,
        embeddings,
        metadatas,
        documents
      });
    } catch (err) {
      console.error(`[CHROMA] Failed to add to collection: ${err.message}`);
    }
  }

  /**
   * Performs semantic search or local keyword search fallback.
   */
  async search(repoId, queryEmbedding, nResults = 5, queryText = '') {
    const collection = await this.getOrCreateCollection(repoId);
    
    if (collection) {
      try {
        const results = await collection.query({
          queryEmbeddings: [queryEmbedding],
          nResults: nResults
        });

        const chunks = [];
        if (results.documents[0]) {
          for (let i = 0; i < results.documents[0].length; i++) {
            chunks.push({
              content: results.documents[0][i],
              metadata: results.metadatas[0][i],
              distance: results.distances ? results.distances[0][i] : null
            });
          }
        }
        if (chunks.length > 0) return chunks;
      } catch (err) {
        console.warn(`[CHROMA] Search failed: ${err.message}. Trying local fallback...`);
      }
    }

    // Local Search Fallback (Keyword based)
    let localChunks = this.localIndexes.get(repoId.toString()) || [];
    
    // Auto-reload if empty
    if (localChunks.length === 0) {
      localChunks = await this.reloadLocalIndex(repoId);
    }

    if (localChunks.length === 0) return [];

    console.info(`[SEARCH] Performing local keyword search for repo ${repoId}. Query: "${queryText}"`);
    const keywords = (queryText || '').toLowerCase()
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Split camelCase
      .split(/[\s,._:/-]+/)
      .filter(k => k.length >= 2 && !['the', 'and', 'for', 'this', 'that', 'with'].includes(k));
    
    console.info(`[SEARCH] Keywords extracted: [${keywords.join(', ')}]`);
    
    if (keywords.length === 0) {
      console.warn(`[SEARCH] No valid keywords found in query. Returning top chunks.`);
      return localChunks.slice(0, nResults).map(c => ({
        content: c.content,
        metadata: {
          filePath: c.filePath,
          startLine: c.startLine,
          endLine: c.endLine,
          name: c.name
        }
      }));
    }

    const scored = localChunks
      .map(chunk => {
        let score = 0;
        const content = (chunk.content + ' ' + (chunk.metadata?.filePath || chunk.filePath)).toLowerCase();
        keywords.forEach(k => {
          if (content.includes(k)) {
            score += 1;
            // Bonus for keyword in name/path
            if ((chunk.metadata?.name || chunk.name || '').toLowerCase().includes(k)) score += 2;
            if ((chunk.metadata?.filePath || chunk.filePath || '').toLowerCase().includes(k)) score += 1;
          }
        });
        return { ...chunk, score };
      })
      .filter(c => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, nResults);

    console.info(`[SEARCH] Found ${scored.length} matching chunks.`);

    return scored.map(c => ({
      content: c.content,
      metadata: {
        filePath: c.metadata?.filePath || c.filePath,
        startLine: c.metadata?.startLine || c.startLine,
        endLine: c.metadata?.endLine || c.endLine,
        name: c.metadata?.name || c.name
      }
    }));
  }

  /**
   * Deletes a collection for a repo.
   */
  async deleteCollection(repoId) {
    this.localIndexes.delete(repoId.toString());
    const collectionName = `chunks_${repoId.toString().replace(/-/g, '_')}`;
    try {
        if (chromaClient) await chromaClient.deleteCollection({ name: collectionName });
    } catch (error) {
        // Ignore if collection doesn't exist
    }
  }
}

module.exports = new VectorIndexer();
