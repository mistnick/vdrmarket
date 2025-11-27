#!/bin/bash

# Fix Docker State Script
# Resolves "KeyError: 'ContainerConfig'" by force removing containers

echo "🛑 Stopping and removing containers manually..."

# List of service containers
CONTAINERS="dataroom-nginx dataroom-app dataroom-certbot dataroom-redis dataroom-postgres"

for container in $CONTAINERS; do
    if docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
        echo "Removing $container..."
        docker rm -f $container
    else
        echo "$container not found, skipping."
    fi
done

echo ""
echo "🧹 Pruning stopped containers/networks to ensure clean state..."
docker container prune -f
docker network prune -f

echo ""
echo "🚀 Starting services with docker-compose..."
docker-compose -f docker-compose.production.yml up -d

echo ""
echo "✅ Done! Checking status..."
docker-compose -f docker-compose.production.yml ps
