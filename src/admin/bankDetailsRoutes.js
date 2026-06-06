const router = require("express").Router();
const BankDetails = require("../models/BankDetails");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

// Middleware to check if user is admin
const adminOnly = (req, res, next) => {
  if (req.session?.admin || req.session?.adminId || process.env.ADMIN_SECRET === req.headers["x-admin-secret"]) {
    return next();
  }
  return res.status(403).json({ success: false, message: "Admin access required" });
};

// GET all bank details for admin
router.get("/", adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    let filter = {};
    
    if (search) {
      const users = await User.find({
        $or: [
          { name: new RegExp(search, "i") },
          { email: new RegExp(search, "i") },
          { phone: new RegExp(search, "i") },
        ]
      }).select("_id");
      filter.user = { $in: users.map(u => u._id) };
    }
    
    const bankDetails = await BankDetails.find(filter)
      .populate("user", "name email phone")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    
    const total = await BankDetails.countDocuments(filter);
    
    // Mask account numbers for security
    const maskedDetails = bankDetails.map(bd => {
      const obj = bd.toObject();
      if (obj.accountNumber) {
        const last4 = obj.accountNumber.slice(-4);
        obj.accountNumber = `••••••••${last4}`;
      }
      return obj;
    });
    
    res.render("bank-details/index", {
      title: "Bank Details",
      navPage: "bank-details",
      admin: req.session.admin,
      bankDetails: maskedDetails,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      search: search || "",
    });
  } catch (e) {
    console.error("Fetch error:", e);
    res.status(500).render("error", { message: "Failed to load bank details" });
  }
});

// GET single bank detail with full account number
router.get("/view/:id", adminOnly, async (req, res) => {
  try {
    const bankDetail = await BankDetails.findById(req.params.id).populate("user");
    if (!bankDetail) {
      return res.status(404).render("error", { message: "Bank details not found" });
    }
    
    const obj = bankDetail.toObject();
    // For admin view, decrypt and show full account number
    obj.accountNumberFull = bankDetail.getFullAccountNumber();
    
    res.render("bank-details/view", {
      title: "Bank Detail",
      navPage: "bank-details",
      admin: req.session.admin,
      bankDetail: obj,
    });
  } catch (e) {
    console.error("View error:", e);
    res.status(500).render("error", { message: "Failed to load bank details" });
  }
});

// GET export bank details as CSV
router.get("/export/csv", adminOnly, async (req, res) => {
  try {
    const bankDetails = await BankDetails.find()
      .populate("user", "name email phone")
      .sort({ createdAt: -1 });
    
    let csv = "Sr.No,Account Holder,Bank Name,Account Number,IFSC Code,Account Type,User Email,User Phone,Verified,Added Date\n";
    
    bankDetails.forEach((bd, index) => {
      const accountNum = bd.getFullAccountNumber();
      const last4 = accountNum.slice(-4);
      csv += `${index + 1},"${bd.accountHolderName}","${bd.bankName}","••••••••${last4}","${bd.ifscCode}","${bd.accountType}","${bd.user.email}","${bd.user.phone}","${bd.isVerified ? 'Yes' : 'No'}","${new Date(bd.createdAt).toLocaleDateString()}"\n`;
    });
    
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=bank-details.csv");
    res.send(csv);
  } catch (e) {
    console.error("Export error:", e);
    res.status(500).json({ success: false, message: "Failed to export data" });
  }
});

// PUT verify bank details
router.put("/verify/:id", adminOnly, async (req, res) => {
  try {
    const bankDetail = await BankDetails.findByIdAndUpdate(
      req.params.id,
      {
        isVerified: true,
        verificationDate: new Date(),
      },
      { new: true }
    ).populate("user", "name email");
    
    if (!bankDetail) {
      return res.status(404).json({ success: false, message: "Bank details not found" });
    }
    
    res.json({
      success: true,
      message: "Bank details verified successfully",
      data: bankDetail,
    });
  } catch (e) {
    console.error("Verify error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// DELETE bank details
router.delete("/:id", adminOnly, async (req, res) => {
  try {
    await BankDetails.findByIdAndDelete(req.params.id);
    res.json({
      success: true,
      message: "Bank details deleted successfully",
    });
  } catch (e) {
    console.error("Delete error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
