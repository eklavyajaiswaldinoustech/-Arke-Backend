// routes/cart.js
const express = require("express");
const router = express.Router();
const Product = require("../models/Product"); // adjust path as needed

// In-memory store (replace with DB if needed)
const cartStore = {};

const getUserId = (req) => {
  // adjust based on your auth middleware
  console.log(req.user,"kkkkkkk ")
  return req.userId || req.user?.id || req.headers["x-user-id"];
};

/* ────────────────────────────────────────────────
   GET /cart  – fetch current user's cart
──────────────────────────────────────────────── */
router.get("/", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const rawCart = cartStore[userId] || [];

    // Enrich each cart item with fresh product data from DB
    const enriched = await Promise.all(
      rawCart.map(async (item) => {
        try {
          const product = await Product.findById(item.productId)
            .populate("category", "name")
            .populate("subCategory", "name")
            .lean();

          if (!product) {
            return {
              _id: item.productId,
              productId: item.productId,
              quantity: item.quantity,
              product: null, // product deleted
            };
          }

          return {
            _id: item.productId,
            productId: item.productId,
            quantity: item.quantity,
            product: {
              _id: product._id,
              name: product.name,
              price: product.price,
              mrp: product.mrp,
              image: product.images || [],
              images: product.images || [],
              description: product.description,
              shortDescription: product.shortDescription,
              material: product.material,
              metal_type: product.metalType,
              weight: product.weight,
              size: product.size,
              sku: product.sku,
              stock: product.stock,
              slug: product.slug,
              isActive: product.isActive,
              category: product.category,
              subCategory: product.subCategory,
              rating: product.rating,
              reviewCount: product.reviewCount,
              isFeatured: product.isFeatured,
              isNewArrival: product.isNewArrival,
              isBestSeller: product.isBestSeller,
            },
          };
        } catch (err) {
          console.error(`Failed to enrich cart item ${item.productId}:`, err);
          return {
            _id: item.productId,
            productId: item.productId,
            quantity: item.quantity,
            product: null,
          };
        }
      })
    );

    // Filter out deleted products
    const validItems = enriched.filter((i) => i.product !== null);

    const total = validItems.reduce(
      (sum, item) => sum + (item.product.price || 0) * item.quantity,
      0
    );
    const itemCount = validItems.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      success: true,
      cart: validItems,
      total,
      itemCount,
    });
  } catch (err) {
    console.error("GET /cart error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

/* ────────────────────────────────────────────────
   POST /cart  – add item to cart
──────────────────────────────────────────────── */
router.post("/", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { productId, quantity = 1 } = req.body;

    console.log("ADD TO CART →", { userId, productId, quantity });

    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }

    // Validate productId format
    if (!productId.match(/^[a-fA-F0-9]{24}$/)) {
      return res.status(400).json({ message: "Invalid productId format" });
    }

    // Verify product exists in DB
    const product = await Product.findById(productId).lean();
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (!product.isActive) {
      return res.status(400).json({ message: "Product is no longer available" });
    }
    if (product.stock < 1) {
      return res.status(400).json({ message: "Product is out of stock" });
    }

    // Init cart for user
    if (!cartStore[userId]) cartStore[userId] = [];

    const existing = cartStore[userId].find(
      (i) => String(i.productId) === String(productId)
    );

    if (existing) {
      // Check stock before bumping
      const newQty = existing.quantity + quantity;
      if (newQty > product.stock) {
        return res.status(400).json({
          message: `Only ${product.stock} units available in stock`,
        });
      }
      existing.quantity = newQty;
      console.log(`🔁 Updated qty for ${productId}, new qty: ${existing.quantity}`);
    } else {
      // Only store productId + quantity — product data fetched fresh on GET
      cartStore[userId].push({
        productId: String(productId),
        quantity: Number(quantity),
        addedAt: new Date().toISOString(),
      });
      console.log(`✅ Added to cart: productId=${productId}, qty=${quantity}`);
    }

    // Fetch fresh product data for all items to calculate accurate totals
    const enrichedCart = await Promise.all(
      cartStore[userId].map(async (item) => {
        const prod = await Product.findById(item.productId).lean();
        return {
          ...item,
          price: prod?.price || 0,
        };
      })
    );

    const total = enrichedCart.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );
    const itemCount = enrichedCart.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    res.json({
      success: true,
      message: "Item added to cart",
      cart: enrichedCart,
      total,
      itemCount,
      addedProduct: {
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || null,
      },
    });
  } catch (err) {
    console.error("POST /cart error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});














// rrrrtghtyhyjuyjtutdjyjytjtyujtyjtj

// ── PATCH /api/Cart/:productId — update quantity
router.patch("/:productId", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { productId } = req.params;
    const { quantity } = req.body;

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ message: "quantity must be a positive integer" });
    }

    const item = (cartStore[userId] || []).find(i => String(i.productId) === String(productId));
    if (!item) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    item.quantity = quantity;
    // console.log(`✏️  Updated ${productId} qty to ${quantity}`);
    
    // Fetch fresh product data for all items to calculate accurate totals
    const enrichedCart = await Promise.all(
      (cartStore[userId] || []).map(async (cartItem) => {
        const product = await Product.findById(cartItem.productId).lean();
        return {
          ...cartItem,
          price: product?.price || 0,
        };
      })
    );

    const total = enrichedCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemCount = enrichedCart.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      success: true,
      cart: enrichedCart,
      total,
      itemCount,
    });
  } catch (err) {
    console.error("PATCH /cart/:productId error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ── DELETE /api/Cart/:productId — remove item
router.delete("/:productId", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { productId } = req.params;
    const initialLength = (cartStore[userId] || []).length;
    
    cartStore[userId] = (cartStore[userId] || []).filter(
      i => String(i.productId) !== String(productId)
    );

    if (cartStore[userId].length === initialLength) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    console.log(`🗑️  Removed ${productId} from cart`);
    
    // Fetch fresh product data for all items to calculate accurate totals
    const enrichedCart = await Promise.all(
      (cartStore[userId] || []).map(async (cartItem) => {
        const product = await Product.findById(cartItem.productId).lean();
        return {
          ...cartItem,
          price: product?.price || 0,
        };
      })
    );

    const total = enrichedCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemCount = enrichedCart.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      success: true,
      cart: enrichedCart,
      total,
      itemCount,
    });
  } catch (err) {
    console.error("DELETE /cart/:productId error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;