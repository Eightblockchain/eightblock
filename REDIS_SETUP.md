# Redis Setup Guide

This application uses Redis for caching to improve performance. Follow these steps to set up Redis.

## Automatic Setup (Recommended)

**Using Docker Compose** - This is the easiest method and is automatically included when you run `pnpm dev`:

```bash
# This command starts PostgreSQL, Redis, Backend, and Frontend all together
pnpm dev
```

The `docker-compose.yml` file will automatically start Redis on port 6379. No manual installation required! ✨

## Manual Installation

If you prefer to install Redis locally instead of using Docker:

### macOS (using Homebrew)

```bash
brew install redis
brew services start redis
```

### Ubuntu/Debian

```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### Docker (standalone)

```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

## Configuration

The application will automatically connect to Redis using environment variables from your `.env` file:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Leave empty for local development
```

**Note**: If you're using `pnpm dev` with Docker Compose, these default values are already configured correctly.

## Verify Redis is Running

```bash
redis-cli ping
```

You should see `PONG` as the response.

## Optional: Redis without Installation

The application is designed to work without Redis. If Redis is not available:

- The cache utility functions will fail gracefully
- The application will continue to work normally
- You'll see warnings in the backend logs
- Data will be fetched directly from PostgreSQL

## Monitoring Cache

To monitor Redis cache in real-time:

```bash
redis-cli monitor
```

To see all cached keys:

```bash
redis-cli keys "articles:*"
```

To clear all cache:

```bash
redis-cli flushall
```

## Cache Strategy

- **TTL**: 5 minutes for article lists
- **Cache Key Pattern**: `articles:page:{page}:limit:{limit}`
- **Invalidation**: Automatic on article create/update/delete
- **Benefits**:
  - Reduced database load
  - Faster response times
  - Better scalability

## Performance Tips

1. **Monitor cache hit rate** using Redis INFO stats
2. **Adjust TTL** based on your update frequency
3. **Use Redis persistence** for production (RDB or AOF)
4. **Consider Redis Cluster** for high traffic

## Troubleshooting

### Connection refused

- Ensure Redis server is running: `redis-cli ping`
- Check if Redis is listening on the correct port: `netstat -an | grep 6379`

### Authentication errors

- Verify REDIS_PASSWORD in .env matches Redis configuration
- Check Redis config: `redis-cli CONFIG GET requirepass`

### Cache not working

- Check backend logs for Redis connection errors
- The app will work without Redis, just slower
