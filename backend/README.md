# Backend Setup Guide

## Prerequisites

- PostgreSQL installed and running
- Node.js 18+ and pnpm installed
- Database created: `eightblock_db`

## Quick Start

### 1. Database Setup

Create the PostgreSQL database:

```bash
psql -U postgres
CREATE DATABASE eightblock_db;
\q
```

### 2. Environment Configuration

Create `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/eightblock_db?schema=public"
NODE_ENV=development
PORT=3001
JWT_SECRET=your-secret-key-change-in-production
```

**Note**: Replace `YOUR_PASSWORD` with your PostgreSQL password. Remember to URL-encode special characters:

- `@` becomes `%40`
- `!` becomes `%21`
- etc.

### 3. Install Dependencies

```bash
cd backend
pnpm install
```

### 4. Run Migrations

```bash
pnpm prisma migrate dev
```

This will:

- Create the database schema
- Generate Prisma Client
- Run the seed script automatically

### 5. Verify Seed Data

The seed script creates:

- 1 user with wallet address: `addr1q9pyac4s5jxhhhfr4uqft4pcf830zj0kge24d52rrlljmc5mquh7wnm244uznlqx7xck0ppkyecsftexwxkv33cay4vsqd2jsh`
- 10 articles (7 published, 3 drafts)
- 8 tags (Blockchain, Cardano, DeFi, etc.)

### 6. Start Development Server

```bash
pnpm dev
```

Server will start on http://localhost:5000

## API Endpoints

### Articles

#### Get All Published Articles

```bash
GET /api/articles
```

Returns only published articles (public endpoint)

#### Get Article by Slug

```bash
GET /api/articles/:slug
```

Example: `/api/articles/getting-started-cardano-development`

#### Get User's Articles

```bash
GET /api/articles/wallet/:walletAddress
```

Returns all articles for the user (including drafts)

Example:

```bash
curl http://localhost:5000/api/articles/wallet/addr1q9pyac4s5jxhhhfr4uqft4pcf830zj0kge24d52rrlljmc5mquh7wnm244uznlqx7xck0ppkyecsftexwxkv33cay4vsqd2jsh
```

#### Create Article

```bash
POST /api/articles
Authorization: Required
Content-Type: application/json

{
  "title": "My Article",
  "slug": "my-article",
  "description": "Article description",
  "content": "Full article content in markdown",
  "category": "Tutorial",
  "authorId": "user_id_here",
  "status": "PUBLISHED",
  "tagIds": ["tag_id_1", "tag_id_2"]
}
```

### Users

#### Get User by Wallet

```bash
GET /api/users/:walletAddress
```

#### Create/Update User

```bash
POST /api/users
Content-Type: application/json

{
  "walletAddress": "addr1...",
  "name": "John Doe",
  "bio": "Cardano developer"
}
```

## Database Schema

### User

- `id`: String (CUID)
- `walletAddress`: String (Unique, Indexed)
- `name`: String (Optional)
- `bio`: String (Optional)
- `avatarUrl`: String (Optional)
- `role`: Enum (ADMIN, EDITOR, WRITER)
- Articles, Comments, Likes: Relations

### Article

- `id`: String (CUID)
- `title`: String
- `slug`: String (Unique)
- `description`: String
- `content`: String (Markdown)
- `category`: String
- `status`: Enum (DRAFT, REVIEW, PUBLISHED)
- `featured`: Boolean
- `publishedAt`: DateTime
- Tags, Comments, Likes: Relations

### Tag

- `id`: String (CUID)
- `name`: String (Unique)
- `slug`: String (Unique)

## Testing the API

Run the test script:

```bash
./test-api.sh
```

Or test manually with curl:

```bash
# Get all published articles
curl http://localhost:5000/api/articles | jq

# Get specific article
curl http://localhost:5000/api/articles/getting-started-cardano-development | jq

# Get user's articles (including drafts)
curl http://localhost:5000/api/articles/wallet/addr1q9pyac4s5jxhhhfr4uqft4pcf830zj0kge24d52rrlljmc5mquh7wnm244uznlqx7xck0ppkyecsftexwxkv33cay4vsqd2jsh | jq
```

## Prisma Studio

View and edit data in the browser:

```bash
pnpm prisma studio
```

Opens at http://localhost:5555

## Common Commands

```bash
# Generate Prisma Client
pnpm prisma generate

# Create new migration
pnpm prisma migrate dev --name migration_name

# Reset database (WARNING: Deletes all data)
pnpm prisma migrate reset

# Run seed script manually
pnpm prisma db seed

# Format Prisma schema
pnpm prisma format

# View database in browser
pnpm prisma studio
```

## Troubleshooting

### Connection Error

- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in .env
- Ensure database exists: `psql -U postgres -l`

### Migration Errors

- Reset database: `pnpm prisma migrate reset`
- Check schema.prisma for errors
- Ensure no manual database changes

### Seed Errors

- Check if user already exists
- Verify tags are created
- Look at terminal output for specific errors

## Production Deployment

1. Set production DATABASE_URL
2. Run migrations: `pnpm prisma migrate deploy`
3. Build: `pnpm build`
4. Start: `pnpm start`

## Environment Variables

| Variable     | Required | Description                          |
| ------------ | -------- | ------------------------------------ |
| DATABASE_URL | Yes      | PostgreSQL connection string         |
| PORT         | No       | Server port (default: 5000)          |
| NODE_ENV     | No       | Environment (development/production) |
| JWT_SECRET   | Yes      | Secret for JWT tokens                |

## Security Notes

- Never commit `.env` files
- Use strong JWT_SECRET in production
- Enable SSL for database connections in production
- Implement rate limiting for public endpoints
- Add authentication middleware for protected routes

## Next Steps

1. Start frontend: `cd ../frontend && pnpm dev`
2. Open http://localhost:3000
3. Connect wallet to test profile page
4. View articles at http://localhost:3000/articles

For more details, see [BACKEND_INTEGRATION.md](../BACKEND_INTEGRATION.md)
