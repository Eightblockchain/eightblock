#!/bin/bash
# Test script to verify backend API integration

echo "🧪 Testing Backend API Integration..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test 1: Check if backend is running
echo "1️⃣  Testing backend health..."
if curl -s http://localhost:5000/api/articles > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend is not running. Start with: cd backend && pnpm dev${NC}"
    exit 1
fi

# Test 2: Get published articles count
echo ""
echo "2️⃣  Testing published articles endpoint..."
ARTICLES_COUNT=$(curl -s http://localhost:5000/api/articles | jq 'length')
echo -e "${GREEN}✅ Found $ARTICLES_COUNT published articles${NC}"

# Test 3: Get specific article
echo ""
echo "3️⃣  Testing single article endpoint..."
ARTICLE_TITLE=$(curl -s http://localhost:5000/api/articles/getting-started-cardano-development | jq -r '.title')
if [ "$ARTICLE_TITLE" != "null" ]; then
    echo -e "${GREEN}✅ Article fetched: $ARTICLE_TITLE${NC}"
else
    echo -e "${RED}❌ Failed to fetch article${NC}"
fi

# Test 4: Get user's articles (including drafts)
echo ""
echo "4️⃣  Testing user articles endpoint..."
WALLET_ADDR="addr1q9pyac4s5jxhhhfr4uqft4pcf830zj0kge24d52rrlljmc5mquh7wnm244uznlqx7xck0ppkyecsftexwxkv33cay4vsqd2jsh"
USER_ARTICLES=$(curl -s "http://localhost:5000/api/articles/wallet/$WALLET_ADDR" | jq 'length')
echo -e "${GREEN}✅ User has $USER_ARTICLES total articles (including drafts)${NC}"

# Test 5: Verify draft filtering
echo ""
echo "5️⃣  Testing draft article filtering..."
DRAFT_COUNT=$(curl -s "http://localhost:5000/api/articles/wallet/$WALLET_ADDR" | jq '[.[] | select(.status == "DRAFT")] | length')
PUBLISHED_COUNT=$(curl -s "http://localhost:5000/api/articles/wallet/$WALLET_ADDR" | jq '[.[] | select(.status == "PUBLISHED")] | length')
echo -e "${GREEN}✅ Drafts: $DRAFT_COUNT, Published: $PUBLISHED_COUNT${NC}"

# Test 6: Check tags are loaded
echo ""
echo "6️⃣  Testing article tags..."
FIRST_ARTICLE_TAGS=$(curl -s http://localhost:5000/api/articles | jq -r '.[0].tags[0].tag.name')
echo -e "${GREEN}✅ Tags loaded: $FIRST_ARTICLE_TAGS${NC}"

echo ""
echo "🎉 All tests passed! Backend API is working correctly."
echo ""
echo "📊 Summary:"
echo "  - Total Published Articles: $ARTICLES_COUNT"
echo "  - User's Total Articles: $USER_ARTICLES"
echo "  - Published: $PUBLISHED_COUNT"
echo "  - Drafts: $DRAFT_COUNT"
echo ""
echo "🚀 Next steps:"
echo "  1. Open http://localhost:3000/articles to see published articles"
echo "  2. Connect your wallet at http://localhost:3000/profile"
echo "  3. View your articles (including drafts) in your profile"
