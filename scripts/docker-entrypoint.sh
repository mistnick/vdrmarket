#!/bin/sh
set -e

echo "🚀 Starting DataRoom application..."

# Wait for database to be ready
echo "⏳ Waiting for database..."
timeout=30
while [ $timeout -gt 0 ]; do
  if node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); pool.query('SELECT 1').then(() => { console.log('✅ Database ready!'); process.exit(0); }).catch(() => process.exit(1));" 2>/dev/null; then
    break
  fi
  timeout=$((timeout - 1))
  sleep 1
done

if [ $timeout -eq 0 ]; then
  echo "❌ Database connection timeout"
  exit 1
fi

# NOTE: Migrations should be run from the host, not inside the container
# Run on host: npx prisma migrate deploy --schema=./prisma/schema.prisma
echo "ℹ️  Skipping migrations (run from host if needed)"

# Start the application
echo "✅ Starting Next.js server..."
exec node server.js
