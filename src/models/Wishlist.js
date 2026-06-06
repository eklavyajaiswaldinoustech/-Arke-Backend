const mongoose = require("mongoose");

const wishlistItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: {
      type: [wishlistItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Add item
wishlistSchema.methods.addItem = function (productId) {
  const exists = this.items.some(
    (i) => String(i.product) === String(productId)
  );

  if (!exists) {
    this.items.push({ product: productId });
  }

  return this;
};

// Remove item
wishlistSchema.methods.removeItem = function (productId) {
  this.items = this.items.filter(
    (i) => String(i.product) !== String(productId)
  );

  return this;
};

// Check item
wishlistSchema.methods.hasItem = function (productId) {
  return this.items.some(
    (i) => String(i.product) === String(productId)
  );
};

// Get populated wishlist
wishlistSchema.statics.getForUser = function (userId) {
  return this.findOne({ user: userId }).populate(
    "items.product",
    "_id name title price salePrice image images thumbnail metal_type type"
  );
};

wishlistSchema.index({ user: 1, "items.product": 1 });

module.exports = mongoose.model("Wishlist", wishlistSchema);