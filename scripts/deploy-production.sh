#!/bin/bash

# ==============================================================================
# DataRoom VDR - Production Deployment Script
# Version: 2.0.0
# Last Updated: 28 Novembre 2025
# ==============================================================================
# 
# This script handles:
# - SSL certificate setup with Let's Encrypt
# - Docker image building
# - Service deployment
# - Database migrations
# - Health checks
#
# Usage:
#   ./scripts/deploy-production.sh [options]
#
# Options:
#   --skip-ssl     Skip SSL certificate generation
#   --skip-build   Skip Docker image building
#   --force-ssl    Force SSL regeneration
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
FORCE_SSL=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --skip-ssl) SKIP_SSL=true ;;
        --skip-build) SKIP_BUILD=true ;;
        --force-ssl) FORCE_SSL=true ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --skip-ssl     Skip SSL certificate generation"
            echo "  --skip-build   Skip Docker image building"
            echo "  --force-ssl    Force SSL regeneration"
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
echo "║       🚀 DataRoom VDR - Production Deployment v2.0           ║"
echo "║                                                              ║"
echo "║       Domain: $DOMAIN                              ║"
echo "║       Date: $(date '+%Y-%m-%d %H:%M:%S')                      ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

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

# Step 8: Database migrations and setup
log_step "8/9" "Running database migrations..."

# Run Prisma migrations
log_info "Applying database migrations..."
if docker exec ${PROJECT_NAME}-app npx prisma migrate deploy; then
    log_success "Database migrations applied"
else
    log_warning "Migration failed - database might already be up to date"
fi

# Regenerate Prisma client
log_info "Regenerating Prisma client..."
docker exec ${PROJECT_NAME}-app npx prisma generate
log_success "Prisma client regenerated"

# Seed database if needed
log_info "Seeding database..."
if docker exec ${PROJECT_NAME}-app npm run db:seed 2>/dev/null; then
    log_success "Database seeded"
else
    log_info "Seeding skipped (already seeded or no seed script)"
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

echo ""
echo -e "${CYAN}Useful Commands:${NC}"
echo -e "  📜 View logs:    ${YELLOW}docker-compose -f $COMPOSE_FILE logs -f${NC}"
echo -e "  🔄 Restart:      ${YELLOW}docker-compose -f $COMPOSE_FILE restart${NC}"
echo -e "  🛑 Stop:         ${YELLOW}docker-compose -f $COMPOSE_FILE down${NC}"
echo -e "  📊 Status:       ${YELLOW}docker-compose -f $COMPOSE_FILE ps${NC}"

echo ""
echo -e "${CYAN}Database Commands:${NC}"
echo -e "  🗄️  Prisma Studio: ${YELLOW}docker exec -it ${PROJECT_NAME}-app npx prisma studio${NC}"
echo -e "  📦 Backup DB:     ${YELLOW}docker exec ${PROJECT_NAME}-postgres pg_dump -U postgres dataroom > backup.sql${NC}"

echo ""
log_success "Deployment script completed at $(date '+%Y-%m-%d %H:%M:%S')"
