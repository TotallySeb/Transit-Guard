import axios from 'axios';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';

const urls = [
  "https://dornsife.usc.edu/news/stories/metro-unsafe-say-those-no-longer-riding-post-pandemic/",
  "https://www.metro.net/customer-experience-survey-results/",
  "https://www.metro.net/news/metro-adds-shatterproof-barriers-to-buses-amid-rising-crime/",
  "https://xtown.la/2023/05/25/want-to-avoid-crime-on-metro-stay-off-the-red-line/",
  "https://www.latimes.com/california/story/2023-03-15/crime-skyrockets-on-la-metro-system-including-jump-in-drug-deaths",
  "https://laist.com/news/transportation/after-violent-incidents-on-metro-how-safe-is-las-public-transit",
  "https://www.nbclosangeles.com/news/local/how-safe-is-la-metro-really-a-look-at-latest-crime-data/3289479/",
  "https://calmatters.org/california-divide/2024/04/la-metro-crime-statistics-2024/"
];

async function fetchText(url) {
  const response = await axios.get(url);
  return response.data; // raw HTML/text for now
}

async function run() {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });

  const embeddingModel = new HuggingFaceInferenceEmbeddings({
    model: 'sentence-transformers/all-MiniLM-L6-v2',
    cache: false,
  });

  // Use MemoryVectorStore instead of HNSWLib
  const vectorStore = await MemoryVectorStore.fromDocuments([], embeddingModel);

  for (const url of urls) {
    console.log(`Fetching: ${url}`);
    const rawText = await fetchText(url);
    const docs = await splitter.splitText(rawText);

    await vectorStore.addDocuments(
      docs.map(chunk => ({
        pageContent: chunk,
        metadata: { source: url },
      }))
    );
  }

  // No save() here, since it's in-memory
  console.log('Ingestion complete. Vector store is in memory.');
}

run().catch(console.error);
// This code fetches text from specified URLs, splits it into chunks, and stores it in an in-memory vector store using Hugging Face embeddings.
// It does not persist the vector store, as it is designed for in-memory operations only.