const { ChromaClient } = require('chromadb');

const chromaClient = new ChromaClient({
  path: process.env.CHROMA_URL || 'http://localhost:8000'
});

const connectChroma = async () => {
  try {
    const version = await chromaClient.version();
    console.log(`ChromaDB Connected: ${version}`);
    return chromaClient;
  } catch (err) {
    console.error(`ChromaDB Error: ${err.message}`);
    // Don't exit process, AI features will just be disabled
  }
};

module.exports = { chromaClient, connectChroma };
