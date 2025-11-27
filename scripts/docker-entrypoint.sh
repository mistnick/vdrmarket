#!/bin/sh
set -e

echo "🚀 Starting application..."

# Wait for database to be ready
echo "⏳ Waiting for database..."
timeout=30
while [ $timeout -gt 0 ]; do
  if node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); pool.query('SELECT 1').then(() => { console.log('Database ready!'); process.exit(0); }).catch(() => process.exit(1));" 2>/dev/null; then
    break
  fi
  timeout=$((timeout - 1))
  sleep 1
done

if [ $timeout -eq 0 ]; then
  echo "❌ Database connection timeout"
  exit 1
fi

# Run migrations
echo "🔄 Running database migrations..."
cd /app
node -e "
const { execSync } = require('child_process');
try {
  // Use direct path to prisma binary in node_modules
  execSync('node ./node_modules/prisma/build/index.js migrate deploy', { stdio: 'inherit', env: process.env });
  console.log('✅ Migrations completed');
} catch (err) {
  console.log('⚠️  Migration warning:', err.message);
}
"

# Start the application
echo "✅ Starting Next.js server..."
exec node server.js
