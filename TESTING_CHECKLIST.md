# Testing Checklist for Wallet Authentication

## ✅ Manual Testing Steps

### 1. Connect Wallet

- [ ] Navigate to http://localhost:3000
- [ ] Click "Connect Wallet" button
- [ ] Approve wallet connection in extension
- [ ] Verify wallet address appears in header
- [ ] **Check browser console** for "Wallet authenticated successfully" message
- [ ] **Check localStorage** for `authToken` and `userId` keys

### 2. Like Feature

- [ ] Navigate to any article page
- [ ] Click the heart/like button
- [ ] Verify toast notification appears: "Article liked!"
- [ ] Verify like count increases
- [ ] Click heart again to unlike
- [ ] Verify toast: "Like removed"
- [ ] Verify like count decreases

### 3. Comment Feature

- [ ] Scroll to comments section
- [ ] Type a comment in the text area
- [ ] Click "Post Comment" button
- [ ] Verify toast: "Comment posted!"
- [ ] Verify comment appears in the list
- [ ] Verify comment count increases

### 4. Bookmark Feature

- [ ] Click bookmark icon
- [ ] Verify toast: "Article saved!"
- [ ] Navigate to /bookmarks
- [ ] Verify article appears in bookmarks list
- [ ] Go back to article
- [ ] Click bookmark icon again
- [ ] Verify toast: "Bookmark removed"

### 5. Share Feature

- [ ] Click share button
- [ ] Verify share dialog or clipboard toast appears

### 6. Disconnect Wallet

- [ ] Click "Disconnect" button
- [ ] Verify wallet address removed from header
- [ ] **Check localStorage** - authToken and userId should be cleared
- [ ] Try to like an article
- [ ] Verify toast: "Authentication required"

### 7. Reconnect Wallet

- [ ] Refresh the page
- [ ] Wait for auto-reconnect (if wallet was previously connected)
- [ ] Verify authentication happens automatically
- [ ] Verify Like/Comment features work without re-connecting

## 🔍 Browser DevTools Checks

### Console Logs to Look For

```
✅ Wallet authenticated successfully: { id: "...", walletAddress: "...", name: "...", role: "..." }
```

### LocalStorage Keys

Open DevTools → Application → Local Storage → http://localhost:3000

- `authToken` - Should be a long JWT string starting with "eyJ..."
- `userId` - Should be a UUID like "cmix4jahl00016x37d5g74lfj"
- `walletConnected` - Should be "true"
- `walletName` - Name of the wallet (e.g., "nami", "eternl")

### Network Tab

- Look for POST request to `http://localhost:5000/api/auth/wallet`
- Response should be 200 with token and user object
- Like requests should have `Authorization: Bearer ...` header

## 🐛 Common Issues

### "Authentication required" even after connecting wallet

**Possible causes:**

1. Backend not running (check `pnpm run dev` in backend folder)
2. CORS issues (check backend console for errors)
3. JWT secret not set (check backend `.env` file has `JWT_SECRET`)

**Solution:**

```bash
# Check backend is running
pgrep -f "node.*backend" && echo "✅ Running" || echo "❌ Not running"

# Restart backend if needed
cd backend && pnpm run dev
```

### Token not being stored

**Check:**

1. Browser console for authentication errors
2. Network tab for failed `/api/auth/wallet` request
3. Backend logs for error messages

### Wallet not connecting

**Check:**

1. Wallet extension is installed
2. Wallet is unlocked
3. Browser console for errors from `@meshsdk/core`

## 📊 Expected API Responses

### Wallet Auth Success

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "cmix4jahl00016x37d5g74lfj",
    "walletAddress": "addr1q9...",
    "name": "User addr1q9...",
    "role": "WRITER"
  }
}
```

### Like Success

```json
{
  "id": "cmix4ku6500036x37i3w2r6of",
  "articleId": "cmix4j0j700139z5oik08ywr2",
  "userId": "cmix4jahl00016x37d5g74lfj",
  "createdAt": "2025-12-08T12:26:06.653Z"
}
```

### Comment Success

```json
{
  "id": "comment-id",
  "articleId": "article-id",
  "userId": "user-id",
  "content": "Great article!",
  "createdAt": "2025-12-08T12:30:00.000Z"
}
```
