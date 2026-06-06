# Bank Details System - Complete Setup Guide

## Overview

This document describes the complete backend and frontend setup for the bank details management system with encryption, admin panel, and security features.

## Files Created/Modified

### Backend Files

#### 1. **src/models/BankDetails.js** (NEW)

- Mongoose schema for storing bank details
- AES-256 encryption for sensitive data (account number)
- Methods: `getFullAccountNumber()` for admin access

#### 2. **src/api/routes.js** (MODIFIED)

Added three endpoints:

- `GET /api/bank-details/:userId` - Get user's bank details
- `POST /api/bank-details` - Save/Update bank details
- `DELETE /api/bank-details` - Delete bank details

#### 3. **src/admin/bankDetailsRoutes.js** (NEW)

Admin panel routes:

- `GET /admin/bank-details/` - List all bank details with pagination
- `GET /admin/bank-details/view/:id` - View single record with full account number
- `GET /admin/bank-details/export/csv` - Export data as CSV
- `PUT /admin/bank-details/verify/:id` - Verify bank account
- `DELETE /admin/bank-details/:id` - Delete record

#### 4. **src/admin/adminRoutes.js** (MODIFIED)

- Added bank details routes mounting

#### 5. **views/bank-details/index.ejs** (NEW)

- Admin list view with search and pagination
- Table showing all bank details (account numbers masked)
- Verify and delete actions

#### 6. **views/bank-details/view.ejs** (NEW)

- Detailed admin view for single record
- Toggle to show/hide full account number
- User information display
- Verification status and actions

### Frontend Files

#### **Bankdetails-UPDATED.jsx** (UPDATED)

Complete React component with:

- Connect to backend API
- Form validation
- Encryption-aware UI
- Loading states
- Success/error messaging

---

## Environment Variables

Add these to your `.env` file:

```env
# Encryption (generate a 32-character random string)
ENCRYPTION_KEY=your-32-character-secret-key-here-at-least

# API
REACT_APP_API_URL=http://localhost:5050/api

# Admin
ADMIN_SECRET=your-admin-secret-key
```

---

## Installation Steps

### 1. Update Models Index

The BankDetails model is already added to `src/models/index.js`:

```javascript
const { BankDetails } = require("../models/index");
```

### 2. Ensure Dependencies

No new dependencies needed - uses existing:

- `mongoose` (v8.0.3+)
- `bcryptjs` (v2.4.3+)
- `crypto` (built-in Node.js)

### 3. Database Connection

The system automatically connects when the server starts. BankDetails collection will be created on first document insertion.

### 4. Frontend Integration

Replace your existing Bankdetails.jsx with the updated version:

```bash
cp Bankdetails-UPDATED.jsx path/to/your/Bankdetails.jsx
```

---

## API Endpoints

### User Endpoints (Protected)

#### Get Bank Details

```bash
GET /api/bank-details/:userId
Authorization: Bearer {token}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "user": "...",
    "accountHolderName": "John Doe",
    "bankName": "HDFC Bank",
    "accountNumber": "••••••••1234",
    "ifscCode": "HDFC0001234",
    "accountType": "savings",
    "isVerified": false,
    "createdAt": "2024-01-01T...",
    "updatedAt": "2024-01-01T..."
  }
}
```

#### Save/Update Bank Details

```bash
POST /api/bank-details
Authorization: Bearer {token}
Content-Type: application/json

{
  "accountHolderName": "John Doe",
  "bankName": "HDFC Bank",
  "accountNumber": "1234567890123",
  "ifscCode": "HDFC0001234",
  "accountType": "savings"
}
```

#### Delete Bank Details

```bash
DELETE /api/bank-details
Authorization: Bearer {token}
```

---

### Admin Endpoints (Protected)

#### List All Bank Details

```bash
GET /admin/bank-details/?page=1&limit=20&search=john
```

#### View Single Record

```bash
GET /admin/bank-details/view/:id
```

- Shows full account number (decrypted)
- User information
- Verification status

#### Verify Bank Account

```bash
PUT /admin/bank-details/verify/:id
```

- Marks account as verified
- Records verification date

#### Export as CSV

```bash
GET /admin/bank-details/export/csv
```

#### Delete Record

```bash
DELETE /admin/bank-details/:id
```

---

## Security Features

### 1. Encryption

- **Algorithm**: AES-256-CBC
- **Key**: 32-character ENCRYPTION_KEY from environment
- **Fields Encrypted**: Account Number
- **IV**: Generated randomly for each encryption

### 2. Data Masking

- Account numbers displayed as `••••••••1234` (last 4 digits visible)
- Full number only accessible to admins with admin session
- Password fields in frontend for account number input

### 3. Authentication

- All user endpoints require valid JWT token
- Admin endpoints require admin session or ADMIN_SECRET header
- User can only access their own bank details

### 4. Validation

- Account number: 9-16 digits only
- IFSC code: Exactly 11 characters
- Confirmation matching for account number

---

## Database Schema

```javascript
{
  user: ObjectId (ref: User),              // Unique per user
  accountHolderName: String,
  bankName: String,
  accountNumber: String (encrypted),
  ifscCode: String,
  accountType: enum["savings", "current", "business"],
  isVerified: Boolean (default: false),
  verificationDate: Date (optional),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Testing

### Test User Flow

1. Navigate to `/bankdetails` (or your component route)
2. Add bank details
3. Form validates before submission
4. Data saved encrypted to database
5. Display shows masked account number
6. Edit to update details

### Test Admin Flow

1. Login to admin panel
2. Navigate to Bank Details
3. View list of all customers' bank details
4. Click view to see full details
5. Toggle eye icon to show/hide account number
6. Verify unverified accounts
7. Export as CSV

---

## Encryption Key Generation

To generate a secure ENCRYPTION_KEY:

**Node.js:**

```javascript
const crypto = require("crypto");
console.log(crypto.randomBytes(16).toString("hex"));
```

**Linux/Mac:**

```bash
openssl rand -hex 16
```

**Online (NOT RECOMMENDED for production):**
Use only for testing: https://www.random.org/strings/

---

## Troubleshooting

### Issue: "Unauthorized" on user endpoints

- Check JWT token in localStorage
- Verify token not expired
- Check Authorization header format

### Issue: Admin can't view bank details

- Verify admin session is active
- Check ADMIN_SECRET environment variable
- Clear session and re-login

### Issue: Account number not decrypting

- Verify ENCRYPTION_KEY matches original encryption key
- Check if account number field is string format
- Ensure MongoDB connection is active

### Issue: CSV export empty

- Check if any bank details exist in database
- Verify admin permissions
- Check browser console for errors

---

## Performance Considerations

1. **Indexing**: User field is unique indexed for fast lookups
2. **Pagination**: Admin list uses pagination (limit 20 default)
3. **Population**: Queries populate user data for display
4. **Encryption Overhead**: Minimal - only account number encrypted

---

## Future Enhancements

1. Bulk verification of accounts
2. Bank account verification via microservice
3. Audit log for admin actions
4. Scheduled encryption key rotation
5. Two-factor authentication for sensitive operations
6. Bank account image upload for verification

---

## Support

For issues or questions:

1. Check database connection
2. Verify environment variables
3. Check browser console for errors
4. Check server logs for detailed errors
5. Ensure all files are in correct locations
