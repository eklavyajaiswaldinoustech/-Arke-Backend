const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name:             { type: String, required: true, trim: true },
  slug:             { type: String, unique: true },
  shortDescription: { type: String },
  description:      { type: String },
  price:            { type: Number, required: true, min: 0 },
  mrp:              { type: Number, min: 0 },
  sku:              { type: String, trim: true },
  stock:            { type: Number, default: 0, min: 0 },
  images:           [{ type: String }],
  category:         { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  subCategory:      { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
  material:         { type: String },
  metalType:        { type: String },
  weight:           { type: Number },
  size:             { type: String },
  tags:             [{ type: String }],
  giftFor: { type: String, enum: ["him", "her"], default: null },
  isActive:         { type: Boolean, default: true },
  isFeatured:       { type: Boolean, default: false },
  isNewArrival:     { type: Boolean, default: false },
  isBestSeller:     { type: Boolean, default: false },
  rating:           { type: Number, default: 0 },
  reviewCount:      { type: Number, default: 0 },
  metaTitle:        { type: String },
  metaDescription:  { type: String },
}, { timestamps: true });

productSchema.pre("save", function (next) {
  if (this.isModified("name") && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now();
  }
  next();
});

// Virtual: discount percentage
productSchema.virtual("discountPercent").get(function () {
  if (this.mrp && this.mrp > this.price) {
    return Math.round(((this.mrp - this.price) / this.mrp) * 100);
  }
  return 0;
});

module.exports = mongoose.model("Product", productSchema);
