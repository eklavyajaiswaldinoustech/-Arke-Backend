require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5050;

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => { console.error("❌ MongoDB error:", err.message); process.exit(1); });
  

app.use(cors({
  origin: "*",
  credentials: false,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));


const announcementRoutes = require("./src/api/announcementRoutes");
const giftRoutes = require("./src/api/giftRoutes");
const cartRoutes = require("./src/api/cartRoutes");
const wishlistRoutes = require("./src/api/wishlisRoutes");





app.use("/api", require("./src/api/routes"));
app.use("/api/announcements", announcementRoutes);
app.use("/api/gifts", giftRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/view-wishlist", wishlistRoutes);


app.get("/", (req, res) => res.json({ status: "running", name: "ARKE API" }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`\n🚀 ARKE API running at http://localhost:${PORT}\n`);
});
