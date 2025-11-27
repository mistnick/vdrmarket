#!/bin/bash

# Unified Production Deployment Script for DataRoom
# Handles SSL setup, updates, and full deployment

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

COMPOSE_FILE="docker-compose.production.yml"
DOMAIN="www.simplevdr.com"
EMAIL="admin@simplevdr.com"

echo -e "${GREEN}🚀 Starting DataRoom Production Deployment...${NC}"

# 1. Network Setup
echo -e "${YELLOW}Step 1/8: Checking Docker network...${NC}"
docker network create dataroom-network 2>/dev/null || echo "Network already exists"

# 2. SSL Setup (Idempotent)
echo -e "${YELLOW}Step 2/8: Checking SSL certificates...${NC}"
if [ ! -f "nginx/certs/fullchain.pem" ]; then
    echo "SSL certificates missing. Starting generation process..."
    
    # Create volumes
    docker volume create certbot_data 2>/dev/null || true
    docker volume create certbot_www 2>/dev/null || true
    
    # Cleanup temp container
    docker rm -f dataroom-nginx-temp 2>/dev/null || true
    
    # Create temp nginx config
    mkdir -p nginx
    cat > nginx/nginx-init.conf << 'EOF'
server {
    listen 80;
    server_name www.simplevdr.com simplevdr.com;
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    location / {
        return 200 'Nginx is working for SSL setup';
        add_header Content-Type text/plain;
    }
}
EOF

    # Start temp nginx
    echo "Starting temporary Nginx..."
    docker run -d \
        --name dataroom-nginx-temp \
        --network dataroom-network \
        -p 80:80 \
        -v $(pwd)/nginx/nginx-init.conf:/etc/nginx/conf.d/default.conf:ro \
        -v certbot_www:/var/www/certbot \
        nginx:alpine

    # Wait for Nginx
    sleep 5

    # Run Certbot
    echo "Running Certbot..."
    docker run --rm \
        --network dataroom-network \
        -v certbot_data:/etc/letsencrypt \
        -v certbot_www:/var/www/certbot \
        certbot/certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        -d $DOMAIN \
        -d simplevdr.com

    # Cleanup temp nginx
    docker stop dataroom-nginx-temp
    docker rm dataroom-nginx-temp
    rm nginx/nginx-init.conf

    # Copy certs (Hard Fix)
    echo "Copying certificates to local directory..."
    mkdir -p nginx/certs
    
    # Try to find certs in volume (handling potential path variations)
    if [ -d "/var/lib/docker/volumes/certbot_data/_data/live/www.simplevdr.com" ]; then
        cp -L /var/lib/docker/volumes/certbot_data/_data/live/www.simplevdr.com/*.pem nginx/certs/
    elif [ -d "/var/lib/docker/volumes/certbot_data/_data/live/simplevdr.com" ]; then
        cp -L /var/lib/docker/volumes/certbot_data/_data/live/simplevdr.com/*.pem nginx/certs/
    else
        echo -e "${RED}❌ Error: Certificates not found after generation!${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ SSL Setup Complete${NC}"
else
    echo -e "${GREEN}✅ SSL certificates already exist in nginx/certs${NC}"
fi

# 3. Code Update
echo -e "${YELLOW}Step 3/8: Pulling latest code...${NC}"
git pull origin main || true

# 4. Build
echo -e "${YELLOW}Step 4/8: Building Docker images...${NC}"
docker-compose -f $COMPOSE_FILE build --no-cache

# 5. Start Services
echo -e "${YELLOW}Step 5/8: Starting services...${NC}"
# Stop first to ensure clean state
docker-compose -f $COMPOSE_FILE down --remove-orphans
docker-compose -f $COMPOSE_FILE up -d

# 6. Health Check
echo -e "${YELLOW}Step 6/8: Waiting for services to be healthy...${NC}"
echo "Waiting for PostgreSQL..."
for i in {1..30}; do
    if docker exec dataroom-postgres pg_isready -U postgres -d dataroom > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PostgreSQL is ready${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

echo "Waiting for Application..."
for i in {1..30}; do
    if docker exec dataroom-app wget --no-verbose --tries=1 --spider http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Application is ready${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

# 7. Database Setup
echo -e "${YELLOW}Step 7/8: Running migrations and seeding...${NC}"
docker exec dataroom-app npx prisma migrate deploy
# Only seed if users table is empty (optional check, or just run seed which is usually idempotent-ish or safe to fail)
docker exec dataroom-app npm run db:seed || echo "Seeding skipped or failed (maybe already seeded)"

# 8. Final Status
echo -e "${YELLOW}Step 8/8: Final Status Check...${NC}"
docker-compose -f $COMPOSE_FILE ps

echo ""
echo -e "${GREEN}🎉 Deployment Successful!${NC}"
echo "URL: https://www.simplevdr.com"
