const mongoose = require("mongoose");

/* ── Gift Page Settings (shared for both her/him) ── */
const GiftPageSchema = new mongoose.Schema({
  gender:      { type: String, enum: ["her", "him"], required: true, unique: true },
  title:       { type: String, default: "" },
  subtitle:    { type: String, default: "" },
  description: { type: String, default: "" },
  badgeText:   { type: String, default: "" },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

/* ── Occasion / Persona tags ── */
const giftTagSchema = new mongoose.Schema({
  gender:  { type: String, enum: ["her", "him"], required: true },
  label:   { type: String, required: true },
  icon:    { type: String, default: "◈" },
  desc:    { type: String, default: "" },   // used for "him" personas
  order:   { type: Number, default: 0 },
  isActive:{ type: Boolean, default: true },
}, { timestamps: true });

/* ── Filter tabs ── */
const giftFilterSchema = new mongoose.Schema({
  gender:  { type: String, enum: ["her", "him"], required: true },
  label:   { type: String, required: true },
  value:   { type: String, required: true },
  order:   { type: Number, default: 0 },
  isActive:{ type: Boolean, default: true },
}, { timestamps: true });

/* ── Curated product list ── */
const giftProductSchema = new mongoose.Schema({
  gender:   { type: String, enum: ["her", "him"], required: true },
  product:  { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  order:    { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = {
  GiftPage:    mongoose.models.GiftPage || mongoose.model("GiftPage", GiftPageSchema),
  GiftTag:     mongoose.models.GiftTag || mongoose.model("GiftTag", giftTagSchema),
  GiftFilter:  mongoose.models.GiftFilter || mongoose.model("GiftFilter", giftFilterSchema),
  GiftProduct: mongoose.models.GiftProduct || mongoose.model("GiftProduct", giftProductSchema),
};