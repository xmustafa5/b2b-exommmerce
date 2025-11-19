# Backend Fixes Applied

## Issue: Backend Crash on Startup

### Problem
Backend was crashing with error:
```
TypeError: (0 , import_auth.authorize) is not a function
```

### Root Cause
Multiple route files were importing a non-existent `authorize` function from the auth middleware. The auth middleware only exports `requireRole`, `requireZone`, `requireAdmin`, etc., but NOT `authorize`.

### Files Fixed
The following route files were updated to use `requireRole` instead of `authorize`:

1. **[src/routes/products.ts](src/routes/products.ts)**
   - Changed: `authorize([UserRole.SUPER_ADMIN])` → `requireRole(UserRole.SUPER_ADMIN)`
   - Changed: `authorize([UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN])` → `requireRole(UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN)`

2. **[src/routes/categories.ts](src/routes/categories.ts)**
   - Changed: `authorize([UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN])` → `requireRole(UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN)`
   - Changed: `authorize([UserRole.SUPER_ADMIN])` → `requireRole(UserRole.SUPER_ADMIN)`

3. **[src/routes/orders.ts](src/routes/orders.ts)**
   - Changed: `authorize([UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN])` → `requireRole(UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN)`
   - Changed: `authorize([UserRole.SHOP_OWNER])` → `requireRole(UserRole.SHOP_OWNER)`

4. **[src/routes/promotions.ts](src/routes/promotions.ts)**
   - Changed: `authorize([UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN])` → `requireRole(UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN)`
   - Changed: `authorize([UserRole.SUPER_ADMIN])` → `requireRole(UserRole.SUPER_ADMIN)`

5. **[src/routes/upload.ts](src/routes/upload.ts)**
   - Changed: `authorize([UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN])` → `requireRole(UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN)`

### Import Changes
All affected files had their imports updated:
```typescript
// Before:
import { authenticate, authorize } from '../middleware/auth';

// After:
import { authenticate, requireRole } from '../middleware/auth';
```

### Result
✅ Backend now starts successfully on http://localhost:3000
✅ API endpoints are accessible at http://localhost:3000/api/*
✅ All route protections are working correctly with `requireRole` middleware

## Testing
```bash
# Test backend health
curl http://localhost:3000/api/products

# Expected: Returns list of products
```

## Date Fixed
2025-11-19 09:47 UTC
