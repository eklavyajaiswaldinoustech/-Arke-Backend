const express = require("express");
const router = express.Router();
const { Wishlist } = require("../models/index");
const Product = require("../models/Product");
const { protect } = require("../middleware/auth");

const ok = (res, data = {}, message = "Success") => res.json({ success: true, message, ...data });
const err = (res, message = "Error", status = 400) => res.status(status).json({ success: false, message });

// GET /api/view-wishlist - Get user's wishlist with populated products
router.get("/", protect, async (req, res) => {
  try {
    const wl = await Wishlist.findOne({ user: req.user._id }).populate("products");
    
    // Return products with full details
    const products = wl?.products || [];
    
    console.log(`✓ Wishlist retrieved for user ${req.user._id}:`, products.length, "items");
    ok(res, { data: products, wishlist: products }, "Wishlist fetched successfully");
  } catch (e) {
    console.error("Wishlist fetch error:", e);
    err(res, e.message);
  }
});

// POST /api/view-wishlist/add - Add product to wishlist
router.post("/add", protect, async (req, res) => {
  try {
    const { productId } = req.body;
    
    if (!productId) {
      return err(res, "productId is required");
    }
    
    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return err(res, "Product not found", 404);
    }
    
    let wl = await Wishlist.findOne({ user: req.user._id });
    if (!wl) {
      wl = await Wishlist.create({ user: req.user._id, products: [] });
    }
    
    const already = wl.products.some(p => p.toString() === productId);
    if (already) {
      // Remove if already exists (toggle)
      wl.products = wl.products.filter(p => p.toString() !== productId);
      await wl.save();
      await wl.populate("products");
      console.log(`♡ Product ${productId} removed from wishlist`);
      return ok(res, { data: wl.products || [], wishlist: wl.products || [] }, "Removed from wishlist");
    }
    
    // Add to wishlist
    wl.products.push(productId);
    await wl.save();
    await wl.populate("products");
    
    console.log(`❤️  Product ${productId} added to wishlist`);
    ok(res, { data: wl.products || [], wishlist: wl.products || [] }, "Added to wishlist");
  } catch (e) {
    console.error("Add to wishlist error:", e);
    err(res, e.message);
  }
});

// POST /api/view-wishlist/remove - Remove product from wishlist
router.post("/remove", protect, async (req, res) => {
  try {
    const { productId } = req.body;
    
    if (!productId) {
      return err(res, "productId is required");
    }
    
    const wl = await Wishlist.findOne({ user: req.user._id });
    if (wl) {
      wl.products = wl.products.filter(p => p.toString() !== productId);
      await wl.save();
      await wl.populate("products");
      console.log(`♡ Product ${productId} removed from wishlist`);
    }
    
    ok(res, { data: wl?.products || [], wishlist: wl?.products || [] }, "Removed from wishlist");
  } catch (e) {
    console.error("Remove from wishlist error:", e);
    err(res, e.message);
  }
});

// DELETE /api/view-wishlist/:productId - Delete from wishlist
router.delete("/:productId", protect, async (req, res) => {
  try {
    const { productId } = req.params;
    
    const wl = await Wishlist.findOne({ user: req.user._id });
    if (wl) {
      wl.products = wl.products.filter(p => p.toString() !== productId);
      await wl.save();
      await wl.populate("products");
      console.log(`♡ Product ${productId} removed from wishlist`);
    }
    
    ok(res, { data: wl?.products || [], wishlist: wl?.products || [] }, "Removed from wishlist");
  } catch (e) {
    console.error("Delete from wishlist error:", e);
    err(res, e.message);
  }
});

// GET /api/view-wishlist/check/:productId - Check if product is in wishlist
router.get("/check/:productId", protect, async (req, res) => {
  try {
    const { productId } = req.params;
    const wl = await Wishlist.findOne({ user: req.user._id });
    const inWishlist = wl?.products.some(p => p.toString() === productId) || false;
    
    console.log(`🔍 Check ${productId} in wishlist:`, inWishlist);
    ok(res, { inWishlist });
  } catch (e) {
    console.error("Check wishlist error:", e);
    err(res, e.message);
  }
});

module.exports = router;