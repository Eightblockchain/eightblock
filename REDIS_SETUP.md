# Redis Setup Guide

This guide explains how to set up Redis for caching in the EightBlock application.

## Installation

### Ubuntu/Debian

```bash
sudo apt update
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### macOS

```bash
brew install redis
brew services start redis
```

### Verify Installation

```bash
redis-cli ping
# Should return: PONG
```

## Configuration

Redis is configured to run on the default port `6379`. The application will automatically connect to `redis://localhost:6379`.

## Usage

### Start Redis

```bash
# Ubuntu/Debian
sudo systemctl start redis-server

# macOS
brew services start redis
```

### Stop Redis

```bash
# Ubuntu/Debian
sudo systemctl stop redis-server

# macOS
brew services stop redis
```

### Check Redis Status

```bash
# Ubuntu/Debian
sudo systemctl status redis-server

# macOS
brew services info redis
```

## Cache Management

### Clear All Cache

```bash
redis-cli FLUSHALL
```

### Monitor Cache Activity

```bash
redis-cli MONITOR
```

### Check Cache Keys

```bash
redis-cli KEYS "*"
```

## Application Integration

The application automatically handles Redis caching:

- **Cache TTL**: 5 minutes (300 seconds)
- **Cache Keys**: `articles:page:{page}:limit:{limit}`
- **Cache Invalidation**: Automatic on article create/update/delete
- **Graceful Fallback**: If Redis is unavailable, the app continues without caching

## Troubleshooting

### Redis Not Running

If you see connection errors, make sure Redis is running:

```bash
sudo systemctl status redis-server  # Ubuntu/Debian
brew services info redis             # macOS
```

### Test Connection

```bash
redis-cli
> ping
PONG
> exit
```

### Check Logs

```bash
# Ubuntu/Debian
sudo journalctl -u redis-server -f

# macOS
tail -f /usr/local/var/log/redis.log
```

## Performance Optimization

For production use, consider these Redis configuration optimizations:

```bash
# Edit Redis config
sudo nano /etc/redis/redis.conf

# Recommended settings:
maxmemory 256mb
maxmemory-policy allkeys-lru
```

Then restart Redis:

```bash
sudo systemctl restart redis-server  # Ubuntu/Debian
brew services restart redis           # macOS
```

## Development Workflow

When running the app in development:

```bash
# Make sure Redis is running
redis-cli ping

# Start the application
pnpm dev
```

The backend will automatically connect to Redis and use it for caching article queries.
