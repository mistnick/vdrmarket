#!/bin/bash

# Test script for DataRoom authentication

echo "🔍 Testing DataRoom Authentication Setup"
echo "=========================================="
echo ""

# Check if server is running
if ! lsof -ti:3000 > /dev/null 2>&1; then
    echo "❌ Server is not running on port 3000"
    echo "   Please run: npm run dev"
    exit 1
fi

echo "✅ Server is running on port 3000"
echo ""

# Test providers endpoint
echo "Testing /api/auth/providers endpoint..."
RESPONSE=$(curl -s http://localhost:3000/api/auth/providers)

if echo "$RESPONSE" | grep -q "credentials"; then
    echo "✅ Providers endpoint is working"
    echo ""
    echo "Available providers:"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
else
    echo "❌ Providers endpoint returned an error:"
    echo "$RESPONSE"
    exit 1
fi

echo ""
echo "=========================================="
echo "🎉 Authentication setup is working correctly!"
echo ""
echo "Available authentication methods:"
echo "  - Email/Password (credentials)"

# Check if Authentik is configured
if [ -n "$AUTHENTIK_ISSUER" ] && [ -n "$AUTHENTIK_CLIENT_ID" ]; then
    echo "  - Authentik OAuth"
fi

# Check if Google is configured  
if [ -n "$GOOGLE_CLIENT_ID" ] && [ -n "$GOOGLE_CLIENT_SECRET" ]; then
    echo "  - Google OAuth"
fi

# Check if Microsoft is configured
if [ -n "$MICROSOFT_CLIENT_ID" ] && [ -n "$MICROSOFT_CLIENT_SECRET" ]; then
    echo "  - Microsoft OAuth"
fi

echo ""
echo "To configure Authentik, see docs/AUTHENTIK-SETUP.md"
