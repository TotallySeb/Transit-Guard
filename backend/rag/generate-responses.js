// generate-responses.js

const { getQueryResults } = require('./retrieve-documents.js'); // Updated to CommonJS import
const { HfInference } = require('@huggingface/inference'); // Updated to CommonJS import

async function run() {
    try {
        // Specify search query and retrieve relevant documents
        const query = "AI Technology";
        const documents = await getQueryResults(query);

        // Build a string representation of the retrieved documents to use in the prompt
        let textDocuments = "";
        documents.forEach(doc => {
            textDocuments += doc.document.pageContent;
        });
        const question = "In a few sentences, what are MongoDB's latest AI announcements?";

        // Create a prompt consisting of the question and context to pass to the LLM
        const prompt = `Answer the following question based on the given context.
            Question: {${question}}
            Context: {${textDocuments}}
        `;

        // Prompt the LLM to generate a response based on the context
        // Note: Assuming InferenceClient is part of HfInference or is globally available,
        // otherwise you might need `const InferenceClient = HfInference;` if HfInference itself is the client.
        const client = new HfInference(process.env.HUGGING_FACE_ACCESS_TOKEN); // Changed from InferenceClient if it's not a direct export

        const chatCompletion = await client.chatCompletion({
            provider: "fireworks-ai",
            model: "mistralai/Mixtral-8x22B-Instruct-v0.1",
            messages: [
                {
                    role: "user",
                    content: prompt
                },
            ],
        });

        // Output the LLM's response as text.
        console.log(chatCompletion.choices[0].message.content);
    } catch (err) {
        console.log(err.stack);
    }
}
run().catch(console.dir);