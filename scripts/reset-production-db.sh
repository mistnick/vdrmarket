#!/bin/bash

# Reset Production Database Script
# ⚠️  WARNING: This will DELETE all data in the database!

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

COMPOSE_FILE="docker-compose.production.yml"

echo -e "${RED}⚠️  WARNING: This will DELETE all data in the production database!${NC}"
echo -e "${YELLOW}Press CTRL+C to cancel, or ENTER to continue...${NC}"
read

echo -e "${YELLOW}Step 1/7: Stopping containers...${NC}"
docker-compose -f $COMPOSE_FILE down

echo -e "${YELLOW}Step 2/7: Finding and removing PostgreSQL volume...${NC}"
# Find all postgres volumes
VOLUMES=$(docker volume ls --format "{{.Name}}" | grep postgres || true)

if [ -z "$VOLUMES" ]; then
    echo -e "${YELLOW}No PostgreSQL volumes found. Skipping...${NC}"
else
    echo "Found volumes:"
    echo "$VOLUMES"
    for volume in $VOLUMES; do
        echo -e "${RED}Removing volume: $volume${NC}"
        docker volume rm $volume || true
    done
fi

echo -e "${YELLOW}Step 3/7: Starting containers with fresh database...${NC}"
docker-compose -f $COMPOSE_FILE up -d

echo -e "${YELLOW}Step 4/7: Waiting for PostgreSQL to be ready...${NC}"
for i in {1..60}; do
    if docker exec dataroom-postgres pg_isready -U postgres -d dataroom > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PostgreSQL is ready${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

echo ""
echo -e "${YELLOW}Step 5/7: Waiting for application to be ready...${NC}"
for i in {1..60}; do
    if docker exec dataroom-app wget --no-verbose --tries=1 --spider http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Application is ready${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

echo ""
echo -e "${YELLOW}Step 6/7: Applying database migrations...${NC}"
docker exec dataroom-app npx prisma migrate deploy

echo -e "${YELLOW}Step 7/7: Seeding database with initial data...${NC}"
docker exec dataroom-app npm run db:seed

echo ""
echo -e "${GREEN}✅ Database reset completed successfully!${NC}"
echo ""
echo "Default admin credentials:"
echo "  Email: admin@dataroom.com"
echo "  Password: Admin123!"
echo ""
echo "📊 Container Status:"
docker-compose -f $COMPOSE_FILE ps
