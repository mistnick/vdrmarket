#!/bin/bash
#
# Generate self-signed SSL certificates for HTTPS
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERT_DIR="$SCRIPT_DIR/../nginx/certs"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Generating self-signed SSL certificates...${NC}"

# Create certs directory
mkdir -p "$CERT_DIR"

# Get domain name
DOMAIN="${1:-localhost}"
echo -e "${YELLOW}Domain: $DOMAIN${NC}"

# Generate private key and certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$CERT_DIR/server.key" \
    -out "$CERT_DIR/server.crt" \
    -subj "/C=IT/ST=Italy/L=Milan/O=DataRoom/OU=IT/CN=$DOMAIN" \
    -addext "subjectAltName=DNS:$DOMAIN,DNS:www.$DOMAIN,DNS:localhost,IP:127.0.0.1"

# Set permissions
chmod 600 "$CERT_DIR/server.key"
chmod 644 "$CERT_DIR/server.crt"

echo -e "${GREEN}✅ Certificates generated successfully!${NC}"
echo ""
echo "Certificate: $CERT_DIR/server.crt"
echo "Private Key: $CERT_DIR/server.key"
echo ""
echo -e "${YELLOW}Note: Self-signed certificates will show a browser warning.${NC}"
echo "For production, use Let's Encrypt or a proper CA certificate."
