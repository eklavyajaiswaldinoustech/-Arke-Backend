const express = require("express");
const router = express.Router();
const Announcement = require("../models/Announcement");

// API routes
router.get("/", async (req, res) => {
  try {
    const announcements = await Announcement.find({ isActive: true }).sort("order").lean();
    res.json({ success: true, data: announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/all", async (req, res) => {
  try {
    const announcements = await Announcement.find().sort("order").lean();
    res.json({ success: true, data: announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { message, isActive, order, bgColor, textColor, link, startDate, endDate } = req.body;
    const a = await Announcement.create({
      message,
      isActive: isActive !== false,
      order: Number(order) || 0,
      bgColor: bgColor || "#d4af37",
      textColor: textColor || "#0f0f0f",
      link: link || null,
      startDate: startDate || null,
      endDate: endDate || null,
    });
    res.json({ success: true, data: a });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { message, isActive, order, bgColor, textColor, link, startDate, endDate } = req.body;
    const a = await Announcement.findByIdAndUpdate(req.params.id, {
      message,
      isActive,
      order,
      bgColor,
      textColor,
      link,
      startDate,
      endDate,
    }, { new: true });
    res.json({ success: true, data: a });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Announcement deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin controller methods attached to the router
router.index = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort("order").lean();
    res.render("announcements/index", {
      title: "Announcements",
      page: "announcements",
      admin: req.session?.admin,
      announcements,
      success: req.session?.success || null,
      error: req.session?.error || null,
    });
    delete req.session.success;
    delete req.session.error;
  } catch (err) {
    req.session.error = err.message;
    res.redirect("/admin/dashboard");
  }
};

router.add = async (req, res) => {
  try {
    const { message, isActive, order, bgColor, textColor, link, startDate, endDate } = req.body;
    await Announcement.create({
      message,
      isActive:  isActive  === "on",
      order:     Number(order) || 0,
      bgColor:   bgColor   || "#d4af37",
      textColor: textColor || "#0f0f0f",
      link:      link      || null,
      startDate: startDate || null,
      endDate:   endDate   || null,
      createdBy: req.session?.admin?._id,
    });
    req.session.success = "Announcement added successfully";
    res.redirect("/admin/announcements");
  } catch (err) {
    req.session.error = err.message;
    res.redirect("/admin/announcements");
  }
};

router.toggle = async (req, res) => {
  try {
    const a = await Announcement.findById(req.params.id);
    if (!a) {
      req.session.error = "Announcement not found";
      return res.redirect("/admin/announcements");
    }
    a.isActive = !a.isActive;
    await a.save();
    res.json({ success: true, isActive: a.isActive });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

router.editPage = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id).lean();
    if (!announcement) {
      req.session.error = "Announcement not found";
      return res.redirect("/admin/announcements");
    }
    res.render("announcements/edit", {
      title: "Edit Announcement",
      page: "announcements",
      admin: req.session?.admin,
      announcement,
      success: req.session?.success || null,
      error: req.session?.error || null,
    });
    delete req.session.success;
    delete req.session.error;
  } catch (err) {
    req.session.error = err.message;
    res.redirect("/admin/announcements");
  }
};

router.edit = async (req, res) => {
  try {
    const { message, isActive, order, bgColor, textColor, link, startDate, endDate } = req.body;
    await Announcement.findByIdAndUpdate(req.params.id, {
      message,
      isActive:  isActive  === "on",
      order:     Number(order) || 0,
      bgColor:   bgColor   || "#d4af37",
      textColor: textColor || "#0f0f0f",
      link:      link      || null,
      startDate: startDate || null,
      endDate:   endDate   || null,
    });
    req.session.success = "Announcement updated";
    res.redirect("/admin/announcements");
  } catch (err) {
    req.session.error = err.message;
    res.redirect("/admin/announcements");
  }
};

router.remove = async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    req.session.success = "Announcement deleted";
    res.redirect("/admin/announcements");
  } catch (err) {
    req.session.error = err.message;
    res.redirect("/admin/announcements");
  }
};

router.reorder = async (req, res) => {
  try {
    const { ids } = req.body;
    await Promise.all(ids.map((id, i) => Announcement.findByIdAndUpdate(id, { order: i })));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = router;