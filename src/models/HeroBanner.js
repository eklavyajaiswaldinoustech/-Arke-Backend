const mongoose = require("mongoose");

const heroBannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    subtitle: {
      type: String,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    image: {
      type: String,
      required: true,
    },
    mobileImage: {
      type: String,
    },
    ctaText: {
      type: String,
      default: "Shop Now",
    },
    ctaLink: {
      type: String,
      default: "/products",
    },
    backgroundColor: {
      type: String,
      default: "#0f0f0f",
    },
    textColor: {
      type: String,
      default: "#f5f5f5",
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayType: {
      type: String,
      enum: ["full-width", "with-text", "overlay"],
      default: "full-width",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HeroBanner", heroBannerSchema);
