# Mobile App Testing Guide

## Prerequisites

1. **Backend must be running:**
   ```bash
   cd /home/mus/Documents/lilium/lilium/backend
   npm run dev
   ```
   Should be running on `http://localhost:3000`

2. **Database must be seeded with test data:**
   - At least one user account
   - Several products with stock
   - Categories assigned to products

## Starting the Mobile App

```bash
cd /home/mus/Documents/lilium/lilium/mobile
npm start
```

This will open Expo Dev Tools. Choose your testing method:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go app on physical device

## Testing Checklist

### 1. Authentication Flow
- [ ] Open app
- [ ] Login screen displays
- [ ] Enter valid credentials
- [ ] Login successfully
- [ ] App shows Home tab

### 2. Home Screen / Product Browsing
- [ ] Home tab is selected by default
- [ ] Products load and display in grid
- [ ] Product images show (or placeholder)
- [ ] Product names, prices, stock info visible
- [ ] Search bar works
- [ ] Pull to refresh works

### 3. Product Detail Screen
- [ ] Tap on any product
- [ ] Product detail screen opens
- [ ] Image displays correctly
- [ ] Both EN and AR names show (if available)
- [ ] Price displays correctly
- [ ] Stock status shows correctly
- [ ] Minimum order quantity shown
- [ ] Quantity selector works (+/- buttons)
- [ ] Can't go below 1
- [ ] Can't exceed stock
- [ ] "Add to Cart" button works
- [ ] Alert shows with options: "Continue Shopping" or "View Cart"

### 4. Cart Functionality
- [ ] Cart badge shows correct item count
- [ ] Tap Cart tab
- [ ] Cart screen shows added items
- [ ] Each item shows image, name, price, quantity
- [ ] Can increase quantity with + button
- [ ] Can decrease quantity with - button
- [ ] Can't exceed stock limit (alert shows)
- [ ] Quantity 0 removes item
- [ ] "Remove" button shows confirmation
- [ ] Removing item updates cart count badge
- [ ] Subtotal calculates correctly
- [ ] "Proceed to Checkout" works

### 5. Checkout Flow
- [ ] Checkout screen opens
- [ ] Order summary shows all items
- [ ] Each item shows correct quantity and price
- [ ] Delivery address field is required
- [ ] Order notes field is optional
- [ ] Subtotal matches cart
- [ ] Delivery shows as "Free"
- [ ] Total calculates correctly
- [ ] Can't place order without address
- [ ] "Place Order" shows confirmation alert
- [ ] Confirming shows loading indicator
- [ ] Success navigates to OrderConfirmation

### 6. Order Confirmation
- [ ] Success icon shows
- [ ] Order number displays
- [ ] "View Order" button works → goes to OrderDetail
- [ ] "Continue Shopping" button works → goes to Home
- [ ] Cart is cleared after order

### 7. Orders Tab
- [ ] Tap Orders tab
- [ ] All orders list displays
- [ ] Each order shows:
  - [ ] Order number (truncated)
  - [ ] Date formatted correctly
  - [ ] Status badge with correct color
  - [ ] Item count
  - [ ] Total amount
- [ ] Pull to refresh works
- [ ] Tap order opens OrderDetail
- [ ] Empty state shows if no orders

### 8. Order Detail Screen
- [ ] Order number and status at top
- [ ] Date formatted correctly
- [ ] All order items listed with images
- [ ] Delivery address shows
- [ ] Order notes show (if provided)
- [ ] Amount breakdown correct
- [ ] "Reorder" button works
- [ ] Reorder clears cart and adds all items
- [ ] Alert confirms items added to cart

### 9. Profile Tab
- [ ] Tap Profile tab
- [ ] Avatar shows user initial
- [ ] Name displays correctly
- [ ] Email displays correctly
- [ ] Business name shows (or "Not set")
- [ ] Phone shows (or "Not set")
- [ ] Role displays correctly
- [ ] Zones display correctly
- [ ] Account status shows (Active/Inactive)
- [ ] Menu items are tappable
- [ ] Placeholders show "Coming Soon" alerts
- [ ] "Logout" button works
- [ ] Logout shows confirmation dialog
- [ ] Confirming logout returns to Login screen

### 10. Navigation Flow
- [ ] All tabs are accessible
- [ ] Tab icons display correctly
- [ ] Active tab highlighted in blue
- [ ] Inactive tabs in gray
- [ ] Badge on Cart tab updates in real-time
- [ ] Stack navigation works (back button)
- [ ] OrderConfirmation has no back button
- [ ] All screen headers display correctly

### 11. Error Handling
- [ ] Network error shows meaningful message
- [ ] Out of stock prevents adding to cart
- [ ] Below min quantity shows alert
- [ ] Empty cart prevents checkout
- [ ] Missing address prevents order
- [ ] Failed order creation shows error

### 12. Persistence
- [ ] Close and reopen app
- [ ] Still logged in
- [ ] Cart items persisted
- [ ] Logout clears persistence
- [ ] Close and reopen
- [ ] Shows login screen

## Common Issues & Solutions

### Issue: "Network request failed"
**Solution:** Check that backend is running on `http://localhost:3000`

### Issue: "401 Unauthorized"
**Solution:** Token expired. Logout and login again.

### Issue: No products showing
**Solution:**
1. Check backend has seeded products
2. Check user's zones match product zones
3. Check products are active

### Issue: Can't add to cart
**Solution:**
1. Check product has stock > 0
2. Check quantity >= minimum order quantity
3. Check product is active

### Issue: Orders not showing
**Solution:** Place at least one order first

### Issue: Cart badge not updating
**Solution:** This is a visual bug, reload the app

## Test User Credentials

Use credentials created during backend setup:
```
Email: test@example.com
Password: password123
```

Or create new user via backend API.

## API Endpoints Being Used

- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `GET /api/products` - Get products list
- `GET /api/products/:id` - Get product details
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create new order

## Performance Testing

1. **Load time:** App should load in < 2 seconds
2. **Product list:** Should handle 50+ products smoothly
3. **Cart:** Should handle 20+ items without lag
4. **Order history:** Should load 50+ orders quickly
5. **Navigation:** Tab switching should be instant

## Regression Testing

After any changes, retest:
1. Login/Logout flow
2. Add to cart flow
3. Checkout flow
4. Order viewing

## Device Testing

Test on multiple devices/platforms:
- [ ] iOS Simulator
- [ ] Android Emulator
- [ ] Physical iOS device
- [ ] Physical Android device

## Notes
- Cart persists even after logout (by design for convenience)
- Orders are user-specific
- Stock validation happens on both frontend and backend
- All prices in IQD (Iraqi Dinar)
