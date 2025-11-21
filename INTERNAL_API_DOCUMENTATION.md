# Internal API Documentation - Lilium Team Only

## Overview

This is a separate, secure API system exclusively for the Lilium development team to manage user accounts for vendors and shop owners. This API is completely isolated from the main application and requires special authentication.

## 🔐 Security Notice

**⚠️ CONFIDENTIAL - FOR LILIUM TEAM ONLY**

This API is restricted to internal use only. The credentials and endpoints documented here should never be shared with clients, vendors, or any external parties.

## Authentication

### Lilium Team Account

| Field | Value |
|-------|-------|
| Email | lilium@lilium.iq |
| Password | lilium@123 |
| Role | INTERNAL_ADMIN |
| Access | Internal API Only |

### Login to Internal System

**Endpoint:** `POST /api/internal/login`

**Request:**
```json
{
  "email": "lilium@lilium.iq",
  "password": "lilium@123"
}
```

**Response:**
```json
{
  "success": true,
  "authenticated": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "message": "Welcome to Lilium Internal System"
}
```

**Token Duration:** 8 hours

**Usage:** Include the token in all subsequent requests:
```
Authorization: Bearer {token}
```

---

## User Management Endpoints

### 1. Create Vendor Account

**Endpoint:** `POST /api/internal/users/vendor`

**Purpose:** Create a vendor user for dashboard access

**Headers:**
```
Authorization: Bearer {internal_token}
Content-Type: application/json
```

**Request:**
```json
{
  "email": "vendor@company.com",
  "password": "SecurePass123!", // Optional - will auto-generate if not provided
  "name": "Vendor Name",
  "businessName": "Company Name",
  "phone": "+9647901234567",
  "companyId": "company-uuid",
  "zones": ["KARKH", "RUSAFA"] // Optional
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "email": "vendor@company.com",
    "name": "Vendor Name",
    "role": "VENDOR",
    "companyId": "company-uuid"
  },
  "credentials": {
    "email": "vendor@company.com",
    "password": "SecurePass123!"
  },
  "message": "Vendor account created successfully. Please share these credentials with the vendor."
}
```

---

### 2. Create Company Manager Account

**Endpoint:** `POST /api/internal/users/company-manager`

**Purpose:** Create a company manager user for dashboard access

**Headers:**
```
Authorization: Bearer {internal_token}
Content-Type: application/json
```

**Request:**
```json
{
  "email": "manager@company.com",
  "password": "SecurePass123!", // Optional - will auto-generate if not provided
  "name": "Manager Name",
  "businessName": "Company Name",
  "phone": "+9647901234567",
  "companyId": "company-uuid",
  "zones": ["KARKH", "RUSAFA"] // Optional
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "email": "manager@company.com",
    "name": "Manager Name",
    "role": "COMPANY_MANAGER",
    "companyId": "company-uuid"
  },
  "credentials": {
    "email": "manager@company.com",
    "password": "SecurePass123!"
  },
  "message": "Company Manager account created successfully. Please share these credentials with the manager."
}
```

---

### 3. Create Shop Owner Account

**Endpoint:** `POST /api/internal/users/shop-owner`

**Purpose:** Create a shop owner user for mobile app access

**Headers:**
```
Authorization: Bearer {internal_token}
Content-Type: application/json
```

**Request:**
```json
{
  "email": "shop@example.com",
  "password": "SecurePass123!", // Optional - will auto-generate if not provided
  "name": "Shop Owner Name",
  "businessName": "Shop Name",
  "phone": "+9647901234567",
  "zone": "KARKH",
  "address": { // Optional
    "street": "Main Street",
    "area": "Area Name",
    "building": "Building 123",
    "landmark": "Near the mosque",
    "latitude": 33.3152,
    "longitude": 44.3661
  }
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "email": "shop@example.com",
    "name": "Shop Owner Name",
    "businessName": "Shop Name",
    "role": "SHOP_OWNER"
  },
  "credentials": {
    "email": "shop@example.com",
    "password": "SecurePass123!"
  },
  "message": "Shop Owner account created successfully. Please share these credentials with the shop owner."
}
```

---

## Company Management

### 4. Create Company

**Endpoint:** `POST /api/internal/companies`

**Headers:**
```
Authorization: Bearer {internal_token}
Content-Type: application/json
```

**Request:**
```json
{
  "name": "Company Name",
  "nameAr": "اسم الشركة",
  "description": "Company description",
  "descriptionAr": "وصف الشركة",
  "logo": "https://example.com/logo.png",
  "email": "company@example.com",
  "phone": "+9647901234567",
  "address": "Baghdad, Iraq",
  "zones": ["KARKH", "RUSAFA"]
}
```

**Response:**
```json
{
  "success": true,
  "company": {
    "id": "company-uuid",
    "name": "Company Name",
    "isActive": true
  },
  "message": "Company created successfully"
}
```

---

### 5. List Companies

**Endpoint:** `GET /api/internal/companies`

**Headers:**
```
Authorization: Bearer {internal_token}
```

**Response:**
```json
{
  "success": true,
  "companies": [
    {
      "id": "company-uuid",
      "name": "Company Name",
      "email": "company@example.com",
      "zones": ["KARKH"],
      "isActive": true
    }
  ],
  "total": 1
}
```

---

## User Listing & Management

### 6. List Users

**Endpoint:** `GET /api/internal/users`

**Query Parameters:**
- `role` (optional): Filter by role (VENDOR, COMPANY_MANAGER, SHOP_OWNER)

**Headers:**
```
Authorization: Bearer {internal_token}
```

**Examples:**
```
GET /api/internal/users - List all users
GET /api/internal/users?role=VENDOR - List only vendors
GET /api/internal/users?role=SHOP_OWNER - List only shop owners
```

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": "user-uuid",
      "email": "user@example.com",
      "name": "User Name",
      "role": "VENDOR",
      "isActive": true,
      "createdAt": "2025-11-21T10:00:00Z"
    }
  ],
  "total": 1
}
```

---

### 7. Deactivate User

**Endpoint:** `PATCH /api/internal/users/{userId}/deactivate`

**Headers:**
```
Authorization: Bearer {internal_token}
```

**Response:**
```json
{
  "success": true,
  "message": "User deactivated successfully"
}
```

---

### 8. Activate User

**Endpoint:** `PATCH /api/internal/users/{userId}/activate`

**Headers:**
```
Authorization: Bearer {internal_token}
```

**Response:**
```json
{
  "success": true,
  "message": "User activated successfully"
}
```

---

## Utility Endpoints

### 9. Generate Password

**Endpoint:** `GET /api/internal/generate-password`

**Query Parameters:**
- `length` (optional): Password length (default: 12)

**Headers:**
```
Authorization: Bearer {internal_token}
```

**Example:**
```
GET /api/internal/generate-password?length=16
```

**Response:**
```json
{
  "success": true,
  "password": "xK9#mP2$nL5@qR8!",
  "message": "Password generated successfully"
}
```

---

### 10. Get Available Zones

**Endpoint:** `GET /api/internal/zones`

**Headers:**
```
Authorization: Bearer {internal_token}
```

**Response:**
```json
{
  "success": true,
  "zones": ["KARKH", "RUSAFA"],
  "message": "Available zones"
}
```

---

### 11. Get Available Roles

**Endpoint:** `GET /api/internal/roles`

**Headers:**
```
Authorization: Bearer {internal_token}
```

**Response:**
```json
{
  "success": true,
  "roles": {
    "dashboard": ["VENDOR", "COMPANY_MANAGER"],
    "mobile": ["SHOP_OWNER"]
  },
  "message": "Available roles for user creation"
}
```

---

## Complete Workflow Examples

### Creating a Vendor with Company

1. **Login to Internal System:**
```bash
curl -X POST http://localhost:3000/api/internal/login \
  -H "Content-Type: application/json" \
  -d '{"email":"lilium@lilium.iq","password":"lilium@123"}'
```

2. **Create Company:**
```bash
curl -X POST http://localhost:3000/api/internal/companies \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ABC Company",
    "zones": ["KARKH"]
  }'
```

3. **Create Vendor Account:**
```bash
curl -X POST http://localhost:3000/api/internal/users/vendor \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vendor@abc.com",
    "name": "John Vendor",
    "companyId": "{company-id-from-step-2}"
  }'
```

### Creating a Shop Owner

```bash
curl -X POST http://localhost:3000/api/internal/users/shop-owner \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "shop@market.com",
    "name": "Ahmed Shop",
    "businessName": "Ahmed Market",
    "phone": "+9647901234567",
    "zone": "RUSAFA"
  }'
```

---

## Important Notes

### Password Management
- If no password is provided, the system auto-generates a secure password
- Generated passwords are returned in the response
- **IMPORTANT:** Save and share credentials immediately - passwords cannot be retrieved later

### User Access
- **Vendors & Company Managers:** Can only login via `/api/auth/login/dashboard`
- **Shop Owners:** Can only login via `/api/auth/login/mobile`
- **Lilium Team:** Can login to both dashboard and internal API

### Security Best Practices
1. Never share the internal API token
2. Rotate the Lilium account password regularly
3. Use generated passwords for user accounts
4. Store credentials securely before sharing with users
5. Monitor all account creation activities

### Error Codes

| Code | Description |
|------|-------------|
| 401 | Unauthorized - Invalid or expired token |
| 403 | Forbidden - Not an internal token |
| 400 | Bad Request - Invalid input data |
| 409 | Conflict - User already exists |
| 404 | Not Found - Company not found |

---

## Testing the Internal API

### Quick Test Script
```javascript
// test-internal-api.js
const axios = require('axios');

const API_URL = 'http://localhost:3000/api/internal';

async function testInternalAPI() {
  try {
    // 1. Login
    const loginResponse = await axios.post(`${API_URL}/login`, {
      email: 'lilium@lilium.iq',
      password: 'lilium@123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // 2. Generate password
    const passwordResponse = await axios.get(`${API_URL}/generate-password`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Generated password:', passwordResponse.data.password);

    // 3. List users
    const usersResponse = await axios.get(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Total users:', usersResponse.data.total);

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testInternalAPI();
```

---

## Troubleshooting

### Common Issues

1. **"Invalid credentials" error:**
   - Verify email is exactly: lilium@lilium.iq
   - Verify password is exactly: lilium@123
   - Check if account exists in database

2. **"This endpoint is for internal use only" error:**
   - Token is not from internal login
   - Token may be from regular auth endpoints

3. **"Company not found" when creating vendor:**
   - Create company first
   - Use correct company ID

4. **User cannot login after creation:**
   - Vendors/Managers: Use `/api/auth/login/dashboard`
   - Shop Owners: Use `/api/auth/login/mobile`
   - NOT the internal API endpoints

---

**Document Version:** 1.0
**Last Updated:** November 21, 2025
**Classification:** INTERNAL - CONFIDENTIAL
**Author:** Lilium Development Team