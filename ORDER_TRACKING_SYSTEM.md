# 📦 Order Tracking & Management System

## Overview

A complete order tracking and management system for the ARKE Jewellery e-commerce platform. This system includes:

- **User-facing order tracking** - Public page for customers to track orders by ID and email
- **Admin order management** - Comprehensive admin panel for managing, tracking, and processing returns
- **Return & Refund management** - Complete workflow for handling returns and processing refunds
- **Real-time status updates** - Detailed timeline of order status with history

---

## 📋 Features

### 1. **User Order Tracking**

- **Public tracking page** - No login required
- Track by Order ID + optional email verification
- Real-time status updates with timeline
- Shipping partner and tracking number
- Expected delivery date
- Item details and shipping address

**Access:** `/track` (public route)

### 2. **Admin Order Management**

#### Dashboard (`/admin/orders/dashboard`)

- Quick stats: Today's orders, pending, shipped, delivered, returns
- Total revenue
- Recent orders table

#### Order List (`/admin/orders`)

- Filter by status (Placed, Confirmed, Packed, Shipped, Delivered, etc.)
- Search by Order ID
- Pagination
- Quick view with action buttons

#### Order Detail (`/admin/orders/<orderId>/detail`)

- Full order information
- Update order status
- View items with images
- Shipping details
- Return request management
- Refund processing

#### Returns Management (`/admin/orders/returns`)

- List all return requests
- Approve/Reject returns
- Schedule pickups
- Process refunds
- Track return status

### 3. **Order Status Workflow**

```
placed → confirmed → processing → packed → shipped → in_transit →
out_for_delivery → delivered

Return workflow (optional from delivered):
return_requested → return_approved → return_picked →
refund_processing → refunded
```

---

## 🔌 API Endpoints

### User API (`/api/orders`)

#### Get My Orders

```http
GET /api/orders/my-orders
Authorization: Bearer <token>
```

Returns all orders for logged-in user with full details.

#### Track Order (Public)

```http
GET /api/orders/track/:orderId?email=user@email.com
```

Public endpoint to track order without authentication.

- `:orderId` - Order ID (e.g., ARK-12345678)
- `email` (optional) - Email for verification

Response:

```json
{
  "success": true,
  "data": {
    "orderId": "ARK-12345678",
    "status": "shipped",
    "items": [...],
    "statusHistory": [...],
    "shippingPartner": "BlueDart Express",
    "trackingNumber": "BD98765432",
    "expectedDelivery": "2025-07-10T00:00:00Z"
  }
}
```

#### Get Single Order

```http
GET /api/orders/:orderId
Authorization: Bearer <token>
```

#### Request Return

```http
POST /api/orders/:orderId/request-return
Authorization: Bearer <token>

Body:
{
  "items": ["productId1", "productId2"],
  "reason": "damaged",
  "details": "Item arrived with broken clasp",
  "refundMethod": "original",
  "photos": ["url1", "url2"]
}
```

---

### Admin API (`/admin/orders`)

#### Get All Orders

```http
GET /admin/orders?page=1&limit=20&status=shipped&search=ARK-12345678
```

#### Get Order Detail

```http
GET /admin/orders/:orderId/detail
```

#### Update Order Status

```http
POST /admin/orders/:orderId/update-status

Body:
{
  "status": "shipped",
  "location": "Delhi Hub",
  "note": "Dispatched from warehouse",
  "shippingPartner": "BlueDart Express",
  "trackingNumber": "BD98765432",
  "expectedDelivery": "2025-07-10"
}
```

#### Approve Return

```http
POST /admin/orders/:orderId/approve-return

Body:
{
  "pickupDate": "2025-07-15",
  "pickupPartner": "BlueDart Express",
  "pickupTrackingId": "BD98765432"
}
```

#### Reject Return

```http
POST /admin/orders/:orderId/reject-return

Body:
{
  "reason": "Item condition is satisfactory"
}
```

#### Process Refund

```http
POST /admin/orders/:orderId/process-refund

Body:
{
  "refundAmount": 2999,
  "method": "original"
}
```

---

## 📊 Order Model Schema

```javascript
{
  // Basic Info
  orderId: String,              // ARK-XXXXXXXX format
  userId: ObjectId,             // Reference to User
  createdAt: Date,
  updatedAt: Date,

  // Items
  items: [{
    productId: ObjectId,
    name: String,
    price: Number,
    mrp: Number,
    quantity: Number,
    image: String,
    customization: String
  }],

  // Pricing
  subtotal: Number,
  discount: Number,
  tax: Number,
  shippingCost: Number,
  total: Number,

  // Addresses
  shippingAddress: {
    name, phone, line1, line2, city, state, pincode
  },
  billingAddress: { ... },

  // Status & Tracking
  status: String,               // placed, confirmed, etc.
  statusHistory: [{
    status: String,
    date: Date,
    location: String,
    note: String,
    updatedBy: String
  }],

  // Shipping
  shippingPartner: String,      // BlueDart, DTDC, etc.
  trackingNumber: String,
  expectedDelivery: Date,
  deliveredAt: Date,

  // Payment
  paymentMethod: String,        // razorpay, cod, wallet
  paymentId: String,
  paymentStatus: String,        // pending, completed, failed

  // Returns
  returnInfo: {
    requestedAt: Date,
    reason: String,             // wrong_item, damaged, etc.
    details: String,
    photos: [String],
    refundMethod: String,       // original, bank, wallet
    returnedItems: [ObjectId],
    approvedAt: Date,
    approvedBy: String,
    pickupDate: Date,
    pickupPartner: String,
    pickupTrackingId: String,
    refundAmount: Number,
    refundProcessedAt: Date,
    rejectionReason: String
  },

  // Admin
  notes: String,
  internalNotes: [{ text, addedBy, addedAt }]
}
```

---

## 📁 File Structure

```
src/
├── models/
│   └── Order.js                 # Order model with full schema
├── api/
│   └── orderRoutes.js           # Public/User API routes
├── admin/
│   ├── orderController.js       # Admin controller logic
│   └── orderRoutes.js           # Admin routes
views/
├── orders/
│   ├── dashboard.ejs            # Admin dashboard
│   ├── index.ejs                # Admin orders list
│   ├── detail.ejs               # Admin order detail
│   └── returns.ejs              # Returns management
└── order-tracking.ejs           # Public tracking page
```

---

## 🚀 Getting Started

### 1. Install & Setup

```bash
# Install dependencies
npm install

# Start backend API
npm run dev

# Start admin panel (in separate terminal)
npm run admin
```

### 2. Access Points

- **Public order tracking**: `http://localhost:5051/track`
- **Admin panel**: `http://localhost:5051/admin/orders`
- **Admin dashboard**: `http://localhost:5051/admin/orders/dashboard`
- **API**: `http://localhost:5050/api/orders`

### 3. Create a Test Order

```bash
# Example using curl
curl -X POST http://localhost:5050/api/orders/track/ARK-12345678
```

---

## 🎯 Admin Workflow

### Processing New Orders

1. **Review Order** → Go to `/admin/orders`
2. **View Details** → Click "View" to see full order info
3. **Update Status** → Change status from "placed" → "confirmed"
4. **Add Tracking** → Enter shipping partner and tracking number
5. **Track Progress** → Status automatically updates through workflow

### Managing Returns

1. **Navigate to Returns** → `/admin/orders/returns`
2. **Review Request** → See customer's reason and photos
3. **Approve/Reject** → Click buttons to take action
4. **Schedule Pickup** → Enter pickup date and partner
5. **Process Refund** → Once return is received, process refund
6. **Verify** → Check refund status in return history

---

## 👥 User Experience

### Customer Order Tracking

1. **Visit tracking page** → `/track`
2. **Enter Order ID** → "ARK-12345678" format
3. **Optional: Add email** → For verification
4. **View timeline** → Real-time status updates
5. **See delivery info** → Shipping partner and tracking
6. **Request return** → If within 7 days of delivery

### Return Process (User)

1. **Eligible order** → Must be delivered within 7 days
2. **Initiate return** → Click "Return / Replace"
3. **Select reason** → Damaged, wrong item, etc.
4. **Add photos** → Evidence of issue
5. **Choose refund method** → Card, bank, or wallet
6. **Submit** → Await admin approval (24-48 hours)
7. **Arrange pickup** → Once approved
8. **Track refund** → Monitor status in returns tab

---

## 🔐 Security & Validation

### Authorization

- User endpoints require JWT authentication
- Admin endpoints require session-based authentication
- Public tracking verifies order ownership via email (optional)

### Validation

- Order ID format: `ARK-XXXXXXXX`
- Return window: 7 days from delivery
- Email verification for order access
- Status transitions: Only valid transitions allowed

---

## 📈 Future Enhancements

- [ ] SMS/Email notifications for status updates
- [ ] Bulk import of tracking numbers
- [ ] Integration with shipping APIs
- [ ] Automated return pickup scheduling
- [ ] Email templates for customer notifications
- [ ] Analytics dashboard
- [ ] Multi-currency support
- [ ] Partial returns/refunds

---

## 🐛 Troubleshooting

### Order not found

- Check Order ID format (should be ARK-XXXXXXXX)
- Verify email matches order records
- Check if order exists in database

### Return not eligible

- Must be within 7 days of delivery
- Order status must be "delivered"
- Can't return cancelled orders

### API errors

- Check authentication token validity
- Verify request body format
- Check MongoDB connection

---

## 📞 Support

For issues or questions about the order system:

1. Check admin dashboard for order status
2. Review MongoDB logs for errors
3. Test API endpoints with Postman
4. Verify environment variables are set

---

## 📝 Notes

- Order IDs are auto-generated in `ARK-XXXXXXXX` format
- All timestamps are stored in UTC/ISO format
- Status history is immutable (for audit trail)
- Returns have a 7-day window from delivery
- Refunds are processed through payment gateway integration (TODO)
