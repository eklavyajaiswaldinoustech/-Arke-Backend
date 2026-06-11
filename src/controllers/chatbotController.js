const ChatConversation = require("../models/ChatConversation");
const ChatMessage = require("../models/ChatMessage");
const Product = require("../models/Product");
const OpenAI = require("openai");

const getClient = () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const analyzeSentiment = (text) => {
  const positive = ["love", "beautiful", "perfect", "amazing", "great", "good", "like", "wonderful"];
  const negative = ["hate", "bad", "ugly", "terrible", "awful", "expensive"];
  const lowerText = text.toLowerCase();
  const posCount = positive.filter(w => lowerText.includes(w)).length;
  const negCount = negative.filter(w => lowerText.includes(w)).length;
  if (posCount > negCount) return "positive";
  if (negCount > posCount) return "negative";
  return "neutral";
};

const getProductContext = async () => {
  try {
    const products = await Product.find({ isActive: true })
      .limit(20)
      .select("name price metalType category tags isFeatured")
      .lean();
    return products.map(p =>
      `- ${p.name} | Rs.${p.price} | ${p.metalType || "N/A"} | ${p.category || "N/A"}`
    ).join("\n");
  } catch {
    return "No products available";
  }
};

const generateAIResponse = async (message, conversationHistory) => {
  const productContext = await getProductContext();

  const systemPrompt = `You are a smart, friendly jewelry shopping assistant for ARKE, a premium Indian jewelry store.

Our current products:
${productContext}

Your job:
- Help customers find the perfect jewelry
- Give personalized gift suggestions based on occasions, relationships, budgets
- Recommend specific products from our catalog when relevant
- Be warm, helpful, and conversational like a knowledgeable friend
- Keep responses concise (2-4 sentences max unless listing products)
- If asked about something unrelated to jewelry/shopping, politely redirect

Never give generic help menus. Always give a direct, personalized response.`;

  const chronological = [...conversationHistory].reverse();
  const withoutCurrent = chronological.slice(0, -1);
  const firstUserIdx = withoutCurrent.findIndex(m => m.sender === "user");

  const messages = [{ role: "system", content: systemPrompt }];

  if (firstUserIdx !== -1) {
    withoutCurrent.slice(firstUserIdx).forEach(m => {
      messages.push({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.message,
      });
    });
  }

  messages.push({ role: "user", content: message });

  const response = await getClient().chat.completions.create({
    model: "gpt-3.5-turbo",
    messages,
    max_tokens: 1024,
    temperature: 0.7,
  });

  return response.choices[0].message.content;
};

exports.startConversation = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ success: false, message: "User not authenticated" });

    const conversation = await ChatConversation.create({
      user: userId,
      title: "Jewelry Shopping Assistant",
      userPreferences: {},
      startedAt: new Date(),
    });

    const greeting = "Hi! I'm your personal jewelry assistant at ARKE. Whether you're looking for a gift, something for a special occasion, or just browsing — I'm here to help. What can I do for you today?";

    await ChatMessage.create({
      conversation: conversation._id,
      sender: "bot",
      message: greeting,
      timestamp: new Date(),
    });

    res.status(201).json({
      success: true,
      data: { conversationId: conversation._id, initialMessage: greeting },
    });
  } catch (err) {
    console.error("startConversation ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, message } = req.body;
    const userId = req.user?._id;

    if (!conversationId || !message)
      return res.status(400).json({ success: false, message: "Conversation ID and message required" });

    const conversation = await ChatConversation.findById(conversationId);
    if (!conversation || conversation.user.toString() !== userId.toString())
      return res.status(403).json({ success: false, message: "Unauthorized" });

    await ChatMessage.create({
      conversation: conversationId,
      sender: "user",
      message,
      sentiment: analyzeSentiment(message),
      timestamp: new Date(),
    });

    const history = await ChatMessage.find({ conversation: conversationId })
      .sort({ timestamp: -1 })
      .limit(20)
      .select("sender message");

    const aiResponse = await generateAIResponse(message, history);

    const botMsg = await ChatMessage.create({
      conversation: conversationId,
      sender: "bot",
      message: aiResponse,
      timestamp: new Date(),
    });

    conversation.lastMessage = aiResponse;
    conversation.updatedAt = new Date();
    await conversation.save();

    res.status(200).json({
      success: true,
      data: { botMessage: aiResponse, messageId: botMsg._id },
    });
  } catch (err) {
    console.error("sendMessage ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?._id;
    const conversation = await ChatConversation.findById(conversationId);
    if (!conversation || conversation.user.toString() !== userId.toString())
      return res.status(403).json({ success: false, message: "Unauthorized" });
    const messages = await ChatMessage.find({ conversation: conversationId })
      .sort({ timestamp: 1 })
      .select("sender message sentiment timestamp");
    res.status(200).json({ success: true, data: { conversation, messages } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user?._id;
    const conversations = await ChatConversation.find({ user: userId })
      .sort({ updatedAt: -1 })
      .select("_id title lastMessage updatedAt");
    res.status(200).json({ success: true, data: conversations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?._id;
    const conversation = await ChatConversation.findById(conversationId);
    if (!conversation || conversation.user.toString() !== userId.toString())
      return res.status(403).json({ success: false, message: "Unauthorized" });
    await ChatConversation.deleteOne({ _id: conversationId });
    await ChatMessage.deleteMany({ conversation: conversationId });
    res.status(200).json({ success: true, message: "Conversation deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getUserInsights = async (req, res) => {
  try {
    const userId = req.user?._id;
    const conversations = await ChatConversation.find({ user: userId });
    const allMessages = await ChatMessage.find({
      conversation: { $in: conversations.map(c => c._id) },
    });
    const pos = allMessages.filter(m => m.sentiment === "positive").length;
    const neg = allMessages.filter(m => m.sentiment === "negative").length;
    res.status(200).json({
      success: true,
      data: {
        totalConversations: conversations.length,
        totalMessages: allMessages.length,
        sentimentAnalysis: { positive: pos, negative: neg, neutral: allMessages.length - pos - neg },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
