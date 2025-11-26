# Database Setup

## Initial Setup

After starting the Docker containers for the first time, you need to run database migrations and seed data.

### 1. Run Migrations

```bash
# From host machine (requires node_modules installed)
npm install --legacy-peer-deps
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/dataroom?schema=public" npx prisma migrate deploy

# Or using Make
make db-migrate
```

### 2. Seed Database

```bash
# Seed test users
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/dataroom?schema=public" npx tsx prisma/seed.ts

# Seed permissions
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/dataroom?schema=public" npx tsx prisma/seed-permissions.ts
```

## Test Users

After seeding, the following test accounts are available:

| Email | Password | Role | Plan |
|-------|----------|------|------|
| admin@dataroom.com | Admin123! | owner | enterprise |
| manager@dataroom.com | Manager123! | admin | professional |
| user@dataroom.com | User123! | member | free |
| viewer@dataroom.com | Viewer123! | viewer | free |

## Troubleshooting

### "The table public.users does not exist"

This means migrations haven't been run. Execute:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/dataroom?schema=public" npx prisma migrate deploy
```

### Clean Database Reset

```bash
# Stop containers and remove volumes
docker-compose down -v

# Remove postgres data
rm -rf volumes/postgres/*

# Start containers
docker-compose up -d

# Wait for postgres to be healthy, then run migrations
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/dataroom?schema=public" npx prisma migrate deploy

# Seed data
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/dataroom?schema=public" npx tsx prisma/seed.ts
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/dataroom?schema=public" npx tsx prisma/seed-permissions.ts
```

## Production Deployment

For production, run migrations before starting the application:

```bash
# In your CI/CD or deployment script
npx prisma migrate deploy
npm run start
```
