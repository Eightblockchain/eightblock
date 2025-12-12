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

### 🛡️ Verifying Wallet Ownership (CIP-30 + CIP-8)

1. **Nonce challenge** – Backend issues a 32-byte hex nonce through `POST /api/auth/wallet/nonce`. Nonces expire after five minutes and are single-use.
2. **Direct wallet signing** – Frontend calls the raw CIP-30 `signData` method with the wallet's change address (hex-encoded) and the nonce. Yoroi/Nami return a CBOR-encoded COSE_Sign1 signature plus a COSE_Key.
3. **CBOR decoding** – Backend decodes both structures via the `cbor` package. The payload (array index `2`) must match the lowercase nonce; the signature bytes live at index `3`.
4. **Sig_structure hashing** – Per CIP-8, we rebuild the Sig_structure `["Signature1", protected, external_aad (empty), payload]` and CBOR-encode it. The encoded bytes are the exact message Ed25519 signs.
5. **Public key extraction** – The COSE_Key is a map where label `-2` stores the 32-byte Ed25519 public key. We reject the request if that buffer is missing or the wrong length.
6. **Ed25519 verification** – Using `@noble/curves/ed25519`, we verify the signature against the Sig_structure bytes and extracted public key. Any mismatch logs `[Security] ✗ Invalid signature` and returns `401`.

These steps harden the flow against replay attacks and malformed wallets: only holders who can produce a valid COSE signature for our nonce gain a JWT.

## ✨ User Experience

- **Automatic auth** - No manual login required
- **Persistent sessions** - Reconnects on page reload
- **Toast notifications** - User feedback for all actions
- **Error handling** - Clear messages when auth fails
