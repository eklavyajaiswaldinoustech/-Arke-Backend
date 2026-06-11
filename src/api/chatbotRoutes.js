const express = require("express");
const router = express.Router();
const chatbotController = require("../controllers/chatbotController");
const jwt = require("jsonwebtoken");

const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "Please login first" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { _id: decoded.id };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

router.post("/start",                   requireAuth, chatbotController.startConversation);
router.post("/message",                 requireAuth, chatbotController.sendMessage);
router.get("/",                         requireAuth, chatbotController.getConversations);
router.get("/:conversationId",          requireAuth, chatbotController.getConversation);
router.delete("/:conversationId",       requireAuth, chatbotController.deleteConversation);
router.get("/:conversationId/insights", requireAuth, chatbotController.getUserInsights);

module.exports = router;
