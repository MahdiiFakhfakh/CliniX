require("dotenv").config();
const express = require("express");
const router = express.Router();
const fetch = require("node-fetch"); // <- fix fetch


router.post("/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) return res.status(400).json({ success: false, error: "Message is required" });

    const messages = [
      ...history.map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content
      })),
      { role: "user", content: message }
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
  model: "bytedance-seed/seed-2.0-mini",
  messages
})
    });

    const data = await response.json();
    console.log("OpenRouter response:", JSON.stringify(data, null, 2));
    const text = data?.choices?.[0]?.message?.content;
if (!text) {
  console.warn("AI returned empty response", data);
  return res.json({
    success: true,
    reply: {
      content: "No response from AI",
      caution: "This AI assistant provides general medical information only. Always consult a licensed healthcare professional.",
    },
  });
}

    return res.json({
      success: true,
      reply: {
        content: text,
        caution: "This AI assistant provides general medical information only. Always consult a licensed healthcare professional.",
      },
    });

  } catch (error) {
    console.error("AI Chat Error:", error);
    return res.status(500).json({ success: false, error: "AI request failed" });
  }
});

module.exports = router;