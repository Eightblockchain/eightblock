#!/bin/bash

echo "=== Testing Comment Functionality ==="
echo ""

# Step 1: Authenticate
echo "1. Authenticating user..."
AUTH_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/wallet \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "addr1q9test_comment_functionality"}')

TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.token')
USER_ID=$(echo "$AUTH_RESPONSE" | jq -r '.user.id')

echo "   User ID: $USER_ID"
echo "   Token (first 30 chars): ${TOKEN:0:30}..."
echo ""

# Step 2: Get an article
echo "2. Getting first article..."
ARTICLE_ID=$(curl -s 'http://localhost:5000/api/articles?page=1&limit=1' | jq -r '.articles[0].id')
echo "   Article ID: $ARTICLE_ID"
echo ""

# Step 3: Post a comment
echo "3. Posting comment..."
COMMENT_RESPONSE=$(curl -s -X POST "http://localhost:5000/api/articles/$ARTICLE_ID/comments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"body\": \"This is a test comment from the script!\", \"authorId\": \"$USER_ID\"}")

echo "   Response:"
echo "$COMMENT_RESPONSE" | jq '.'
echo ""

# Step 4: Fetch comments
echo "4. Fetching all comments for this article..."
COMMENTS=$(curl -s "http://localhost:5000/api/articles/$ARTICLE_ID/comments")
echo "$COMMENTS" | jq '.'

echo ""
echo "✅ Test complete!"
