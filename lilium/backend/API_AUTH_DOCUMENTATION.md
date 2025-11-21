# Authentication API Documentation

## Overview

The Lilium B2B E-commerce platform uses a dual authentication system with separate endpoints for dashboard and mobile access. All users are created through administrative actions, not through public registration.

## User Creation Model

| Role | Created By | Access |
|------|------------|--------|
| SUPER_ADMIN | Database setup | Dashboard |
| ADMIN | SUPER_ADMIN | Dashboard |
| COMPANY_MANAGER | ADMIN | Dashboard |
| VENDOR | ADMIN | Dashboard |
| SHOP_OWNER | Database or ADMIN | Mobile App |

## Authentication Endpoints

### 1. Dashboard Login
**Endpoint:** `POST /api/auth/login/dashboard`

**Description:** Login endpoint for dashboard users (VENDOR, COMPANY_MANAGER, ADMIN, SUPER_ADMIN)

**Request Body:**
```json
{
  "email": "admin@company.com",
  "password": "securePassword123"
}
```

**Success Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "admin@company.com",
    "name": "Admin Name",
    "businessName": "Company Name",
    "phone": "+1234567890",
    "role": "ADMIN",
    "zones": ["KARKH", "RUSAFA"],
    "companyId": "company-uuid"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials
- `403 Forbidden` - User doesn't have dashboard access or account is deactivated

**Access Requirements:**
- User must have one of these roles: VENDOR, COMPANY_MANAGER, ADMIN, SUPER_ADMIN
- Account must be active

---

### 2. Mobile Login
**Endpoint:** `POST /api/auth/login/mobile`

**Description:** Login endpoint for mobile app users (SHOP_OWNER only)

**Request Body:**
```json
{
  "email": "shop@example.com",
  "password": "securePassword123"
}
```

**Success Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "shop@example.com",
    "name": "Shop Owner Name",
    "businessName": "Shop Name",
    "phone": "+1234567890",
    "role": "SHOP_OWNER",
    "zones": ["KARKH"]
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials
- `403 Forbidden` - User doesn't have mobile access or account is deactivated

**Access Requirements:**
- User must have SHOP_OWNER role
- Account must be active

---

### 3. Get Current User
**Endpoint:** `GET /api/auth/me`

**Description:** Get current authenticated user information

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Success Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "User Name",
  "businessName": "Business Name",
  "role": "VENDOR",
  "zones": ["KARKH", "RUSAFA"]
}
```

**Error Response:**
- `401 Unauthorized` - Invalid or expired token

---

### 4. Logout
**Endpoint:** `POST /api/auth/logout`

**Description:** Logout current user and invalidate refresh token

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Success Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

### 5. Refresh Token
**Endpoint:** `POST /api/auth/refresh`

**Description:** Get new access token using refresh token

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Success Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Error Response:**
- `401 Unauthorized` - Invalid or expired refresh token

---

### 6. Request Password Reset
**Endpoint:** `POST /api/auth/password/request-reset`

**Description:** Request password reset link via email

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "message": "If the email exists, a password reset link has been sent"
}
```

**Note:** Always returns success to prevent user enumeration

---

### 7. Reset Password
**Endpoint:** `POST /api/auth/password/reset`

**Description:** Reset password using token from email

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "password": "newSecurePassword123"
}
```

**Success Response (200):**
```json
{
  "message": "Password has been reset successfully"
}
```

**Error Response:**
- `400 Bad Request` - Invalid or expired reset token

---

### 8. Update Password
**Endpoint:** `PUT /api/auth/password`

**Description:** Update password for authenticated user

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword123"
}
```

**Success Response (200):**
```json
{
  "message": "Password updated successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Current password is incorrect
- `401 Unauthorized` - Invalid or expired token

---

## JWT Token Structure

### Access Token Payload
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "ADMIN",
  "zones": ["KARKH", "RUSAFA"],
  "iat": 1234567890,
  "exp": 1234571490
}
```

### Token Expiry
- **Access Token:** 1 hour (configurable via JWT_EXPIRES_IN)
- **Refresh Token:** 7 days (configurable via JWT_REFRESH_EXPIRES_IN)

---

## Security Considerations

1. **Password Requirements:**
   - Minimum 8 characters
   - Stored using bcrypt hashing

2. **Rate Limiting:**
   - Development: 1000 requests per 15 minutes
   - Production: 100 requests per 15 minutes

3. **Security Headers:**
   - Helmet middleware enabled
   - CORS configured
   - HSTS enabled in production

4. **Token Security:**
   - Tokens signed with JWT_SECRET
   - Refresh tokens stored in database
   - Tokens invalidated on logout

---

## Error Response Format

All error responses follow this format:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Detailed error message"
}
```

---

## Testing with cURL

### Dashboard Login
```bash
curl -X POST http://localhost:3000/api/auth/login/dashboard \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"password123"}'
```

### Mobile Login
```bash
curl -X POST http://localhost:3000/api/auth/login/mobile \
  -H "Content-Type: application/json" \
  -d '{"email":"shop@example.com","password":"password123"}'
```

### Get Current User
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Refresh Token
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'
```

---

## Migration Notes

### From Old System to New System

**Removed Features:**
- `/api/auth/register` - No longer available
- `/api/auth/register/mobile` - No longer available
- `/api/auth/send-otp` - Removed
- `/api/auth/login-otp` - Removed

**Changed Features:**
- `/api/auth/login` → Split into `/api/auth/login/dashboard` and `/api/auth/login/mobile`

**Unchanged Features:**
- Token refresh mechanism
- Password reset flow
- JWT structure

---

## Implementation Details

### User Creation Process

Since registration endpoints are removed, users must be created through:

1. **Direct Database Insert** (for SUPER_ADMIN and initial SHOP_OWNER)
```sql
INSERT INTO "User" (id, email, password, name, role, zones, "isActive")
VALUES (
  gen_random_uuid(),
  'admin@company.com',
  '$2b$10$...', -- bcrypt hashed password
  'Super Admin',
  'SUPER_ADMIN',
  ARRAY['KARKH', 'RUSAFA']::Zone[],
  true
);
```

2. **Admin Dashboard** (future implementation)
- SUPER_ADMIN can create ADMIN users
- ADMIN can create VENDOR, COMPANY_MANAGER, and SHOP_OWNER users
- User management API endpoints to be implemented in Phase 2.3

---

## Environment Variables

Required environment variables for authentication:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/database

# Node Environment
NODE_ENV=development
```

---

**Document Version:** 1.0
**Last Updated:** November 21, 2025
**Author:** Lilium Development Team