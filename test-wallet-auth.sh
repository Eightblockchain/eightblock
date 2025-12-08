#!/bin/bash

# Test wallet authentication endpoint
echo "Testing wallet authentication endpoint..."
echo ""

# Test with a sample wallet address
WALLET_ADDRESS="addr1q9test_wallet_address_12345678901234567890"

echo "1. Testing POST /api/auth/wallet with wallet address: $WALLET_ADDRESS"
RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/wallet \
  -H "Content-Type: application/json" \
  -d "{\"walletAddress\": \"$WALLET_ADDRESS\"}")

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Extract token from response
TOKEN=$(echo "$RESPONSE" | jq -r '.token' 2>/dev/null)

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
  echo "✓ Authentication successful! Token received."
  echo "Token (first 50 chars): ${TOKEN:0:50}..."
  echo ""
  
  # Extract user ID
  USER_ID=$(echo "$RESPONSE" | jq -r '.user.id' 2>/dev/null)
  echo "User ID: $USER_ID"
  echo ""
  
  # Test using the token to like an article
  echo "2. Testing authenticated request - Like article"
  # Get first article
  ARTICLE=$(curl -s 'http://localhost:5000/api/articles?page=1&limit=1' | jq -r '.articles[0]')
  ARTICLE_ID=$(echo "$ARTICLE" | jq -r '.id')
  
  if [ "$ARTICLE_ID" != "null" ] && [ -n "$ARTICLE_ID" ]; then
    echo "Using article ID: $ARTICLE_ID"
    
    LIKE_RESPONSE=$(curl -s -X POST "http://localhost:5000/api/articles/$ARTICLE_ID/likes" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{\"userId\": \"$USER_ID\"}")
    
    echo "Like response:"
    echo "$LIKE_RESPONSE" | jq '.' 2>/dev/null || echo "$LIKE_RESPONSE"
    echo ""
    echo "✓ Authentication flow complete!"
  else
    echo "No articles found to test"
  fi
else
  echo "✗ Authentication failed!"
fi
