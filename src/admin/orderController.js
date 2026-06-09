const Order = require("../models/Order");
const User = require("../models/User");

/**
 * GET /admin/orders
 * List all orders with filters and pagination
 */
exports.getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      startDate,
      endDate,
      sortBy = "-createdAt",
    } = req.query;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { orderId: { $regex: search, $options: "i" } },
        { "shippingAddress.phone": { $regex: search, $options: "i" } },
      ];
    }
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Fetch orders
    const orders = await Order.find(filter)
      .populate("userId", "name email phone")
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    return res.render("orders/index", {
      orders,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
      status,
      search,
      success: req.query.success,
      error: req.query.error,
    });
  } catch (err) {
    console.error("Error fetching orders:", err);
    return res.render("orders/index", {
      orders: [],
      error: "Failed to fetch orders",
    });
  }
};

/**
 * GET /admin/orders/:orderId/detail
 * View order details
 */
exports.getOrderDetail = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("userId", "name email phone addresses")
      .populate("items.productId");

    if (!order) {
      return res.status(404).render("404", { message: "Order not found" });
    }

    return res.render("orders/detail", {
      order,
      success: req.query.success,
      error: req.query.error,
    });
  } catch (err) {
    console.error("Error fetching order detail:", err);
    return res.status(500).render("500", { message: "Failed to fetch order" });
  }
};

/**
 * POST /admin/orders/:orderId/update-status
 * Update order status and add to history
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, location, note, shippingPartner, trackingNumber, expectedDelivery } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Update status
    order.status = status;

    // Add to status history
    order.statusHistory.push({
      status,
      date: new Date(),
      location,
      note,
      updatedBy: req.session.admin?.name || "System",
    });

    // Update shipping details if provided
    if (shippingPartner) order.shippingPartner = shippingPartner;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (expectedDelivery) order.expectedDelivery = new Date(expectedDelivery);
    if (status === "delivered") order.deliveredAt = new Date();

    await order.save();

    // If return_approved, prepare for return pickup
    if (status === "return_approved") {
      // Add internal note
      if (order.returnInfo) {
        order.returnInfo.approvedAt = new Date();
        order.returnInfo.approvedBy = req.session.admin?.name || "System";
      }
      await order.save();
    }

    return res.json({
      success: true,
      message: "Order status updated successfully",
      data: order,
    });
  } catch (err) {
    console.error("Error updating order:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update order",
      error: err.message,
    });
  }
};

/**
 * POST /admin/orders/:orderId/process-refund
 * Process refund for returned order
 */
exports.processRefund = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { refundAmount, method } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!order.returnInfo) {
      return res.status(400).json({ success: false, message: "No return info found" });
    }

    // Update refund info
    order.returnInfo.refundAmount = refundAmount || order.total;
    order.returnInfo.refundMethod = method || order.returnInfo.refundMethod;
    order.status = "refund_processing";

    order.statusHistory.push({
      status: "refund_processing",
      date: new Date(),
      note: `Refund of ₹${refundAmount || order.total} initiated`,
      updatedBy: req.session.admin?.name || "System",
    });

    // TODO: Integrate with payment gateway for actual refund processing
    // For now, just update the status
    setTimeout(async () => {
      order.status = "refunded";
      order.returnInfo.refundProcessedAt = new Date();
      order.statusHistory.push({
        status: "refunded",
        date: new Date(),
        note: `Refund of ₹${refundAmount || order.total} processed successfully`,
      });
      await order.save();
    }, 2000);

    await order.save();

    return res.json({
      success: true,
      message: "Refund processing initiated",
      data: order,
    });
  } catch (err) {
    console.error("Error processing refund:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to process refund",
      error: err.message,
    });
  }
};

/**
 * POST /admin/orders/:orderId/approve-return
 * Approve return request
 */
exports.approveReturn = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { pickupDate, pickupPartner, pickupTrackingId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!order.returnInfo) {
      return res.status(400).json({ success: false, message: "No return request found" });
    }

    // Approve return
    order.status = "return_approved";
    order.returnInfo.approvedAt = new Date();
    order.returnInfo.approvedBy = req.session.admin?.name || "System";
    order.returnInfo.pickupDate = new Date(pickupDate);
    order.returnInfo.pickupPartner = pickupPartner;
    order.returnInfo.pickupTrackingId = pickupTrackingId;

    order.statusHistory.push({
      status: "return_approved",
      date: new Date(),
      note: `Return approved. Pickup scheduled with ${pickupPartner}`,
      updatedBy: req.session.admin?.name || "System",
    });

    await order.save();

    return res.json({
      success: true,
      message: "Return approved successfully",
      data: order,
    });
  } catch (err) {
    console.error("Error approving return:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to approve return",
      error: err.message,
    });
  }
};

/**
 * POST /admin/orders/:orderId/reject-return
 * Reject return request
 */
exports.rejectReturn = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!order.returnInfo) {
      return res.status(400).json({ success: false, message: "No return request found" });
    }

    order.status = "return_rejected";
    order.returnInfo.rejectionReason = reason;

    order.statusHistory.push({
      status: "return_rejected",
      date: new Date(),
      note: `Return rejected. Reason: ${reason}`,
      updatedBy: req.session.admin?.name || "System",
    });

    await order.save();

    return res.json({
      success: true,
      message: "Return rejected successfully",
      data: order,
    });
  } catch (err) {
    console.error("Error rejecting return:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to reject return",
      error: err.message,
    });
  }
};

/**
 * GET /admin/orders/returns
 * View all return requests
 */
exports.getReturns = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    const filter = {
      $or: [
        { status: "return_requested" },
        { status: "return_approved" },
        { status: "return_picked" },
        { status: "refund_processing" },
        { status: "refunded" },
        { status: "return_rejected" },
      ],
    };

    if (status) {
      filter.$or = [{ status }];
    }

    const returns = await Order.find(filter)
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    return res.render("orders/returns", {
      returns,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
      success: req.query.success,
      error: req.query.error,
    });
  } catch (err) {
    console.error("Error fetching returns:", err);
    return res.render("orders/returns", {
      returns: [],
      error: "Failed to fetch returns",
    });
  }
};

/**
 * GET /admin/orders/dashboard
 * Order dashboard with stats
 */
exports.getOrderDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Today's orders
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: today },
    });

    // Pending orders
    const pendingOrders = await Order.countDocuments({
      status: { $in: ["placed", "confirmed", "processing", "packed"] },
    });

    // Shipped orders
    const shippedOrders = await Order.countDocuments({
      status: { $in: ["shipped", "in_transit", "out_for_delivery"] },
    });

    // Delivered orders
    const deliveredOrders = await Order.countDocuments({ status: "delivered" });

    // Return requests
    const returnRequests = await Order.countDocuments({
      status: "return_requested",
    });

    // Total revenue
    const revenue = await Order.aggregate([
      { $match: { status: "delivered" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);

    // Recent orders
    const recentOrders = await Order.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(10);

    return res.render("orders/dashboard", {
      stats: {
        todayOrders,
        pendingOrders,
        shippedOrders,
        deliveredOrders,
        returnRequests,
        totalRevenue: revenue[0]?.total || 0,
      },
      recentOrders,
    });
  } catch (err) {
    console.error("Error fetching order dashboard:", err);
    return res.render("orders/dashboard", {
      stats: {},
      recentOrders: [],
      error: "Failed to load dashboard",
    });
  }
};
