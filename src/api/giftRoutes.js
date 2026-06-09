const express = require("express");
const router = express.Router();
const { GiftPage, GiftTag, GiftFilter, GiftProduct } = require("../models/GiftPage");
const productModel = require('../models/Product')

const ok = (res, data = {}, message = "Success") => res.json({ success: true, message, ...data });
const err = (res, message = "Error", status = 400) => res.status(status).json({ success: false, message });

/* ── GIFT FOR HER ── */
router.get("/gift-for-her", async (req, res) => {
  try {
    const page = await GiftPage.findOne({ gender: "her", isActive: true });
    const tags = await GiftTag.find({ gender: "her", isActive: true }).sort({ order: 1 });
    const filters = await GiftFilter.find({ gender: "her", isActive: true }).sort({ order: 1 });
    
    // Use aggregation for efficient product fetching
    // const products = await GiftProduct.aggregate([
    //   { $match: { gender: "her", isActive: true } },
    //   {
    //     $lookup: {
    //       from: "products",
    //       localField: "product",
    //       foreignField: "_id",
    //       as: "product",
    //     },
    //   },
    //   { $unwind: "$product" },
    //   { $match: { "product.isActive": true } },
    //   {
    //     $project: {
    //       _id: 1,
    //       gender: 1,
    //       order: 1,
    //       isActive: 1,
    //       "product._id": 1,
    //       "product.name": 1,
    //       "product.price": 1,
    //       "product.mrp": 1,
    //       "product.images": 1,
    //       "product.category": 1,
    //       "product.slug": 1,
    //       "product.rating": 1,
    //       "product.reviewCount": 1,
    //     },
    //   },
    //   { $sort: { order: 1 } },
    // ]);

    const products = await productModel.aggregate(
      [
         {
    $match: {
      giftFor:"her",
      isActive:true
    }
  }
      ]
    )
    // console.log(products,"productsproducts")

    ok(res, {
      data: {
        page: page || { title: "Gifts For Her", subtitle: "", description: "", badgeText: "" },
        tags,
        filters,
        products,
      },
    });
  } catch (e) {
    console.log(e);
    err(res, e.message);
  }
});

/* ── GIFT FOR HIM ── */
router.get("/gift-for-him", async (req, res) => {
  try {
    const page = await GiftPage.findOne({ gender: "him", isActive: true });
    const tags = await GiftTag.find({ gender: "him", isActive: true }).sort({ order: 1 });
    const filters = await GiftFilter.find({ gender: "him", isActive: true }).sort({ order: 1 });
    
    // Use aggregation for efficient product fetching
    // const products = await GiftProduct.aggregate([
    //   { $match: { gender: "him", isActive: true } },
    //   {
    //     $lookup: {
    //       from: "products",
    //       localField: "product",
    //       foreignField: "_id",
    //       as: "product",
    //     },
    //   },
    //   { $unwind: "$product" },
    //   { $match: { "product.isActive": true } },
    //   {
    //     $project: {
    //       _id: 1,
    //       gender: 1,
    //       order: 1,
    //       isActive: 1,
    //       "product._id": 1,
    //       "product.name": 1,
    //       "product.price": 1,
    //       "product.mrp": 1,
    //       "product.images": 1,
    //       "product.category": 1,
    //       "product.slug": 1,
    //       "product.rating": 1,
    //       "product.reviewCount": 1,
    //     },
    //   },
    //   { $sort: { order: 1 } },
    // ]);

    const products = await productModel.aggregate(
      [
         {
    $match: {
      giftFor:"him",
      isActive:true
    }
  }
      ]
    )

    ok(res, {
      data: {
        page: page || { title: "Gifts For Him", subtitle: "", description: "", badgeText: "" },
        tags,
        filters,
        products,
      },
    });
  } catch (e) {
    console.log(e);
    err(res, e.message);
  }
});

/* ── GET PRODUCTS BY FILTER ── */
router.get("/gift-for-her/filter/:filterValue", async (req, res) => {
  try {
    const products = await GiftProduct.aggregate([
      { $match: { gender: "her", isActive: true } },
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      { $match: { "product.isActive": true } },
      {
        $project: {
          _id: 1,
          gender: 1,
          order: 1,
          isActive: 1,
          "product._id": 1,
          "product.name": 1,
          "product.price": 1,
          "product.mrp": 1,
          "product.images": 1,
          "product.category": 1,
          "product.slug": 1,
          "product.rating": 1,
          "product.reviewCount": 1,
        },
      },
      { $sort: { order: 1 } },
    ]);

    ok(res, { data: products });
  } catch (e) {
    console.log(e);
    err(res, e.message);
  }
});

router.get("/gift-for-him/filter/:filterValue", async (req, res) => {
  try {
    const products = await GiftProduct.aggregate([
      { $match: { gender: "him", isActive: true } },
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      { $match: { "product.isActive": true } },
      {
        $project: {
          _id: 1,
          gender: 1,
          order: 1,
          isActive: 1,
          "product._id": 1,
          "product.name": 1,
          "product.price": 1,
          "product.mrp": 1,
          "product.images": 1,
          "product.category": 1,
          "product.slug": 1,
          "product.rating": 1,
          "product.reviewCount": 1,
        },
      },
      { $sort: { order: 1 } },
    ]);

    ok(res, { data: products });
  } catch (e) {
    console.log(e);
    err(res, e.message);
  }
});

/* ── GET PRODUCTS BY TAG/PERSONA ── */
router.get("/gift-for-her/tag/:tagId", async (req, res) => {
  try {
    const products = await GiftProduct.aggregate([
      { $match: { gender: "her", isActive: true } },
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      { $match: { "product.isActive": true } },
      {
        $project: {
          _id: 1,
          gender: 1,
          order: 1,
          isActive: 1,
          "product._id": 1,
          "product.name": 1,
          "product.price": 1,
          "product.mrp": 1,
          "product.images": 1,
          "product.category": 1,
          "product.slug": 1,
          "product.rating": 1,
          "product.reviewCount": 1,
        },
      },
      { $sort: { order: 1 } },
    ]);

    ok(res, { data: products });
  } catch (e) {
    console.log(e);
    err(res, e.message);
  }
});

router.get("/gift-for-him/tag/:tagId", async (req, res) => {
  try {
    const products = await GiftProduct.aggregate([
      { $match: { gender: "him", isActive: true } },
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      { $match: { "product.isActive": true } },
      {
        $project: {
          _id: 1,
          gender: 1,
          order: 1,
          isActive: 1,
          "product._id": 1,
          "product.name": 1,
          "product.price": 1,
          "product.mrp": 1,
          "product.images": 1,
          "product.category": 1,
          "product.slug": 1,
          "product.rating": 1,
          "product.reviewCount": 1,
        },
      },
      { $sort: { order: 1 } },
    ]);

    ok(res, { data: products });
  } catch (e) {
    console.log(e);
    err(res, e.message);
  }
});

module.exports = router;
