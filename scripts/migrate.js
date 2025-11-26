#!/usr/bin/env node
/**
 * Run Prisma migrations in production
 */

const { execSync } = require('child_process');

console.log('🔄 Running Prisma migrations...');

try {
  // Run migrations
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@postgres:5432/dataroom?schema=public'
    }
  });
  
  console.log('✅ Migrations completed successfully');
  process.exit(0);
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}
