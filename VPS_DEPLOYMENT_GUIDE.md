# 🚀 VPS Deployment Guide - EightBlock

Complete guide to deploy your app on a VPS with GitHub continuous deployment.

---

## 📋 Table of Contents

1. [VPS Requirements](#vps-requirements)
2. [Initial VPS Setup](#initial-vps-setup)
3. [Install Dependencies](#install-dependencies)
4. [Database & Redis Setup](#database--redis-setup)
5. [Application Setup](#application-setup)
6. [Domain & SSL Configuration](#domain--ssl-configuration)
7. [GitHub CI/CD Setup](#github-cicd-setup)
8. [Monitoring & Maintenance](#monitoring--maintenance)

---

## 🖥️ VPS Requirements

### Recommended Specifications (for 10K-50K users):

**Minimum (Small Scale - 1K-5K users):**

- **CPU:** 2 vCPUs
- **RAM:** 4 GB
- **Storage:** 50 GB SSD
- **Bandwidth:** 2 TB/month
- **Cost:** ~$12-20/month
- **Providers:** DigitalOcean, Linode, Vultr, Hetzner

**Recommended (Medium Scale - 10K-50K users):**

- **CPU:** 4 vCPUs
- **RAM:** 8 GB
- **Storage:** 100 GB SSD
- **Bandwidth:** 4 TB/month
- **Cost:** ~$40-60/month
- **Providers:** DigitalOcean, Linode, Vultr, Hetzner

**Production (Large Scale - 50K+ users):**

- **CPU:** 8 vCPUs
- **RAM:** 16 GB
- **Storage:** 200 GB SSD
- **Bandwidth:** 8 TB/month
- **Cost:** ~$80-120/month
- **Providers:** DigitalOcean, Linode, AWS Lightsail, Vultr

### Operating System:

- **Ubuntu 22.04 LTS** (recommended)
- **Ubuntu 24.04 LTS** (also good)
- **Debian 12** (alternative)

---

## 🔧 Initial VPS Setup

### Step 1: Connect to Your VPS

```bash
# SSH into your VPS (replace with your IP)
ssh root@YOUR_VPS_IP

# If you have a key-based auth:
ssh -i ~/.ssh/your_key.pem root@YOUR_VPS_IP
```

### Step 2: Create a Non-Root User

```bash
# Create new user
adduser deploy

# Add to sudo group
usermod -aG sudo deploy

# Switch to new user
su - deploy
```

### Step 3: Setup SSH Key Authentication

```bash
# On your local machine, copy your SSH key
ssh-copy-id deploy@YOUR_VPS_IP

# Or manually:
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
# Paste your public key, save and exit
chmod 600 ~/.ssh/authorized_keys
```

### Step 4: Secure SSH Access

```bash
sudo nano /etc/ssh/sshd_config

# Make these changes:
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes

# Restart SSH
sudo systemctl restart sshd
```

### Step 5: Setup Firewall

```bash
# Install and enable UFW
sudo apt update
sudo apt install ufw

# Allow SSH, HTTP, HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5432/tcp  # PostgreSQL (only if needed externally)
sudo ufw allow 6379/tcp  # Redis (only if needed externally)

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## 📦 Install Dependencies

### Step 1: Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### Step 2: Install Node.js 20.x

```bash
# Install Node.js 20.x via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version

# Install pnpm globally
sudo npm install -g pnpm
pnpm --version
```

### Step 3: Install Git

```bash
sudo apt install git -y
git --version

# Configure git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Step 4: Install Build Tools

```bash
sudo apt install -y build-essential curl wget
```

---

## 🗄️ Database & Redis Setup

### Option A: Using Docker (Recommended)

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Logout and login again for group changes
exit
# SSH back in

# Verify Docker
docker --version
docker compose version
```

### Option B: Install PostgreSQL & Redis Natively

```bash
# Install PostgreSQL 15
sudo apt install postgresql postgresql-contrib -y

# Install Redis
sudo apt install redis-server -y

# Start services
sudo systemctl start postgresql redis-server
sudo systemctl enable postgresql redis-server
```

### Configure PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE eightblock_prod;
CREATE USER eightblock WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE eightblock_prod TO eightblock;
ALTER DATABASE eightblock_prod OWNER TO eightblock;
\q
```

### Configure Redis

```bash
# Edit Redis config
sudo nano /etc/redis/redis.conf

# Set a password (uncomment and modify):
requirepass your_redis_password_here

# Restart Redis
sudo systemctl restart redis-server
```

---

## 🚀 Application Setup

### Step 1: Clone Repository

```bash
# Create app directory
sudo mkdir -p /var/www
sudo chown -R deploy:deploy /var/www

# Clone your repository
cd /var/www
git clone https://github.com/Mechack08/eightblock.git
cd eightblock
```

### Step 2: Setup Environment Variables

```bash
# Backend environment
cd /var/www/eightblock/backend
nano .env
```

**Backend .env:**

```env
# Database
DATABASE_URL="postgresql://eightblock:your_secure_password_here@localhost:5432/eightblock_prod?schema=public&connection_limit=20&pool_timeout=10"

# Node Environment
NODE_ENV=production
PORT=5000

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=YOUR_GENERATED_SECRET_HERE

# Redis
REDIS_URL="redis://:your_redis_password_here@localhost:6379"

# CORS - Your domain
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Optional: File upload limits
MAX_FILE_SIZE=10485760
```

```bash
# Frontend environment
cd /var/www/eightblock/frontend
nano .env.production
```

**Frontend .env.production:**

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com
```

### Step 3: Install Dependencies & Build

```bash
# Backend
cd /var/www/eightblock/backend
pnpm install --prod
npx prisma generate
npx prisma migrate deploy

# Frontend
cd /var/www/eightblock/frontend
pnpm install
pnpm build
```

### Step 4: Setup PM2 Process Manager

```bash
# Install PM2 globally
sudo npm install -g pm2

# Create PM2 ecosystem file
cd /var/www/eightblock
nano ecosystem.config.js
```

**ecosystem.config.js:**

```javascript
module.exports = {
  apps: [
    {
      name: 'eightblock-backend',
      cwd: '/var/www/eightblock/backend',
      script: 'tsx',
      args: 'src/server.ts',
      instances: 2, // Use 2-4 instances for load balancing
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/var/www/eightblock/logs/backend-error.log',
      out_file: '/var/www/eightblock/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '1G',
    },
    {
      name: 'eightblock-frontend',
      cwd: '/var/www/eightblock/frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/var/www/eightblock/logs/frontend-error.log',
      out_file: '/var/www/eightblock/logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '1G',
    },
  ],
};
```

```bash
# Create logs directory
mkdir -p /var/www/eightblock/logs

# Start applications with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command it outputs

# Check status
pm2 status
pm2 logs
```

---

## 🌐 Domain & SSL Configuration

### Step 1: Point Domain to VPS

In your domain registrar (e.g., Namecheap, GoDaddy, Cloudflare):

```
A Record:   yourdomain.com        → YOUR_VPS_IP
A Record:   www.yourdomain.com    → YOUR_VPS_IP
A Record:   api.yourdomain.com    → YOUR_VPS_IP
```

### Step 2: Install Nginx

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 3: Configure Nginx

```bash
# Create backend config
sudo nano /etc/nginx/sites-available/api.yourdomain.com
```

**api.yourdomain.com:**

```nginx
upstream backend {
    least_conn;
    server 127.0.0.1:5000;
    keepalive 64;
}

server {
    listen 80;
    server_name api.yourdomain.com;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
    limit_req zone=api_limit burst=20 nodelay;

    # Large file uploads
    client_max_body_size 20M;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

```bash
# Create frontend config
sudo nano /etc/nginx/sites-available/yourdomain.com
```

**yourdomain.com:**

```nginx
upstream frontend {
    least_conn;
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable sites
sudo ln -s /etc/nginx/sites-available/api.yourdomain.com /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 4: Install SSL Certificates (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificates
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal is already set up
# Test renewal
sudo certbot renew --dry-run
```

---

## 🔄 GitHub CI/CD Setup

### Step 1: Create GitHub Actions Workflow

Create `.github/workflows/deploy.yml` in your repository:

```yaml
name: Deploy to VPS

on:
  push:
    branches: [main, production]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USERNAME }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: 22
          script: |
            cd /var/www/eightblock

            # Pull latest code
            git pull origin main

            # Backend updates
            cd backend
            pnpm install --prod
            npx prisma generate
            npx prisma migrate deploy

            # Frontend updates
            cd ../frontend
            pnpm install
            pnpm build

            # Restart applications
            pm2 restart ecosystem.config.js

            # Clear Nginx cache
            sudo nginx -s reload

            echo "✅ Deployment completed successfully!"
```

### Step 2: Setup GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

```
VPS_HOST: Your VPS IP address
VPS_USERNAME: deploy
VPS_SSH_KEY: Your private SSH key (entire content)
```

To get your SSH private key:

```bash
# On your local machine
cat ~/.ssh/id_rsa
# Copy the entire output
```

### Step 3: Setup Deployment SSH Key on VPS

```bash
# On your VPS as deploy user
ssh-keygen -t rsa -b 4096 -C "github-actions"
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/id_rsa
# Copy this private key to GitHub secrets as VPS_SSH_KEY
```

### Step 4: Create Deployment Script (Optional)

```bash
# On VPS
nano /var/www/eightblock/deploy.sh
```

**deploy.sh:**

```bash
#!/bin/bash

set -e

echo "🚀 Starting deployment..."

cd /var/www/eightblock

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Backend
echo "🔧 Building backend..."
cd backend
pnpm install --prod
npx prisma generate
npx prisma migrate deploy

# Frontend
echo "🎨 Building frontend..."
cd ../frontend
pnpm install
pnpm build

# Restart services
echo "♻️  Restarting services..."
pm2 restart ecosystem.config.js

# Health check
echo "🏥 Checking health..."
sleep 5
curl -f http://localhost:5000/health || echo "⚠️  Backend health check failed"
curl -f http://localhost:3000 || echo "⚠️  Frontend health check failed"

echo "✅ Deployment completed successfully!"
```

```bash
# Make executable
chmod +x /var/www/eightblock/deploy.sh
```

---

## 📊 Monitoring & Maintenance

### Step 1: Setup Log Rotation

```bash
sudo nano /etc/logrotate.d/eightblock
```

```
/var/www/eightblock/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    copytruncate
}
```

### Step 2: Setup Monitoring

```bash
# Install monitoring tools
sudo apt install htop iotop nethogs -y

# PM2 monitoring
pm2 monit

# View logs
pm2 logs eightblock-backend
pm2 logs eightblock-frontend

# System monitoring
htop
```

### Step 3: Database Backups

```bash
# Create backup script
nano ~/backup-db.sh
```

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/eightblock_$DATE.sql.gz"

mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U eightblock eightblock_prod | gzip > $BACKUP_FILE

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "✅ Backup completed: $BACKUP_FILE"
```

```bash
chmod +x ~/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /home/deploy/backup-db.sh
```

### Step 4: Health Check Script

```bash
nano /var/www/eightblock/healthcheck.sh
```

```bash
#!/bin/bash

# Check backend
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend is down! Restarting..."
    pm2 restart eightblock-backend
fi

# Check frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend is down! Restarting..."
    pm2 restart eightblock-frontend
fi

# Check database
if pg_isready -U eightblock > /dev/null 2>&1; then
    echo "✅ Database is healthy"
else
    echo "❌ Database is down!"
fi

# Check Redis
if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is healthy"
else
    echo "❌ Redis is down!"
fi
```

```bash
chmod +x /var/www/eightblock/healthcheck.sh

# Run every 5 minutes
crontab -e
# Add: */5 * * * * /var/www/eightblock/healthcheck.sh >> /var/www/eightblock/logs/healthcheck.log 2>&1
```

---

## 🔒 Security Checklist

- [ ] SSH key-based authentication only
- [ ] Firewall (UFW) enabled
- [ ] SSL certificates installed
- [ ] Strong database passwords
- [ ] Redis password set
- [ ] JWT secret is strong and unique
- [ ] Regular system updates
- [ ] Automatic security updates enabled
- [ ] Database backups configured
- [ ] Log rotation configured

### Enable Automatic Security Updates

```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 🎯 Quick Commands Reference

```bash
# Application Management
pm2 status                    # Check app status
pm2 restart all               # Restart all apps
pm2 logs                      # View logs
pm2 monit                     # Monitor resources

# Nginx
sudo nginx -t                 # Test config
sudo systemctl restart nginx  # Restart
sudo tail -f /var/log/nginx/error.log

# Database
sudo -u postgres psql eightblock_prod
pg_dump -U eightblock eightblock_prod > backup.sql

# System
htop                          # Resource monitor
df -h                         # Disk space
free -m                       # Memory usage
sudo ufw status               # Firewall status

# Git
cd /var/www/eightblock
git pull origin main
./deploy.sh
```

---

## 💰 Monthly Cost Estimate

**Recommended Setup (4 vCPUs, 8GB RAM):**

- VPS: $40-60/month
- Domain: $10-15/year
- SSL: Free (Let's Encrypt)
- **Total: ~$40-60/month**

**Budget Setup (2 vCPUs, 4GB RAM):**

- VPS: $12-20/month
- Domain: $10-15/year
- **Total: ~$12-20/month**

---

## 🚀 Deployment Checklist

- [ ] VPS provisioned with Ubuntu 22.04
- [ ] Non-root user created
- [ ] SSH key authentication setup
- [ ] Firewall configured
- [ ] Node.js 20.x installed
- [ ] PostgreSQL & Redis installed/configured
- [ ] Repository cloned
- [ ] Environment variables set
- [ ] Dependencies installed
- [ ] Database migrated
- [ ] PM2 configured and running
- [ ] Nginx configured
- [ ] Domain DNS configured
- [ ] SSL certificates installed
- [ ] GitHub Actions secrets added
- [ ] First deployment successful
- [ ] Monitoring setup
- [ ] Backup script configured

---

## 📞 Troubleshooting

### App not starting:

```bash
pm2 logs
pm2 restart all
```

### Database connection issues:

```bash
sudo systemctl status postgresql
sudo -u postgres psql
```

### SSL issues:

```bash
sudo certbot renew --dry-run
sudo systemctl restart nginx
```

### Deployment fails:

```bash
cd /var/www/eightblock
git status
./deploy.sh
```

---

**Your app will be live at:**

- 🌐 Frontend: https://yourdomain.com
- 🔌 API: https://api.yourdomain.com
- 🚀 Auto-deploys on every push to `main` branch!
