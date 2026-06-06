const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema({
  message:   { type: String, required: true, trim: true },
  isActive:  { type: Boolean, default: true },
  order:     { type: Number, default: 0 },       // display order
  bgColor:   { type: String, default: "#d4af37" }, // hex color
  textColor: { type: String, default: "#0f0f0f" },
  link:      { type: String, default: null },      // optional click link
  startDate: { type: Date, default: null },         // schedule start
  endDate:   { type: Date, default: null },         // schedule end
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
}, { timestamps: true });

// Only return announcements that are active and within schedule
announcementSchema.statics.getActive = function () {
  const now = new Date();
  return this.find({
    isActive: true,
    $or: [
      { startDate: null },
      { startDate: { $lte: now } },
    ],
    $or: [
      { endDate: null },
      { endDate: { $gte: now } },
    ],
  }).sort("order");
};

module.exports = mongoose.model("Announcement", announcementSchema);