const { GiftPage, GiftTag, GiftFilter, GiftProduct } = require("../models/Giftpage");
const Product = require("../models/Product");

/* ── GIFT FOR HER ────────────────────────────────────────────── */

exports.giftHerPage = async (req, res) => {
  try {
    const page = await GiftPage.findOne({ gender: "her" });
    const tags = await GiftTag.find({ gender: "her" }).sort({ order: 1 });
    const filters = await GiftFilter.find({ gender: "her" }).sort({ order: 1 });
    const products = await GiftProduct.find({ gender: "her" })
      .populate("product")
      .sort({ order: 1 });
    const allProducts = await Product.find({ isActive: true }).select("_id name price images").sort({ name: 1 });

    res.render("gift/her-index", {
      title: "Gift For Her",
      page: "gift-her",
      admin: req.session.admin,
      giftPage: page,
      tags,
      filters,
      products,
      allProducts,
      success: req.session.success,
      error: req.session.error,
    });
    delete req.session.success;
    delete req.session.error;
  } catch (err) {
    req.session.error = err.message;
    res.redirect("/admin/dashboard");
  }
};

exports.saveHerPageSettings = async (req, res) => {
  try {
    const { title, subtitle, description, badgeText } = req.body;
    await GiftPage.findOneAndUpdate(
      { gender: "her" },
      { title, subtitle, description, badgeText },
      { upsert: true }
    );
    req.session.success = "Gift For Her settings updated.";
    res.redirect("/admin/gift-for-her");
  } catch (err) {
    req.session.error = err.message;
    res.redirect("/admin/gift-for-her");
  }
};

exports.addHerTag = async (req, res) => {
  try {
    const { label, icon, order } = req.body;
    await GiftTag.create({
      gender: "her",
      label,
      icon: icon || "◈",
      order: Number(order) || 0,
    });
    req.session.success = "Tag added.";
    res.redirect("/admin/gift-for-her");
  } catch (err) {
    req.session.error = err.message;
    res.redirect("/admin/gift-for-her");
  }
};

exports.deleteHerTag = async (req, res) => {
  try {
    await GiftTag.findByIdAndDelete(req.params.id);
    req.session.success = "Tag deleted.";
    res.redirect("/admin/gift-for-her");
  } catch (err) {
    req.session.error = err.message;
    res.redirect("/admin/gift-for-her");
  }
};

exports.toggleHerTag = async (req, res) => {
  try {
    const tag = await GiftTag.findById(req.params.id);
    if (tag) {
      tag.isActive = !tag.isActive;
      await tag.save();
    }
    res.redirect("/admin/gift-for-her");
  } catch (err) {
    req.session.error = err.message;
    res.redirect("/admin/gift-for-her");
  }
};

exports.addHerFilter = async (req, res) => {
  try {
    const { label, value, order } = req.body;
    await GiftFilter.create({
      gender: "her",
      label,
      value,
      order: Number(order) || 0,
    });
    req.session.success = "Filter added.";
    res.redirect("/admin/gift-for-her");
  } catch (err) {
    req.session.error = err.message;
    res.redirect("/admin/gift-for-her");
  }
};

exports.deleteHerFilter = async (req, res) => {
  try {
    await GiftFilter.findByIdAndDelete(req.params.id);
    req.session.success = "Filter deleted.";
    res.redirect("/admin/gift-for-her");
  } catch (err) {
    req.session.error = err.message;
    res.redirect("/admin/gift-for-her");
  }
};

exports.toggleHerFilter = async (req, res) => {
  try {
    const filter = await GiftFilter.findById(req.params.id);
    if (filter) {
      filter.isActive = !filter.isActive;
      await filter.save();
    }
    res.redirect("/admin/gift-for-her");
  } catch (err) {
    req.session.error = err.message;
    res.redirect("/admin/gift-for-her");
  }
};

exports.addHerProduct = async (req, res) => {
  try {
    const { product, order } = req.body;
    await GiftProduct.create({
      gender: "her",
      product,
      order: Number(order) || 0,
    });
    req.session.success = "Product added.";
    res.redirect("/admin/gift-for-her");
  } catch (err) {
    req.session.error = err.message;
    res.redirect("/admin/gift-for-her");
  }
};

exports.deleteHerProduct = async (req, res) => {
  try {
    await GiftProduct.findByIdAndDelete(req.params.id);
    req.session.success = "Product removed.";
    res.redirect("/admin/gift-for-her");
  } catch (err) {
    req.session.error = err.message;
    res.redirect("/admin/gift-for-her");
  }
};

exports.toggleHerProduct = async (req, res) => {
  try {
    const product = await GiftProduct.findById(req.params.id);
    if (product) {
      product.isActive = !product.isActive;
      await product.save();
    }
    res.redirect("/admin/gift-for-her");
  } catch (err) {
    req.session.error = err.message;
    res.redirect("/admin/gift-for-her");
  }
};

/* ── GIFT FOR HIM ────────────────────────────────────────────── */

exports.giftHimPage = async (req, res) => {
  try {
    const page = await GiftPage.findOne({ gender: "him" });
    const tags = await GiftTag.find({ gender: "him" }).sort({ order: 1 });
    const filters = await GiftFilter.find({ gender: "him" }).sort({ order: 1 });
    const products = await GiftProduct.find({ gender: "him" })
      .populate("product")
      .sort({ order: 1 });
    const allProducts = await Product.find({ isActive: true }).select("_id name price images").sort({ name: 1 });

    res.render("gift/him-index", {
      title: "Gift For Him",
      page: "gift-him",
      admin: req.session.admin,
      giftPage: page,
      tags,
      filters,
      products,
      allProducts,
      success: req.session.success,
      error: req.session.error,
    });
    delete req.session.success;
    delete req.session.error;
  } catch (err) {
    req.session.error = err.message;
    res.redirect("/admin/dashboard");
  }
};

exports.saveHimPageSettings = async (req, res) => {
  try {
    const { title, subtitle, description, badgeText } = req.body;
    await GiftPage.findOneAndUpdate(
      { gender: "him" },
      { title, subtitle, description, badgeText },
      { upsert: true }
    );
    req.session.success = "Gift For Him settings updated.";
    res.redirect("/admin/gift-for-him");
  } catch (err) {
    req.session.error = err.message;
    res.redirect("/admin/gift-for-him");
  }
};

exports.addHimTag = async (req, res) => {
  try {
    const { label, icon, desc, order } = req.body;
    await GiftTag.create({
      gender: "him",
      label,
      icon: icon || "◈",
      desc: desc || "",
      order: Number(order) || 0,
    });
    req.session.success = "Persona added.";
    res.redirect("/admin/gift-for-him");
  } catch (err) {
    req.session.error = err.message;
    res.redirect("/admin/gift-for-him");
  }
};

exports.deleteHimTag = async (req, res) => {
  try {
    await GiftTag.findByIdAndDelete(req.params.id);
    req.session.success = "Persona deleted.";
    res.redirect("/admin/gift-for-him");
  } catch (err) {
    req.session.error = err.message;
    res.redirect("/admin/gift-for-him");
  }
};

exports.toggleHimTag = async (req, res) => {
  try {
    const tag = await GiftTag.findById(req.params.id);
    if (tag) {
      tag.isActive = !tag.isActive;
      await tag.save();
    }
    res.redirect("/admin/gift-for-him");
  } catch (err) {
    req.session.error = err.message;
    res.redirect("/admin/gift-for-him");
  }
};

exports.addHimFilter = async (req, res) => {
  try {
    const { label, value, order } = req.body;
    await GiftFilter.create({
      gender: "him",
      label,
      value,
      order: Number(order) || 0,
    });
    req.session.success = "Filter added.";
    res.redirect("/admin/gift-for-him");
  } catch (err) {
    req.session.error = err.message;
    res.redirect("/admin/gift-for-him");
  }
};

exports.deleteHimFilter = async (req, res) => {
  try {
    await GiftFilter.findByIdAndDelete(req.params.id);
    req.session.success = "Filter deleted.";
    res.redirect("/admin/gift-for-him");
  } catch (err) {
    req.session.error = err.message;
    res.redirect("/admin/gift-for-him");
  }
};

exports.toggleHimFilter = async (req, res) => {
  try {
    const filter = await GiftFilter.findById(req.params.id);
    if (filter) {
      filter.isActive = !filter.isActive;
      await filter.save();
    }
    res.redirect("/admin/gift-for-him");
  } catch (err) {
    req.session.error = err.message;
    res.redirect("/admin/gift-for-him");
  }
};

exports.addHimProduct = async (req, res) => {
  try {
    const { product, order } = req.body;
    await GiftProduct.create({
      gender: "him",
      product,
      order: Number(order) || 0,
    });
    req.session.success = "Product added.";
    res.redirect("/admin/gift-for-him");
  } catch (err) {
    req.session.error = err.message;
    res.redirect("/admin/gift-for-him");
  }
};

exports.deleteHimProduct = async (req, res) => {
  try {
    await GiftProduct.findByIdAndDelete(req.params.id);
    req.session.success = "Product removed.";
    res.redirect("/admin/gift-for-him");
  } catch (err) {
    req.session.error = err.message;
    res.redirect("/admin/gift-for-him");
  }
};

exports.toggleHimProduct = async (req, res) => {
  try {
    const product = await GiftProduct.findById(req.params.id);
    if (product) {
      product.isActive = !product.isActive;
      await product.save();
    }
    res.redirect("/admin/gift-for-him");
  } catch (err) {
    req.session.error = err.message;
    res.redirect("/admin/gift-for-him");
  }
};
