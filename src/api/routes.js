const router = require("express").Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const User     = require("../models/User");
const Product  = require("../models/Product");
const Category = require("../models/Category");
const SubCategory = require("../models/SubCategory");
const { Order, Cart, Wishlist, Banner, Blog, Coupon, BankDetails } = require("../models/index");
const { protect } = require("../middleware/auth");

const uploadDir = path.join(__dirname, "../../public/uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => cb(null, Date.now() + "-" + Math.round(Math.random()*1e9) + path.extname(file.originalname)),
});
const upload = multer({ storage, limits: { fileSize: 5*1024*1024 } });

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
const ok  = (res, data = {}, message = "Success") => res.json({ success: true, message, ...data });
const err = (res, message = "Error", status = 400) => res.status(status).json({ success: false, message });

// ═══════════════════════════════════════════════════════════════════════════
// ── AUTH ──────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

router.post("/add-user", async (req, res) => {
  try {
    console.log("Registering user with data:", req.body);
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) return err(res, "Name, email and password are required");
    if (await User.findOne({ email })) return err(res, "Email already registered");
    const user = await User.create({ name, email, phone, password });
    const token = signToken(user._id);
    ok(res, { token, data: { token, user: { _id: user._id, name: user.name, email: user.email } } }, "Registered successfully");
  } catch (e) { 
    console.error("Registration error:", e);
    err(res, e.message); 
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) return err(res, "Invalid email or password", 401);
    if (!user.isActive) return err(res, "Account has been disabled", 401);
    const token = signToken(user._id);
    ok(res, { token, data: { token, user: { _id: user._id, name: user.name, email: user.email, phone: user.phone } } }, "Login successful");
  } catch (e) { 
    console.error("Login error:", e);
    err(res, e.message); 
  }
});

router.get("/profile", protect, async (req, res) => {
  try {
    ok(res, { data: req.user });
  } catch (e) {
    err(res, e.message);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ── PRODUCTS ──────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

router.get("/get-all-product", async (req, res) => {
  try {
    const { category, search, sort, page = 1, limit = 20 } = req.query;
    console.log("Fetching products with:", { category, search, sort, page, limit });
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (search) filter.$or = [{ name: new RegExp(search, "i") }, { tags: new RegExp(search, "i") }];
    if (req.query.giftFor) filter.giftFor = req.query.giftFor;
    
    const sortMap = { price_asc: { price: 1 }, price_desc: { price: -1 }, newest: { createdAt: -1 } };
    const products = await Product.find(filter)
      .populate("category", "name")
      .sort(sortMap[sort] || { createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    
    ok(res, { data: products, products });
  } catch (e) { 
    console.error("Get all products error:", e);
    err(res, e.message); 
  }
});

router.get("/get-product/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category", "name");
    if (!product) return err(res, "Product not found", 404);
    ok(res, { data: product, product });
  } catch (e) { 
    console.error("Get product error:", e);
    err(res, e.message); 
  }
});

router.get("/latest-products", async (req, res) => {
  try {
    let products = await Product.find({ isActive: true, isNewArrival: true }).sort({ createdAt: -1 }).limit(12);
    if (!products.length) products = await Product.find({ isActive: true }).sort({ createdAt: -1 }).limit(12);
    ok(res, { data: products, products });
  } catch (e) { 
    console.error("Get latest products error:", e);
    err(res, e.message); 
  }
});

router.get("/best-by-us", async (req, res) => {
  try {
    let products = await Product.find({ isActive: true, isBestSeller: true }).sort({ createdAt: -1 }).limit(12);
    if (!products.length) products = await Product.find({ isActive: true }).sort({ createdAt: -1 }).limit(12);
    ok(res, { data: products, products });
  } catch (e) { 
    console.error("Get best sellers error:", e);
    err(res, e.message); 
  }
});

router.post("/add-product", upload.array("images", 10), async (req, res) => {
  try {
    const images = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];
    const product = await Product.create({ 
      ...req.body, 
      images, 
      price: Number(req.body.price), 
      stock: Number(req.body.stock || 0) 
    });
    ok(res, { data: product }, "Product added");
  } catch (e) { 
    console.error("Add product error:", e);
    err(res, e.message); 
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ── CATEGORIES ────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

router.get("/get-all-Category", async (req, res) => {
  try {
    console.log("getting categories");
    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, createdAt: -1 });
    ok(res, { data: categories, categories });
  } catch (e) { 
    console.error("Get categories error:", e);
    err(res, e.message); 
  }
});

router.post("/add-Category", upload.single("image"), async (req, res) => {
  try {
    const { name, description } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    const cat = await Category.create({ name, description, image });
    ok(res, { data: cat }, "Category created");
  } catch (e) { 
    console.error("Add category error:", e);
    err(res, e.message); 
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ── CART ──────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

router.get("/viewCart", protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
    ok(res, { data: cart?.items || [], items: cart?.items || [] });
  } catch (e) { 
    console.error("View cart error:", e);
    err(res, e.message); 
  }
});

router.post("/addCart", protect, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });
    
    const existing = cart.items.find(i => i.product?.toString() === productId);
    if (existing) existing.quantity += Number(quantity);
    else cart.items.push({ product: productId, quantity: Number(quantity) });
    
    await cart.save();
    await cart.populate("items.product");
    ok(res, { data: cart.items }, "Added to cart");
  } catch (e) { 
    console.error("Add to cart error:", e);
    err(res, e.message); 
  }
});

router.post("/removeFromCart", protect, async (req, res) => {
  try {
    const { productId } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) { 
      cart.items = cart.items.filter(i => i.product?.toString() !== productId); 
      await cart.save();
      await cart.populate("items.product");
    }
    ok(res, { data: cart?.items || [] }, "Removed from cart");
  } catch (e) { 
    console.error("Remove from cart error:", e);
    err(res, e.message); 
  }
});

router.post("/update-quantity", protect, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    if (!productId || quantity === undefined) {
      return err(res, "productId and quantity are required");
    }
    
    if (!Number.isInteger(quantity) || quantity < 1) {
      return err(res, "quantity must be a positive integer");
    }
    
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return err(res, "Cart not found");
    }
    
    const item = cart.items.find(i => i.product?.toString() === productId);
    if (!item) {
      return err(res, "Product not found in cart");
    }
    
    item.quantity = Number(quantity);
    await cart.save();
    await cart.populate("items.product");
    
    ok(res, { data: cart.items }, "Quantity updated successfully");
  } catch (e) { 
    console.error("Update quantity error:", e);
    err(res, e.message); 
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ── WISHLIST ──────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

router.get("/view-wishlist", protect, async (req, res) => {
  try {
    const wl = await Wishlist.findOne({ user: req.user._id }).populate("products");
    ok(res, { data: wl?.products || [], wishlist: wl?.products || [] });
  } catch (e) { 
    console.error("View wishlist error:", e);
    err(res, e.message); 
  }
});

router.post("/add-to-wishlist", protect, async (req, res) => {
  try {
    const { productId } = req.body;
    
    if (!productId) {
      return err(res, "productId is required");
    }
    
    const product = await Product.findById(productId);
    if (!product) {
      return err(res, "Product not found");
    }
    
    let wl = await Wishlist.findOne({ user: req.user._id });
    if (!wl) wl = await Wishlist.create({ user: req.user._id, products: [] });
    
    const already = wl.products.map(p => p.toString()).includes(productId);
    if (already) { 
      wl.products = wl.products.filter(p => p.toString() !== productId); 
      await wl.save(); 
      wl = await Wishlist.findOne({ user: req.user._id }).populate("products");
      return ok(res, { data: wl?.products || [], wishlist: wl?.products || [] }, "Removed from wishlist"); 
    }
    
    wl.products.push(productId);
    await wl.save();
    wl = await Wishlist.findOne({ user: req.user._id }).populate("products");
    ok(res, { data: wl?.products || [], wishlist: wl?.products || [] }, "Added to wishlist");
  } catch (e) { 
    console.error("Add to wishlist error:", e);
    err(res, e.message); 
  }
});

router.post("/remove-from-wishlist", protect, async (req, res) => {
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
    }
    
    ok(res, { data: wl?.products || [], wishlist: wl?.products || [] }, "Removed from wishlist");
  } catch (e) { 
    console.error("Remove from wishlist error:", e);
    err(res, e.message); 
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ── ORDERS ────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

router.post("/place-order", protect, async (req, res) => {
  try {
    console.log("Order Data:", req.body);

    const {
      items,
      shippingAddress,
      paymentMethod = "online",
      couponCode,
    } = req.body;

    if (!items || !items.length) {
      return err(res, "No items in order");
    }

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(
        item.productId || item.product
      );

      if (!product) continue;

      const quantity = item.quantity || 1;

      subtotal += product.price * quantity;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity,
        image:
          product.images?.[0] ||
          product.image ||
          "",
      });
    }

    if (!orderItems.length) {
      return err(res, "No valid products found");
    }

    const shippingCharge = subtotal >= 999 ? 0 : 99;

    let discount = 0;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
      });

      if (coupon) {
        if (coupon.discountType === "percentage") {
          discount =
            (subtotal * coupon.discountValue) / 100;
        } else {
          discount = coupon.discountValue;
        }
      }
    }

    const totalAmount =
      subtotal + shippingCharge - discount;

    const order = await Order.create({
      user: req.user._id,

      items: orderItems,

      shippingAddress: {
        name: `${shippingAddress.firstName || ""} ${
          shippingAddress.lastName || ""
        }`.trim(),
        line1: shippingAddress.address || "",
        line2: shippingAddress.apartment || "",
        city: shippingAddress.city || "",
        state: shippingAddress.state || "",
        pincode: shippingAddress.pincode || "",
        phone: shippingAddress.phone || "",
      },

      subtotal,
      shippingCharge,
      discount,
      totalAmount,

      couponCode: couponCode || "",

      paymentMethod,
      paymentStatus: "pending",

      status: "pending",
    });

    await User.findByIdAndUpdate(req.user._id, {
      $inc: {
        orderCount: 1,
        totalSpent: totalAmount,
      },
    });

    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { items: [] }
    );

    return ok(
      res,
      {
        orderId: order._id,
        data: order,
      },
      "Order placed successfully"
    );
  } catch (e) {
    console.error("Place order error:", e);
    return err(res, e.message);
  }
});

router.get("/orders", protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    
    const formattedOrders = orders.map(order => ({
      ...order.toObject(),
      items: order.items.map(item => ({
        ...item,
        image: item.image || item.images?.[0],
        images: item.images || (item.image ? [item.image] : []),
      })),
      shipping: order.shipping || 0,
      status: order.status || "pending",
      paymentStatus: order.paymentStatus || "pending",
    }));
    
    ok(res, { data: formattedOrders, orders: formattedOrders });
  } catch (e) {
    console.error("Get orders error:", e);
    err(res, e.message);
  }
});

router.get("/order/:orderId", protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.orderId)) {
      return err(res, "Invalid order ID", 400);
    }
    
    const order = await Order.findById(req.params.orderId);
    
    if (!order) return err(res, "Order not found", 404);
    
    if (order.user.toString() !== req.user._id.toString()) {
      return err(res, "Unauthorized", 403);
    }
    
    const formattedOrder = {
      ...order.toObject(),
      items: order.items.map(item => ({
        ...item,
        image: item.image || item.images?.[0],
        images: item.images || (item.image ? [item.image] : []),
      })),
      shipping: order.shipping || 0,
      status: order.status || "pending",
      paymentStatus: order.paymentStatus || "pending",
    };
    
    ok(res, { data: formattedOrder, order: formattedOrder });
  } catch (e) {
    console.error("Get order error:", e);
    err(res, e.message);
  }
});

router.patch("/order/:orderId/status", protect, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
    
    if (!validStatuses.includes(status)) {
      return err(res, `Invalid status. Must be one of: ${validStatuses.join(", ")}`);
    }
    
    if (!mongoose.Types.ObjectId.isValid(req.params.orderId)) {
      return err(res, "Invalid order ID", 400);
    }
    
    const order = await Order.findById(req.params.orderId);
    
    if (!order) return err(res, "Order not found", 404);
    
    if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return err(res, "Unauthorized", 403);
    }
    
    order.status = status;
    
    if (status === "delivered") {
      order.deliveredAt = new Date();
    }
    
    await order.save();
    
    const formattedOrder = {
      ...order.toObject(),
      items: order.items.map(item => ({
        ...item,
        image: item.image || item.images?.[0],
        images: item.images || (item.image ? [item.image] : []),
      })),
    };
    
    ok(res, { data: formattedOrder }, `Order status updated to ${status}`);
  } catch (e) {
    console.error("Update order status error:", e);
    err(res, e.message);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ── RAZORPAY ──────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

router.post("/create-razorpay-order", protect, async (req, res) => {
  try {
    const Razorpay = require("razorpay");
    const rzp = new Razorpay({ 
      key_id: process.env.RAZORPAY_KEY_ID, 
      key_secret: process.env.RAZORPAY_KEY_SECRET 
    });
    const rzpOrder = await rzp.orders.create({ 
      amount: req.body.amount * 100, 
      currency: "INR", 
      receipt: "arke_" + Date.now() 
    });
    ok(res, { data: rzpOrder, orderId: rzpOrder.id, key: process.env.RAZORPAY_KEY_ID });
  } catch (e) { 
    console.error("Create razorpay order error:", e);
    err(res, e.message); 
  }
});

router.post("/verify-payment", protect, async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpayOrderId + "|" + razorpayPaymentId)
      .digest("hex");
    
    if (expected !== razorpaySignature) return err(res, "Payment verification failed", 400);
    
    await Order.findByIdAndUpdate(orderId, { 
      paymentStatus: "paid", 
      razorpayOrderId, 
      razorpayPaymentId, 
      status: "processing" 
    });
    
    ok(res, {}, "Payment verified");
  } catch (e) { 
    console.error("Verify payment error:", e);
    err(res, e.message); 
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ── BANNERS ───────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

router.get("/banner", async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    ok(res, { data: banners, banners });
  } catch (e) { 
    console.error("Get banners error:", e);
    err(res, e.message); 
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ── BLOGS ─────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

router.get("/blogs", async (req, res) => {
  try {
    const blogs = await Blog.find({ isPublished: true }).sort({ createdAt: -1 }).limit(20);
    ok(res, { data: blogs, blogs });
  } catch (e) { 
    console.error("Get blogs error:", e);
    err(res, e.message); 
  }
});

router.get("/blogs/:id", async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(
      req.params.id, 
      { $inc: { views: 1 } }, 
      { new: true }
    );
    if (!blog) return err(res, "Post not found", 404);
    ok(res, { data: blog });
  } catch (e) { 
    console.error("Get blog error:", e);
    err(res, e.message); 
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ── COUPONS ───────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

// ✅ FIX: removed `protect` so guests on the cart page can also load coupons
router.get("/coupons", async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      $or: [
        { expiryDate: null },
        { expiryDate: { $gte: now } }
      ]
    }).select("code discountType discountValue minOrderAmount expiryDate").lean();
    
    ok(res, { data: coupons });
  } catch (e) {
    console.error("Get coupons error:", e);
    err(res, e.message);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ── BANK DETAILS ──────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

router.get("/bank-details", protect, async (req, res) => {
  try {
    const bankDetails = await BankDetails.findOne({ user: req.user._id });
    ok(res, { data: bankDetails || null });
  } catch (e) { 
    console.error("Get bank details error:", e);
    err(res, e.message); 
  }
});

router.get("/bank-details/:userId", protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return err(res, "Invalid user ID", 400);
    }
    if (req.user._id.toString() !== req.params.userId && !req.user.isAdmin) {
      return err(res, "Unauthorized", 403);
    }
    const bankDetails = await BankDetails.findOne({ user: req.params.userId });
    ok(res, { data: bankDetails || null });
  } catch (e) { 
    console.error("Get user bank details error:", e);
    err(res, e.message); 
  }
});

router.post("/bank-details", protect, async (req, res) => {
  try {
    const { accountHolderName, bankName, accountNumber, ifscCode, accountType } = req.body;
    
    if (!accountHolderName || !bankName || !accountNumber || !ifscCode) {
      return err(res, "All fields are required");
    }
    
    if (accountNumber.length < 9 || accountNumber.length > 16) {
      return err(res, "Account number must be 9-16 digits");
    }
    
    if (ifscCode.length !== 11) {
      return err(res, "IFSC code must be 11 characters");
    }
    
    let bankDetails = await BankDetails.findOne({ user: req.user._id });
    
    if (bankDetails) {
      bankDetails.accountHolderName = accountHolderName;
      bankDetails.bankName = bankName;
      bankDetails.accountNumber = accountNumber;
      bankDetails.ifscCode = ifscCode.toUpperCase();
      bankDetails.accountType = accountType || "savings";
      await bankDetails.save();
    } else {
      bankDetails = await BankDetails.create({
        user: req.user._id,
        accountHolderName,
        bankName,
        accountNumber,
        ifscCode: ifscCode.toUpperCase(),
        accountType: accountType || "savings",
      });
    }
    
    ok(res, { data: bankDetails }, "Bank details saved successfully");
  } catch (e) { 
    console.error("Save bank details error:", e);
    err(res, e.message); 
  }
});

router.delete("/bank-details", protect, async (req, res) => {
  try {
    await BankDetails.findOneAndDelete({ user: req.user._id });
    ok(res, {}, "Bank details deleted successfully");
  } catch (e) { 
    console.error("Delete bank details error:", e);
    err(res, e.message); 
  }
});

module.exports = router;