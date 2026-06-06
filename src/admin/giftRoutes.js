const express = require("express");
const router = express.Router();
const ctrl = require("./giftController");

// ── Auth guard ─────────────────────────────────────────────────
const guard = (req, res, next) => {
  if (!req.session?.admin) return res.redirect("/admin/login");
  next();
};

router.use(guard);

/* ── Gift For Her ── */
router.get("/gift-for-her", ctrl.giftHerPage);
router.post("/gift-for-her/settings", ctrl.saveHerPageSettings);
router.post("/gift-for-her/tags/add", ctrl.addHerTag);
router.get("/gift-for-her/tags/delete/:id", ctrl.deleteHerTag);
router.get("/gift-for-her/tags/toggle/:id", ctrl.toggleHerTag);
router.post("/gift-for-her/filters/add", ctrl.addHerFilter);
router.get("/gift-for-her/filters/delete/:id", ctrl.deleteHerFilter);
router.get("/gift-for-her/filters/toggle/:id", ctrl.toggleHerFilter);
router.post("/gift-for-her/products/add", ctrl.addHerProduct);
router.get("/gift-for-her/products/delete/:id", ctrl.deleteHerProduct);
router.get("/gift-for-her/products/toggle/:id", ctrl.toggleHerProduct);

/* ── Gift For Him ── */
router.get("/gift-for-him", ctrl.giftHimPage);
router.post("/gift-for-him/settings", ctrl.saveHimPageSettings);
router.post("/gift-for-him/tags/add", ctrl.addHimTag);
router.get("/gift-for-him/tags/delete/:id", ctrl.deleteHimTag);
router.get("/gift-for-him/tags/toggle/:id", ctrl.toggleHimTag);
router.post("/gift-for-him/filters/add", ctrl.addHimFilter);
router.get("/gift-for-him/filters/delete/:id", ctrl.deleteHimFilter);
router.get("/gift-for-him/filters/toggle/:id", ctrl.toggleHimFilter);
router.post("/gift-for-him/products/add", ctrl.addHimProduct);
router.get("/gift-for-him/products/delete/:id", ctrl.deleteHimProduct);
router.get("/gift-for-him/products/toggle/:id", ctrl.toggleHimProduct);

module.exports = router;
