# Wallet Authentication Implementation Summary

## ✅ What Was Fixed

The Like and Comment features were not working because there was a missing integration between the frontend wallet connection and backend JWT authentication.

## 🔄 Authentication Flow

### 1. **Wallet Connection** (Frontend)

- User connects their Cardano wallet via `WalletProvider`
- Wallet address is retrieved from the wallet extension

### 2. **Backend Authentication** (New!)

- Frontend calls `POST /api/auth/wallet` with the wallet address
- Backend either:
  - Finds existing user with that wallet address, OR
  - Creates new user with wallet address as identifier
- Backend generates JWT token containing `userId` and `role`
- Returns: `{ token, user: { id, walletAddress, name, role } }`

### 3. **Token Storage** (Frontend)

- JWT token stored in `localStorage` as `authToken`
- User ID stored in `localStorage` as `userId`
- These persist across page refreshes

### 4. **Authenticated Requests** (Frontend)

- Like/Comment features check for `authToken` and `userId`
- Include `Authorization: Bearer ${token}` header in API calls
- Backend validates JWT and uses `req.user.userId` from token

## 📝 Files Modified

### Backend

1. **`/backend/src/controllers/auth-controller.ts`**
   - Added `walletAuth()` function
   - Handles wallet-based authentication
   - Generates JWT tokens for wallet users

2. **`/backend/src/routes/auth-routes.ts`**
   - Added `POST /auth/wallet` endpoint
   - Validates wallet address (min 10 characters)

### Frontend

1. **`/frontend/lib/wallet-context.tsx`**
   - Enhanced `connect()` to call backend auth endpoint
   - Stores JWT token and user ID in localStorage
   - Clears auth data on disconnect

2. **`/frontend/app/articles/[slug]/page.tsx`**
   - Reads `authToken` and `userId` from localStorage
   - Uses `userId` instead of `address` for API calls
   - Validates authentication before Like/Comment actions

3. **`/frontend/lib/article-api.ts`**
   - Enhanced error handling in API functions
   - Returns detailed error messages from backend

## 🧪 Testing

Run the test script to verify the complete flow:

```bash
./test-wallet-auth.sh
```

**Expected result:**

1. ✅ Wallet authentication succeeds and returns JWT token
2. ✅ Token can be used to make authenticated requests (like articles)

## 🎯 How It Works Now

### Before (Broken)

```
Wallet Connect → Store address in state → Try to Like → ❌ "Authentication required"
```

### After (Working)

```
Wallet Connect →
  Call /api/auth/wallet →
  Get JWT token →
  Store in localStorage →
  Like/Comment work! ✅
```

## 🔑 Key Technical Details

**JWT Token Contains:**

```json
{
  "userId": "cmix4jahl00016x37d5g74lfj",
  "role": "WRITER",
  "iat": 1765196766,
  "exp": 1765801566
}
```

**LocalStorage Keys:**

- `authToken` - JWT for authenticated requests
- `userId` - Used in request bodies
- `walletAddress` - User's wallet address
- `walletConnected` - Connection state
- `walletName` - Name of connected wallet

**Backend Validation:**

- All protected routes use `requireAuth` middleware
- Validates `Bearer` token from Authorization header
- Sets `req.user` with decoded token data
- Returns 401 if token invalid/missing

## 📊 Database Structure

When a wallet connects:

```sql
-- User created with wallet address
INSERT INTO User (walletAddress, name, role)
VALUES ('addr1q9...', 'User addr1q9...', 'WRITER');

-- Likes reference user ID
INSERT INTO Like (articleId, userId)
VALUES ('article-id', 'user-id');

-- Comments reference user ID
INSERT INTO Comment (articleId, userId, content)
VALUES ('article-id', 'user-id', 'Great article!');
```

## 🚀 Next Steps for Users

1. **Connect Wallet** - Click "Connect Wallet" button
2. **Authentication happens automatically** - No additional steps!
3. **Like Articles** - Click heart icon on any article
4. **Post Comments** - Write and submit comments
5. **Share Articles** - Use share button
6. **Bookmark Articles** - Save for later reading

## 🔒 Security Features

- JWT tokens expire after 7 days
- Tokens validated on every protected request
- Wallet addresses uniquely identify users
- Role-based access control (WRITER, ADMIN)
- CORS enabled for frontend origin

## ✨ User Experience

- **Automatic auth** - No manual login required
- **Persistent sessions** - Reconnects on page reload
- **Toast notifications** - User feedback for all actions
- **Error handling** - Clear messages when auth fails
