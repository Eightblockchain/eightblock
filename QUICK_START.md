# Quick Start Guide

## One Command Setup 🚀

```bash
# Clone the repository
git clone https://github.com/Mechack08/eightblock.git
cd eightblock

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Start EVERYTHING (PostgreSQL + Redis + Backend + Frontend)
pnpm dev
```

That's it! The app is now running with:

- ✅ PostgreSQL database (port 5432)
- ✅ Redis caching (port 6379)
- ✅ Backend API (http://localhost:5000)
- ✅ Frontend (http://localhost:3000)

## First Time Setup

After running `pnpm dev` for the first time, seed the database:

```bash
# In a new terminal
cd backend
pnpm prisma db seed
```

## Useful Commands

| Command              | What it does                                         |
| -------------------- | ---------------------------------------------------- |
| `pnpm dev`           | Start all services (DB + Redis + Backend + Frontend) |
| `pnpm services:stop` | Stop Docker services (PostgreSQL + Redis)            |
| `pnpm services:logs` | View Docker service logs                             |
| `pnpm dev:frontend`  | Start only the frontend                              |
| `pnpm dev:backend`   | Start only the backend                               |

## What Happens When You Run `pnpm dev`?

1. **Docker Compose starts** PostgreSQL and Redis containers
2. **Waits 3 seconds** for services to be ready
3. **Starts Backend** on port 5000
4. **Starts Frontend** on port 3000

All in one command! 🎉

## Stopping the App

Press `Ctrl+C` to stop the frontend and backend.

To stop the Docker services:

```bash
pnpm services:stop
```

## Troubleshooting

### "Docker daemon is not running"

- Start Docker Desktop
- Wait for it to fully start
- Run `pnpm dev` again

### "Port 5432 already in use"

- You might have PostgreSQL running locally
- Either stop local PostgreSQL: `brew services stop postgresql@15`
- Or change the port in `docker-compose.yml`

### "Port 6379 already in use"

- You might have Redis running locally
- Either stop local Redis: `brew services stop redis`
- Or change the port in `docker-compose.yml`

### Database migration errors

```bash
cd backend
pnpm prisma migrate dev
pnpm prisma db seed
```

## Requirements

- Node.js 20+
- pnpm 9+
- Docker Desktop

That's all you need! No manual PostgreSQL or Redis installation required. 🎊
