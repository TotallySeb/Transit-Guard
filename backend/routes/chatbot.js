// routes/chatbot.js (CommonJS version)

const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Chat = require('../models/chat');
const dotenv = require('dotenv');
dotenv.config();

const {getQueryResults} = require('../rag/retrieve-documents.js'); // Updated to CommonJS import

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/', async (req, res) => {
  try {
    const { message, history } = req.body;

    // Validate input
    if (!message) return res.status(400).json({ error: 'Message is required' });

        // Specify search query and retrieve relevant documents
        const query = "Metro safety tips"; // Example query
        const documents = await getQueryResults(query);

        // Build a string representation of the retrieved documents to use in the prompt
        let textDocuments = "";
        documents.forEach(doc => {
            textDocuments += doc.document.pageContent;
        });
        const question = message;

        
        // Create a prompt consisting of the question and context to pass to the LLM
        const prompt = `Answer the following question based on the given context.
            Question: {${question}}
            Context: {${textDocuments}}
        `;

    // Prepare contents for Gemini API, including history if available
    const contents = history || [];
    contents.push({ role: 'user', parts: [{ text: prompt }] }); // Add the current user message

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Define the system instruction for the AI model
    const systemInstruction = {
      role: 'system',
      parts: [
        {
          text: `You are Metro Transit Guard AI, deeply committed to passenger safety. Your primary function is to provide helpful, empathetic, and friendly responses primarily related to metro transit operations, safety protocols, and adjacent public transportation topics. When discussing safety, actively reinforce the importance of vigilance and reporting, and provide relevant official resources. You prioritize passenger well-being and actively guide users on how to enhance their safety and report concerns, rather than passively stating facts. While your main focus is on these areas, you can engage in brief, polite small talk to build rapport. If a user asks about something entirely unrelated to metro transit or safety, gently guide them back to relevant topics or suggest they ask a different question related to your domain. Do not engage in extended general conversations. IF A USER SEEMS TO URGENTLY NEED SOMETHING, RESPOND WITH A CLEAR, CONCISE, AND URGENT TONE IMMEDIATELY, prioritizing their safety and need for quick information.`,
        },
      ],
    };

    // Initialize the chat with history and the new system instruction
    const chat = model.startChat({
      history: contents.slice(0, -1), // Exclude the current user message as it's sent next
      systemInstruction: systemInstruction,
    });

    const result = await chat.sendMessage(prompt);
    const aiReplyText = result.response.text();

    // Update history with the AI's response for the next turn
    contents.push({ role: 'model', parts: [{ text: aiReplyText }] });

    // Save chat to DB
    await Chat.create({ message: message, response: aiReplyText });

    // Send AI's reply and updated history back to the frontend
    res.json({ reply: aiReplyText, history: contents });
  } catch (error) {
    console.error('Gemini API error:', error);
    if (error.response && error.response.status === 404) {
      res.status(500).json({ error: 'AI model not found or accessible. Check API key and model name.' });
    } else {
      res.status(500).json({ error: error.message || 'Failed to get response from AI. Please try again later.' });
    }
  }
});

module.exports = router;
