#!/bin/bash

# Eightblock Auto-Deployment Script
set -e

PROJECT_DIR="/var/www/eightblock"
DEPLOY_LOG="$PROJECT_DIR/logs/deploy.log"

echo "================================================" | tee -a "$DEPLOY_LOG"
echo "Deployment started at $(date)" | tee -a "$DEPLOY_LOG"
echo "================================================" | tee -a "$DEPLOY_LOG"

cd $PROJECT_DIR

# Pull latest changes
echo "Pulling latest changes..." | tee -a "$DEPLOY_LOG"
git pull origin main 2>&1 | tee -a "$DEPLOY_LOG"

# Install dependencies
echo "Installing dependencies..." | tee -a "$DEPLOY_LOG"
pnpm install 2>&1 | tee -a "$DEPLOY_LOG"

# Backend deployment
echo "Building backend..." | tee -a "$DEPLOY_LOG"
cd backend
pnpm prisma generate 2>&1 | tee -a "$DEPLOY_LOG"
pnpm prisma migrate deploy 2>&1 | tee -a "$DEPLOY_LOG"
pnpm build 2>&1 | tee -a "$DEPLOY_LOG"

# Frontend deployment
echo "Building frontend..." | tee -a "$DEPLOY_LOG"
cd ../frontend
pnpm build 2>&1 | tee -a "$DEPLOY_LOG"

# Restart services
echo "Restarting services..." | tee -a "$DEPLOY_LOG"
cd ..
pm2 restart ecosystem.config.js 2>&1 | tee -a "$DEPLOY_LOG"

echo "================================================" | tee -a "$DEPLOY_LOG"
echo "Deployment completed at $(date)" | tee -a "$DEPLOY_LOG"
echo "================================================" | tee -a "$DEPLOY_LOG"

# Send notification (optional)
# curl -X POST -H 'Content-type: application/json' --data '{"text":"Eightblock deployed successfully!"}' YOUR_SLACK_WEBHOOK_URL