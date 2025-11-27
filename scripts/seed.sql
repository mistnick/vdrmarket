-- DataRoom Database Seed Script
-- Run with: docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d dataroom -f /tmp/seed.sql

-- Insert admin user
-- Password: Admin123! (bcrypt hash)
INSERT INTO users (id, email, name, password, "createdAt", "updatedAt")
VALUES (
    'admin-user-id-001',
    'admin@dataroom.com',
    'Admin User',
    '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqMDRZLpSq/QQcPq0LFPsRnQhS.S6',
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET 
    password = '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqMDRZLpSq/QQcPq0LFPsRnQhS.S6',
    "updatedAt" = NOW();

-- Create admin team
INSERT INTO teams (id, name, slug, plan, "createdAt", "updatedAt")
VALUES (
    'admin-team-id-001',
    'Admin Team',
    'admin-team',
    'enterprise',
    NOW(),
    NOW()
) ON CONFLICT (slug) DO NOTHING;

-- Link admin to team
INSERT INTO team_members (id, "teamId", "userId", role, "createdAt", "updatedAt")
VALUES (
    'admin-member-id-001',
    'admin-team-id-001',
    'admin-user-id-001',
    'owner',
    NOW(),
    NOW()
) ON CONFLICT ("teamId", "userId") DO NOTHING;

-- Verify the data
SELECT 'Admin User:' as info, email, name FROM users WHERE email = 'admin@dataroom.com';
SELECT 'Admin Team:' as info, name, slug, plan FROM teams WHERE slug = 'admin-team';
SELECT 'Team Member:' as info, role FROM team_members WHERE "userId" = 'admin-user-id-001';
