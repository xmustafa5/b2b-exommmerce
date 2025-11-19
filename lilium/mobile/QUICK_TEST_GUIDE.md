# Quick Test Guide - Mobile App

## 🚀 Quick Start

### Step 1: Start the Backend
```bash
cd /home/mus/Documents/lilium/lilium/backend
npm run dev
```

**Expected output**: Server running on http://localhost:3000

### Step 2: Start the Mobile App
```bash
cd /home/mus/Documents/lilium/lilium/mobile
npm run web
```

**Expected output**: Metro bundler starts, browser opens at http://localhost:8081

## 🧪 Testing the Login Screen

### Test User Credentials
From your backend, you should have seed data. Try these common test credentials:

**Admin User:**
```
Email: admin@example.com
Password: password123
```

**Shop Owner:**
```
Email: shop@example.com
Password: password123
```

### Login Flow Test
1. App loads → Shows Login Screen
2. Enter email and password
3. Click "Login" button
4. Loading indicator appears
5. On success → Navigates to Home Screen
6. On error → Shows alert with error message

## 🏠 Testing the Home Screen

### What You Should See:
1. **Header**:
   - Greeting: "Hello,"
   - User name
   - Red "Logout" button

2. **Search Bar**:
   - Text input to search products

3. **Product Grid**:
   - 2 columns of products
   - Each product shows:
     - Image (or "No Image" placeholder)
     - Product name
     - Price in IQD
     - Stock and minimum order quantity

4. **Footer**:
   - Pagination info (Page X of Y | Total: Z)

### Home Screen Features to Test:

#### 1. Product Listing
- Pull down to refresh
- Products load in grid format
- Scroll through products

#### 2. Search
- Type in search bar
- Products filter automatically
- Clear search to see all products

#### 3. Logout
- Click "Logout" button
- Returns to Login screen
- Token is cleared

#### 4. Auto-Login
- Close the app
- Reopen the app
- Should go directly to Home (if logged in before)

## 🐛 Troubleshooting

### Issue: "Network Error" on Login
**Solution**: Check if backend is running on http://localhost:3000

```bash
# Test backend health
curl http://localhost:3000/health
```

### Issue: No products showing
**Solution**: Check if backend has products

```bash
# Get products from API
curl http://localhost:3000/products
```

### Issue: "Cannot find module"
**Solution**: Reinstall dependencies

```bash
cd /home/mus/Documents/lilium/lilium/mobile
rm -rf node_modules
npm install
```

### Issue: Metro bundler error
**Solution**: Clear cache and restart

```bash
npm start -- --reset-cache
```

## 📱 Testing on Different Platforms

### Web (Browser)
```bash
npm run web
```
**API URL**: `http://localhost:3000`

### iOS Simulator (macOS only)
```bash
npm run ios
```
**API URL**: `http://localhost:3000`

### Android Emulator
```bash
npm run android
```
**API URL**: `http://10.0.2.2:3000`
**Note**: Update `API_BASE_URL` in `src/services/api.ts` to `http://10.0.2.2:3000`

### Physical Device
1. Find your computer's IP address:
   ```bash
   # Linux/Mac
   ifconfig | grep inet

   # Windows
   ipconfig
   ```

2. Update `API_BASE_URL` in `src/services/api.ts`:
   ```typescript
   const API_BASE_URL = 'http://YOUR_IP:3000';
   ```

3. Make sure phone and computer are on same WiFi network

## ✅ Success Criteria

### Login Screen ✅
- [ ] Shows email and password fields
- [ ] Shows "Login" button
- [ ] Email field has email keyboard
- [ ] Password field is masked
- [ ] Loading indicator shows during login
- [ ] Error alert shows on wrong credentials
- [ ] Navigates to Home on successful login

### Home Screen ✅
- [ ] Shows user name in header
- [ ] Shows logout button
- [ ] Shows search bar
- [ ] Products display in 2-column grid
- [ ] Each product shows image, name, price, stock
- [ ] Pull-to-refresh works
- [ ] Search filters products
- [ ] Pagination info shows at bottom
- [ ] Logout button works

## 🎯 What to Look For

### Good Signs:
✅ Login screen loads instantly
✅ Login button disabled during API call
✅ Home screen shows products in grid
✅ Pull-to-refresh refreshes product list
✅ Search filters products as you type
✅ Logout clears data and returns to login
✅ Reopening app auto-logs in if previously logged in

### Red Flags:
❌ "Network Error" - Backend not running
❌ Empty product list - No products in backend
❌ Logout doesn't clear - AsyncStorage issue
❌ App crashes - Check console for errors

## 📊 Expected Behavior

| Action | Expected Result |
|--------|----------------|
| Open app (first time) | Login screen |
| Enter wrong password | Error alert |
| Enter correct credentials | Navigate to Home |
| Pull down on Home | Refresh products |
| Type in search | Filter products |
| Click Logout | Return to Login |
| Reopen app (logged in) | Go to Home directly |
| Reopen app (logged out) | Show Login |

## 🔍 Debug Mode

To see API calls and responses:

1. Open Developer Tools in browser (F12)
2. Go to Network tab
3. Watch API calls to `/auth/login` and `/products`
4. Check Console tab for any errors

---

**Happy Testing!** 🎉

If you encounter issues, check:
1. Backend is running ✓
2. API URL is correct ✓
3. Dependencies are installed ✓
4. No TypeScript errors ✓
