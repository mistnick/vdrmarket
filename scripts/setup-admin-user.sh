#!/bin/bash
#
# Setup Admin User Script
# Creates or updates the admin user in the database
#

set -e

cd /opt/dataroom

echo "=== DataRoom Admin User Setup ==="
echo ""

# Check table structure
echo "[INFO] Checking users table structure..."
docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d dataroom -c "\d users"

echo ""
echo "[INFO] Creating/updating admin user..."

# Create admin user with correct column names
docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d dataroom << 'SQLEOF'
-- First, check what columns exist
SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;

-- Insert or update admin user
-- Password hash for: Admin123!
INSERT INTO users (id, email, name, password, created_at, updated_at)
VALUES (
    'admin-user-id-001',
    'admin@dataroom.com',
    'Admin User',
    '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqMDRZLpSq/QQcPq0LFPsRnQhS.S6',
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET 
    password = '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqMDRZLpSq/QQcPq0LFPsRnQhS.S6',
    updated_at = NOW();

-- Create team for admin if not exists
INSERT INTO teams (id, name, slug, plan, created_at, updated_at)
VALUES (
    'admin-team-id-001',
    'Admin Team',
    'admin-team',
    'enterprise',
    NOW(),
    NOW()
) ON CONFLICT (slug) DO NOTHING;

-- Link admin to team
INSERT INTO team_members (id, team_id, user_id, role, created_at, updated_at)
VALUES (
    'admin-member-id-001',
    'admin-team-id-001',
    'admin-user-id-001',
    'owner',
    NOW(),
    NOW()
) ON CONFLICT (team_id, user_id) DO NOTHING;

-- Verify
SELECT 'User created:' as status, email, name FROM users WHERE email='admin@dataroom.com';
SELECT 'Team created:' as status, name, slug FROM teams WHERE slug='admin-team';
SQLEOF

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Login credentials:"
echo "  Email:    admin@dataroom.com"
echo "  Password: Admin123!"
echo ""
