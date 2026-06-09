require("dotenv").config();
const express = require("express");
const session = require("express-session");
const expressLayouts = require("express-ejs-layouts");
const path = require("path");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.ADMIN_PORT || 5051;

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => { console.error("❌ DB error:", err.message); process.exit(1); });

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layouts/main");
app.set("layout extractScripts", true);
app.set("layout extractStyles", true);

// Static files
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
app.use("/admin/css", express.static(path.join(__dirname, "public/css")));
app.use("/admin/js", express.static(path.join(__dirname, "public/js")));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || "arke_admin_secret",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 },
}));

// Routes
app.use("/admin", require("./src/admin/adminRoutes"));

// Public order tracking page
app.get("/track", (req, res) => {
  res.render("order-tracking", { layout: false });
});

app.get("/", (req, res) => res.redirect("/admin"));

app.listen(PORT, () => {
  console.log(`\n🎛️  ARKE Admin Panel → http://localhost:${PORT}/admin\n`);
});
