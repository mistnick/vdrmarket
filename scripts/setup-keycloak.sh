#!/bin/bash

# Setup Keycloak for DataRoom
# This script configures Keycloak via CLI to create the OAuth2/OIDC client

set -e

KEYCLOAK_URL="${KEYCLOAK_URL:-http://localhost:8080}"
ADMIN_USER="${KEYCLOAK_ADMIN:-admin}"
ADMIN_PASS="${KEYCLOAK_ADMIN_PASSWORD:-admin123}"
REALM="dataroom"
CLIENT_ID="${OAUTH_CLIENT_ID:-dataroom-client}"
REDIRECT_URI="${OAUTH_REDIRECT_URI:-http://localhost:3000/api/auth/callback}"
LOGOUT_URI="${OAUTH_POST_LOGOUT_REDIRECT_URI:-http://localhost:3000/auth/login}"

echo "🚀 Setting up Keycloak for DataRoom..."
echo "Keycloak URL: $KEYCLOAK_URL"

# Wait for Keycloak to be ready
echo "⏳ Waiting for Keycloak to be ready..."
max_attempts=60
attempt=0
until curl -sf "$KEYCLOAK_URL/health/ready" > /dev/null 2>&1; do
    attempt=$((attempt + 1))
    if [ $attempt -ge $max_attempts ]; then
        echo "❌ Keycloak did not become ready in time"
        exit 1
    fi
    echo "Waiting... (attempt $attempt/$max_attempts)"
    sleep 5
done

echo "✅ Keycloak is ready!"

# Get access token
echo "🔑 Getting admin access token..."
TOKEN_RESPONSE=$(curl -sf -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=$ADMIN_USER" \
    -d "password=$ADMIN_PASS" \
    -d "grant_type=password" \
    -d "client_id=admin-cli")

ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ Failed to get access token"
    echo "Response: $TOKEN_RESPONSE"
    exit 1
fi

echo "✅ Access token obtained"

# Create Realm
echo "📝 Creating DataRoom realm..."
curl -sf -X POST "$KEYCLOAK_URL/admin/realms" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "realm": "'$REALM'",
        "enabled": true,
        "displayName": "DataRoom",
        "registrationAllowed": true,
        "resetPasswordAllowed": true,
        "rememberMe": true,
        "verifyEmail": false,
        "loginWithEmailAllowed": true,
        "duplicateEmailsAllowed": false,
        "sslRequired": "none"
    }' || echo "Realm might already exist"

echo "✅ Realm created/verified"

# Create Client
echo "📱 Creating OAuth2 client..."
curl -sf -X POST "$KEYCLOAK_URL/admin/realms/$REALM/clients" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "clientId": "'$CLIENT_ID'",
        "name": "DataRoom Application",
        "description": "Secure Document Sharing Platform",
        "enabled": true,
        "clientAuthenticatorType": "client-secret",
        "redirectUris": ["'$REDIRECT_URI'", "'$LOGOUT_URI'", "http://localhost:3000/*"],
        "webOrigins": ["http://localhost:3000"],
        "protocol": "openid-connect",
        "publicClient": false,
        "standardFlowEnabled": true,
        "implicitFlowEnabled": false,
        "directAccessGrantsEnabled": true,
        "serviceAccountsEnabled": false,
        "attributes": {
            "pkce.code.challenge.method": "S256"
        }
    }' || echo "Client might already exist"

echo "✅ Client created/verified"

# Get client secret
echo "🔑 Retrieving client secret..."
CLIENT_UUID=$(curl -sf "$KEYCLOAK_URL/admin/realms/$REALM/clients?clientId=$CLIENT_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN" | \
    grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$CLIENT_UUID" ]; then
    echo "❌ Could not find client UUID"
    exit 1
fi

CLIENT_SECRET=$(curl -sf "$KEYCLOAK_URL/admin/realms/$REALM/clients/$CLIENT_UUID/client-secret" \
    -H "Authorization: Bearer $ACCESS_TOKEN" | \
    grep -o '"value":"[^"]*"' | cut -d'"' -f4)

if [ -z "$CLIENT_SECRET" ]; then
    echo "⚠️  Could not retrieve client secret automatically"
    echo "Please retrieve it manually from Keycloak admin console"
else
    echo "✅ Client secret retrieved!"
fi

# Create test user
echo "👤 Creating test user..."
curl -sf -X POST "$KEYCLOAK_URL/admin/realms/$REALM/users" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "username": "testuser",
        "email": "testuser@dataroom.local",
        "emailVerified": true,
        "enabled": true,
        "firstName": "Test",
        "lastName": "User",
        "credentials": [{
            "type": "password",
            "value": "test123",
            "temporary": false
        }]
    }' || echo "Test user might already exist"

echo "✅ Test user created"

echo ""
echo "======================================"
echo "🎉 Keycloak Setup Complete!"
echo "======================================"
echo ""
echo "Add these to your .env file:"
echo ""
echo "OAUTH_CLIENT_ID=$CLIENT_ID"
echo "OAUTH_CLIENT_SECRET=$CLIENT_SECRET"
echo "OAUTH_ISSUER=$KEYCLOAK_URL/realms/$REALM"
echo ""
echo "Access Keycloak Admin:"
echo "URL: $KEYCLOAK_URL"
echo "Username: $ADMIN_USER"
echo "Password: $ADMIN_PASS"
echo ""
echo "Test User:"
echo "Username: testuser"
echo "Email: testuser@dataroom.local"
echo "Password: test123"
echo ""
echo "======================================"
