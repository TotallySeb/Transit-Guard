// routes/chatbot.js
import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Chat from "../models/chat.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    // Prepare contents for Gemini API, including history if available
    const contents = history || [];
    contents.push({ role: "user", parts: [{ text: message }] }); // Add the current user message

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Define the system instruction for the AI model
    // FIX APPLIED HERE: Modified system instruction for less neutrality on safety
    const systemInstruction = {
      role: "system",
      parts: [
        {
          text: `You are Metro Transit Guard AI, deeply committed to passenger safety. Your primary function is to provide helpful, empathetic, and friendly responses primarily related to metro transit operations, safety protocols, and adjacent public transportation topics. When discussing safety, actively reinforce the importance of vigilance and reporting, and provide relevant official resources. You prioritize passenger well-being and actively guide users on how to enhance their safety and report concerns, rather than passively stating facts. While your main focus is on these areas, you can engage in brief, polite small talk to build rapport. If a user asks about something entirely unrelated to metro transit or safety, gently guide them back to relevant topics or suggest they ask a different question related to your domain. Do not engage in extended general conversations. IF A USER SEEMS TO URGENTLY NEED SOMETHING, RESPOND WITH A CLEAR, CONCISE, AND URGENT TONE IMMEDIATELY, prioritizing their safety and need for quick information.`,
        },
      ],
    };

    // Initialize the chat with history and the new system instruction
    const chat = model.startChat({
      history: contents.slice(0, -1), // Exclude the current user message as it's sent next
      systemInstruction: systemInstruction, // Pass the correctly formatted system instruction
    });

    const result = await chat.sendMessage(message); // Send the current message
    const aiReplyText = result.response.text(); // Get the AI's response

    // Update history with the AI's response for the next turn
    contents.push({ role: "model", parts: [{ text: aiReplyText }] });

    // Save chat to DB (optional, based on your schema)
    await Chat.create({ message: message, response: aiReplyText });

    // Send both the AI's reply AND the updated history back to the frontend
    res.json({ reply: aiReplyText, history: contents });
  } catch (error) {
    console.error("Gemini API error:", error);
    if (error.response && error.response.status === 404) {
      res.status(500).json({ error: "AI model not found or accessible. Check API key and model name." });
    } else {
      res.status(500).json({ error: error.message || "Failed to get response from AI. Please try again later." });
    }
  }
});

export default router;