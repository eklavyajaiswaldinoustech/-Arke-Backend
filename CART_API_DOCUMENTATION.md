# Cart API Documentation

## Overview
Complete cart management API with support for adding/removing products, quantity management, coupon application, and cart calculations.

## Base URL
```
http://localhost:5050/api/cart
```

## Authentication
All endpoints require authentication. Include JWT token in Authorization header:
```
Authorization: Bearer <token>
```

---

## Endpoints

### 1. Get User Cart
**Endpoint:** `GET /api/cart/`

**Description:** Retrieve the current user's cart with all items and totals.

**Request:**
```bash
curl -X GET http://localhost:5050/api/cart \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "message": "Cart retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "user": "507f1f77bcf86cd799439012",
    "items": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "product": {
          "_id": "507f1f77bcf86cd799439014",
          "name": "Gold Ring",
          "price": 5000,
          "mrp": 6000,
          "images": ["/uploads/ring.jpg"],
          "slug": "gold-ring-123"
        },
        "quantity": 2,
        "addedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "appliedCoupon": {
      "couponId": "507f1f77bcf86cd799439015",
      "code": "SAVE10",
      "discountType": "percentage",
      "discountValue": 10,
      "discountAmount": 500
    },
    "subtotal": 10000,
    "discountAmount": 500,
    "shipping": 99,
    "total": 9599,
    "status": "active",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 2. Add to Cart
**Endpoint:** `POST /api/cart/add-to-cart`

**Description:** Add a product to the user's cart or increase quantity if already in cart.

**Request:**
```bash
curl -X POST http://localhost:5050/api/cart/add-to-cart \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "507f1f77bcf86cd799439014",
    "quantity": 2
  }'
```

**Request Body:**
```json
{
  "productId": "507f1f77bcf86cd799439014",  // Required: Product ObjectId
  "quantity": 2                               // Required: Quantity (minimum 1)
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Product added to cart successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "user": "507f1f77bcf86cd799439012",
    "items": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "product": {
          "_id": "507f1f77bcf86cd799439014",
          "name": "Gold Ring",
          "price": 5000,
          "mrp": 6000,
          "images": ["/uploads/ring.jpg"],
          "slug": "gold-ring-123"
        },
        "quantity": 2
      }
    ],
    "subtotal": 10000,
    "total": 10099,
    "shipping": 99
  }
}
```

**Error Responses:**
```json
// Invalid product ID
{
  "success": false,
  "message": "Invalid product ID"
}

// Product not found
{
  "success": false,
  "message": "Product not found"
}

// Insufficient stock
{
  "success": false,
  "message": "Only 5 items in stock"
}

// Invalid quantity
{
  "success": false,
  "message": "Quantity must be at least 1"
}
```

---

### 3. Remove from Cart
**Endpoint:** `POST /api/cart/remove-from-cart`

**Description:** Remove a product from the user's cart.

**Request:**
```bash
curl -X POST http://localhost:5050/api/cart/remove-from-cart \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "507f1f77bcf86cd799439014"
  }'
```

**Request Body:**
```json
{
  "productId": "507f1f77bcf86cd799439014"  // Required: Product ObjectId
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product removed from cart successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "items": [],
    "subtotal": 0,
    "total": 99,
    "shipping": 99
  }
}
```

---

### 4. Update Quantity
**Endpoint:** `POST /api/cart/update-quantity`

**Description:** Update the quantity of a product in the cart.

**Request:**
```bash
curl -X POST http://localhost:5050/api/cart/update-quantity \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "507f1f77bcf86cd799439014",
    "quantity": 5
  }'
```

**Request Body:**
```json
{
  "productId": "507f1f77bcf86cd799439014",  // Required: Product ObjectId
  "quantity": 5                               // Required: New quantity (minimum 1)
}
```

**Response:**
```json
{
  "success": true,
  "message": "Quantity updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "items": [
      {
        "product": {
          "_id": "507f1f77bcf86cd799439014",
          "name": "Gold Ring",
          "price": 5000
        },
        "quantity": 5
      }
    ],
    "subtotal": 25000,
    "total": 25099
  }
}
```

---

### 5. Apply Coupon
**Endpoint:** `POST /api/cart/apply-coupon`

**Description:** Apply a coupon code to the cart for discount.

**Request:**
```bash
curl -X POST http://localhost:5050/api/cart/apply-coupon \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "couponCode": "SAVE10"
  }'
```

**Request Body:**
```json
{
  "couponCode": "SAVE10"  // Required: Coupon code
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Coupon applied successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "items": [...],
    "appliedCoupon": {
      "couponId": "507f1f77bcf86cd799439015",
      "code": "SAVE10",
      "discountType": "percentage",
      "discountValue": 10,
      "discountAmount": 1000
    },
    "subtotal": 10000,
    "discountAmount": 1000,
    "shipping": 99,
    "total": 9099
  }
}
```

**Error Responses:**
```json
// Invalid coupon
{
  "success": false,
  "message": "Invalid or expired coupon code"
}

// Coupon not yet valid
{
  "success": false,
  "message": "Coupon is not yet valid"
}

// Coupon expired
{
  "success": false,
  "message": "Coupon has expired"
}

// Minimum order value not met
{
  "success": false,
  "message": "Minimum order value of ₹1000 required"
}

// Maximum uses reached
{
  "success": false,
  "message": "Coupon has reached maximum usage limit"
}
```

---

### 6. Remove Coupon
**Endpoint:** `POST /api/cart/remove-coupon`

**Description:** Remove the applied coupon from the cart.

**Request:**
```bash
curl -X POST http://localhost:5050/api/cart/remove-coupon \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "message": "Coupon removed successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "items": [...],
    "appliedCoupon": {
      "couponId": null,
      "code": null,
      "discountType": null,
      "discountValue": 0,
      "discountAmount": 0
    },
    "subtotal": 10000,
    "discountAmount": 0,
    "shipping": 99,
    "total": 10099
  }
}
```

---

### 7. Clear Cart
**Endpoint:** `POST /api/cart/clear`

**Description:** Remove all items and coupons from the cart.

**Request:**
```bash
curl -X POST http://localhost:5050/api/cart/clear \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "message": "Cart cleared successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "items": [],
    "appliedCoupon": {
      "couponId": null,
      "code": null,
      "discountType": null,
      "discountValue": 0,
      "discountAmount": 0
    },
    "subtotal": 0,
    "discountAmount": 0,
    "shipping": 99,
    "total": 99
  }
}
```

---

### 8. Get Cart Summary
**Endpoint:** `GET /api/cart/summary`

**Description:** Get a summary of the cart for checkout page (simplified format).

**Request:**
```bash
curl -X GET http://localhost:5050/api/cart/summary \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "message": "Cart summary retrieved successfully",
  "data": {
    "itemCount": 2,
    "items": [
      {
        "productId": "507f1f77bcf86cd799439014",
        "name": "Gold Ring",
        "price": 5000,
        "mrp": 6000,
        "quantity": 2,
        "total": 10000,
        "image": "/uploads/ring.jpg"
      }
    ],
    "subtotal": 10000,
    "discountAmount": 1000,
    "shipping": 99,
    "total": 9099,
    "appliedCoupon": "SAVE10"
  }
}
```

---

## Cart Calculation Logic

### Subtotal
Sum of all product prices × quantities:
```
subtotal = Σ(product.price × item.quantity)
```

### Discount Amount
- **Percentage Coupon:** `discountAmount = (subtotal × coupon.discountValue) / 100`
- **Fixed Coupon:** `discountAmount = min(coupon.discountValue, subtotal)`

### Shipping
- Free shipping: `subtotal >= ₹999`
- Shipping charge: `₹99` (if subtotal < ₹999)

### Total
```
total = subtotal - discountAmount + shipping
```

---

## Error Handling

### Common Error Codes

| Status | Message | Cause |
|--------|---------|-------|
| 400 | Invalid product ID | Malformed ObjectId |
| 400 | Product not found | Product ID doesn't exist |
| 400 | Product is not available | Product isActive = false |
| 400 | Only X items in stock | Insufficient stock |
| 400 | Quantity must be at least 1 | Quantity < 1 |
| 400 | Invalid or expired coupon code | Coupon doesn't exist or expired |
| 400 | Coupon is not yet valid | Current date < coupon.startDate |
| 400 | Coupon has expired | Current date > coupon.expiryDate |
| 400 | Minimum order value of ₹X required | subtotal < coupon.minOrderValue |
| 400 | Coupon has reached maximum usage limit | usedCount >= maxUses |
| 404 | Cart not found | Cart doesn't exist for user |
| 404 | Product not found in cart | Product not in cart items |
| 401 | Unauthorized | Invalid or missing token |

---

## Frontend Integration Example

```javascript
// Add to cart
async function addToCart(productId, quantity) {
  const response = await fetch('http://localhost:5050/api/cart/add-to-cart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ productId, quantity })
  });
  const data = await response.json();
  if (data.success) {
    console.log('Added to cart:', data.data);
  } else {
    console.error('Error:', data.message);
  }
}

// Get cart
async function getCart() {
  const response = await fetch('http://localhost:5050/api/cart', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  const data = await response.json();
  return data.data;
}

// Apply coupon
async function applyCoupon(couponCode) {
  const response = await fetch('http://localhost:5050/api/cart/apply-coupon', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ couponCode })
  });
  const data = await response.json();
  if (data.success) {
    console.log('Coupon applied. New total:', data.data.total);
  } else {
    console.error('Error:', data.message);
  }
}
```

---

## Testing with Postman

1. **Register/Login** to get JWT token
2. **Set Authorization Header** to Bearer token
3. **Test each endpoint** with provided curl examples
4. **Verify Cart Calculations** after each operation

---

## Notes

- Cart is automatically created on first add-to-cart call
- Totals are calculated automatically via pre-save middleware
- Each user can have only one active cart
- Stock is validated before adding/updating quantity
- Shipping is calculated automatically based on subtotal
- Coupon discounts are applied before shipping calculation
