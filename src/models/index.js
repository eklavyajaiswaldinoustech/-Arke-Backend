const mongoose = require("mongoose");
const Announcement = require("./Announcement");
const HeroBanner = require("./HeroBanner");
const Cart = require("./Cart");

/* ── Order ─────────────────────────────────────────────────── */
const orderSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [{
    product:  { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name:     String,
    price:    Number,
    quantity: { type: Number, default: 1 },
    image:    String,
  }],
  shippingAddress: {
    name: String, line1: String, line2: String,
    city: String, state: String, pincode: String, phone: String,
  },
  subtotal:       { type: Number, default: 0 },
  shippingCharge: { type: Number, default: 0 },
  discount:       { type: Number, default: 0 },
  totalAmount:    { type: Number, required: true },
  couponCode:     { type: String },
  status:         { type: String, enum: ["pending","processing","shipped","delivered","cancelled"], default: "pending" },
  paymentMethod:  { type: String, enum: ["online","cod"], default: "online" },
  paymentStatus:  { type: String, enum: ["pending","paid","failed","refunded"], default: "pending" },
  razorpayOrderId:   { type: String },
  razorpayPaymentId: { type: String },
  trackingNumber: { type: String },
  notes:          { type: String },
}, { timestamps: true });

/* ── Wishlist ───────────────────────────────────────────────── */
const wishlistSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
}, { timestamps: true });

/* ── Banner ─────────────────────────────────────────────────── */
const bannerSchema = new mongoose.Schema({
  title:       { type: String },
  subtitle:    { type: String },
  description: { type: String },
  image:       { type: String, required: true },
  ctaText:     { type: String, default: "Shop Now" },
  ctaLink:     { type: String, default: "/products" },
  isActive:    { type: Boolean, default: true },
  order:       { type: Number, default: 0 },
}, { timestamps: true });

/* ── Blog ───────────────────────────────────────────────────── */
const blogSchema = new mongoose.Schema({
  title:           { type: String, required: true },
  slug:            { type: String, unique: true },
  excerpt:         { type: String },
  content:         { type: String, required: true },
  image:           { type: String },
  thumbnail:       { type: String },
  category:        { type: String, default: "Jewellery" },
  tags:            [{ type: String }],
  isPublished:     { type: Boolean, default: true },
  metaTitle:       { type: String },
  metaDescription: { type: String },
  views:           { type: Number, default: 0 },
}, { timestamps: true });

blogSchema.pre("save", function (next) {
  if (this.isModified("title") && !this.slug) {
    this.slug = this.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now();
  }
  if (!this.thumbnail && this.image) this.thumbnail = this.image;
  next();
});

/* ── Coupon ─────────────────────────────────────────────────── */
const couponSchema = new mongoose.Schema({
  code:           { type: String, required: true, unique: true, uppercase: true },
  discountType:   { type: String, enum: ["percentage", "fixed"], default: "percentage" },
  discountValue:  { type: Number, required: true, min: 1 },
  minOrderAmount: { type: Number, default: 0 },
  maxUses:        { type: Number, default: null },
  usedCount:      { type: Number, default: 0 },
  expiryDate:     { type: Date, default: null },
  isActive:       { type: Boolean, default: true },
  usedBy:         [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });

module.exports = {
  Order:    mongoose.model("Order", orderSchema),
  Cart:     Cart,
  Wishlist: mongoose.model("Wishlist", wishlistSchema),
  Banner:   mongoose.model("Banner", bannerSchema),
  Blog:     mongoose.model("Blog", blogSchema),
  Coupon:   mongoose.model("Coupon", couponSchema),
  Announcement: Announcement,
  HeroBanner: HeroBanner,
  BankDetails: require("./BankDetails"),
};
