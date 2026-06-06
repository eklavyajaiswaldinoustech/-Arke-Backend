require("dotenv").config();
const mongoose = require("mongoose");

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB\n");

  const Admin = require("./src/models/Admin");
  const Category = require("./src/models/Category");
  const Product = require("./src/models/Product");
  const { Banner } = require("./src/models/index");

  // ── Create Admin ───────────────────────────────────────────
  const existing = await Admin.findOne({ email: "admin@arke.com" });
  if (!existing) {
    await Admin.create({ name: "Arke Admin", email: "admin@arke.com", password: "admin123", role: "superadmin" });
    console.log("👤 Admin created:");
    console.log("   Email:    admin@arke.com");
    console.log("   Password: admin123");
    console.log("   ⚠️  Change this password after first login!\n");
  } else {
    console.log("👤 Admin already exists: admin@arke.com\n");
  }

  // ── Create Categories ──────────────────────────────────────
  const catCount = await Category.countDocuments();
  if (catCount === 0) {
    const categories = await Category.insertMany([
      { name: "Earrings",   slug: "earrings",   isActive: true, sortOrder: 1 },
      { name: "Necklaces",  slug: "necklaces",  isActive: true, sortOrder: 2 },
      { name: "Bracelets",  slug: "bracelets",  isActive: true, sortOrder: 3 },
      { name: "Rings",      slug: "rings",      isActive: true, sortOrder: 4 },
      { name: "Mangalsutra",slug: "mangalsutra",isActive: true, sortOrder: 5 },
    ]);
    console.log(`✅ Created ${categories.length} categories\n`);

    // ── Create Sample Products ─────────────────────────────
    const earringsCat = categories[0]._id;
    await Product.insertMany([
      { name: "Pearl Drop Earrings", slug: "pearl-drop-earrings", price: 799, mrp: 1299, stock: 50, category: earringsCat, isActive: true, isNewArrival: true, isBestSeller: true, description: "Elegant pearl drop earrings in gold plating. Hypoallergenic and tarnish-proof.", tags: ["earrings","pearl","gift"] },
      { name: "Gold Hoop Earrings", slug: "gold-hoop-earrings", price: 599, mrp: 999, stock: 80, category: earringsCat, isActive: true, isNewArrival: true, description: "Classic gold hoop earrings. Lightweight and comfortable for all-day wear.", tags: ["earrings","hoop","minimal"] },
      { name: "Crystal Stud Earrings", slug: "crystal-stud-earrings", price: 499, mrp: 799, stock: 100, category: earringsCat, isActive: true, isBestSeller: true, description: "Sparkling crystal studs set in gold-plated silver.", tags: ["earrings","crystal","studs"] },
    ]);
    console.log("✅ Created 3 sample products\n");
  } else {
    console.log(`📦 ${catCount} categories already exist — skipping\n`);
  }

  // ── Create Sample Banner ───────────────────────────────────
  const bannerCount = await Banner.countDocuments();
  if (bannerCount === 0) {
    await Banner.create({ title: "New Season Collection", subtitle: "Wear it your way", ctaText: "Explore Now", ctaLink: "/new-collection", image: "/img/hero-placeholder.jpg", isActive: true });
    console.log("🖼️  Created sample banner\n");
  }

  console.log("─────────────────────────────────────────");
  console.log(`🎛️  Admin Panel: http://localhost:${process.env.ADMIN_PORT || 5051}/admin`);
  console.log("🚀  API Server:  http://localhost:5000");
  console.log("─────────────────────────────────────────\n");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => { console.error("❌ Seed error:", err.message); process.exit(1); });
