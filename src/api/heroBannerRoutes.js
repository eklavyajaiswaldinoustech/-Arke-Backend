const express = require("express");
const router = express.Router();
const HeroBanner = require("../models/HeroBanner");

// Get all active hero banners
router.get("/", async (req, res) => {
  try {
    const banners = await HeroBanner.find({ isActive: true }).sort({ order: 1 });
    res.json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all hero banners (including inactive)
router.get("/all", async (req, res) => {
  try {
    const banners = await HeroBanner.find().sort({ order: 1 });
    res.json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single hero banner
router.get("/:id", async (req, res) => {
  try {
    const banner = await HeroBanner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }
    res.json({ success: true, data: banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create hero banner
router.post("/", async (req, res) => {
  try {
    const {
      title,
      subtitle,
      description,
      image,
      mobileImage,
      ctaText,
      ctaLink,
      backgroundColor,
      textColor,
      order,
      displayType,
      isActive,
    } = req.body;

    const banner = new HeroBanner({
      title,
      subtitle,
      description,
      image,
      mobileImage,
      ctaText: ctaText || "Shop Now",
      ctaLink: ctaLink || "/products",
      backgroundColor: backgroundColor || "#0f0f0f",
      textColor: textColor || "#f5f5f5",
      order: order || 0,
      displayType: displayType || "full-width",
      isActive: isActive !== false,
    });

    await banner.save();
    res.json({ success: true, data: banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update hero banner
router.put("/:id", async (req, res) => {
  try {
    const {
      title,
      subtitle,
      description,
      image,
      mobileImage,
      ctaText,
      ctaLink,
      backgroundColor,
      textColor,
      order,
      displayType,
      isActive,
    } = req.body;

    const banner = await HeroBanner.findByIdAndUpdate(
      req.params.id,
      {
        title,
        subtitle,
        description,
        image,
        mobileImage,
        ctaText,
        ctaLink,
        backgroundColor,
        textColor,
        order,
        displayType,
        isActive,
      },
      { new: true }
    );

    res.json({ success: true, data: banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete hero banner
router.delete("/:id", async (req, res) => {
  try {
    await HeroBanner.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Hero banner deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
