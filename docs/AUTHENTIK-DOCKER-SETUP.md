# Authentik Docker Setup Guide

This guide explains how to set up and configure Authentik for DataRoom authentication.

## 🚀 Quick Start

### 1. Start Services

```bash
# Start all services (Authentik, PostgreSQL, Redis, DataRoom)
docker-compose up -d

# Check logs
docker-compose logs -f authentik-server
```

### 2. Wait for Authentik to Initialize

Authentik takes a few minutes to initialize. Check when it's ready:

```bash
# Wait until you see "Application startup complete"
docker-compose logs -f authentik-server | grep "startup complete"
```

### 3. Configure Authentik Automatically

Run the setup script to automatically create the OAuth2 application:

```bash
./scripts/setup-authentik.sh
```

This script will:
- Create an OAuth2/OIDC Provider
- Create the DataRoom Application
- Configure redirect URIs
- Generate client credentials

### 4. Update .env File

Copy the credentials from the script output to your `.env` file:

```env
OAUTH_CLIENT_ID=dataroom-client
OAUTH_CLIENT_SECRET=<generated-secret>
OAUTH_ISSUER=http://localhost:9000/application/o/dataroom/
OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/callback
OAUTH_POST_LOGOUT_REDIRECT_URI=http://localhost:3000/auth/login
OAUTH_SCOPE=openid profile email
```

### 5. Access Authentik Admin Panel

- **URL**: http://localhost:9000
- **Email**: admin@dataroom.local
- **Password**: ChangeMe123! (or your AUTHENTIK_BOOTSTRAP_PASSWORD)

## 📋 Manual Configuration

If the automatic script fails, configure manually:

### Step 1: Create OAuth2 Provider

1. Go to http://localhost:9000/if/admin/
2. Navigate to **Applications** → **Providers** → **Create**
3. Select **OAuth2/OpenID Provider**
4. Configure:
   - **Name**: DataRoom OAuth2 Provider
   - **Client Type**: Confidential
   - **Client ID**: dataroom-client
   - **Redirect URIs**: 
     ```
     http://localhost:3000/api/auth/callback
     http://localhost:3000/auth/login
     ```
   - **Signing Key**: authentik Self-signed Certificate
5. Click **Create**
6. Copy the **Client Secret**

### Step 2: Create Application

1. Navigate to **Applications** → **Applications** → **Create**
2. Configure:
   - **Name**: DataRoom
   - **Slug**: dataroom
   - **Provider**: DataRoom OAuth2 Provider
   - **Launch URL**: http://localhost:3000
3. Click **Create**

### Step 3: Create Test User

1. Navigate to **Directory** → **Users** → **Create**
2. Fill in:
   - **Username**: testuser
   - **Email**: testuser@dataroom.local
   - **Name**: Test User
3. Set a password
4. Click **Create**

## 🔧 Environment Variables

### Required Variables

```env
# Authentik Configuration
AUTHENTIK_SECRET_KEY=super-secret-key-change-in-production
AUTHENTIK_BOOTSTRAP_PASSWORD=ChangeMe123!
AUTHENTIK_BOOTSTRAP_EMAIL=admin@dataroom.local
AUTHENTIK_BOOTSTRAP_TOKEN=bootstrap-token-change-me

# DataRoom OAuth Configuration
OAUTH_CLIENT_ID=dataroom-client
OAUTH_CLIENT_SECRET=<from-authentik>
OAUTH_ISSUER=http://localhost:9000/application/o/dataroom/
OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/callback
OAUTH_POST_LOGOUT_REDIRECT_URI=http://localhost:3000/auth/login
OAUTH_SCOPE=openid profile email
```

## 🧪 Testing Authentication

### Test Login Flow

1. Start DataRoom: `npm run dev`
2. Navigate to http://localhost:3000
3. Click "Sign In with SSO"
4. You'll be redirected to Authentik
5. Login with your Authentik credentials
6. Authorize the application
7. You'll be redirected back to DataRoom

### Test Logout

1. Navigate to http://localhost:3000/auth/logout
2. You'll be logged out from both DataRoom and Authentik

## 📊 Service Ports

- **DataRoom App**: http://localhost:3000
- **Authentik**: http://localhost:9000
- **PostgreSQL**: localhost:5433
- **MinIO Console**: http://localhost:9101
- **MinIO API**: http://localhost:9100

## 🔍 Troubleshooting

### Authentik Not Starting

```bash
# Check logs
docker-compose logs authentik-server

# Common issues:
# 1. Port 9000 already in use
# 2. PostgreSQL not ready
# 3. Redis not ready
```

### Authentication Fails

1. **Check OAuth Configuration**:
   ```bash
   curl http://localhost:9000/application/o/dataroom/.well-known/openid-configuration
   ```

2. **Verify Redirect URIs**: Make sure they match exactly in Authentik

3. **Check Client Secret**: Ensure it's correctly set in `.env`

4. **Review Logs**:
   ```bash
   docker-compose logs -f authentik-server
   docker-compose logs -f app
   ```

### Reset Authentik

```bash
# Stop services
docker-compose down

# Remove volumes (WARNING: This deletes all data)
docker-compose down -v

# Start fresh
docker-compose up -d
./scripts/setup-authentik.sh
```

## 🔐 Security Considerations

### Production Deployment

1. **Change Default Passwords**:
   - AUTHENTIK_SECRET_KEY
   - AUTHENTIK_BOOTSTRAP_PASSWORD
   - Database passwords

2. **Use HTTPS**:
   - Configure reverse proxy (nginx/traefik)
   - Update OAUTH_ISSUER to https://
   - Update redirect URIs to https://

3. **Network Isolation**:
   - Don't expose PostgreSQL/Redis ports
   - Use Docker networks

4. **Environment Variables**:
   - Use Docker secrets or vault
   - Don't commit .env to git

### Recommended Production Setup

```yaml
# docker-compose.prod.yml
services:
  authentik-server:
    environment:
      AUTHENTIK_SECRET_KEY: ${AUTHENTIK_SECRET_KEY}  # From vault
      AUTHENTIK_ERROR_REPORTING__ENABLED: "true"
      AUTHENTIK_LOG_LEVEL: warning
    # Remove port exposure, use reverse proxy
```

## 📚 Additional Resources

- [Authentik Documentation](https://docs.goauthentik.io/)
- [OAuth2/OIDC Spec](https://openid.net/connect/)
- [DataRoom Auth Implementation](./AUTHENTIK-SETUP.md)

## 🆘 Support

If you encounter issues:

1. Check [Authentik Discussions](https://github.com/goauthentik/authentik/discussions)
2. Review DataRoom logs: `docker-compose logs app`
3. Check Authentik logs: `docker-compose logs authentik-server`
4. Open an issue on GitHub
