# DataRoom VDR - Deployment Guide

**Version**: 3.0.0 - DataRoom-based Architecture  
**Last Updated**: 2025-11-29  
**Status**: ✅ Production Ready

---

## 🎉 Deployment Summary

DataRoom VDR uses a DataRoom-centric architecture where:
- **DataRoom** is the root container (replaces Team)
- **Groups** manage user access (ADMINISTRATOR, USER, CUSTOM)
- **Permissions** are granular at document/folder level

---

## 🚀 Quick Deploy

### Development
```bash
# Start all services
docker-compose up -d

# Run migrations
npm run db:push

# Seed database
npm run db:seed
npm run db:seed:permissions
```

### Production
```bash
# Full deployment with SSL
./scripts/deploy-production.sh

# Or skip SSL (if already configured)
./scripts/deploy-production.sh --skip-ssl
```

---

## 🐳 Docker Services

### Development (`docker-compose.yml`)
| Service | Port | Description |
|---------|------|-------------|
| postgres | 5433 | PostgreSQL 16 database |
| redis | 6379 | Cache & session store |
| minio | 9100/9101 | S3-compatible storage |
| app | 3000 | Next.js application |

### Production (`docker-compose.production.yml`)
| Service | Port | Description |
|---------|------|-------------|
| postgres | - | PostgreSQL 16 (internal) |
| redis | - | Redis 7 (internal) |
| app | - | Next.js (internal) |
| nginx | 80/443 | Reverse proxy + SSL |
| certbot | - | SSL certificate renewal |

---

## 📦 Access URLs

### Development
- **App**: http://localhost:3000
- **MinIO Console**: http://localhost:9101
- **PostgreSQL**: localhost:5433

### Production
- **Website**: https://www.simplevdr.com
- **API Health**: https://www.simplevdr.com/api/health

---

## 🔧 Docker Commands

```bash
# View status
docker-compose ps

# View logs
docker-compose logs -f app
docker-compose logs -f postgres

# Restart services
docker-compose restart app

# Stop everything
docker-compose down

# Rebuild
docker-compose up --build -d

# Production commands
docker-compose -f docker-compose.production.yml ps
docker-compose -f docker-compose.production.yml logs -f
```

---

## 🗄️ Database Management

### Access PostgreSQL
```bash
# Development
docker exec -it dataroom-postgres psql -U postgres -d dataroom

# Production
docker exec -it dataroom-postgres psql -U ${POSTGRES_USER} -d ${POSTGRES_DB}
```

### Run Migrations
```bash
# Development
npm run db:push
npm run db:migrate

# Production (inside container)
docker exec dataroom-app npx prisma migrate deploy
```

### Seed Database
```bash
# Seed users and data rooms
npm run db:seed

# Seed groups and permissions
npm run db:seed:permissions
```

### Backup & Restore
```bash
# Backup
docker exec dataroom-postgres pg_dump -U postgres dataroom > backup_$(date +%Y%m%d).sql

# Restore
docker exec -i dataroom-postgres psql -U postgres dataroom < backup.sql
```

---

## 🔐 VDR Configuration

### Default Groups
When running `npm run db:seed:permissions`, the following groups are created for each DataRoom:

1. **Administrators** (type: ADMINISTRATOR)
   - Full access to all features
   - All permissions enabled

2. **Users** (type: USER)
   - View and download access
   - Limited upload capability

### Permission Flags
| Flag | Description |
|------|-------------|
| canFence | Restrict access to specific sections |
| canView | View documents/folders |
| canDownloadEncrypted | Download encrypted versions |
| canDownloadPdf | Download as PDF |
| canDownloadOriginal | Download original files |
| canUpload | Upload new documents |
| canManage | Full management access |

---

## 📁 MinIO Setup (Development)

1. Open MinIO Console: http://localhost:9101
2. Login: `minioadmin` / `minioadmin`
3. Create bucket: `dataroom`
4. Configure in `.env`:
```env
STORAGE_PROVIDER=s3
AWS_ENDPOINT=http://minio:9000
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_S3_BUCKET=dataroom
```

---

## 🔒 SSL Setup (Production)

### Automatic (via deploy script)
```bash
./scripts/deploy-production.sh
# SSL certificates are automatically obtained via Let's Encrypt
```

### Manual
```bash
# Force SSL regeneration
./scripts/deploy-production.sh --force-ssl

# Skip SSL (use existing)
./scripts/deploy-production.sh --skip-ssl
```

Certificates are stored in:
- `nginx/certs/fullchain.pem`
- `nginx/certs/privkey.pem`

---

## 📝 Environment Variables

### Required (Production)
```env
# Database
DATABASE_URL=postgresql://user:pass@postgres:5432/dataroom
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<secure-password>
POSTGRES_DB=dataroom

# Auth
NEXTAUTH_URL=https://www.simplevdr.com
NEXTAUTH_SECRET=<32-char-random-string>
AUTH_SECRET=<32-char-random-string>

# Redis
REDIS_URL=redis://:password@redis:6379
REDIS_PASSWORD=<secure-password>
```

### Storage (S3/Aruba)
```env
STORAGE_PROVIDER=s3
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
AWS_S3_BUCKET=dataroom
AWS_ENDPOINT=<endpoint>  # Optional for S3-compatible
```

### Email (Optional)
```env
RESEND_API_KEY=<key>
EMAIL_FROM=noreply@simplevdr.com
```

---

## 🐛 Troubleshooting

### App Won't Start
```bash
# Check logs
docker logs dataroom-app

# Common fixes:
# 1. Wait for database
docker-compose restart app

# 2. Run migrations
docker exec dataroom-app npx prisma migrate deploy

# 3. Regenerate Prisma client
docker exec dataroom-app npx prisma generate
```

### Database Connection Issues
```bash
# Check if postgres is healthy
docker ps | grep postgres

# Test connection
docker exec dataroom-postgres pg_isready -U postgres
```

### Permission Errors
```bash
# Re-run permission seeding
docker exec dataroom-app npm run db:seed:permissions

# Check groups exist
docker exec dataroom-postgres psql -U postgres -d dataroom -c "SELECT * FROM groups;"
```

---

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Resource Usage
```bash
docker stats
```

### Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
```

---

## 🔄 Update Procedure

```bash
# 1. Pull latest code
git pull origin main

# 2. Rebuild and restart
docker-compose down
docker-compose up --build -d

# 3. Run migrations
docker exec dataroom-app npx prisma migrate deploy

# 4. Verify health
curl http://localhost:3000/api/health
```

---

**Status**: 🟢 Production Ready  
**Docker Version**: 3.0.0  
**Last Deploy**: 2025-11-29
