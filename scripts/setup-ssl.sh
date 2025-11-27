#!/bin/bash

# SSL Certificate Setup Script for Let's Encrypt
# This script obtains SSL certificates for www.simplevdr.com

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

DOMAIN="www.simplevdr.com"
EMAIL="admin@simplevdr.com"  # Change this to your email
COMPOSE_FILE="docker-compose.production.yml"

echo -e "${YELLOW}SSL Certificate Setup for $DOMAIN${NC}"
echo ""

# Create Docker network if it doesn't exist
echo -e "${YELLOW}Step 1/6: Creating Docker network...${NC}"
docker network create dataroom-network 2>/dev/null || echo "Network already exists"

# Check if certbot volumes exist
echo -e "${YELLOW}Step 2/6: Creating certbot volumes...${NC}"
docker volume create certbot_data 2>/dev/null || true
docker volume create certbot_www 2>/dev/null || true

# Start nginx in HTTP-only mode for ACME challenge
echo -e "${YELLOW}Step 3/6: Starting nginx for ACME challenge...${NC}"

# Cleanup any existing temp container
docker rm -f dataroom-nginx-temp 2>/dev/null || true

# Create temporary nginx config without SSL
cat > nginx/nginx-init.conf << 'EOF'
server {
    listen 80;
    server_name www.simplevdr.com simplevdr.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        proxy_pass http://app:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Start nginx with temporary config
docker run -d \
    --name dataroom-nginx-temp \
    --network dataroom-network \
    -p 80:80 \
    -v $(pwd)/nginx/nginx-init.conf:/etc/nginx/conf.d/default.conf:ro \
    -v certbot_www:/var/www/certbot \
    nginx:alpine

echo -e "${YELLOW}Step 4/6: Obtaining SSL certificate from Let's Encrypt...${NC}"
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

echo -e "${YELLOW}Step 5/6: Stopping temporary nginx...${NC}"
docker stop dataroom-nginx-temp
docker rm dataroom-nginx-temp
rm nginx/nginx-init.conf

echo -e "${YELLOW}Step 6/6: Starting production stack with SSL...${NC}"
docker-compose -f $COMPOSE_FILE up -d nginx

echo ""
echo -e "${GREEN}✅ SSL certificate obtained successfully!${NC}"
echo ""
echo "Your site is now accessible at:"
echo "  https://www.simplevdr.com"
echo ""
echo "Certificate will auto-renew every 12 hours via the certbot container."
