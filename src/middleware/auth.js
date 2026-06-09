const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  try {
    // console.log(req.cookies, "Checking auth for:", req.method, req.originalUrl);
    const token = req.headers.authorization?.split(" ")[1] || req.cookies?.token;
    if (!token) return res.status(401).json({ success: false, message: "Not authenticated" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user || !req.user.isActive) return res.status(401).json({ success: false, message: "Account not found or disabled" });
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

exports.adminGuard = (req, res, next) => {
  if (!req.session?.admin) return res.redirect("/admin/login");
  next();
};
