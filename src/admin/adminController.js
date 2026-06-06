const Product = require("../models/Product");
const Category = require("../models/Category");
const SubCategory = require("../models/SubCategory");
const { Order, Banner, Blog, Coupon, BankDetails } = require("../models/index");
const User = require("../models/User");
const Admin = require("../models/Admin");
const Announcement = require("../models/Announcement");
const HeroBanner = require("../models/HeroBanner");
const { GiftPage, GiftTag, GiftFilter, GiftProduct } = require("../models/GiftPage");
const jwt = require("jsonwebtoken");

const renderPage = async (res, view, data = {}) => {
  res.render(view, { ...data, layout: "layouts/main" });
};

/* ── Auth ───────────────────────────────────────────────────────────── */
exports.loginPage = (req, res) => res.render("auth/login", { error: null, layout: false, title: "Login" });

exports.loginPost = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const admin = await Admin.findOne({ email, isActive: true });
    if (!admin) return res.render("auth/login", { error: "Invalid email or password", layout: false });
    const match = await admin.comparePassword(password);
    if (!match) return res.render("auth/login", { error: "Invalid email or password", layout: false });
    req.session.admin = { _id: admin._id, name: admin.name, email: admin.email };
    res.redirect("/admin");
  } catch (err) {
    res.render("auth/login", { error: "Something went wrong.", layout: false });
  }
};

exports.logout = (req, res) => { req.session.destroy(); res.redirect("/admin/login"); };

/* ── Dashboard ──────────────────────────────────────────────────────── */
exports.dashboard = async (req, res) => {
  try {
    const [totalOrders, totalRevenueAgg, totalProducts, totalUsers, totalCategories, totalBlogs,
      pendingOrders, processingOrders, deliveredOrders, cancelledOrders, recentOrders, topProducts,
      lowStockProducts, activeCoupons, bankDetailsCount, newUsers, todayOrders, todayRevenueAgg] = await Promise.all([
      Order.countDocuments(),
      Order.aggregate([{ $match: { paymentStatus: "paid" } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
      Product.countDocuments(),
      User.countDocuments(),
      Category.countDocuments(),
      Blog.countDocuments(),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({ status: "processing" }),
      Order.countDocuments({ status: "delivered" }),
      Order.countDocuments({ status: "cancelled" }),
      Order.find().sort({ createdAt: -1 }).limit(8).populate("user", "name email"),
      Product.find({ isActive: true }).sort({ createdAt: -1 }).limit(5),
      Product.find({ isActive: true, stock: { $lte: 5 } }).sort({ stock: 1, createdAt: -1 }).limit(6),
      Coupon.countDocuments({ isActive: true }),
      BankDetails.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(5),
      Order.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      }),
      Order.aggregate([
        {
          $match: {
            paymentStatus: "paid",
            createdAt: {
              $gte: new Date(new Date().setHours(0, 0, 0, 0)),
              $lte: new Date(new Date().setHours(23, 59, 59, 999)),
            },
          },
        },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
    ]);

    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const revenueChart = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const start = new Date(d); start.setHours(0,0,0,0);
      const end = new Date(d); end.setHours(23,59,59,999);
      const agg = await Order.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end }, paymentStatus: "paid" } },
        { $group: { _id: null, revenue: { $sum: "$totalAmount" } } },
      ]);
      revenueChart.push({ day: days[start.getDay()], revenue: agg[0]?.revenue || 0 });
    }

    res.render("dashboard/index", {
      title: "Dashboard", page: "dashboard", admin: req.session.admin,
      stats: {
        totalOrders, totalRevenue: totalRevenueAgg[0]?.total || 0,
        totalProducts, totalUsers, totalCategories, totalBlogs,
        pendingOrders, processingOrders, deliveredOrders, cancelledOrders, revenueChart,
        activeCoupons, bankDetailsCount, todayOrders, todayRevenue: todayRevenueAgg[0]?.total || 0,
      },
      recentOrders, topProducts, lowStockProducts, newUsers,
      success: req.session.success || null, error: req.session.error || null,
    });
    delete req.session.success; delete req.session.error;
  } catch (err) {
    console.error(err);
    res.render("dashboard/index", {
      title: "Dashboard",
      page: "dashboard",
      admin: req.session.admin,
      stats: {},
      recentOrders: [],
      topProducts: [],
      lowStockProducts: [],
      newUsers: [],
    });
  }
};

/* ── Products ───────────────────────────────────────────────────────── */
exports.productList = async (req, res) => {
  const products = await Product.find().populate("category", "name").sort({ createdAt: -1 });
  const categories = await Category.find({ isActive: true });
  res.render("products/index", { title: "Products", page: "products", admin: req.session.admin, products, categories, success: req.session.success, error: req.session.error });
  delete req.session.success; delete req.session.error;
};

exports.addProductPage = async (req, res) => {
  const categories = await Category.find({ isActive: true });
  const subCategories = await SubCategory.find({ isActive: true });
  res.render("products/form", { title: "Add Product", page: "products", admin: req.session.admin, product: null, categories, subCategories });
};

exports.addProduct = async (req, res) => {
  try {
    const images = req.files?.images ? req.files.images.map(f => `/uploads/${f.filename}`) : [];
    const { name, price, mrp, sku, stock, description, shortDescription, material, metalType, weight, size, tags, category, subCategory, isActive, isFeatured, isNewArrival, isBestSeller, metaTitle, metaDescription, giftFor } = req.body;
    
    console.log("Adding product with data:", { name, price, category, giftFor });
    
    const productData = {
      name, 
      price: Number(price), 
      mrp: mrp ? Number(mrp) : null, 
      sku, 
      stock: Number(stock || 0),
      description, 
      shortDescription, 
      material, 
      metalType, 
      weight: weight ? Number(weight) : null, 
      size,
      tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      category: category || null, 
      subCategory: subCategory || null, 
      images,
      isActive: isActive === "true", 
      isFeatured: !!isFeatured, 
      isNewArrival: !!isNewArrival, 
      isBestSeller: !!isBestSeller,
      metaTitle, 
      metaDescription,
      giftFor: giftFor || null,
    };
    
    console.log("Product data to save:", productData);
    
    const product = await Product.create(productData);
    
    console.log("Product saved:", product._id);
    
    req.session.success = `Product "${name}" added.`;
    res.redirect("/admin/products");
  } catch (err) { 
    console.error("Error adding product:", err);
    req.session.error = err.message; 
    res.redirect("/admin/products/add"); 
  }
};

exports.editProductPage = async (req, res) => {
  const product = await Product.findById(req.params.id);
  const categories = await Category.find({ isActive: true });
  const subCategories = await SubCategory.find({ isActive: true });
  res.render("products/form", { title: "Edit Product", page: "products", admin: req.session.admin, product, categories, subCategories });
};

exports.editProduct = async (req, res) => {
  try {
    const { name, price, mrp, sku, stock, description, shortDescription, material, metalType, weight, size, tags, category, subCategory, isActive, isFeatured, isNewArrival, isBestSeller, metaTitle, metaDescription, giftFor } = req.body;
    const update = {
      name, price: Number(price), mrp: mrp ? Number(mrp) : null, sku, stock: Number(stock || 0),
      description, shortDescription, material, metalType, weight: weight ? Number(weight) : null, size,
      tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      category, subCategory: subCategory || null,
      isActive: isActive === "true", isFeatured: !!isFeatured, isNewArrival: !!isNewArrival, isBestSeller: !!isBestSeller,
      metaTitle, metaDescription,
      giftFor: giftFor || null,
    };
    if (req.files?.images?.length) update.images = req.files.images.map(f => `/uploads/${f.filename}`);
    const p = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
    req.session.success = `"${p.name}" updated.`;
    res.redirect("/admin/products");
  } catch (err) { req.session.error = err.message; res.redirect("/admin/products/edit/" + req.params.id); }
};

exports.deleteProduct = async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  req.session.success = "Product deleted.";
  res.redirect("/admin/products");
};

/* ── Categories ─────────────────────────────────────────────────────── */
exports.categoryList = async (req, res) => {
  const categories = await Category.find().sort({ createdAt: -1 });
  const editId = req.query.edit;
  const editCat = editId ? categories.find(c => c._id.toString() === editId) : null;
  res.render("categories/index", { title: "Categories", page: "categories", admin: req.session.admin, categories, editCat: editCat || null, success: req.session.success, error: req.session.error });
  delete req.session.success; delete req.session.error;
};

exports.addCategory = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    await Category.create({ name, description, image, isActive: isActive === "true" });
    req.session.success = `Category "${name}" added.`;
    res.redirect("/admin/categories");
  } catch (err) { req.session.error = err.message; res.redirect("/admin/categories"); }
};

exports.editCategory = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    const update = { name, description, isActive: isActive === "true" };
    if (req.file) update.image = `/uploads/${req.file.filename}`;
    await Category.findByIdAndUpdate(req.params.id, update);
    req.session.success = "Category updated.";
    res.redirect("/admin/categories");
  } catch (err) { req.session.error = err.message; res.redirect("/admin/categories"); }
};

exports.deleteCategory = async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  req.session.success = "Category deleted.";
  res.redirect("/admin/categories");
};

/* ── Banners ────────────────────────────────────────────────────────── */
exports.bannerList = async (req, res) => {
  const banners = await Banner.find().sort({ order: 1, createdAt: -1 });
  res.render("banners/index", { title: "Banners", page: "banners", admin: req.session.admin, banners, success: req.session.success, error: req.session.error });
  delete req.session.success; delete req.session.error;
};

exports.addBanner = async (req, res) => {
  try {
    const { title, subtitle, ctaText, ctaLink, isActive } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    if (!image) { req.session.error = "Please upload a banner image."; return res.redirect("/admin/banners"); }
    await Banner.create({ title, subtitle, ctaText, ctaLink, image, isActive: isActive === "true" });
    req.session.success = "Banner added.";
    res.redirect("/admin/banners");
  } catch (err) { req.session.error = err.message; res.redirect("/admin/banners"); }
};

exports.editBannerPage = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) { req.session.error = "Banner not found."; return res.redirect("/admin/banners"); }
    res.render("banners/edit-banner", { title: "Edit Banner", page: "banners", admin: req.session.admin, banner });
  } catch (err) { req.session.error = err.message; res.redirect("/admin/banners"); }
};

exports.editBanner = async (req, res) => {
  try {
    const { title, subtitle, description, ctaText, ctaLink, order, isActive } = req.body;
    const update = { title, subtitle, description, ctaText, ctaLink, order: Number(order) || 0, isActive: isActive === "true" };
    if (req.file) update.image = `/uploads/${req.file.filename}`;
    const banner = await Banner.findByIdAndUpdate(req.params.id, update, { new: true });
    req.session.success = `Banner "${banner.title}" updated.`;
    res.redirect("/admin/banners");
  } catch (err) { req.session.error = err.message; res.redirect("/admin/banners/edit/" + req.params.id); }
};

exports.deleteBanner = async (req, res) => {
  await Banner.findByIdAndDelete(req.params.id);
  req.session.success = "Banner removed.";
  res.redirect("/admin/banners");
};

/* ── Blog ───────────────────────────────────────────────────────────── */
exports.blogList = async (req, res) => {
  const blogs = await Blog.find().sort({ createdAt: -1 });
  res.render("blog/index", { title: "Blog", page: "blog", admin: req.session.admin, blogs, success: req.session.success, error: req.session.error });
  delete req.session.success; delete req.session.error;
};

exports.addBlogPage = (req, res) => res.render("blog/form", { title: "New Post", page: "blog", admin: req.session.admin, blog: null });

exports.addBlog = async (req, res) => {
  try {
    const { title, excerpt, content, category, tags, isPublished, metaTitle, metaDescription } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    await Blog.create({
      title, excerpt, content, category, image, thumbnail: image,
      isPublished: isPublished === "true",
      tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      metaTitle, metaDescription,
    });
    req.session.success = "Blog post published.";
    res.redirect("/admin/blog");
  } catch (err) { req.session.error = err.message; res.redirect("/admin/blog/add"); }
};

exports.editBlogPage = async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  res.render("blog/form", { title: "Edit Post", page: "blog", admin: req.session.admin, blog });
};

exports.editBlog = async (req, res) => {
  try {
    const { title, excerpt, content, category, tags, isPublished, metaTitle, metaDescription } = req.body;
    const update = {
      title, excerpt, content, category, isPublished: isPublished === "true",
      tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      metaTitle, metaDescription,
    };
    if (req.file) { update.image = `/uploads/${req.file.filename}`; update.thumbnail = update.image; }
    await Blog.findByIdAndUpdate(req.params.id, update);
    req.session.success = "Post updated.";
    res.redirect("/admin/blog");
  } catch (err) { req.session.error = err.message; res.redirect("/admin/blog/edit/" + req.params.id); }
};

exports.deleteBlog = async (req, res) => {
  await Blog.findByIdAndDelete(req.params.id);
  req.session.success = "Post deleted.";
  res.redirect("/admin/blog");
};

/* ── Orders ─────────────────────────────────────────────────────────── */
exports.orderList = async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  const orders = await Order.find(filter).populate("user", "name email").sort({ createdAt: -1 });
  res.render("orders/index", { title: "Orders", page: "orders", admin: req.session.admin, orders, currentStatus: req.query.status || "", success: req.session.success });
  delete req.session.success;
};

exports.orderDetail = async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user", "name email phone").populate("items.product", "name images sku");
  res.render("orders/detail", { title: "Order Detail", page: "orders", admin: req.session.admin, order, success: req.session.success });
  delete req.session.success;
};

exports.updateOrderStatus = async (req, res) => {
  const { status, paymentStatus } = req.body;
  await Order.findByIdAndUpdate(req.params.id, { status, paymentStatus });
  req.session.success = "Order status updated.";
  res.redirect("/admin/orders/" + req.params.id);
};

/* ── Users ──────────────────────────────────────────────────────────── */
exports.userList = async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.render("users/index", { title: "Customers", page: "users", admin: req.session.admin, users, success: req.session.success, error: req.session.error });
  delete req.session.success; delete req.session.error;
};

exports.userDetail = async (req, res) => {
  try {
    const [user, orders, bankDetails] = await Promise.all([
      User.findById(req.params.id),
      Order.find({ user: req.params.id }).sort({ createdAt: -1 }).limit(20).populate("items.product", "name images sku"),
      BankDetails.findOne({ user: req.params.id }),
    ]);

    if (!user) {
      req.session.error = "Customer not found.";
      return res.redirect("/admin/users");
    }

    const paidOrders = orders.filter(order => order.paymentStatus === "paid");
    const totalSpent = paidOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const stats = {
      totalOrders: orders.length,
      paidOrders: paidOrders.length,
      totalSpent,
      averageOrderValue: paidOrders.length ? Math.round(totalSpent / paidOrders.length) : 0,
      pendingOrders: orders.filter(order => ["pending", "processing", "shipped"].includes(order.status)).length,
    };

    res.render("users/view", {
      title: user.name || "Customer Detail",
      page: "users",
      admin: req.session.admin,
      user,
      orders,
      bankDetails,
      stats,
      success: req.session.success,
      error: req.session.error,
    });
    delete req.session.success; delete req.session.error;
  } catch (err) {
    req.session.error = err.message;
    res.redirect("/admin/users");
  }
};

exports.toggleUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    user.isActive = !user.isActive;
    await user.save();
    req.session.success = `${user.name || user.email} ${user.isActive ? "unblocked" : "blocked"}.`;
  }
  res.redirect(req.get("referer") || "/admin/users");
};

/* ── Coupons ────────────────────────────────────────────────────────── */
exports.couponList = async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.render("coupons/index", { title: "Coupons", page: "coupons", admin: req.session.admin, coupons, success: req.session.success });
  delete req.session.success;
};

exports.addCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, minOrderAmount, maxUses, expiryDate } = req.body;
    await Coupon.create({
      code: code.toUpperCase(), discountType, discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount || 0),
      maxUses: maxUses ? Number(maxUses) : null,
      expiryDate: expiryDate || null, isActive: true,
    });
    req.session.success = `Coupon ${code.toUpperCase()} created.`;
    res.redirect("/admin/coupons");
  } catch (err) { req.session.error = err.message; res.redirect("/admin/coupons"); }
};

exports.toggleCoupon = async (req, res) => {
  const c = await Coupon.findById(req.params.id);
  if (c) { c.isActive = !c.isActive; await c.save(); }
  res.redirect("/admin/coupons");
};

exports.deleteCoupon = async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  req.session.success = "Coupon deleted.";
  res.redirect("/admin/coupons");
};

/* ── Announcements ──────────────────────────────────────────────────── */
exports.announcementList = async (req, res) => {
  const announcements = await Announcement.find().sort({ order: 1, createdAt: -1 });
  res.render("announcements/index", {
    title: "Announcements", page: "announcements", admin: req.session.admin,
    announcements, success: req.session.success, error: req.session.error,
  });
  delete req.session.success; delete req.session.error;
};

// ✅ FIXED — was accidentally running a query instead of creating
exports.addAnnouncement = async (req, res) => {
  try {
    const { message, isActive, order, bgColor, textColor, link, startDate, endDate } = req.body;
    await Announcement.create({
      message,
      isActive: isActive === "on" || isActive === "true",
      order: Number(order) || 0,
      bgColor:   bgColor   || "#d4af37",
      textColor: textColor || "#0f0f0f",
      link:      link      || null,
      startDate: startDate || null,
      endDate:   endDate   || null,
    });
    req.session.success = "Announcement added.";
    res.redirect("/admin/announcements");
  } catch (err) { req.session.error = err.message; res.redirect("/admin/announcements"); }
};

exports.editAnnouncement = async (req, res) => {
  try {
    const { message, isActive, order, bgColor, textColor, link, startDate, endDate } = req.body;
    await Announcement.findByIdAndUpdate(req.params.id, {
      message,
      isActive: isActive === "on" || isActive === "true",
      order: Number(order) || 0,
      bgColor:   bgColor   || "#d4af37",
      textColor: textColor || "#0f0f0f",
      link:      link      || null,
      startDate: startDate || null,
      endDate:   endDate   || null,
    });
    req.session.success = "Announcement updated.";
    res.redirect("/admin/announcements");
  } catch (err) { req.session.error = err.message; res.redirect("/admin/announcements"); }
};

exports.deleteAnnouncement = async (req, res) => {
  await Announcement.findByIdAndDelete(req.params.id);
  req.session.success = "Announcement deleted.";
  res.redirect("/admin/announcements");
};

exports.toggleAnnouncement = async (req, res) => {
  const a = await Announcement.findById(req.params.id);
  if (a) { a.isActive = !a.isActive; await a.save(); }
  res.redirect("/admin/announcements");
};

// Public API for frontend navbar
exports.getAnnouncements = async (req, res) => {
  try {
    const now  = new Date();
    const data = await Announcement.find({
      isActive: true,
      $and: [
        { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate:   null }, { endDate:   { $gte: now } }] },
      ],
    }).sort("order").lean();
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── Hero Banners ───────────────────────────────────────────────────── */
exports.heroBannerList = async (req, res) => {
  const banners = await HeroBanner.find().sort({ order: 1, createdAt: -1 });
  res.render("hero-banners/index", {
    title: "Hero Banners", page: "hero-banners", admin: req.session.admin,
    banners, success: req.session.success, error: req.session.error,
  });
  delete req.session.success; delete req.session.error;
};

exports.addHeroBannerPage = (req, res) => {
  res.render("hero-banners/form", { title: "Add Hero Banner", page: "hero-banners", admin: req.session.admin, banner: null });
};

exports.addHeroBanner = async (req, res) => {
  try {
    const { title, subtitle, description, ctaText, ctaLink, backgroundColor, textColor, order, displayType, isActive } = req.body;
    const image       = req.files?.image       ? `/uploads/${req.files.image[0].filename}`       : null;
    const mobileImage = req.files?.mobileImage ? `/uploads/${req.files.mobileImage[0].filename}` : null;
    if (!image) { req.session.error = "Please upload a banner image."; return res.redirect("/admin/hero-banners"); }
    await HeroBanner.create({
      title, subtitle, description, image, mobileImage,
      ctaText: ctaText || "Shop Now", ctaLink: ctaLink || "/products",
      backgroundColor: backgroundColor || "#0f0f0f", textColor: textColor || "#f5f5f5",
      order: Number(order) || 0, displayType: displayType || "full-width",
      isActive: isActive === "true",
    });
    req.session.success = "Hero banner added.";
    res.redirect("/admin/hero-banners");
  } catch (err) { req.session.error = err.message; res.redirect("/admin/hero-banners"); }
};

exports.editHeroBannerPage = async (req, res) => {
  const banner = await HeroBanner.findById(req.params.id);
  res.render("hero-banners/form", { title: "Edit Hero Banner", page: "hero-banners", admin: req.session.admin, banner });
};

exports.editHeroBanner = async (req, res) => {
  try {
    const { title, subtitle, description, ctaText, ctaLink, backgroundColor, textColor, order, displayType, isActive } = req.body;
    const update = {
      title, subtitle, description,
      ctaText: ctaText || "Shop Now", ctaLink: ctaLink || "/products",
      backgroundColor: backgroundColor || "#0f0f0f", textColor: textColor || "#f5f5f5",
      order: Number(order) || 0, displayType: displayType || "full-width",
      isActive: isActive === "true",
    };
    if (req.files?.image)       update.image       = `/uploads/${req.files.image[0].filename}`;
    if (req.files?.mobileImage) update.mobileImage = `/uploads/${req.files.mobileImage[0].filename}`;
    await HeroBanner.findByIdAndUpdate(req.params.id, update);
    req.session.success = "Hero banner updated.";
    res.redirect("/admin/hero-banners");
  } catch (err) { req.session.error = err.message; res.redirect("/admin/hero-banners/edit/" + req.params.id); }
};

exports.deleteHeroBanner = async (req, res) => {
  await HeroBanner.findByIdAndDelete(req.params.id);
  req.session.success = "Hero banner deleted.";
  res.redirect("/admin/hero-banners");
};

exports.toggleHeroBanner = async (req, res) => {
  const banner = await HeroBanner.findById(req.params.id);
  if (banner) { banner.isActive = !banner.isActive; await banner.save(); }
  res.redirect("/admin/hero-banners");
};

/* ── Gift For Her ───────────────────────────────────────────────────── */
const loadGiftData = async (gender) => {
  const [page, tags, filters, giftProducts, allProducts] = await Promise.all([
    GiftPage.findOne({ gender }),
    GiftTag.find({ gender }).sort("order"),
    GiftFilter.find({ gender }).sort("order"),
    GiftProduct.find({ gender }).sort("order").populate("product", "name images price isActive"),
    Product.find({ isActive: true }).sort({ name: 1 }).select("name images price"),
  ]);
  return { page, tags, filters, giftProducts, allProducts };
};

exports.giftHerPage = async (req, res) => {
  try {
    const data = await loadGiftData("her");
    res.render("gift-for-her/index", {
      title: "Gift For Her", page: "gift-for-her", admin: req.session.admin,
      ...data, success: req.session.success || null, error: req.session.error || null,
    });
    delete req.session.success; delete req.session.error;
  } catch (err) { console.error(err); res.redirect("/admin"); }
};

exports.saveHerPageSettings = async (req, res) => {
  try {
    const { title, subtitle, description, badgeText, isActive } = req.body;
    await GiftPage.findOneAndUpdate(
      { gender: "her" },
      { title, subtitle, description, badgeText, isActive: isActive === "true" },
      { upsert: true, new: true }
    );
    req.session.success = "Gift For Her settings saved.";
    res.redirect("/admin/gift-for-her");
  } catch (err) { req.session.error = err.message; res.redirect("/admin/gift-for-her"); }
};

exports.addHerTag = async (req, res) => {
  try {
    const { label, icon, order } = req.body;
    await GiftTag.create({ gender: "her", label, icon: icon || "◈", order: Number(order) || 0 });
    req.session.success = "Occasion tag added.";
    res.redirect("/admin/gift-for-her");
  } catch (err) { req.session.error = err.message; res.redirect("/admin/gift-for-her"); }
};

exports.deleteHerTag = async (req, res) => {
  await GiftTag.findByIdAndDelete(req.params.id);
  req.session.success = "Tag deleted.";
  res.redirect("/admin/gift-for-her");
};

exports.toggleHerTag = async (req, res) => {
  const t = await GiftTag.findById(req.params.id);
  if (t) { t.isActive = !t.isActive; await t.save(); }
  res.redirect("/admin/gift-for-her");
};

exports.addHerFilter = async (req, res) => {
  try {
    const { label, value, order } = req.body;
    await GiftFilter.create({ gender: "her", label, value, order: Number(order) || 0 });
    req.session.success = "Filter added.";
    res.redirect("/admin/gift-for-her");
  } catch (err) { req.session.error = err.message; res.redirect("/admin/gift-for-her"); }
};

exports.deleteHerFilter = async (req, res) => {
  await GiftFilter.findByIdAndDelete(req.params.id);
  req.session.success = "Filter deleted.";
  res.redirect("/admin/gift-for-her");
};

exports.toggleHerFilter = async (req, res) => {
  const f = await GiftFilter.findById(req.params.id);
  if (f) { f.isActive = !f.isActive; await f.save(); }
  res.redirect("/admin/gift-for-her");
};

exports.addHerProduct = async (req, res) => {
  try {
    const { productId, order } = req.body;
    const exists = await GiftProduct.findOne({ gender: "her", product: productId });
    if (exists) { req.session.error = "Product already in Gift For Her."; return res.redirect("/admin/gift-for-her"); }
    await GiftProduct.create({ gender: "her", product: productId, order: Number(order) || 0 });
    req.session.success = "Product added to Gift For Her.";
    res.redirect("/admin/gift-for-her");
  } catch (err) { req.session.error = err.message; res.redirect("/admin/gift-for-her"); }
};

exports.deleteHerProduct = async (req, res) => {
  await GiftProduct.findByIdAndDelete(req.params.id);
  req.session.success = "Product removed.";
  res.redirect("/admin/gift-for-her");
};

exports.toggleHerProduct = async (req, res) => {
  const p = await GiftProduct.findById(req.params.id);
  if (p) { p.isActive = !p.isActive; await p.save(); }
  res.redirect("/admin/gift-for-her");
};

/* ── Gift For Him ───────────────────────────────────────────────────── */
exports.giftHimPage = async (req, res) => {
  try {
    const data = await loadGiftData("him");
    res.render("gift-for-him/index", {
      title: "Gift For Him", page: "gift-for-him", admin: req.session.admin,
      ...data, success: req.session.success || null, error: req.session.error || null,
    });
    delete req.session.success; delete req.session.error;
  } catch (err) { console.error(err); res.redirect("/admin"); }
};

exports.saveHimPageSettings = async (req, res) => {
  try {
    const { title, subtitle, description, badgeText, isActive } = req.body;
    await GiftPage.findOneAndUpdate(
      { gender: "him" },
      { title, subtitle, description, badgeText, isActive: isActive === "true" },
      { upsert: true, new: true }
    );
    req.session.success = "Gift For Him settings saved.";
    res.redirect("/admin/gift-for-him");
  } catch (err) { req.session.error = err.message; res.redirect("/admin/gift-for-him"); }
};

exports.addHimTag = async (req, res) => {
  try {
    const { label, icon, desc, order } = req.body;
    await GiftTag.create({ gender: "him", label, icon: icon || "◈", desc: desc || "", order: Number(order) || 0 });
    req.session.success = "Persona added.";
    res.redirect("/admin/gift-for-him");
  } catch (err) { req.session.error = err.message; res.redirect("/admin/gift-for-him"); }
};

exports.deleteHimTag = async (req, res) => {
  await GiftTag.findByIdAndDelete(req.params.id);
  req.session.success = "Persona deleted.";
  res.redirect("/admin/gift-for-him");
};

exports.toggleHimTag = async (req, res) => {
  const t = await GiftTag.findById(req.params.id);
  if (t) { t.isActive = !t.isActive; await t.save(); }
  res.redirect("/admin/gift-for-him");
};

exports.addHimFilter = async (req, res) => {
  try {
    const { label, value, order } = req.body;
    await GiftFilter.create({ gender: "him", label, value, order: Number(order) || 0 });
    req.session.success = "Filter added.";
    res.redirect("/admin/gift-for-him");
  } catch (err) { req.session.error = err.message; res.redirect("/admin/gift-for-him"); }
};

exports.deleteHimFilter = async (req, res) => {
  await GiftFilter.findByIdAndDelete(req.params.id);
  req.session.success = "Filter deleted.";
  res.redirect("/admin/gift-for-him");
};

exports.toggleHimFilter = async (req, res) => {
  const f = await GiftFilter.findById(req.params.id);
  if (f) { f.isActive = !f.isActive; await f.save(); }
  res.redirect("/admin/gift-for-him");
};

exports.addHimProduct = async (req, res) => {
  try {
    const { productId, order } = req.body;
    const exists = await GiftProduct.findOne({ gender: "him", product: productId });
    if (exists) { req.session.error = "Product already in Gift For Him."; return res.redirect("/admin/gift-for-him"); }
    await GiftProduct.create({ gender: "him", product: productId, order: Number(order) || 0 });
    req.session.success = "Product added to Gift For Him.";
    res.redirect("/admin/gift-for-him");
  } catch (err) { req.session.error = err.message; res.redirect("/admin/gift-for-him"); }
};

exports.deleteHimProduct = async (req, res) => {
  await GiftProduct.findByIdAndDelete(req.params.id);
  req.session.success = "Product removed.";
  res.redirect("/admin/gift-for-him");
};

exports.toggleHimProduct = async (req, res) => {
  const p = await GiftProduct.findById(req.params.id);
  if (p) { p.isActive = !p.isActive; await p.save(); }
  res.redirect("/admin/gift-for-him");
};

/* ── Gift Public API (used by React frontend) ───────────────────────── */
const buildGiftApiResponse = async (gender, res) => {
  try {
    const [page, tags, filters, giftProducts] = await Promise.all([
      GiftPage.findOne({ gender, isActive: true }).lean(),
      GiftTag.find({ gender, isActive: true }).sort("order").lean(),
      GiftFilter.find({ gender, isActive: true }).sort("order").lean(),
      GiftProduct.find({ gender, isActive: true }).sort("order").populate("product").lean(),
    ]);
    res.json({
      success: true,
      data: {
        page:     page || {},
        tags,
        filters,
        products: giftProducts.map(gp => gp.product).filter(Boolean),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.apiGiftHer = (req, res) => buildGiftApiResponse("her", res);
exports.apiGiftHim = (req, res) => buildGiftApiResponse("him", res);
