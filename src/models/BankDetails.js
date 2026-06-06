const mongoose = require("mongoose");
const crypto = require("crypto");

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "your-32-character-secret-key-here"; // Use 32 chars
const IV_LENGTH = 16;

// Helper functions for encryption/decryption
const encrypt = (text) => {
  if (!text) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
};

const decrypt = (text) => {
  if (!text) return null;
  const parts = text.split(":");
  const iv = Buffer.from(parts[0], "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
  let decrypted = decipher.update(parts[1], "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

const bankDetailsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  accountHolderName: {
    type: String,
    required: true,
    trim: true,
  },
  bankName: {
    type: String,
    required: true,
    trim: true,
  },
  accountNumber: {
    type: String,
    required: true,
    set: encrypt,
    get: decrypt,
  },
  ifscCode: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  accountType: {
    type: String,
    enum: ["savings", "current", "business"],
    default: "savings",
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationDate: Date,
}, { timestamps: true, toJSON: { getters: true }, toObject: { getters: true } });

// Don't return encrypted account number in toJSON unless explicitly requested
bankDetailsSchema.methods.toJSON = function () {
  const obj = this.toObject();
  // Return masked account number for security
  if (obj.accountNumber) {
    const last4 = obj.accountNumber.slice(-4);
    obj.accountNumber = `••••••••${last4}`;
  }
  return obj;
};

// Method to get full account number (admin only)
bankDetailsSchema.methods.getFullAccountNumber = function () {
  return decrypt(this._doc.accountNumber);
};

module.exports = mongoose.model("BankDetails", bankDetailsSchema);
