#!/bin/bash

# Script to generate properly encoded DATABASE_URL from credentials

echo "Database URL Generator"
echo "====================="
echo ""

# Read credentials
read -p "PostgreSQL User [postgres]: " POSTGRES_USER
POSTGRES_USER=${POSTGRES_USER:-postgres}

read -sp "PostgreSQL Password: " POSTGRES_PASSWORD
echo ""

read -p "PostgreSQL Database [dataroom]: " POSTGRES_DB
POSTGRES_DB=${POSTGRES_DB:-dataroom}

read -p "PostgreSQL Host [postgres]: " POSTGRES_HOST
POSTGRES_HOST=${POSTGRES_HOST:-postgres}

read -p "PostgreSQL Port [5432]: " POSTGRES_PORT
POSTGRES_PORT=${POSTGRES_PORT:-5432}

# URL encode the password using Python (available in most systems)
if command -v python3 &> /dev/null; then
    ENCODED_PASSWORD=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$POSTGRES_PASSWORD', safe=''))")
elif command -v python &> /dev/null; then
    ENCODED_PASSWORD=$(python -c "import urllib; print(urllib.quote('$POSTGRES_PASSWORD', safe=''))")
else
    echo "⚠️  Warning: Python not found. Password will not be URL-encoded."
    echo "   You may need to manually encode special characters."
    ENCODED_PASSWORD=$POSTGRES_PASSWORD
fi

# Generate DATABASE_URL
DATABASE_URL="postgresql://${POSTGRES_USER}:${ENCODED_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}?schema=public&connection_limit=20&pool_timeout=10"

echo ""
echo "✅ Generated DATABASE_URL:"
echo ""
echo "DATABASE_URL=\"$DATABASE_URL\""
echo ""
echo "Copy the line above and add it to your .env.production file"
