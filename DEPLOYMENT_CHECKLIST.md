# 🚀 Deployment Checklist

## Pre-Deployment (Before VPS Setup)

### GitHub Repository

- [ ] Push all code to GitHub
- [ ] Verify all tests pass locally
- [ ] Review all environment variables
- [ ] Create `.env.example` files (without sensitive data)
- [ ] Document any manual setup steps
- [ ] Create GitHub repository secrets (will need VPS details)

### Local Testing

- [ ] Test production build locally
  ```bash
  cd backend && pnpm install
  cd ../frontend && pnpm build && pnpm start
  ```
- [ ] Verify database migrations work
- [ ] Test API endpoints with production-like data
- [ ] Check for console errors in browser

---

## VPS Provisioning

### Choose VPS Provider

- [ ] **DigitalOcean** ($40/month for 4GB RAM/2 vCPU droplet)
- [ ] **Linode** ($36/month for 4GB RAM/2 vCPU Linode)
- [ ] **Vultr** ($36/month for 4GB RAM/2 vCPU instance)
- [ ] **Hetzner** (€16/month for 4GB RAM/2 vCPU - cheapest)

### VPS Specs (Recommended)

- [ ] 4GB RAM minimum (8GB for 10K+ users)
- [ ] 2 vCPU minimum (4 vCPU for 10K+ users)
- [ ] 50GB SSD minimum (100GB recommended)
- [ ] Ubuntu 22.04 LTS (preferred)
- [ ] Region: Closest to your users

### Domain Setup

- [ ] Purchase domain (Namecheap, Cloudflare, etc.)
- [ ] Configure DNS A records:
  - `yourdomain.com` → VPS IP
  - `api.yourdomain.com` → VPS IP
  - `www.yourdomain.com` → VPS IP

---

## Initial VPS Setup

### 1. Connect to VPS

```bash
ssh root@YOUR_VPS_IP
```

### 2. Create Deploy User

```bash
adduser deploy
usermod -aG sudo deploy
```

### 3. Setup SSH Keys

**On your local machine:**

```bash
ssh-keygen -t ed25519 -C "deploy@eightblock"
cat ~/.ssh/id_ed25519.pub
```

**On VPS (as deploy user):**

```bash
su - deploy
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys  # Paste public key
chmod 600 ~/.ssh/authorized_keys
exit
```

**Test SSH:**

```bash
ssh deploy@YOUR_VPS_IP
```

- [ ] Root user created
- [ ] Deploy user created and added to sudo group
- [ ] SSH keys generated and added
- [ ] SSH access working with deploy user

### 4. Security Hardening

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Setup firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Disable root SSH login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd

# Setup fail2ban
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
```

- [ ] System updated
- [ ] Firewall configured (SSH, HTTP, HTTPS)
- [ ] Root SSH login disabled
- [ ] Fail2ban installed

---

## Install Dependencies

### 5. Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Should be v20.x
```

### 6. Install pnpm

```bash
sudo npm install -g pnpm
pnpm --version
```

### 7. Install Git

```bash
sudo apt install git -y
git --version
```

### 8. Install PostgreSQL 15

```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 9. Install Redis

```bash
sudo apt install redis-server -y
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### 10. Install PM2

```bash
sudo npm install -g pm2
pm2 startup
# Run the command it outputs
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u deploy --hp /home/deploy
```

### 11. Install Nginx

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

- [ ] Node.js 20.x installed
- [ ] pnpm installed globally
- [ ] Git installed
- [ ] PostgreSQL 15 installed and running
- [ ] Redis installed and running
- [ ] PM2 installed and startup configured
- [ ] Nginx installed and running

---

## Database Configuration

### 12. Setup PostgreSQL

```bash
sudo -u postgres psql

CREATE DATABASE eightblock;
CREATE USER eightblock WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE eightblock TO eightblock;
\c eightblock
GRANT ALL ON SCHEMA public TO eightblock;
\q
```

### 13. Configure Redis

```bash
sudo nano /etc/redis/redis.conf
# Set: requirepass your_redis_password_here
sudo systemctl restart redis-server

# Test:
redis-cli
AUTH your_redis_password_here
PING  # Should return PONG
exit
```

- [ ] PostgreSQL database created
- [ ] PostgreSQL user created with strong password
- [ ] Privileges granted
- [ ] Redis password configured
- [ ] Redis accessible

---

## Application Setup

### 14. Clone Repository

```bash
sudo mkdir -p /var/www
sudo chown deploy:deploy /var/www
cd /var/www
git clone https://github.com/YOUR_USERNAME/eightblock.git
cd eightblock
```

### 15. Setup Environment Variables

**Backend `.env`:**

```bash
cd /var/www/eightblock/backend
nano .env
```

```env
NODE_ENV=production
PORT=5000

# Database (replace with your actual values)
DATABASE_URL="postgresql://eightblock:YOUR_DB_PASSWORD@localhost:5432/eightblock?schema=public&connection_limit=20&pool_timeout=10"

# Redis (replace with your actual password)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_REDIS_PASSWORD

# JWT (generate a secure random string)
JWT_SECRET=your_jwt_secret_here_use_openssl_rand_base64_32

# CORS (your domain)
CORS_ORIGIN=https://yourdomain.com

# Optional: File uploads
UPLOAD_DIR=/var/www/eightblock/backend/uploads
```

**Frontend `.env.production`:**

```bash
cd /var/www/eightblock/frontend
nano .env.production
```

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your_nextauth_secret_here_use_openssl_rand_base64_32
```

- [ ] Repository cloned to `/var/www/eightblock`
- [ ] Backend `.env` configured with database credentials
- [ ] Backend `.env` configured with Redis password
- [ ] Backend `.env` has strong JWT_SECRET
- [ ] Frontend `.env.production` configured
- [ ] Frontend `.env.production` has strong NEXTAUTH_SECRET

### 16. Install Dependencies & Build

```bash
cd /var/www/eightblock

# Backend
cd backend
pnpm install --prod
npx prisma generate
npx prisma migrate deploy

# Frontend
cd ../frontend
pnpm install
pnpm build
```

- [ ] Backend dependencies installed
- [ ] Prisma client generated
- [ ] Database migrations applied
- [ ] Frontend dependencies installed
- [ ] Frontend built successfully

### 17. Setup PM2

```bash
cd /var/www/eightblock

# Create logs directory
mkdir -p logs

# Start applications
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Verify running
pm2 status
pm2 logs
```

- [ ] PM2 started with ecosystem.config.js
- [ ] Both backend and frontend running
- [ ] PM2 process list saved
- [ ] Services accessible on localhost

---

## Nginx Configuration

### 18. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/eightblock
```

**Paste this configuration:**

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:5000;
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

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
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

**Enable site:**

```bash
sudo ln -s /etc/nginx/sites-available/eightblock /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

- [ ] Nginx configuration created
- [ ] Configuration syntax validated
- [ ] Site enabled
- [ ] Nginx reloaded

### 19. Test HTTP Access

```bash
curl http://api.yourdomain.com/health
curl http://yourdomain.com
```

- [ ] API accessible via domain
- [ ] Frontend accessible via domain

---

## SSL Certificates

### 20. Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 21. Obtain SSL Certificates

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

**Follow prompts:**

- Enter email address
- Agree to terms
- Choose redirect HTTP to HTTPS (recommended)

### 22. Test Auto-Renewal

```bash
sudo certbot renew --dry-run
```

- [ ] Certbot installed
- [ ] SSL certificates obtained for all domains
- [ ] HTTPS working for frontend
- [ ] HTTPS working for API
- [ ] Auto-renewal configured and tested

---

## GitHub CI/CD Setup

### 23. Generate GitHub Secrets

**Generate SSH key for GitHub Actions:**

```bash
ssh-keygen -t ed25519 -C "github-actions@eightblock" -f ~/.ssh/github-actions
cat ~/.ssh/github-actions.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github-actions  # Copy private key
```

### 24. Add GitHub Secrets

Go to your GitHub repository:
`Settings → Secrets and variables → Actions → New repository secret`

Add these secrets:

| Secret Name    | Value                                             |
| -------------- | ------------------------------------------------- |
| `VPS_HOST`     | Your VPS IP address                               |
| `VPS_USERNAME` | `deploy`                                          |
| `VPS_SSH_KEY`  | Contents of `~/.ssh/github-actions` (private key) |

- [ ] SSH key generated for GitHub Actions
- [ ] Public key added to `authorized_keys`
- [ ] `VPS_HOST` secret added to GitHub
- [ ] `VPS_USERNAME` secret added to GitHub
- [ ] `VPS_SSH_KEY` secret added to GitHub

### 25. Test CI/CD Pipeline

```bash
# Make a small change locally
echo "# Test deployment" >> README.md
git add README.md
git commit -m "Test CI/CD pipeline"
git push origin main
```

**Check GitHub Actions:**

- Go to `Actions` tab in your repository
- Watch the deployment workflow run
- Verify it completes successfully

- [ ] Test commit pushed
- [ ] GitHub Actions workflow triggered
- [ ] Deployment completed successfully
- [ ] Changes reflected on live site

---

## Monitoring & Maintenance

### 26. Setup Log Rotation

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
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 27. Database Backups

**Create backup script:**

```bash
nano ~/backup-database.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/eightblock"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U eightblock eightblock > "$BACKUP_DIR/db_backup_$DATE.sql"

# Keep only last 7 days
find $BACKUP_DIR -name "db_backup_*.sql" -mtime +7 -delete

echo "Backup completed: db_backup_$DATE.sql"
```

```bash
chmod +x ~/backup-database.sh

# Test backup
~/backup-database.sh

# Setup daily cron job
crontab -e
# Add: 0 2 * * * /home/deploy/backup-database.sh >> /home/deploy/backup.log 2>&1
```

### 28. Health Monitoring

**Create health check script:**

```bash
nano ~/health-check.sh
```

```bash
#!/bin/bash

# Check backend
if ! curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo "Backend is down! Restarting..."
    pm2 restart eightblock-backend
fi

# Check frontend
if ! curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "Frontend is down! Restarting..."
    pm2 restart eightblock-frontend
fi
```

```bash
chmod +x ~/health-check.sh

# Setup cron job (every 5 minutes)
crontab -e
# Add: */5 * * * * /home/deploy/health-check.sh >> /home/deploy/health.log 2>&1
```

- [ ] Log rotation configured
- [ ] Database backup script created and tested
- [ ] Daily backup cron job configured
- [ ] Health check script created
- [ ] Health check cron job configured

---

## Post-Deployment Testing

### 29. Functional Testing

- [ ] Visit https://yourdomain.com
- [ ] Register a new account
- [ ] Login works
- [ ] Create an article
- [ ] Upload images work
- [ ] Comment on article
- [ ] Like/bookmark functionality
- [ ] Profile page loads
- [ ] Search works
- [ ] API endpoints respond correctly

### 30. Performance Testing

```bash
# Test backend response time
curl -w "@-" -o /dev/null -s https://api.yourdomain.com/api/articles << 'EOF'
    time_namelookup:  %{time_namelookup}\n
       time_connect:  %{time_connect}\n
    time_appconnect:  %{time_appconnect}\n
      time_redirect:  %{time_redirect}\n
   time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
         time_total:  %{time_total}\n
EOF
```

- [ ] API response time < 200ms
- [ ] Frontend loads in < 3s
- [ ] Images load properly
- [ ] No console errors

### 31. Security Verification

- [ ] HTTPS working (green padlock in browser)
- [ ] HTTP redirects to HTTPS
- [ ] Rate limiting active (test with multiple requests)
- [ ] File upload size limits working
- [ ] SQL injection protection (Prisma handles this)
- [ ] XSS protection (test with script tags in comments)

---

## 🎉 Deployment Complete!

### Quick Commands Reference

**View logs:**

```bash
pm2 logs eightblock-backend
pm2 logs eightblock-frontend
tail -f /var/www/eightblock/logs/backend-error.log
```

**Restart services:**

```bash
pm2 restart ecosystem.config.js
pm2 restart eightblock-backend
pm2 restart eightblock-frontend
```

**Database operations:**

```bash
cd /var/www/eightblock/backend
npx prisma studio  # GUI for database
npx prisma migrate deploy  # Run migrations
```

**Manual deployment:**

```bash
cd /var/www/eightblock
bash deploy.sh
```

**Check service status:**

```bash
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql
sudo systemctl status redis-server
```

### Support & Documentation

- 📖 [VPS_DEPLOYMENT_GUIDE.md](./VPS_DEPLOYMENT_GUIDE.md) - Complete deployment guide
- 📊 [PRODUCTION_OPTIMIZATION.md](./PRODUCTION_OPTIMIZATION.md) - Performance optimizations
- 📈 [VISIT_TRACKING_GUIDE.md](./VISIT_TRACKING_GUIDE.md) - Analytics documentation

### Cost Estimate

**Monthly Running Costs:**

- VPS (4GB RAM): $36-40/month
- Domain: $12/year (~$1/month)
- SSL: Free (Let's Encrypt)

**Total: ~$37-41/month**

### Scaling Up

When you reach 10K+ concurrent users:

- Upgrade VPS to 8GB RAM / 4 vCPUs ($60-80/month)
- Setup Redis rate limiting (Priority 1)
- Move uploads to cloud storage (S3/Cloudinary)
- Setup database read replicas
- Implement CDN (Cloudflare)

---

## Troubleshooting

### Common Issues

**1. PM2 services won't start:**

```bash
pm2 kill
pm2 start ecosystem.config.js
pm2 logs
```

**2. Database connection error:**

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U eightblock -d eightblock -h localhost
```

**3. Redis connection error:**

```bash
# Check Redis is running
sudo systemctl status redis-server

# Test connection
redis-cli
AUTH your_password
PING
```

**4. Nginx 502 Bad Gateway:**

```bash
# Check if services are running
pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

**5. GitHub Actions deployment fails:**

- Check SSH key is correct in GitHub secrets
- Verify deploy user has write access to `/var/www/eightblock`
- Check GitHub Actions logs for specific error

---

## 📞 Need Help?

If you encounter issues not covered here:

1. Check logs: `pm2 logs`
2. Review [VPS_DEPLOYMENT_GUIDE.md](./VPS_DEPLOYMENT_GUIDE.md)
3. Check GitHub Actions logs
4. Verify all environment variables are set correctly

**Happy Deploying! 🚀**
