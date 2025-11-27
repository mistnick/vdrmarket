#!/bin/bash

# Production Deployment Script for DataRoom
# This script rebuilds the entire Docker environment for production

set -e  # Exit on error

echo "🚀 Starting DataRoom Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.production.yml"
ENV_FILE=".env.production"

# Check if .env.production exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}Error: $ENV_FILE not found!${NC}"
    echo "Please create a .env.production file with the required environment variables."
    exit 1
fi

echo -e "${YELLOW}Step 1/7: Stopping existing containers...${NC}"
docker-compose -f $COMPOSE_FILE down

echo -e "${YELLOW}Step 2/7: Removing old images...${NC}"
docker rmi -f dataroom-app:latest 2>/dev/null || true

echo -e "${YELLOW}Step 3/7: Pulling latest code from GitHub...${NC}"
git pull origin main || git pull origin master

echo -e "${YELLOW}Step 4/7: Building Docker images (no cache)...${NC}"
docker-compose -f $COMPOSE_FILE build --no-cache

echo -e "${YELLOW}Step 5/7: Starting containers...${NC}"
docker-compose -f $COMPOSE_FILE up -d

echo -e "${YELLOW}Step 6/7: Waiting for services to be healthy...${NC}"
sleep 10

# Wait for postgres to be ready
echo "Waiting for PostgreSQL..."
for i in {1..30}; do
    if docker exec dataroom-postgres pg_isready -U postgres -d dataroom > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PostgreSQL is ready${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

# Wait for app to be ready
echo "Waiting for application..."
for i in {1..30}; do
    if docker exec dataroom-app wget --no-verbose --tries=1 --spider http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Application is ready${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

echo -e "${YELLOW}Step 7/7: Running database migrations and seeding...${NC}"

# Run migrations
echo "Running Prisma migrations..."
docker exec dataroom-app npx prisma migrate deploy

# Run seeding
echo "Seeding database..."
docker exec dataroom-app npm run prisma:seed || docker exec dataroom-app npx prisma db seed

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo "📊 Container Status:"
docker-compose -f $COMPOSE_FILE ps

echo ""
echo "📝 View logs with:"
echo "  docker-compose -f $COMPOSE_FILE logs -f app"
echo ""
echo "🔍 Check application health:"
echo "  curl http://localhost:3000/api/health"
echo ""
echo -e "${GREEN}🎉 DataRoom is now running in production mode!${NC}"
