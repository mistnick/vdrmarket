#!/bin/bash

#===============================================================================
# DataRoom VPS Deployment Script
# Deploy Docker containers to Ubuntu 24.04 LTS server via SSH
#===============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

#===============================================================================
# CONFIGURATION - Modify these values
#===============================================================================

# SSH Connection
SSH_HOST=""           # Server IP or hostname (e.g., "192.168.1.100" or "vps.example.com")
SSH_USER=""           # SSH username (e.g., "root" or "ubuntu")
SSH_PORT="22"         # SSH port (default: 22)
SSH_KEY=""            # Path to SSH key (optional, leave empty for password auth)

# Remote paths
REMOTE_APP_DIR="/opt/dataroom"

# Docker registry (optional - for private registry)
DOCKER_REGISTRY=""    # e.g., "ghcr.io/mistnick" or leave empty for local build

#===============================================================================
# Parse command line arguments
#===============================================================================

print_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --host HOST        SSH host (IP or hostname)"
    echo "  -u, --user USER        SSH username"
    echo "  -p, --port PORT        SSH port (default: 22)"
    echo "  -k, --key FILE         SSH private key file (optional)"
    echo "  -d, --dir DIR          Remote app directory (default: /opt/dataroom)"
    echo "  --setup                First-time server setup (install Docker)"
    echo "  --help                 Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -h 192.168.1.100 -u root --setup    # First deploy with Docker installation"
    echo "  $0 -h 192.168.1.100 -u root            # Update existing deployment"
    echo "  $0 -h vps.example.com -u ubuntu -k ~/.ssh/id_rsa"
}

SETUP_MODE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--host)
            SSH_HOST="$2"
            shift 2
            ;;
        -u|--user)
            SSH_USER="$2"
            shift 2
            ;;
        -p|--port)
            SSH_PORT="$2"
            shift 2
            ;;
        -k|--key)
            SSH_KEY="$2"
            shift 2
            ;;
        -d|--dir)
            REMOTE_APP_DIR="$2"
            shift 2
            ;;
        --setup)
            SETUP_MODE=true
            shift
            ;;
        --help)
            print_usage
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            print_usage
            exit 1
            ;;
    esac
done

#===============================================================================
# Validation
#===============================================================================

if [[ -z "$SSH_HOST" ]]; then
    echo -e "${YELLOW}Enter SSH host (IP or hostname):${NC}"
    read -r SSH_HOST
fi

if [[ -z "$SSH_USER" ]]; then
    echo -e "${YELLOW}Enter SSH username:${NC}"
    read -r SSH_USER
fi

if [[ -z "$SSH_HOST" || -z "$SSH_USER" ]]; then
    echo -e "${RED}Error: SSH host and user are required${NC}"
    print_usage
    exit 1
fi

# Build SSH command
SSH_OPTS="-o StrictHostKeyChecking=accept-new -o ConnectTimeout=10"
if [[ -n "$SSH_KEY" ]]; then
    SSH_OPTS="$SSH_OPTS -i $SSH_KEY"
fi
SSH_CMD="ssh $SSH_OPTS -p $SSH_PORT $SSH_USER@$SSH_HOST"
SCP_CMD="scp $SSH_OPTS -P $SSH_PORT"

#===============================================================================
# Helper functions
#===============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

run_remote() {
    $SSH_CMD "$1"
}

#===============================================================================
# Test SSH connection
#===============================================================================

log_info "Testing SSH connection to $SSH_USER@$SSH_HOST..."

if ! $SSH_CMD "echo 'Connection successful'" 2>/dev/null; then
    log_error "Cannot connect to server. Please check your credentials."
    exit 1
fi

log_success "SSH connection established"

#===============================================================================
# Server setup (first-time only)
#===============================================================================

if $SETUP_MODE; then
    log_info "=== First-time server setup ==="
    
    log_info "Updating system packages..."
    run_remote "sudo apt update && sudo apt upgrade -y"
    
    log_info "Installing Docker..."
    run_remote "curl -fsSL https://get.docker.com | sudo sh"
    
    log_info "Adding user to docker group..."
    run_remote "sudo usermod -aG docker $SSH_USER"
    
    log_info "Installing Docker Compose plugin..."
    run_remote "sudo apt install -y docker-compose-plugin"
    
    log_info "Enabling Docker service..."
    run_remote "sudo systemctl enable docker && sudo systemctl start docker"
    
    log_info "Installing useful tools..."
    run_remote "sudo apt install -y git curl htop"
    
    log_info "Creating app directory..."
    run_remote "sudo mkdir -p $REMOTE_APP_DIR && sudo chown $SSH_USER:$SSH_USER $REMOTE_APP_DIR"
    
    log_success "Server setup completed!"
    echo ""
    log_warning "Please logout and login again (or run 'newgrp docker') to use Docker without sudo"
    echo ""
fi

#===============================================================================
# Deploy application
#===============================================================================

log_info "=== Deploying DataRoom application ==="

# Get the script directory (project root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

log_info "Project directory: $PROJECT_DIR"

# Create remote directory
log_info "Creating remote directory structure..."
run_remote "mkdir -p $REMOTE_APP_DIR/{volumes/postgres,volumes/minio,volumes/redis,logs}"

# Files to copy
FILES_TO_COPY=(
    "docker-compose.prod.yml"
    "Dockerfile"
    "package.json"
    "package-lock.json"
    "next.config.ts"
    "tailwind.config.js"
    "postcss.config.mjs"
    "tsconfig.json"
    "prisma.config.ts"
    "components.json"
    "middleware.ts.backup"
)

# Directories to copy
DIRS_TO_COPY=(
    "app"
    "components"
    "lib"
    "hooks"
    "types"
    "prisma"
    "public"
    "dictionaries"
)

# Create a temporary archive
log_info "Creating deployment archive..."
ARCHIVE_NAME="dataroom-deploy-$(date +%Y%m%d-%H%M%S).tar.gz"
TEMP_DIR=$(mktemp -d)

cd "$PROJECT_DIR"

# Copy files to temp
for file in "${FILES_TO_COPY[@]}"; do
    if [[ -f "$file" ]]; then
        cp "$file" "$TEMP_DIR/"
    fi
done

# Copy directories to temp
for dir in "${DIRS_TO_COPY[@]}"; do
    if [[ -d "$dir" ]]; then
        cp -r "$dir" "$TEMP_DIR/"
    fi
done

# Create .env.example if not exists
if [[ ! -f "$TEMP_DIR/.env" ]]; then
    cat > "$TEMP_DIR/.env.example" << 'EOF'
# Database
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/dataroom"
POSTGRES_USER=postgres
POSTGRES_PASSWORD=CHANGE_ME_SECURE_PASSWORD
POSTGRES_DB=dataroom

# NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=CHANGE_ME_GENERATE_WITH_openssl_rand_base64_32

# Authentik OAuth
AUTHENTIK_CLIENT_ID=your-client-id
AUTHENTIK_CLIENT_SECRET=your-client-secret
AUTHENTIK_ISSUER=https://auth.your-domain.com/application/o/dataroom/

# MinIO Storage
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=CHANGE_ME_SECURE_PASSWORD
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_BUCKET=dataroom
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=CHANGE_ME_SECURE_PASSWORD

# Redis
REDIS_URL=redis://redis:6379

# App
NODE_ENV=production
EOF
fi

# Create archive
cd "$TEMP_DIR"
tar -czf "$ARCHIVE_NAME" .

log_info "Uploading archive to server..."
$SCP_CMD "$TEMP_DIR/$ARCHIVE_NAME" "$SSH_USER@$SSH_HOST:$REMOTE_APP_DIR/"

log_info "Extracting archive on server..."
run_remote "cd $REMOTE_APP_DIR && tar -xzf $ARCHIVE_NAME && rm $ARCHIVE_NAME"

# Cleanup temp
rm -rf "$TEMP_DIR"

# Check if .env exists on remote
log_info "Checking environment configuration..."
if ! run_remote "test -f $REMOTE_APP_DIR/.env" 2>/dev/null; then
    log_warning ".env file not found on server!"
    log_warning "Please create $REMOTE_APP_DIR/.env with your configuration"
    log_warning "A template has been created at $REMOTE_APP_DIR/.env.example"
    echo ""
    echo -e "${YELLOW}Do you want to create .env now? (y/n):${NC}"
    read -r CREATE_ENV
    if [[ "$CREATE_ENV" == "y" ]]; then
        run_remote "cp $REMOTE_APP_DIR/.env.example $REMOTE_APP_DIR/.env"
        log_info "Please edit the .env file on the server:"
        log_info "  $SSH_CMD 'nano $REMOTE_APP_DIR/.env'"
        exit 0
    fi
fi

# Build and start containers
log_info "Building Docker images on server..."
run_remote "cd $REMOTE_APP_DIR && docker compose -f docker-compose.prod.yml build"

log_info "Starting containers..."
run_remote "cd $REMOTE_APP_DIR && docker compose -f docker-compose.prod.yml up -d"

# Run database migrations
log_info "Running database migrations..."
sleep 5  # Wait for database to be ready
run_remote "cd $REMOTE_APP_DIR && docker compose -f docker-compose.prod.yml exec -T app node ./node_modules/prisma/build/index.js migrate deploy" || true

# Show status
log_info "Checking container status..."
run_remote "cd $REMOTE_APP_DIR && docker compose -f docker-compose.prod.yml ps"

echo ""
log_success "=== Deployment completed! ==="
echo ""
echo -e "${GREEN}Your application should be available at:${NC}"
echo -e "  http://$SSH_HOST:3000"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo -e "  View logs:     $SSH_CMD 'cd $REMOTE_APP_DIR && docker compose -f docker-compose.prod.yml logs -f'"
echo -e "  Restart app:   $SSH_CMD 'cd $REMOTE_APP_DIR && docker compose -f docker-compose.prod.yml restart'"
echo -e "  Stop app:      $SSH_CMD 'cd $REMOTE_APP_DIR && docker compose -f docker-compose.prod.yml down'"
echo ""
