#!/bin/sh
set -e

echo "🚀 Starting DataRoom VDR Application..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
until npx prisma db execute --stdin < /dev/null > /dev/null 2>&1 || npx prisma migrate status > /dev/null 2>&1; do
  echo "   Database is unavailable - sleeping"
  sleep 2
done

echo "✅ Database is ready!"

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy || {
  echo "⚠️  Migration failed or already up to date"
}

# Generate Prisma client (in case it's not available)
echo "🔧 Generating Prisma client..."
npx prisma generate

# Seed database (creates super admin and test users)
echo "🌱 Seeding database..."
npm run db:seed || {
  echo "ℹ️  Database already seeded or seed failed"
}

echo "✅ Database initialization complete!"
echo "🎉 Starting Next.js server..."

# Start the Next.js server
exec "$@"
