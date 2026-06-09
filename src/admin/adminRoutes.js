const express = require("express");
const router = express.Router();
const adminController = require("./adminController");
const ctrl = require("./adminController");
const giftRoutes = require("./giftRoutes");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const announcementCtrl = require("../api/announcementRoutes"); 
// ── Upload config ──────────────────────────────────────────────
const uploadDir = path.join(__dirname, "../../public/uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadFields = upload.fields([{ name: "images", maxCount: 10 }, { name: "image", maxCount: 1 }]);

// ── Auth guard ─────────────────────────────────────────────────
const guard = (req, res, next) => {
  if (!req.session?.admin) return res.redirect("/admin/login");
  next();
};

// ── Auth routes ────────────────────────────────────────────────
router.get("/login", ctrl.loginPage);
router.post("/login", ctrl.loginPost);
router.get("/logout", ctrl.logout);

// ── All routes below require login ─────────────────────────────
router.use(guard);

// Dashboard
router.get("/", ctrl.dashboard);
router.get("/dashboard", ctrl.dashboard);

// Products
router.get("/products", ctrl.productList);
router.get("/products/add", ctrl.addProductPage);
router.post("/products/add", uploadFields, ctrl.addProduct);
router.get("/products/edit/:id", ctrl.editProductPage);
router.post("/products/edit/:id", uploadFields, ctrl.editProduct);
router.get("/products/delete/:id", ctrl.deleteProduct);

// Categories
router.get("/categories", ctrl.categoryList);
router.post("/categories/add", upload.single("image"), ctrl.addCategory);
router.get("/categories/edit/:id", (req, res) => res.redirect(`/admin/categories?edit=${req.params.id}`));
router.post("/categories/edit/:id", upload.single("image"), ctrl.editCategory);
router.get("/categories/delete/:id", ctrl.deleteCategory);

// Banners
router.get("/banners", ctrl.bannerList);
router.post("/banners/add", upload.single("image"), ctrl.addBanner);
router.get("/banners/delete/:id", ctrl.deleteBanner);
router.get("/banners/edit/:id", ctrl.editBannerPage);
router.post("/banners/edit/:id", upload.single("image"), ctrl.editBanner);



// Blog
router.get("/blog", ctrl.blogList);
router.get("/blog/add", ctrl.addBlogPage);
router.post("/blog/add", upload.single("image"), ctrl.addBlog);
router.get("/blog/edit/:id", ctrl.editBlogPage);
router.post("/blog/edit/:id", upload.single("image"), ctrl.editBlog);
router.get("/blog/delete/:id", ctrl.deleteBlog);

// Orders
router.get("/orders", ctrl.orderList);
router.get("/orders/:id", ctrl.orderDetail);
router.post("/orders/:id/status", ctrl.updateOrderStatus);

// Users
router.get("/users", ctrl.userList);
router.get("/users/:id", ctrl.userDetail);
router.get("/users/:id/toggle", ctrl.toggleUser);

// Coupons
router.get("/coupons", ctrl.couponList);
router.post("/coupons/add", ctrl.addCoupon);
router.get("/coupons/toggle/:id", ctrl.toggleCoupon);
router.get("/coupons/delete/:id", ctrl.deleteCoupon);
router.get("/coupons", adminController.getCoupons);

// Announcements
router.get("/announcements", announcementCtrl.index);
router.post("/announcements/add", announcementCtrl.add);
router.get("/announcements/edit/:id", announcementCtrl.editPage);
router.post("/announcements/edit/:id", announcementCtrl.edit);
router.get("/announcements/delete/:id", announcementCtrl.remove);
router.post("/announcements/delete/:id", announcementCtrl.remove);
router.get("/announcements/toggle/:id", announcementCtrl.toggle);
router.post("/announcements/toggle/:id", announcementCtrl.toggle);
router.post("/announcements/reorder", announcementCtrl.reorder);

// Gift Pages
router.use(giftRoutes);

// Bank Details
router.use("/bank-details", require("./bankDetailsRoutes"));

module.exports = router;


