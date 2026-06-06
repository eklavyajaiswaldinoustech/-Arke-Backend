const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:     { type: String, trim: true },
  password:  { type: String, required: true, minlength: 6 },
  avatar:    { type: String },
  addresses: [{
    label:    String,
    name:     String,
    line1:    String,
    line2:    String,
    city:     String,
    state:    String,
    pincode:  String,
    phone:    String,
    isDefault: { type: Boolean, default: false },
  }],
  isActive:    { type: Boolean, default: true },
  isVerified:  { type: Boolean, default: false },
  orderCount:  { type: Number, default: 0 },
  totalSpent:  { type: Number, default: 0 },
}, { timestamps: true });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model("User", userSchema);
