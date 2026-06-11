const mongoose = require("mongoose");

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: [
      "pending",
      "placed",
      "confirmed",
      "processing",
      "packed",
      "shipped",
      "in_transit",
      "out_for_delivery",
      "delivered",
      "cancelled",
      "return_requested",
      "return_approved",
      "return_picked",
      "refund_processing",
      "refunded",
      "return_rejected",
    ],
    required: true,
  },
  date: { type: Date, default: Date.now },
  location: String,
  note: String,
  updatedBy: { type: String }, // admin user who updated
});

const returnInfoSchema = new mongoose.Schema({
  requestedAt: { type: Date, default: Date.now },
  reason: String, // wrong_item, damaged, defective, not_as_described, size_issue, quality_issue, changed_mind, other
  details: String,
  photos: [String], // URLs to return photos
  refundMethod: {
    type: String,
    enum: ["original", "bank", "wallet"],
    default: "original",
  },
  returnedItems: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  approvedAt: Date,
  approvedBy: { type: String }, // admin name
  pickupDate: Date,
  pickupPartner: String,
  pickupTrackingId: String,
  refundAmount: Number,
  refundProcessedAt: Date,
  rejectionReason: String,
});

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      required: true,
      default: () => "ARK-" + Date.now().toString().slice(-8).toUpperCase(),
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: String,
        price: Number,
        mrp: Number,
        quantity: { type: Number, default: 1 },
        image: String,
        customization: String, // if any
      },
    ],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    shippingCost: { type: Number, default: 0 },
    total: { type: Number, required: true },

    // Shipping info
    shippingAddress: {
      name: String,
      phone: String,
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
    },
    billingAddress: {
      name: String,
      phone: String,
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
    },

    // Delivery tracking
    status: {
      type: String,
      enum: [
        "placed",
        "confirmed",
        "processing",
        "packed",
        "shipped",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "cancelled",
        "return_requested",
        "return_approved",
        "return_picked",
        "refund_processing",
        "refunded",
        "return_rejected",
      ],
      default: "placed",
    },
    statusHistory: [statusHistorySchema],

    // Shipping partner details
    shippingPartner: String, // e.g., "BlueDart Express", "DTDC"
    trackingNumber: String,
    expectedDelivery: Date,
    deliveredAt: Date,

    // Payment info
    paymentMethod: {
      type: String,
      enum: ["razorpay", "cod", "wallet"],
      default: "cod",
    },
    paymentId: String,
    paymentStatus: { type: String, enum: ["pending", "paid", "completed", "failed", "refunded"], default: "pending" },

    // Return info
    returnInfo: returnInfoSchema,

    // Notes
    notes: String,
    internalNotes: [{ text: String, addedBy: String, addedAt: Date }],

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Index for faster queries
orderSchema.index({ userId: 1 });
orderSchema.index({ orderId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ "shippingAddress.email": 1 });

module.exports = mongoose.model("Order", orderSchema);
