#!/bin/bash

# EightBlock VPS Deployment Script
# This script automates the deployment process

set -e

echo "🚀 EightBlock Deployment Script"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as correct user
if [ "$USER" = "root" ]; then
    echo -e "${RED}❌ Do not run this script as root!${NC}"
    echo "Run as the deploy user: sudo -u deploy bash deploy.sh"
    exit 1
fi

echo "📍 Current directory: $(pwd)"
echo ""

# Pull latest code
echo "📥 Pulling latest code from GitHub..."
git pull origin main
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Git pull failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Code updated${NC}"
echo ""

# Backend
echo "🔧 Building backend..."
cd backend
echo "  📦 Installing dependencies..."
pnpm install --prod --frozen-lockfile
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backend dependencies installation failed!${NC}"
    exit 1
fi

echo "  🔄 Generating Prisma client..."
npx prisma generate

echo "  🗄️  Running database migrations..."
npx prisma migrate deploy
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Migration failed - check database connection${NC}"
fi

echo -e "${GREEN}✅ Backend built${NC}"
echo ""

# Frontend
echo "🎨 Building frontend..."
cd ../frontend
echo "  📦 Installing dependencies..."
pnpm install --frozen-lockfile
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend dependencies installation failed!${NC}"
    exit 1
fi

echo "  🏗️  Building Next.js..."
pnpm build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend built${NC}"
echo ""

# Restart services
echo "♻️  Restarting services..."
cd ..
pm2 restart ecosystem.config.js
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ PM2 restart failed!${NC}"
    exit 1
fi

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 5

# Health checks
echo ""
echo "🏥 Running health checks..."

# Backend health check
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Backend health check failed${NC}"
fi

# Frontend health check
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend health check failed${NC}"
fi

# Database check
if pg_isready -U eightblock > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Database connection issue${NC}"
fi

# Redis check
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Redis connection issue${NC}"
fi

# Reload Nginx
echo ""
echo "🔄 Reloading Nginx..."
sudo nginx -s reload

echo ""
echo "================================"
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo "📊 Status:"
pm2 status
echo ""
echo "📝 View logs:"
echo "  pm2 logs eightblock-backend"
echo "  pm2 logs eightblock-frontend"
echo ""
echo "🌐 Your app should be live at:"
echo "  Frontend: https://yourdomain.com"
echo "  API: https://api.yourdomain.com"
