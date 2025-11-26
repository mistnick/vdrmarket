#!/bin/bash

# Script to create volume directories for Docker
set -e

echo "📁 Creating Docker volume directories..."

# Create directories
mkdir -p volumes/postgres
mkdir -p volumes/minio
mkdir -p volumes/redis

# Set permissions
chmod 755 volumes/postgres
chmod 755 volumes/minio
chmod 755 volumes/redis

echo "✅ Volume directories created successfully!"
echo ""
echo "Directories:"
echo "  - volumes/postgres"
echo "  - volumes/minio"
echo "  - volumes/redis"
