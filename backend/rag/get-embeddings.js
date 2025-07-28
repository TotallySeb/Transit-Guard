// get-embeddings.js

const { pipeline } = require('@xenova/transformers');

// Function to generate embeddings for a given data source
async function getEmbedding(data) {
    const embedder = await pipeline(
        'feature-extraction',
        'Xenova/nomic-embed-text-v1');
    const results = await embedder(data, { pooling: 'mean', normalize: true });
    return Array.from(results.data);
}

// Export the function using CommonJS
module.exports = {
    getEmbedding: getEmbedding
};