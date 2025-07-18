import { HNSWLib } from 'langchain/vectorstores/hnswlib';
import { HuggingFaceInferenceEmbeddings } from 'langchain/embeddings/hf';

export async function retrieveRelevantDocs(query) {
  const embeddingModel = new HuggingFaceInferenceEmbeddings({
    model: 'sentence-transformers/all-MiniLM-L6-v2',
  });

  const vectorStore = await HNSWLib.load('vectorstore.json', embeddingModel);

  const results = await vectorStore.similaritySearch(query, 8);
  return results; // Array of top 8 documents (chunks)
}
// Note: Ensure you have the necessary packages installed:
// npm install langchain hnswlib langchain-embeddings-hf