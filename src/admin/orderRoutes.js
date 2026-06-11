const express = require("express");
const router = express.Router();
const {
  getAllOrders,
  getOrderDetail,
  updateOrderStatus,
  updateOrderStatusHTML,
  processRefund,
  approveReturn,
  rejectReturn,
  getReturns,
  getOrderDashboard,
} = require("../admin/orderController");

/**
 * Order Management Routes
 */

// Dashboard
router.get("/dashboard", getOrderDashboard);

// List all orders
router.get("/", getAllOrders);

// Order detail
router.get("/:orderId/detail", getOrderDetail);

// Update order status (HTML form submission)
router.post("/:orderId/status", updateOrderStatusHTML);

// Update order status (API / AJAX)
router.post("/:orderId/update-status", updateOrderStatus);

// Process refund
router.post("/:orderId/process-refund", processRefund);

// Approve return
router.post("/:orderId/approve-return", approveReturn);

// Reject return
router.post("/:orderId/reject-return", rejectReturn);

// Returns management
router.get("/returns", getReturns);

module.exports = router;
