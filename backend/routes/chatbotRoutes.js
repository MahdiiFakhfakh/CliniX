require("dotenv").config();
const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const Conversation = require("../models/Conversation");

const SYSTEM_PROMPT = `You are a helpful medical assistant in a patient health 
management app called Clinix. Answer questions about medications, symptoms, and 
general health clearly and concisely. Always remind users to consult their doctor 
for serious concerns. Never diagnose or prescribe medication.`;

// POST /api/chatbot/chat  (protected)
router.post("/chat", protect, async (req, res) => {
  try {
    const { message } = req.body;
    const patientId = req.user._id;

    if (!message) {
      return res.status(400).json({ success: false, error: "Message is required" });
    }

    // Load existing conversation from MongoDB
    let conversation = await Conversation.findOne({ patientId });
    if (!conversation) {
      conversation = new Conversation({ patientId, messages: [] });
    }

    // Build messages array for OpenRouter (last 20 messages to stay within limits)
    const recentMessages = conversation.messages.slice(-20).map(m => ({
      role: m.role,
      content: m.content
    }));

    const messagesPayload = [
      { role: "system", content: SYSTEM_PROMPT },
      ...recentMessages,
      { role: "user", content: message }
    ];

    // Call OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: messagesPayload
      })
    });

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;

    if (!text) {
      console.warn("AI returned empty response", data);
      return res.json({
        success: true,
        reply: {
          content: "I couldn't generate a response. Please try again.",
          caution: "This AI assistant provides general medical information only. Always consult a licensed healthcare professional."
        }
      });
    }

    // Save both messages to MongoDB
    conversation.messages.push({ role: "user", content: message });
    conversation.messages.push({ role: "assistant", content: text });
    conversation.updatedAt = new Date();
    await conversation.save();

    return res.json({
      success: true,
      reply: {
        content: text,
        caution: "This AI assistant provides general medical information only. Always consult a licensed healthcare professional."
      }
    });

  } catch (error) {
    console.error("AI Chat Error:", error);
    return res.status(500).json({ success: false, error: "AI request failed" });
  }
});

// GET /api/chatbot/history  (protected)
router.get("/history", protect, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({ patientId: req.user._id });
    const messages = conversation ? conversation.messages : [];
    return res.json({ success: true, messages });
  } catch (error) {
    console.error("History fetch error:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch history" });
  }
});

// DELETE /api/chatbot/history  (protected)
router.delete("/history", protect, async (req, res) => {
  try {
    await Conversation.findOneAndDelete({ patientId: req.user._id });
    return res.json({ success: true, message: "Conversation cleared" });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to clear history" });
  }
});

module.exports = router;