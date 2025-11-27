#!/bin/bash
#
# DataRoom Production Deployment Script
# This script sets up and deploys the DataRoom application on a production server
#
# Usage: ./deploy-production.sh
#
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Configuration
APP_DIR="/opt/dataroom"
REPO_URL="https://github.com/mistnick/vdrmarket.git"
BRANCH="main"

echo ""
echo "=============================================="
echo "    DataRoom Production Deployment Script"
echo "=============================================="
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   log_error "This script must be run as root"
   exit 1
fi

# Step 1: Update system
log_info "Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq
log_success "System updated"

# Step 2: Install Docker if not present
if ! command -v docker &> /dev/null; then
    log_info "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    log_success "Docker installed"
else
    log_info "Docker already installed"
fi

# Step 3: Install Docker Compose plugin if not present
if ! docker compose version &> /dev/null; then
    log_info "Installing Docker Compose plugin..."
    apt-get install -y -qq docker-compose-plugin
    log_success "Docker Compose plugin installed"
else
    log_info "Docker Compose already installed"
fi

# Step 4: Install Git if not present
if ! command -v git &> /dev/null; then
    log_info "Installing Git..."
    apt-get install -y -qq git
    log_success "Git installed"
else
    log_info "Git already installed"
fi

# Step 5: Create app directory
log_info "Setting up application directory..."
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# Step 6: Clone or update repository
if [ -d "$APP_DIR/.git" ]; then
    log_info "Updating existing repository..."
    git fetch origin
    git reset --hard origin/$BRANCH
elif [ "$(ls -A $APP_DIR 2>/dev/null)" ]; then
    log_info "Directory not empty, cleaning and cloning..."
    # Backup .env if exists
    [ -f "$APP_DIR/.env" ] && cp "$APP_DIR/.env" /tmp/dataroom-env-backup
    rm -rf "$APP_DIR"/*
    rm -rf "$APP_DIR"/.[!.]* 2>/dev/null || true
    git clone -b $BRANCH $REPO_URL .
    # Restore .env if existed
    [ -f /tmp/dataroom-env-backup ] && mv /tmp/dataroom-env-backup "$APP_DIR/.env"
else
    log_info "Cloning repository..."
    git clone -b $BRANCH $REPO_URL .
fi
log_success "Repository ready"

# Step 7: Create .env file if not exists
if [ ! -f "$APP_DIR/.env" ]; then
    log_info "Creating .env file..."
    
    # Generate secrets
    AUTH_SECRET=$(openssl rand -base64 32)
    POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
    REDIS_PASSWORD=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
    
    cat > "$APP_DIR/.env" << EOF
# DataRoom Production Configuration
# Generated on $(date)

# ============================================
# REQUIRED: Update these values
# ============================================

# Application URL (change to your domain)
NEXTAUTH_URL=http://$(curl -s ifconfig.me):3000

# ============================================
# Authentication Secrets (auto-generated)
# ============================================
AUTH_SECRET=${AUTH_SECRET}
NEXTAUTH_SECRET=${AUTH_SECRET}

# ============================================
# Database Configuration (auto-generated)
# ============================================
POSTGRES_USER=postgres
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=dataroom

# ============================================
# Redis Configuration (auto-generated)
# ============================================
REDIS_PASSWORD=${REDIS_PASSWORD}

# ============================================
# Storage Configuration (Aruba Cloud Object Storage)
# ============================================
AWS_REGION=r1-it
AWS_ACCESS_KEY_ID=simplevdr-obj
AWS_SECRET_ACCESS_KEY=-ihh@jf.WnsAY_
AWS_S3_BUCKET=dataroom
AWS_ENDPOINT=http://r1-it.storage.cloud.it

# ============================================
# Optional: Monitoring
# ============================================
SENTRY_DSN=
EOF

    chmod 600 "$APP_DIR/.env"
    log_success ".env file created"
    log_warning "Please review and update NEXTAUTH_URL in .env if needed"
else
    log_info ".env file already exists, skipping creation"
fi

# Step 8: Build and start containers
log_info "Building Docker images..."
docker compose -f docker-compose.prod.yml build --no-cache

log_info "Starting containers..."
docker compose -f docker-compose.prod.yml up -d

# Step 9: Wait for services to be healthy
log_info "Waiting for services to be healthy..."
sleep 10

MAX_ATTEMPTS=30
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if docker compose -f docker-compose.prod.yml ps | grep -q "healthy"; then
        HEALTHY_COUNT=$(docker compose -f docker-compose.prod.yml ps | grep -c "healthy" || true)
        if [ "$HEALTHY_COUNT" -ge 2 ]; then
            break
        fi
    fi
    ATTEMPT=$((ATTEMPT + 1))
    echo -n "."
    sleep 5
done
echo ""

# Step 10: Run database migrations
log_info "Running database migrations..."

cd "$APP_DIR"
source "$APP_DIR/.env"

# Wait for postgres to be ready
log_info "Waiting for PostgreSQL..."
sleep 10

# Run migrations using psql directly with the SQL from Prisma migrations
log_info "Applying database schema..."

# Check if tables exist
TABLE_COUNT=$(docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d dataroom -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name != '_prisma_migrations';" 2>/dev/null | tr -d ' ' || echo "0")

if [ "$TABLE_COUNT" = "0" ] || [ -z "$TABLE_COUNT" ]; then
    log_info "Database is empty, applying initial schema..."
    
    # Apply each migration SQL file
    for migration_dir in "$APP_DIR"/prisma/migrations/*/; do
        if [ -f "${migration_dir}migration.sql" ]; then
            migration_name=$(basename "$migration_dir")
            log_info "Applying migration: $migration_name"
            docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d dataroom -f - < "${migration_dir}migration.sql" 2>/dev/null || true
            
            # Record migration in _prisma_migrations table
            docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d dataroom -c "
                INSERT INTO _prisma_migrations (id, checksum, migration_name, applied_steps_count, finished_at)
                VALUES ('$(uuidgen || cat /proc/sys/kernel/random/uuid 2>/dev/null || echo $RANDOM)', 'manual', '$migration_name', 1, NOW())
                ON CONFLICT DO NOTHING;
            " 2>/dev/null || true
        fi
    done
    
    log_success "Schema applied successfully"
else
    log_info "Database already has $TABLE_COUNT tables, skipping schema creation"
fi

# Seed the database if needed
if [ ! -f "$APP_DIR/.seeded" ]; then
    log_info "Seeding database with test users..."
    
    # Create test users directly via SQL
    docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d dataroom << 'SEED_SQL'
    -- Create admin user if not exists
    INSERT INTO users (id, email, name, password, email_verified, created_at, updated_at)
    VALUES (
        'admin-user-id-001',
        'admin@dataroom.com',
        'Admin User',
        '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u',
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (email) DO NOTHING;
    
    -- Create admin team if not exists
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
    ) ON CONFLICT DO NOTHING;
SEED_SQL
    
    touch "$APP_DIR/.seeded"
    log_success "Database seeded (admin@dataroom.com / Admin123!)"
fi

log_success "Database setup completed"

# Step 11: Show status
echo ""
echo "=============================================="
log_success "Deployment completed!"
echo "=============================================="
echo ""
docker compose -f docker-compose.prod.yml ps
echo ""

# Get server IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

echo ""
log_info "Application URLs:"
echo "  - Web App:    http://${SERVER_IP}:3000"
echo ""
log_info "Useful commands:"
echo "  - View logs:    docker compose -f docker-compose.prod.yml logs -f"
echo "  - Restart:      docker compose -f docker-compose.prod.yml restart"
echo "  - Stop:         docker compose -f docker-compose.prod.yml down"
echo "  - Update:       git pull && docker compose -f docker-compose.prod.yml up -d --build"
echo ""
log_warning "Remember to:"
echo "  1. Configure a reverse proxy (nginx) with SSL for production"
echo "  2. Update NEXTAUTH_URL in .env with your domain"
echo "  3. Set up firewall rules (ufw)"
echo "  4. Configure automatic backups for PostgreSQL"
echo ""
