import { retrieveRelevantDocs } from './retrieve-documents.js';
import { HfInference } from '@huggingface/inference';

async function generateAnswer(question) {
  const docs = await retrieveRelevantDocs(question);

  // Concatenate all retrieved chunks as context
  const context = docs.map(doc => doc.pageContent).join('\n---\n');

  // Construct prompt for LLM
  const prompt = `
    Use the following context to answer the question:
    Context:
    ${context}

    Question:
    ${question}

    Answer:
  `;

  const client = new HfInference(process.env.HUGGING_FACE_ACCESS_TOKEN);

  const response = await client.textGeneration({
    model: 'gpt2',  // Replace with your preferred model
    inputs: prompt,
    parameters: { max_new_tokens: 200 },
  });

  console.log('Answer:', response.generated_text);
}

const question = "Explain the main ideas from the linked documents about AI advancements.";
generateAnswer(question);
// Note: Ensure you have the necessary packages installed:
// npm install @huggingface/inference rag-link-sources/retrieve-documents.js