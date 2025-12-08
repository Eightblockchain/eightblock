#!/bin/bash

echo "=== Testing Like Functionality ==="
echo ""

# Authenticate
echo "1. Authenticating..."
AUTH=$(curl -s -X POST http://localhost:5000/api/auth/wallet \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "addr1q9test_like_functionality"}')

TOKEN=$(echo "$AUTH" | jq -r '.token')
USER_ID=$(echo "$AUTH" | jq -r '.user.id')
echo "   User ID: $USER_ID"
echo ""

# Get article
echo "2. Getting first article..."
ARTICLE_ID=$(curl -s 'http://localhost:5000/api/articles?page=1&limit=1' | jq -r '.articles[0].id')
echo "   Article ID: $ARTICLE_ID"
echo ""

# Check initial like status
echo "3. Checking if user already liked..."
LIKED=$(curl -s "http://localhost:5000/api/articles/$ARTICLE_ID/likes?userId=$USER_ID" | jq -r '.liked')
echo "   Initially liked: $LIKED"
echo ""

# Like the article
echo "4. Liking the article..."
LIKE_RESPONSE=$(curl -s -X POST "http://localhost:5000/api/articles/$ARTICLE_ID/likes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"userId\": \"$USER_ID\"}")
echo "   Response: $(echo $LIKE_RESPONSE | jq -c '.')"
echo ""

# Check like status after liking
echo "5. Checking like status after liking..."
LIKED_AFTER=$(curl -s "http://localhost:5000/api/articles/$ARTICLE_ID/likes?userId=$USER_ID" | jq -r '.liked')
echo "   Liked after POST: $LIKED_AFTER"
echo ""

# Unlike the article
echo "6. Unliking the article..."
UNLIKE_RESPONSE=$(curl -s -X DELETE "http://localhost:5000/api/articles/$ARTICLE_ID/likes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"userId\": \"$USER_ID\"}")
echo "   Status: $(curl -w '%{http_code}' -s -o /dev/null -X DELETE "http://localhost:5000/api/articles/$ARTICLE_ID/likes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"userId\": \"$USER_ID\"}")"
echo ""

# Check like status after unliking
echo "7. Checking like status after unliking..."
LIKED_FINAL=$(curl -s "http://localhost:5000/api/articles/$ARTICLE_ID/likes?userId=$USER_ID" | jq -r '.liked')
echo "   Liked after DELETE: $LIKED_FINAL"
echo ""

if [ "$LIKED_AFTER" = "true" ] && [ "$LIKED_FINAL" = "false" ]; then
  echo "✅ Like/Unlike functionality working correctly!"
else
  echo "❌ Something went wrong:"
  echo "   After like: $LIKED_AFTER (expected: true)"
  echo "   After unlike: $LIKED_FINAL (expected: false)"
fi
