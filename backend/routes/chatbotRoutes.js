require("dotenv").config();

const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");

const chatbotServiceUrl = (
  process.env.CHATBOT_SERVICE_URL || "http://127.0.0.1:8001"
).replace(/\/+$/, "");

const forwardToChatbotService = async (req, res) => {
  const targetUrl = `${chatbotServiceUrl}/api/chatbot${req.path}`;
  const headers = {
    "Content-Type": "application/json",
    "X-Clinix-User-Id": req.user._id.toString(),
  };

  if (process.env.CHATBOT_GATEWAY_SECRET) {
    headers["X-Clinix-Gateway-Secret"] = process.env.CHATBOT_GATEWAY_SECRET;
  }

  if (req.headers.authorization) {
    headers.Authorization = req.headers.authorization;
  }

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: req.method === "GET" ? undefined : JSON.stringify(req.body || {}),
    });
    const responseText = await response.text();
    const contentType = response.headers.get("content-type");

    if (contentType) {
      res.set("content-type", contentType);
    }

    return res.status(response.status).send(responseText);
  } catch (error) {
    console.error("Chatbot service proxy error:", error);
    return res.status(502).json({
      success: false,
      error: "Chatbot service unavailable",
    });
  }
};

router.use(protect);
router.post("/chat", forwardToChatbotService);
router.get("/history", forwardToChatbotService);
router.delete("/history", forwardToChatbotService);

module.exports = router;
