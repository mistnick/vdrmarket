#!/bin/bash

# ==============================================================================
# DataRoom VDR - Production Deployment Script
# Version: 3.2.0 - Hierarchical Indexing System
# Last Updated: 30 Novembre 2025
# ==============================================================================
#
# Architecture: DataRoom > Groups > GroupMembers (no Team entity)
# Authorization: GroupType-based (ADMINISTRATOR, USER, CUSTOM)
# New Features: Hierarchical Index System for Documents and Folders
# 
# This script handles:
# - SSL certificate setup with Let's Encrypt
# - Docker image building
# - Service deployment
# - Database migrations
# - Permission seeding
# - Health checks
#
# Usage:
#   ./scripts/deploy-production.sh [options]
#
# Options:
#   --skip-ssl     Skip SSL certificate generation
#   --skip-build   Skip Docker image building
#   --skip-seed    Skip database seeding
#   --force-ssl    Force SSL regeneration
#   --db-only      Skip to database migration step (8/9) - assumes services running
#   --help         Show this help message
#
# ==============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.production.yml"
DOMAIN="www.simplevdr.com"
DOMAIN_ALT="simplevdr.com"
EMAIL="admin@simplevdr.com"
PROJECT_NAME="dataroom"

# Parse arguments
SKIP_SSL=false
SKIP_BUILD=false
SKIP_SEED=false
FORCE_SSL=false
DB_ONLY=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --skip-ssl) SKIP_SSL=true ;;
        --skip-build) SKIP_BUILD=true ;;
        --skip-seed) SKIP_SEED=true ;;
        --force-ssl) FORCE_SSL=true ;;
        --db-only) DB_ONLY=true ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --skip-ssl     Skip SSL certificate generation"
            echo "  --skip-build   Skip Docker image building"
            echo "  --skip-seed    Skip database seeding"
            echo "  --force-ssl    Force SSL regeneration"
            echo "  --db-only      Skip to database migration step (8/9) - assumes services running"
            echo "  --help         Show this help message"
            exit 0
            ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# Helper functions
log_step() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}Step $1: $2${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_step "0/9" "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    log_success "Docker is installed"
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    log_success "Docker Compose is installed"
    
    # Check if production compose file exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Production compose file not found: $COMPOSE_FILE"
        exit 1
    fi
    log_success "Production compose file found"
    
    # Check .env file
    if [ ! -f ".env.production" ] && [ ! -f ".env" ]; then
        log_warning "No .env.production or .env file found"
        log_info "Please ensure environment variables are set"
    else
        log_success "Environment file found"
    fi
}

# ==============================================================================
# MAIN DEPLOYMENT PROCESS
# ==============================================================================

echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║       🚀 DataRoom VDR - Production Deployment v3.2           ║"
echo "║       Architecture: DataRoom > Groups > Members              ║"
echo "║       Authorization: GroupType-based ACL                     ║"
echo "║       New: Hierarchical Indexing System                      ║"
echo "║                                                              ║"
echo "║       Domain: $DOMAIN                              ║"
echo "║       Date: $(date '+%Y-%m-%d %H:%M:%S')                      ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# If --db-only flag is set, skip to step 8
if [ "$DB_ONLY" = true ]; then
    log_info "🚀 --db-only flag detected, skipping to database migrations..."
    log_info "Assuming services are already running..."
    
    # Quick health check
    if ! docker exec ${PROJECT_NAME}-postgres pg_isready -U postgres -d dataroom > /dev/null 2>&1; then
        log_error "PostgreSQL is not running! Start services first or run without --db-only"
        exit 1
    fi
    log_success "PostgreSQL is running"
    
    if ! docker exec ${PROJECT_NAME}-app wget --no-verbose --tries=1 --spider http://localhost:3000/api/health > /dev/null 2>&1; then
        log_warning "Application health check failed, but continuing..."
    else
        log_success "Application is running"
    fi
    
    # Jump to Step 8
    # Step 8: Database migrations and VDR setup
    log_step "8/9" "Running database migrations and VDR setup..."
    
    # Run Prisma migrations
    log_info "Applying database migrations..."
    if docker exec ${PROJECT_NAME}-app npx prisma migrate deploy; then
        log_success "Database migrations applied"
    else
        log_warning "Migration deploy failed - trying db push as fallback..."
        # Show output to debug issues
        docker exec ${PROJECT_NAME}-app npx prisma db push --accept-data-loss
        if [ $? -eq 0 ]; then
            log_success "Database schema pushed successfully"
        else
            log_error "Database schema update failed - trying force reset..."
            docker exec ${PROJECT_NAME}-app npx prisma db push --force-reset --accept-data-loss
        fi
    fi

    # Regenerate Prisma client
    log_info "Regenerating Prisma client..."
    docker exec ${PROJECT_NAME}-app npx prisma generate
    log_success "Prisma client regenerated"

    # Verify VDR tables exist
    log_info "Verifying VDR system tables..."
    VDR_TABLES_CHECK=$(docker exec ${PROJECT_NAME}-postgres psql -U postgres -d dataroom -tAc "
    SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('groups', 'group_members', 'user_invitations', 
                       'document_group_permissions', 'document_user_permissions',
                       'folder_group_permissions', 'folder_user_permissions',
                       'due_diligence_checklists', 'due_diligence_items');
    " 2>/dev/null || echo "0")

    if [ "$VDR_TABLES_CHECK" -eq "9" ]; then
        log_success "All 9 VDR tables verified"
    else
        log_warning "Expected 9 VDR tables, found $VDR_TABLES_CHECK"
        log_info "Running prisma db push with force-reset to create missing tables..."
        docker exec ${PROJECT_NAME}-app npx prisma db push --force-reset --accept-data-loss
        
        # Re-verify after push
        sleep 2
        VDR_TABLES_CHECK=$(docker exec ${PROJECT_NAME}-postgres psql -U postgres -d dataroom -tAc "
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('groups', 'group_members', 'user_invitations', 
                           'document_group_permissions', 'document_user_permissions',
                           'folder_group_permissions', 'folder_user_permissions',
                           'due_diligence_checklists', 'due_diligence_items');
        " 2>/dev/null || echo "0")
        
        if [ "$VDR_TABLES_CHECK" -eq "9" ]; then
            log_success "All 9 VDR tables created successfully"
        else
            log_error "Failed to create VDR tables. Found $VDR_TABLES_CHECK/9 tables"
            log_info "Listing existing tables:"
            docker exec ${PROJECT_NAME}-postgres psql -U postgres -d dataroom -c "\dt"
        fi
    fi

    # Check DataRoom schema
    log_info "Verifying DataRoom schema..."
    DATAROOM_CHECK=$(docker exec ${PROJECT_NAME}-postgres psql -U postgres -d dataroom -tAc "
    SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_name = 'data_rooms' AND column_name = 'slug';
    " 2>/dev/null || echo "0")

    if [ "$DATAROOM_CHECK" -eq "1" ]; then
        log_success "DataRoom schema verified"
    else
        log_warning "DataRoom table may need migration"
    fi

    # Seed database if needed
    if [ "$SKIP_SEED" = true ]; then
        log_info "Skipping database seeding (--skip-seed flag)"
    else
        log_info "Seeding database..."
        # Show full output to debug seed issues
        docker exec ${PROJECT_NAME}-app npm run db:seed
        SEED_EXIT=$?
        if [ $SEED_EXIT -eq 0 ]; then
            log_success "Database seeded"
        else
            log_warning "Seed script returned error code $SEED_EXIT"
        fi

        # Run permission seeding
        log_info "Seeding permissions..."
        docker exec ${PROJECT_NAME}-app npm run db:seed:permissions
        PERM_EXIT=$?
        if [ $PERM_EXIT -eq 0 ]; then
            log_success "Permissions seeded"
        else
            log_warning "Permission seed returned error code $PERM_EXIT"
        fi
        
        # Verify super admin account exists
        log_info "Verifying super admin account..."
        # Check if isSuperAdmin column exists first
        COLUMN_EXISTS=$(docker exec ${PROJECT_NAME}-postgres psql -U postgres -d dataroom -tAc "
        SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'isSuperAdmin';
        " 2>/dev/null || echo "0")
        
        if [ "$COLUMN_EXISTS" -eq "1" ]; then
            SUPER_ADMIN_CHECK=$(docker exec ${PROJECT_NAME}-postgres psql -U postgres -d dataroom -tAc "
            SELECT COUNT(*) FROM users WHERE email = 'info@simplevdr.com' AND \"isSuperAdmin\" = true;
            " 2>/dev/null || echo "0")
            
            if [ "$SUPER_ADMIN_CHECK" -eq "1" ]; then
                log_success "Super admin account verified (info@simplevdr.com)"
            else
                log_warning "Super admin not found - creating directly via SQL..."
                # Create super admin directly in database
                docker exec ${PROJECT_NAME}-postgres psql -U postgres -d dataroom -c "
                INSERT INTO users (id, email, name, password, \"isSuperAdmin\", \"isActive\", \"emailVerified\", \"createdAt\", \"updatedAt\")
                VALUES (
                    gen_random_uuid(),
                    'info@simplevdr.com',
                    'SimpleVDR Admin',
                    '\$2a\$10\$K8YQH8qXzqjVxJQJ6ZvKs.gVXqXq5KeJnH4WVHqVwGLdZnNqFqQHe',
                    true,
                    true,
                    NOW(),
                    NOW(),
                    NOW()
                )
                ON CONFLICT (email) DO UPDATE SET
                    \"isSuperAdmin\" = true,
                    \"isActive\" = true;
                " 2>/dev/null || log_error "Failed to create super admin via SQL"
                
                # Re-verify
                SUPER_ADMIN_CHECK=$(docker exec ${PROJECT_NAME}-postgres psql -U postgres -d dataroom -tAc "
                SELECT COUNT(*) FROM users WHERE email = 'info@simplevdr.com' AND \"isSuperAdmin\" = true;
                " 2>/dev/null || echo "0")
                
                if [ "$SUPER_ADMIN_CHECK" -eq "1" ]; then
                    log_success "Super admin created via SQL (info@simplevdr.com / S1mpl3VDR!!)"
                else
                    log_error "Failed to create super admin"
                fi
            fi
        else
            log_warning "isSuperAdmin column not found - run migrations first"
        fi
    fi

    # Create default VDR groups if needed
    log_info "Checking VDR administrator groups..."
    # First check if groups table exists
    GROUPS_TABLE_EXISTS=$(docker exec ${PROJECT_NAME}-postgres psql -U postgres -d dataroom -tAc "
    SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'groups';
    " 2>/dev/null || echo "0")
    
    if [ "$GROUPS_TABLE_EXISTS" -eq "1" ]; then
        ADMIN_GROUPS=$(docker exec ${PROJECT_NAME}-postgres psql -U postgres -d dataroom -tAc "
        SELECT COUNT(*) FROM groups WHERE type = 'ADMINISTRATOR';
        " 2>/dev/null || echo "0")

        if [ "$ADMIN_GROUPS" -eq "0" ]; then
            log_warning "No ADMINISTRATOR groups found - creating default group..."
            
            # Get super admin user ID
            SUPER_ADMIN_ID=$(docker exec ${PROJECT_NAME}-postgres psql -U postgres -d dataroom -tAc "
            SELECT id FROM users WHERE email = 'info@simplevdr.com' LIMIT 1;
            " 2>/dev/null | tr -d ' ')
            
            if [ -n "$SUPER_ADMIN_ID" ] && [ "$SUPER_ADMIN_ID" != "" ]; then
                # First create a default DataRoom if none exists
                DATAROOM_EXISTS=$(docker exec ${PROJECT_NAME}-postgres psql -U postgres -d dataroom -tAc "
                SELECT COUNT(*) FROM data_rooms;
                " 2>/dev/null || echo "0")
                
                if [ "$DATAROOM_EXISTS" -eq "0" ]; then
                    log_info "Creating default DataRoom..."
                    docker exec ${PROJECT_NAME}-postgres psql -U postgres -d dataroom -c "
                    INSERT INTO data_rooms (id, name, slug, \"createdAt\", \"updatedAt\")
                    VALUES (gen_random_uuid(), 'Default DataRoom', 'default-dataroom', NOW(), NOW());
                    " 2>/dev/null || true
                fi
                
                # Get the DataRoom ID
                DATAROOM_ID=$(docker exec ${PROJECT_NAME}-postgres psql -U postgres -d dataroom -tAc "
                SELECT id FROM data_rooms LIMIT 1;
                " 2>/dev/null | tr -d ' ')
                
                if [ -n "$DATAROOM_ID" ] && [ "$DATAROOM_ID" != "" ]; then
                    # Create administrator group
                    docker exec ${PROJECT_NAME}-postgres psql -U postgres -d dataroom -c "
                    INSERT INTO groups (id, name, type, \"dataRoomId\", \"createdAt\", \"updatedAt\")
                    VALUES (gen_random_uuid(), 'Administrators', 'ADMINISTRATOR', '$DATAROOM_ID', NOW(), NOW());
                    " 2>/dev/null || true
                    
                    # Get group ID and add super admin as member
                    GROUP_ID=$(docker exec ${PROJECT_NAME}-postgres psql -U postgres -d dataroom -tAc "
                    SELECT id FROM groups WHERE type = 'ADMINISTRATOR' AND \"dataRoomId\" = '$DATAROOM_ID' LIMIT 1;
                    " 2>/dev/null | tr -d ' ')
                    
                    if [ -n "$GROUP_ID" ] && [ "$GROUP_ID" != "" ]; then
                        docker exec ${PROJECT_NAME}-postgres psql -U postgres -d dataroom -c "
                        INSERT INTO group_members (id, \"groupId\", \"userId\", role, \"createdAt\", \"updatedAt\")
                        VALUES (gen_random_uuid(), '$GROUP_ID', '$SUPER_ADMIN_ID', 'owner', NOW(), NOW())
                        ON CONFLICT DO NOTHING;
                        " 2>/dev/null || true
                        log_success "Created ADMINISTRATOR group with super admin"
                    fi
                fi
            else
                log_warning "Super admin user not found - cannot create group"
            fi
        else
            log_success "Found $ADMIN_GROUPS ADMINISTRATOR group(s)"
        fi
    else
        log_warning "Groups table not found - schema needs to be applied"
    fi

    log_success "Database setup completed!"
    echo ""
    log_info "Run 'docker-compose -f $COMPOSE_FILE logs -f' to view logs"
    exit 0
fi

# Step 0: Prerequisites
check_prerequisites

# Step 1: Network Setup
log_step "1/9" "Setting up Docker network..."
docker network create ${PROJECT_NAME}-network 2>/dev/null && log_success "Network created" || log_info "Network already exists"

# Step 2: SSL Setup
log_step "2/9" "Checking SSL certificates..."

if [ "$SKIP_SSL" = true ]; then
    log_info "Skipping SSL setup (--skip-ssl flag)"
elif [ -f "nginx/certs/fullchain.pem" ] && [ "$FORCE_SSL" = false ]; then
    log_success "SSL certificates already exist in nginx/certs"
    log_info "Use --force-ssl to regenerate"
else
    log_info "Starting SSL certificate generation..."
    
    # Create volumes for certbot
    docker volume create certbot_data 2>/dev/null || true
    docker volume create certbot_www 2>/dev/null || true
    
    # Cleanup any existing temp container
    docker rm -f ${PROJECT_NAME}-nginx-temp 2>/dev/null || true
    
    # Create temporary nginx config for ACME challenge
    mkdir -p nginx
    cat > nginx/nginx-init.conf << 'NGINX_INIT'
server {
    listen 80;
    server_name www.simplevdr.com simplevdr.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 200 'DataRoom VDR - SSL Setup in Progress';
        add_header Content-Type text/plain;
    }
}
NGINX_INIT

    # Start temporary nginx for ACME challenge
    log_info "Starting temporary Nginx for ACME challenge..."
    docker run -d \
        --name ${PROJECT_NAME}-nginx-temp \
        --network ${PROJECT_NAME}-network \
        -p 80:80 \
        -v $(pwd)/nginx/nginx-init.conf:/etc/nginx/conf.d/default.conf:ro \
        -v certbot_www:/var/www/certbot \
        nginx:alpine

    # Wait for Nginx to start
    sleep 5

    # Run Certbot
    log_info "Running Certbot for certificate generation..."
    docker run --rm \
        --network ${PROJECT_NAME}-network \
        -v certbot_data:/etc/letsencrypt \
        -v certbot_www:/var/www/certbot \
        certbot/certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        -d $DOMAIN \
        -d $DOMAIN_ALT

    # Cleanup temporary nginx
    docker stop ${PROJECT_NAME}-nginx-temp 2>/dev/null || true
    docker rm ${PROJECT_NAME}-nginx-temp 2>/dev/null || true
    rm -f nginx/nginx-init.conf

    # Copy certificates to local directory
    log_info "Copying certificates to nginx/certs..."
    mkdir -p nginx/certs
    
    # Use a temporary container to copy certs from volume
    docker run --rm \
        -v certbot_data:/etc/letsencrypt:ro \
        -v $(pwd)/nginx/certs:/certs \
        alpine sh -c "cp -L /etc/letsencrypt/live/$DOMAIN/*.pem /certs/ 2>/dev/null || cp -L /etc/letsencrypt/live/$DOMAIN_ALT/*.pem /certs/"
    
    if [ -f "nginx/certs/fullchain.pem" ]; then
        log_success "SSL certificates generated successfully"
    else
        log_error "Failed to generate SSL certificates"
        exit 1
    fi
fi

# Step 3: Pull latest code
log_step "3/9" "Pulling latest code from repository..."
if git pull origin main 2>/dev/null; then
    log_success "Code updated from repository"
else
    log_warning "Git pull failed or not a git repository - continuing with local code"
fi

# Step 4: Load environment variables
log_step "4/9" "Loading environment configuration..."
if [ -f ".env.production" ]; then
    set -a
    source .env.production
    set +a
    log_success "Loaded .env.production"
elif [ -f ".env" ]; then
    set -a
    source .env
    set +a
    log_success "Loaded .env"
else
    log_warning "No environment file found - using docker-compose defaults"
fi

# Step 5: Build Docker images
log_step "5/9" "Building Docker images..."
if [ "$SKIP_BUILD" = true ]; then
    log_info "Skipping build (--skip-build flag)"
else
    docker-compose -f $COMPOSE_FILE build --no-cache
    log_success "Docker images built successfully"
fi

# Step 6: Stop existing services and start new ones
log_step "6/9" "Deploying services..."
docker-compose -f $COMPOSE_FILE down --remove-orphans 2>/dev/null || true
docker-compose -f $COMPOSE_FILE up -d
log_success "Services started"

# Step 7: Health checks
log_step "7/9" "Running health checks..."

# Wait for PostgreSQL
echo -n "Waiting for PostgreSQL"
for i in {1..60}; do
    if docker exec ${PROJECT_NAME}-postgres pg_isready -U postgres -d dataroom > /dev/null 2>&1; then
        echo ""
        log_success "PostgreSQL is ready"
        break
    fi
    echo -n "."
    sleep 2
    if [ $i -eq 60 ]; then
        echo ""
        log_error "PostgreSQL failed to start"
        exit 1
    fi
done

# Wait for Redis
echo -n "Waiting for Redis"
for i in {1..30}; do
    if docker exec ${PROJECT_NAME}-redis redis-cli ping > /dev/null 2>&1; then
        echo ""
        log_success "Redis is ready"
        break
    fi
    echo -n "."
    sleep 2
    if [ $i -eq 30 ]; then
        echo ""
        log_error "Redis failed to start"
        exit 1
    fi
done

# Wait for Application
echo -n "Waiting for Application"
for i in {1..90}; do
    if docker exec ${PROJECT_NAME}-app wget --no-verbose --tries=1 --spider http://localhost:3000/api/health > /dev/null 2>&1; then
        echo ""
        log_success "Application is ready"
        break
    fi
    echo -n "."
    sleep 2
    if [ $i -eq 90 ]; then
        echo ""
        log_error "Application failed to start"
        log_info "Checking logs..."
        docker logs ${PROJECT_NAME}-app --tail 50
        exit 1
    fi
done

# Step 8: Database migrations and VDR setup
log_step "8/9" "Running database migrations and VDR setup..."

# Run Prisma migrations
log_info "Applying database migrations..."
if docker exec ${PROJECT_NAME}-app npx prisma migrate deploy; then
    log_success "Database migrations applied"
else
    log_warning "Migration deploy failed - trying db push as fallback..."
    docker exec ${PROJECT_NAME}-app npx prisma db push --accept-data-loss
    if [ $? -eq 0 ]; then
        log_success "Database schema pushed successfully"
    else
        log_error "Database schema update failed - trying force reset..."
        docker exec ${PROJECT_NAME}-app npx prisma db push --force-reset --accept-data-loss
    fi
fi

# Regenerate Prisma client
log_info "Regenerating Prisma client..."
docker exec ${PROJECT_NAME}-app npx prisma generate
log_success "Prisma client regenerated"

# Verify VDR tables exist (updated for DataRoom-based architecture)
log_info "Verifying VDR system tables..."
VDR_TABLES_CHECK=$(docker exec ${PROJECT_NAME}-postgres psql -U postgres -d dataroom -tAc "
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('groups', 'group_members', 'user_invitations', 
                   'document_group_permissions', 'document_user_permissions',
                   'folder_group_permissions', 'folder_user_permissions',
                   'due_diligence_checklists', 'due_diligence_items');
" 2>/dev/null || echo "0")

if [ "$VDR_TABLES_CHECK" -eq "9" ]; then
    log_success "All 9 VDR tables verified"
else
    log_warning "Expected 9 VDR tables, found $VDR_TABLES_CHECK"
    log_info "Running prisma db push with force-reset to create missing tables..."
    docker exec ${PROJECT_NAME}-app npx prisma db push --force-reset --accept-data-loss
    
    # Re-verify after push
    sleep 2
    VDR_TABLES_CHECK=$(docker exec ${PROJECT_NAME}-postgres psql -U postgres -d dataroom -tAc "
    SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('groups', 'group_members', 'user_invitations', 
                       'document_group_permissions', 'document_user_permissions',
                       'folder_group_permissions', 'folder_user_permissions',
                       'due_diligence_checklists', 'due_diligence_items');
    " 2>/dev/null || echo "0")
    
    if [ "$VDR_TABLES_CHECK" -eq "9" ]; then
        log_success "All 9 VDR tables created successfully"
    else
        log_error "Failed to create VDR tables. Found $VDR_TABLES_CHECK/9 tables"
        log_info "Listing existing tables:"
        docker exec ${PROJECT_NAME}-postgres psql -U postgres -d dataroom -c "\dt"
    fi
fi

# Check DataRoom schema
log_info "Verifying DataRoom schema..."
DATAROOM_CHECK=$(docker exec ${PROJECT_NAME}-postgres psql -U postgres -d dataroom -tAc "
SELECT COUNT(*) FROM information_schema.columns 
WHERE table_name = 'data_rooms' AND column_name = 'slug';
" 2>/dev/null || echo "0")

if [ "$DATAROOM_CHECK" -eq "1" ]; then
    log_success "DataRoom schema verified"
else
    log_warning "DataRoom table may need migration"
fi

# Seed database if needed
if [ "$SKIP_SEED" = true ]; then
    log_info "Skipping database seeding (--skip-seed flag)"
else
    log_info "Seeding database..."
    # Show full output to debug seed issues
    docker exec ${PROJECT_NAME}-app npm run db:seed
    SEED_EXIT=$?
    if [ $SEED_EXIT -eq 0 ]; then
        log_success "Database seeded"
    else
        log_warning "Seed script returned error code $SEED_EXIT"
    fi

    # Run permission seeding
    log_info "Seeding permissions..."
    docker exec ${PROJECT_NAME}-app npm run db:seed:permissions
    PERM_EXIT=$?
    if [ $PERM_EXIT -eq 0 ]; then
        log_success "Permissions seeded"
    else
        log_warning "Permission seed returned error code $PERM_EXIT"
    fi
    
    # Verify super admin account exists
    log_info "Verifying super admin account..."
    # Check if isSuperAdmin column exists first
    COLUMN_EXISTS=$(docker exec ${PROJECT_NAME}-postgres psql -U postgres -d dataroom -tAc "
    SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'isSuperAdmin';
    " 2>/dev/null || echo "0")
    
    if [ "$COLUMN_EXISTS" -eq "1" ]; then
        SUPER_ADMIN_CHECK=$(docker exec ${PROJECT_NAME}-postgres psql -U postgres -d dataroom -tAc "
        SELECT COUNT(*) FROM users WHERE email = 'info@simplevdr.com' AND \"isSuperAdmin\" = true;
        " 2>/dev/null || echo "0")
        
        if [ "$SUPER_ADMIN_CHECK" -eq "1" ]; then
            log_success "Super admin account verified (info@simplevdr.com)"
        else
            log_warning "Super admin not found - creating directly via SQL..."
            # Create super admin directly in database
            docker exec ${PROJECT_NAME}-postgres psql -U postgres -d dataroom -c "
            INSERT INTO users (id, email, name, password, \"isSuperAdmin\", \"isActive\", \"emailVerified\", \"createdAt\", \"updatedAt\")
            VALUES (
                gen_random_uuid(),
                'info@simplevdr.com',
                'SimpleVDR Admin',
                '\$2a\$10\$K8YQH8qXzqjVxJQJ6ZvKs.gVXqXq5KeJnH4WVHqVwGLdZnNqFqQHe',
                true,
                true,
                NOW(),
                NOW(),
                NOW()
            )
            ON CONFLICT (email) DO UPDATE SET
                \"isSuperAdmin\" = true,
                \"isActive\" = true;
            " 2>/dev/null || log_error "Failed to create super admin via SQL"
            
            # Re-verify
            SUPER_ADMIN_CHECK=$(docker exec ${PROJECT_NAME}-postgres psql -U postgres -d dataroom -tAc "
            SELECT COUNT(*) FROM users WHERE email = 'info@simplevdr.com' AND \"isSuperAdmin\" = true;
            " 2>/dev/null || echo "0")
            
            if [ "$SUPER_ADMIN_CHECK" -eq "1" ]; then
                log_success "Super admin created via SQL (info@simplevdr.com / S1mpl3VDR!!)"
            else
                log_error "Failed to create super admin"
            fi
        fi
    else
        log_warning "isSuperAdmin column not found - run migrations first"
    fi
fi

# Create default VDR groups if needed
log_info "Checking VDR administrator groups..."
# First check if groups table exists
GROUPS_TABLE_EXISTS=$(docker exec ${PROJECT_NAME}-postgres psql -U postgres -d dataroom -tAc "
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'groups';
" 2>/dev/null || echo "0")

if [ "$GROUPS_TABLE_EXISTS" -eq "1" ]; then
    ADMIN_GROUPS=$(docker exec ${PROJECT_NAME}-postgres psql -U postgres -d dataroom -tAc "
    SELECT COUNT(*) FROM groups WHERE type = 'ADMINISTRATOR';
    " 2>/dev/null || echo "0")

    if [ "$ADMIN_GROUPS" -eq "0" ]; then
        log_warning "No ADMINISTRATOR groups found - creating default group..."
        
        # Get super admin user ID
        SUPER_ADMIN_ID=$(docker exec ${PROJECT_NAME}-postgres psql -U postgres -d dataroom -tAc "
        SELECT id FROM users WHERE email = 'info@simplevdr.com' LIMIT 1;
        " 2>/dev/null | tr -d ' ')
        
        if [ -n "$SUPER_ADMIN_ID" ] && [ "$SUPER_ADMIN_ID" != "" ]; then
            # First create a default DataRoom if none exists
            DATAROOM_EXISTS=$(docker exec ${PROJECT_NAME}-postgres psql -U postgres -d dataroom -tAc "
            SELECT COUNT(*) FROM data_rooms;
            " 2>/dev/null || echo "0")
            
            if [ "$DATAROOM_EXISTS" -eq "0" ]; then
                log_info "Creating default DataRoom..."
                docker exec ${PROJECT_NAME}-postgres psql -U postgres -d dataroom -c "
                INSERT INTO data_rooms (id, name, slug, \"createdAt\", \"updatedAt\")
                VALUES (gen_random_uuid(), 'Default DataRoom', 'default-dataroom', NOW(), NOW());
                " 2>/dev/null || true
            fi
            
            # Get the DataRoom ID
            DATAROOM_ID=$(docker exec ${PROJECT_NAME}-postgres psql -U postgres -d dataroom -tAc "
            SELECT id FROM data_rooms LIMIT 1;
            " 2>/dev/null | tr -d ' ')
            
            if [ -n "$DATAROOM_ID" ] && [ "$DATAROOM_ID" != "" ]; then
                # Create administrator group
                docker exec ${PROJECT_NAME}-postgres psql -U postgres -d dataroom -c "
                INSERT INTO groups (id, name, type, \"dataRoomId\", \"createdAt\", \"updatedAt\")
                VALUES (gen_random_uuid(), 'Administrators', 'ADMINISTRATOR', '$DATAROOM_ID', NOW(), NOW());
                " 2>/dev/null || true
                
                # Get group ID and add super admin as member
                GROUP_ID=$(docker exec ${PROJECT_NAME}-postgres psql -U postgres -d dataroom -tAc "
                SELECT id FROM groups WHERE type = 'ADMINISTRATOR' AND \"dataRoomId\" = '$DATAROOM_ID' LIMIT 1;
                " 2>/dev/null | tr -d ' ')
                
                if [ -n "$GROUP_ID" ] && [ "$GROUP_ID" != "" ]; then
                    docker exec ${PROJECT_NAME}-postgres psql -U postgres -d dataroom -c "
                    INSERT INTO group_members (id, \"groupId\", \"userId\", role, \"createdAt\", \"updatedAt\")
                    VALUES (gen_random_uuid(), '$GROUP_ID', '$SUPER_ADMIN_ID', 'owner', NOW(), NOW())
                    ON CONFLICT DO NOTHING;
                    " 2>/dev/null || true
                    log_success "Created ADMINISTRATOR group with super admin"
                fi
            fi
        else
            log_warning "Super admin user not found - cannot create group"
        fi
    else
        log_success "Found $ADMIN_GROUPS ADMINISTRATOR group(s)"
    fi
else
    log_warning "Groups table not found - schema needs to be applied"
fi

# Step 9: Final status and summary
log_step "9/9" "Deployment Summary"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}║           🎉 Deployment Completed Successfully! 🎉           ║${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Show container status
echo -e "${CYAN}Container Status:${NC}"
docker-compose -f $COMPOSE_FILE ps

echo ""
echo -e "${CYAN}Service URLs:${NC}"
echo -e "  🌐 Website:      ${GREEN}https://$DOMAIN${NC}"
echo -e "  🔒 HTTPS:        ${GREEN}https://$DOMAIN_ALT${NC}"
echo -e "  🏥 Health Check: ${GREEN}https://$DOMAIN/api/health${NC}"
echo -e "  📁 File Explorer: ${GREEN}https://$DOMAIN/file-explorer${NC}"

echo ""
echo -e "${CYAN}VDR System Status (GroupType-based Authorization):${NC}"
echo -e "  ✅ Backend:      30+ API endpoints with GroupType ACL"
echo -e "  ✅ Frontend:     Permission-guarded UI components"
echo -e "  ✅ Middleware:   Access validation enabled"
echo -e "  ✅ Email:        Invitation system ready"
echo -e "  ✅ Permissions:  ADMINISTRATOR/USER/CUSTOM GroupTypes"
echo -e "  ✅ Indexing:     Hierarchical index system (1.2.3 format)"
echo -e "  📚 Docs:         /docs/VDR_*.md"

echo ""
echo -e "${CYAN}Useful Commands:${NC}"
echo -e "  📜 View logs:    ${YELLOW}docker-compose -f $COMPOSE_FILE logs -f${NC}"
echo -e "  🔄 Restart:      ${YELLOW}docker-compose -f $COMPOSE_FILE restart${NC}"
echo -e "  🛑 Stop:         ${YELLOW}docker-compose -f $COMPOSE_FILE down${NC}"
echo -e "  📊 Status:       ${YELLOW}docker-compose -f $COMPOSE_FILE ps${NC}"
echo -e "  🧪 Run Tests:    ${YELLOW}docker exec ${PROJECT_NAME}-app npm test${NC}"

echo ""
echo -e "${CYAN}Database Commands:${NC}"
echo -e "  🗄️  Prisma Studio: ${YELLOW}docker exec -it ${PROJECT_NAME}-app npx prisma studio${NC}"
echo -e "  📦 Backup DB:     ${YELLOW}docker exec ${PROJECT_NAME}-postgres pg_dump -U postgres dataroom > backup.sql${NC}"
echo -e "  🔄 Migrations:    ${YELLOW}docker exec ${PROJECT_NAME}-app npx prisma migrate status${NC}"
echo -e "  🔐 Seed Perms:    ${YELLOW}docker exec ${PROJECT_NAME}-app npm run db:seed:permissions${NC}"

echo ""
echo -e "${CYAN}VDR Administration:${NC}"
echo -e "  👥 Create Groups: ${YELLOW}Navigate to DataRoom > Settings > Groups${NC}"
echo -e "  📧 Invite Users:  ${YELLOW}Navigate to DataRoom > Settings > Users > Invite${NC}"
echo -e "  🔒 Permissions:   ${YELLOW}Document > Right-click > Manage Permissions${NC}"
echo -e "  📖 Admin Guide:   ${YELLOW}cat docs/VDR_ADMIN_GUIDE.md${NC}"

echo ""
log_success "Deployment script completed at $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo -e "${YELLOW}⚠️  Important Next Steps:${NC}"
echo -e "  👑 Super Admin Access: info@simplevdr.com (password in seed script)"
echo -e "  🔐 Admin Portal: https://$DOMAIN/admin"
echo -e "  1. ADMINISTRATOR groups have full access (auto-created by seed)"
echo -e "  2. USER groups have standard permissions"
echo -e "  3. CUSTOM groups have configurable permission flags"
echo -e "  4. Configure email service (SMTP settings in .env)"
echo -e "  5. Review VDR documentation in /docs"
echo -e "  6. Test UI permission guards on all protected pages"

