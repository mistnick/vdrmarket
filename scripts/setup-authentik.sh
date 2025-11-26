#!/bin/bash

# Setup Authentik for DataRoom
# This script configures Authentik via API to create the OAuth2/OIDC application

set -e

AUTHENTIK_URL="${AUTHENTIK_URL:-http://localhost:9000}"
AUTHENTIK_TOKEN="${AUTHENTIK_BOOTSTRAP_TOKEN:-bootstrap-token-change-me}"
CLIENT_ID="${OAUTH_CLIENT_ID:-dataroom-client}"
REDIRECT_URI="${OAUTH_REDIRECT_URI:-http://localhost:3000/api/auth/callback}"
LOGOUT_URI="${OAUTH_POST_LOGOUT_REDIRECT_URI:-http://localhost:3000/auth/login}"

echo "🚀 Setting up Authentik for DataRoom..."
echo "Authentik URL: $AUTHENTIK_URL"

# Wait for Authentik to be ready
echo "⏳ Waiting for Authentik to be ready..."
max_attempts=60
attempt=0
until curl -sf "$AUTHENTIK_URL/api/v3/core/applications/" -H "Authorization: Bearer $AUTHENTIK_TOKEN" > /dev/null 2>&1; do
    attempt=$((attempt + 1))
    if [ $attempt -ge $max_attempts ]; then
        echo "❌ Authentik did not become ready in time"
        exit 1
    fi
    echo "Waiting... (attempt $attempt/$max_attempts)"
    sleep 5
done

echo "✅ Authentik is ready!"

# Create OAuth2 Provider
echo "📝 Creating OAuth2 Provider..."
PROVIDER_RESPONSE=$(curl -sf -X POST "$AUTHENTIK_URL/api/v3/providers/oauth2/" \
    -H "Authorization: Bearer $AUTHENTIK_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "DataRoom OAuth2 Provider",
        "authorization_flow": "default-provider-authorization-implicit-consent",
        "client_type": "confidential",
        "client_id": "'$CLIENT_ID'",
        "redirect_uris": "'$REDIRECT_URI'\n'$LOGOUT_URI'",
        "signing_key": "authentik Self-signed Certificate",
        "property_mappings": []
    }' 2>&1 || echo "Provider might already exist")

echo "$PROVIDER_RESPONSE"

# Extract provider slug/pk (try to get existing one if creation failed)
PROVIDER_PK=$(echo "$PROVIDER_RESPONSE" | grep -o '"pk":[0-9]*' | head -1 | grep -o '[0-9]*' || \
    curl -sf "$AUTHENTIK_URL/api/v3/providers/oauth2/" \
    -H "Authorization: Bearer $AUTHENTIK_TOKEN" | \
    grep -o '"pk":[0-9]*' | head -1 | grep -o '[0-9]*')

if [ -z "$PROVIDER_PK" ]; then
    echo "❌ Failed to create or find OAuth2 Provider"
    exit 1
fi

echo "✅ OAuth2 Provider created/found with PK: $PROVIDER_PK"

# Create Application
echo "📱 Creating DataRoom Application..."
APP_RESPONSE=$(curl -sf -X POST "$AUTHENTIK_URL/api/v3/core/applications/" \
    -H "Authorization: Bearer $AUTHENTIK_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "DataRoom",
        "slug": "dataroom",
        "provider": '$PROVIDER_PK',
        "meta_launch_url": "http://localhost:3000",
        "meta_icon": "https://goauthentik.io/img/icon.png",
        "meta_description": "Secure Document Sharing Platform",
        "policy_engine_mode": "any",
        "open_in_new_tab": true
    }' 2>&1 || echo "Application might already exist")

echo "$APP_RESPONSE"

# Get the client secret
echo "🔑 Retrieving client secret..."
CLIENT_SECRET=$(curl -sf "$AUTHENTIK_URL/api/v3/providers/oauth2/$PROVIDER_PK/" \
    -H "Authorization: Bearer $AUTHENTIK_TOKEN" | \
    grep -o '"client_secret":"[^"]*"' | cut -d'"' -f4)

if [ -z "$CLIENT_SECRET" ]; then
    echo "⚠️  Could not retrieve client secret automatically"
    echo "Please retrieve it manually from Authentik admin panel"
else
    echo "✅ Client secret retrieved!"
    echo ""
    echo "======================================"
    echo "🎉 Authentik Setup Complete!"
    echo "======================================"
    echo ""
    echo "Add these to your .env file:"
    echo ""
    echo "OAUTH_CLIENT_ID=$CLIENT_ID"
    echo "OAUTH_CLIENT_SECRET=$CLIENT_SECRET"
    echo "OAUTH_ISSUER=$AUTHENTIK_URL/application/o/dataroom/"
    echo ""
    echo "Access Authentik Admin:"
    echo "URL: $AUTHENTIK_URL"
    echo "Email: admin@dataroom.local"
    echo "Password: ChangeMe123!"
    echo ""
    echo "======================================"
fi
