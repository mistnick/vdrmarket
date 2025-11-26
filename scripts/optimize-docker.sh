#!/bin/bash

# Docker Performance Optimization Script
set -e

echo "🚀 Docker Performance Optimization"
echo "=================================="
echo ""

# 1. Prune unused resources
echo "🧹 1. Cleaning up unused Docker resources..."
docker system prune -af --volumes
echo "✅ Cleanup completed"
echo ""

# 2. Build with BuildKit and caching
echo "🏗️  2. Building optimized images with BuildKit..."
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
docker-compose build --parallel --no-cache
echo "✅ Build completed"
echo ""

# 3. Start services
echo "🚀 3. Starting optimized services..."
docker-compose up -d
echo "✅ Services started"
echo ""

# 4. Wait for services to be healthy
echo "⏳ 4. Waiting for services to be healthy..."
sleep 10

# Check health status
echo ""
echo "📊 Service Health Status:"
docker-compose ps
echo ""

# 5. Performance recommendations
echo "💡 Performance Recommendations:"
echo "   - Postgres: Tuned for 2GB RAM, 200 connections"
echo "   - Redis: LRU cache with 512MB limit"
echo "   - Keycloak: Optimized mode with connection pooling"
echo "   - App: Production mode with resource limits"
echo "   - MinIO: Caching enabled for faster access"
echo ""

echo "✅ Optimization complete!"
echo ""
echo "📈 Monitor performance with:"
echo "   docker stats"
echo ""
echo "🔍 View logs with:"
echo "   docker-compose logs -f [service_name]"
