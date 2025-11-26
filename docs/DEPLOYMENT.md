# DataRoom - Deployment Guide

**Deployment Date**: 2025-11-20  
**Version**: Phase 1 - Core Infrastructure  
**Status**: ✅ Successfully Deployed

---

## 🎉 Deployment Summary

DataRoom Phase 1 has been successfully built and deployed using Docker Compose!

### Deployment Details
- **GitHub Repository**: https://github.com/mistnick/dataroom
- **Latest Commit**: Phase 1 - Core Infrastructure & Authentication
- **Build Time**: ~182 seconds
- **Containers**: 3 running (app, postgres, minio)
- **Status**: All healthy

---

## 🚀 Access URLs

### Application
- **Main App**: http://localhost:3000
- **Landing Page**: http://localhost:3000
- **Login**: http://localhost:3000/auth/login
- **Signup**: http://localhost:3000/auth/signup
- **Dashboard**: http://localhost:3000/dashboard (requires authentication)

### Services
- **PostgreSQL Database**: localhost:5433
  - Username: `postgres`
  - Password: `postgres`
  - Database: `dataroom`

- **MinIO (S3-compatible Storage)**: 
  - API: http://localhost:9100
  - Console: http://localhost:9101
  - Username: `minioadmin`
  - Password: `minioadmin`

---

## 📦 Running Containers

```
dataroom-app         - Next.js Application (port 3000)
dataroom-postgres    - PostgreSQL 16 Database (port 5433)
dataroom-minio       - MinIO S3 Storage (ports 9100, 9101)
```

All containers are configured with `restart: unless-stopped` for automatic recovery.

---

## 🔧 Docker Commands

### View Container Status
```bash
docker ps
docker-compose ps
```

### View Logs
```bash
# All containers
docker-compose logs -f

# Specific container
docker logs dataroom-app -f
docker logs dataroom-postgres -f
docker logs dataroom-minio -f
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart app
```

### Stop Services
```bash
docker-compose down
```

### Start Services
```bash
docker-compose up -d
```

### Rebuild and Deploy
```bash
docker-compose down
docker-compose up --build -d
```

---

## 🗄️ Database Management

### Access PostgreSQL
```bash
docker exec -it dataroom-postgres psql -U postgres -d dataroom
```

### Run Migrations
```bash
# From host
npm run db:migrate

# Inside container
docker exec -it dataroom-app npx prisma migrate deploy
```

### View Database with Prisma Studio
```bash
npm run db:studio
```

---

## 📁 MinIO Setup (First Time Only)

1. Open MinIO Console: http://localhost:9101
2. Login with `minioadmin` / `minioadmin`
3. Create bucket:
   - Click "Create Bucket"
   - Name: `dataroom`
   - Click "Create"
4. Configure in `.env`:
   ```env
   STORAGE_PROVIDER=s3
   AWS_ENDPOINT=http://minio:9000
   AWS_ACCESS_KEY_ID=minioadmin
   AWS_SECRET_ACCESS_KEY=minioadmin
   AWS_S3_BUCKET=dataroom
   AWS_REGION=us-east-1
   ```

---

## 🔐 OAuth Configuration (Optional)

To enable OAuth authentication, add credentials to `.env`:

### Google OAuth
1. Get credentials from [Google Cloud Console](https://console.cloud.google.com/)
2. Add to `.env`:
   ```env
   GOOGLE_CLIENT_ID="your_client_id"
   GOOGLE_CLIENT_SECRET="your_secret"
   ```

### Microsoft OAuth
1. Get credentials from [Azure Portal](https://portal.azure.com/)
2. Add to `.env`:
   ```env
   MICROSOFT_CLIENT_ID="your_client_id"
   MICROSOFT_CLIENT_SECRET="your_secret"
   MICROSOFT_TENANT_ID="your_tenant_id"
   ```

After adding credentials, restart the app container:
```bash
docker-compose restart app
```

---

## Testing the Deployment

### 1. Check Application Health
```bash
curl http://localhost:3000
# Should return HTML of landing page
```

### 2. Test Database Connection
```bash
docker exec -it dataroom-postgres pg_isready -U postgres
# Should return: localhost:5432 - accepting connections
```

### 3. Test MinIO
```bash
curl http://localhost:9100/minio/health/live
# Should return: OK
```

### 4. Create Test Account
1. Navigate to http://localhost:3000/auth/signup
2. Fill in name, email, password (min 8 characters)
3. Click "Create Account"
4. Login at http://localhost:3000/auth/login
5. Access dashboard at http://localhost:3000/dashboard

---

## 📊 Monitoring

### Check Container Health
```bash
docker inspect dataroom-postgres --format='{{.State.Health.Status}}'
# Should return: healthy
```

### View Resource Usage
```bash
docker stats
```

### Check Docker Disk Usage
```bash
docker system df
```

---

## 🐛 Troubleshooting

### App Container Won't Start
```bash
# View logs
docker logs dataroom-app

# Common issues:
# - Database not ready: Wait for postgres to be healthy
# - Environment variables missing: Check .env file
# - Port conflict: Change port in docker-compose.yml
```

### Database Connection Issues
```bash
# Check if postgres is healthy
docker ps

# Test connection from app container
docker exec -it dataroom-app npx prisma db push
```

### MinIO Not Accessible
```bash
# Check if container is running
docker ps | grep minio

# Restart MinIO
docker-compose restart minio
```

### Build Failures
```bash
# Clean rebuild
docker-compose down -v  # WARNING: This deletes data!
docker-compose up --build -d
```

---

## 🔄 Updating the Application

### Pull Latest Changes
```bash
git pull origin main
```

### Rebuild and Redeploy
```bash
docker-compose down
docker-compose up --build -d
```

### Run New Migrations
```bash
docker exec -it dataroom-app npx prisma migrate deploy
```

---

## 📝 Environment Variables

Key environment variables used in production:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/dataroom?schema=public

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-in-production
AUTH_SECRET=your-secret-key-change-in-production

# Storage
STORAGE_PROVIDER=s3
AWS_ENDPOINT=http://minio:9000
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_S3_BUCKET=dataroom
AWS_REGION=us-east-1

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🎯 Next Steps

1. **Test Authentication**:
   - Create a test account
   - Test OAuth providers (if configured)
   - Verify session persistence

2. **Configure MinIO**:
   - Create bucket
   - Test file upload (when implemented)

3. **Phase 2 Development**:
   - Start implementing document upload
   - Integrate storage providers
   - Build document management UI

4. **Production Deployment**:
   - Configure reverse proxy (nginx)
   - Setup HTTPS/SSL certificates
   - Configure production domain
   - Setup proper secrets
   - Configure backups

---

## 💾 Backup Strategy

### Database Backup
```bash
# Create backup
docker exec dataroom-postgres pg_dump -U postgres dataroom > backup_$(date +%Y%m%d).sql

# Restore backup
docker exec -i dataroom-postgres psql -U postgres dataroom < backup_20251120.sql
```

### MinIO Data Backup
```bash
# MinIO data is in Docker volume: minio_data
docker run --rm -v dataroom_minio_data:/data -v $(pwd):/backup alpine tar czf /backup/minio_backup.tar.gz -C /data .
```

---

## 📞 Support

- **Issues**: https://github.com/mistnick/dataroom/issues
- **Documentation**: `/docs` folder
- **Task Tracking**: `task.md`
- **Implementation Plan**: `implementation_plan.md`

---

**Last Updated**: 2025-11-20  
**Deployed Version**: Phase 1  
**Status**: 🟢 Running
