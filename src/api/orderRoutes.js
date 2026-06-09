const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const { protect } = require("../middleware/auth");

/**
 * GET /api/orders
 * Get all orders for logged-in user (alias for my-orders)
 */
router.get("/", protect, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate("items.productId")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: orders,
      count: orders.length,
    });
  } catch (err) {
    console.error("Error fetching orders:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: err.message,
    });
  }
});

/**
 * GET /api/orders/my-orders
 * Get all orders for logged-in user
 */
router.get("/my-orders", protect, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate("items.productId")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: orders,
      count: orders.length,
    });
  } catch (err) {
    console.error("Error fetching orders:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: err.message,
    });
  }
});

/**
 * GET /api/orders/track/:orderId
 * Track order by ID (with optional email verification)
 */
router.get("/track/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { email } = req.query;

    // Find order by orderId
    let order = await Order.findOne({ orderId }).populate("items.productId");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // If email is provided, verify it matches
    if (email) {
      const userId = order.userId;
      const user = await require("../models/User").findById(userId);
      if (!user || user.email.toLowerCase() !== email.toLowerCase()) {
        return res.status(403).json({
          success: false,
          message: "Email does not match order records",
        });
      }
    }

    return res.json({
      success: true,
      data: order,
    });
  } catch (err) {
    console.error("Error tracking order:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to track order",
      error: err.message,
    });
  }
});

/**
 * GET /api/orders/:orderId
 * Get single order details (for logged-in user)
 */
router.get("/:orderId", protect, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      orderId,
      userId: req.user._id,
    }).populate("items.productId");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.json({
      success: true,
      data: order,
    });
  } catch (err) {
    console.error("Error fetching order:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: err.message,
    });
  }
});

/**
 * POST /api/orders/:orderId/request-return
 * Request return for an order
 */
router.post("/:orderId/request-return", protect, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { items, reason, details, refundMethod, photos } = req.body;

    // Validate order exists and belongs to user
    const order = await Order.findOne({
      orderId,
      userId: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if order is delivered and within 7 days
    if (order.status !== "delivered") {
      return res.status(400).json({
        success: false,
        message: "Only delivered orders can be returned",
      });
    }

    const deliveredDate = order.deliveredAt || order.statusHistory.find((s) => s.status === "delivered")?.date;
    if (!deliveredDate) {
      return res.status(400).json({
        success: false,
        message: "Delivery date not found",
      });
    }

    const daysSinceDelivery = Math.floor((Date.now() - new Date(deliveredDate)) / (1000 * 60 * 60 * 24));
    if (daysSinceDelivery > 7) {
      return res.status(400).json({
        success: false,
        message: `Return window expired. Return must be requested within 7 days of delivery. It has been ${daysSinceDelivery} days.`,
      });
    }

    // Update order status to return_requested
    order.status = "return_requested";
    order.returnInfo = {
      requestedAt: new Date(),
      reason,
      details,
      refundMethod,
      photos: photos || [],
      returnedItems: items || order.items.map((i) => i.productId),
    };

    // Add status history
    order.statusHistory.push({
      status: "return_requested",
      date: new Date(),
      note: `Return requested by customer. Reason: ${reason}`,
    });

    await order.save();

    return res.json({
      success: true,
      message: "Return request submitted successfully",
      data: order,
    });
  } catch (err) {
    console.error("Error requesting return:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to request return",
      error: err.message,
    });
  }
});

module.exports = router;
