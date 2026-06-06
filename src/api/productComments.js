const express = require("express");
const router = express.Router();

// In-memory store (replace with MongoDB)
const commentsStore = {}; // { productId: [ { id, userId, userName, email, rating, text, timestamp, orderVerified } ] }
const ordersStore = {}; // { userId: [ { productId, orderId, purchaseDate } ] }

// ── Middleware: Verify user is logged in ────────────────────
function getUserId(req) {
  const auth = req.headers.authorization || "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token) return null;
  return token; // Using token as userId for demo
}

// ── Verify Purchase (check if user bought the product) ─────
function verifyPurchase(userId, productId) {
  if (!ordersStore[userId]) return false;
  return ordersStore[userId].some((order) => order.productId === productId);
}

// ── GET: All comments for a product ─────────────────────────
router.get("/:productId", (req, res) => {
  const { productId } = req.params;
  const userId = getUserId(req);

  // Check if user has purchased this product
  const hasPurchased = userId ? verifyPurchase(userId, productId) : false;

  const comments = commentsStore[productId] || [];

  res.json({
    success: true,
    comments: comments,
    userHasPurchased: hasPurchased,
    totalComments: comments.length,
  });
});

// ── POST: Add comment (only if user purchased product) ───────
router.post("/:productId", (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized - Please login" });
  }

  const { productId } = req.params;
  const { userName, email, rating, text } = req.body;

  // Verify purchase
  if (!verifyPurchase(userId, productId)) {
    return res.status(403).json({
      message:
        "You must purchase this product to leave a comment",
      eligible: false,
    });
  }

  if (!text || !text.trim()) {
    return res.status(400).json({ message: "Comment text is required" });
  }

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5" });
  }

  const newComment = {
    id: Date.now(),
    userId,
    userName: userName || "Anonymous",
    email: email || "",
    rating: Number(rating),
    text: text.trim(),
    timestamp: new Date().toISOString(),
    date: new Date().toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    verified: true,
  };

  if (!commentsStore[productId]) {
    commentsStore[productId] = [];
  }

  commentsStore[productId].unshift(newComment); // Add to beginning (newest first)

  console.log(`✅ Comment added for product ${productId}`);

  res.json({
    success: true,
    comment: newComment,
    message: "Thank you for your feedback!",
  });
});

// ── POST: Record purchase (called from order endpoint) ───────
router.post("/record-purchase/:productId", (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { productId } = req.params;
  const { orderId } = req.body;

  if (!ordersStore[userId]) {
    ordersStore[userId] = [];
  }

  ordersStore[userId].push({
    productId,
    orderId,
    purchaseDate: new Date().toISOString(),
  });

  console.log(`📦 Purchase recorded for user ${userId}, product ${productId}`);

  res.json({
    success: true,
    message: "Purchase recorded",
  });
});

module.exports = router;