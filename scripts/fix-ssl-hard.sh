#!/bin/bash

# Fix SSL Hard Script
# Copies certificates to local folder to bypass symlink/mount issues
# and force restarts Nginx

echo "🛑 Stopping Nginx..."
docker rm -f dataroom-nginx 2>/dev/null || true

echo "📂 Creating local certs directory..."
mkdir -p nginx/certs

echo "📋 Copying certificates (dereferencing symlinks)..."
# Try both www and non-www paths just in case
if [ -d "/var/lib/docker/volumes/certbot_data/_data/live/www.simplevdr.com" ]; then
    cp -L /var/lib/docker/volumes/certbot_data/_data/live/www.simplevdr.com/*.pem nginx/certs/
    echo "✅ Copied from www.simplevdr.com"
elif [ -d "/var/lib/docker/volumes/certbot_data/_data/live/simplevdr.com" ]; then
    cp -L /var/lib/docker/volumes/certbot_data/_data/live/simplevdr.com/*.pem nginx/certs/
    echo "✅ Copied from simplevdr.com"
else
    echo "❌ Could not find certificates in Docker volume!"
    exit 1
fi

echo "📝 Updating nginx.conf to use local certs..."
# Replace Let's Encrypt paths with local mapped paths
sed -i 's|/etc/letsencrypt/live/www.simplevdr.com/|/etc/nginx/certs/|g' nginx/nginx.conf
sed -i 's|/etc/letsencrypt/live/simplevdr.com/|/etc/nginx/certs/|g' nginx/nginx.conf

echo "🚀 Restarting Nginx..."
docker-compose -f docker-compose.production.yml up -d nginx

echo "✅ Done! Checking logs..."
sleep 2
docker logs dataroom-nginx
