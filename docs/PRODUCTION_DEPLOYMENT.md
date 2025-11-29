# Docker Production Optimization

## Changes Made

### Dockerfile Optimizations

1. **Multi-Stage Build Improvements**
   - Cleaner stage separation
   - Better layer caching
   - Smaller final image size

2. **Security Enhancements**
   - Non-root user (nextjs:nodejs)
   - dumb-init for proper signal handling
   - Minimal runtime dependencies
   - No development dependencies in production

3. **Performance Optimizations**
   - Increased Node.js memory limit (4GB)
   - Removed unnecessary cache files
   - Optimized healthcheck settings
   - Better wget-based healthcheck

4. **Size Reduction**
   - npm prune --production
   - Removed test files
   - Cleaned build artifacts
   - Removed cache directories

### Deployment Script Updates

1. **VDR System Integration**
   - Verification of 9 VDR tables
   - Check for User/DataRoom extensions
   - Administrator group verification
   - VDR migration status checks

2. **Enhanced Health Checks**
   - VDR table count verification
   - Schema extension validation
   - Migration status reporting

3. **Improved Deployment Summary**
   - VDR system status display
   - VDR-specific URLs and commands
   - Admin guide references
   - Post-deployment checklist

4. **Better Error Handling**
   - Detailed migration status
   - Table verification warnings
   - Clear next steps

## Production Deployment

### Prerequisites

```bash
# Ensure .env.production is configured
cp .env.production.example .env.production

# Edit with your values
nano .env.production
```

### Deploy

```bash
# Full deployment with SSL
./scripts/deploy-production.sh

# Skip SSL (if already configured)
./scripts/deploy-production.sh --skip-ssl

# Skip build (use existing image)
./scripts/deploy-production.sh --skip-build
```

### Post-Deployment

1. **Create Administrator Group**
   - Navigate to each data room
   - Go to VDR tab
   - Create ADMINISTRATOR group

2. **Invite Administrators**
   - Use "Invite User" button
   - Assign to ADMINISTRATOR group
   - Users receive email with activation link

3. **Configure Email Service**
   - Set SMTP settings in .env.production
   - Test with user invitation
   - Check logs for email sending

4. **Verify VDR System**
   - Check `/docs/VDR_README.md`
   - Test group creation
   - Test user invitation
   - Test permission assignment

## Monitoring

### Container Logs

```bash
# All services
docker-compose -f docker-compose.production.yml logs -f

# Specific service
docker logs dataroom-app -f
```

### VDR Health

```bash
# Check VDR tables
docker exec dataroom-postgres psql -U postgres -d dataroom -c "
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name LIKE '%Group%' OR table_name LIKE '%Permission%'
  ORDER BY table_name;
"

# Check admin groups
docker exec dataroom-postgres psql -U postgres -d dataroom -c "
  SELECT id, name, type, \"dataRoomId\" 
  FROM \"Group\" 
  WHERE type = 'ADMINISTRATOR';
"
```

### Performance

```bash
# Container stats
docker stats

# Application metrics
docker exec dataroom-app wget -qO- http://localhost:3000/api/health
```

## Troubleshooting

### VDR Tables Missing

```bash
# Check migration status
docker exec dataroom-app npx prisma migrate status

# Apply migrations
docker exec dataroom-app npx prisma migrate deploy

# Regenerate client
docker exec dataroom-app npx prisma generate
```

### Email Not Sending

1. Check SMTP configuration in .env.production
2. Verify EMAIL_PROVIDER is set to "smtp"
3. Check application logs for email errors
4. Test SMTP connection from container

```bash
docker exec dataroom-app node -e "
const nodemailer = require('nodemailer');
const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});
transport.verify().then(console.log).catch(console.error);
"
```

### Performance Issues

1. Check Node.js memory: `NODE_OPTIONS="--max-old-space-size=4096"`
2. Monitor container resources: `docker stats`
3. Check database connections: `docker exec dataroom-postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"`
4. Review application logs for errors

## Security Checklist

- [ ] Non-root user in containers
- [ ] Environment variables in .env.production (not committed)
- [ ] SSL certificates configured and valid
- [ ] Database backups scheduled
- [ ] 2FA enabled for administrators
- [ ] IP restrictions configured (if needed)
- [ ] Rate limiting enabled (if needed)
- [ ] Security headers configured in Nginx
- [ ] CORS properly configured
- [ ] File upload size limits set

## Backup Strategy

### Database Backup

```bash
# Manual backup
docker exec dataroom-postgres pg_dump -U postgres dataroom > backup-$(date +%Y%m%d-%H%M%S).sql

# Restore
docker exec -i dataroom-postgres psql -U postgres dataroom < backup.sql
```

### Automated Backups

Add to crontab:

```bash
# Daily backup at 2 AM
0 2 * * * /path/to/scripts/backup-database.sh
```

### File Storage Backup

```bash
# Backup uploads (if local storage)
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz /path/to/uploads

# Or use cloud backup (AWS S3, Azure Blob, etc.)
```

## Performance Tuning

### Node.js

- `NODE_OPTIONS="--max-old-space-size=4096"` (already set)
- Adjust based on available memory

### PostgreSQL

Edit `docker-compose.production.yml`:

```yaml
postgres:
  command:
    - "postgres"
    - "-c"
    - "max_connections=200"
    - "-c"
    - "shared_buffers=256MB"
    - "-c"
    - "effective_cache_size=1GB"
```

### Redis

```yaml
redis:
  command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
```

## Updates and Maintenance

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and deploy
./scripts/deploy-production.sh --force-ssl

# Or skip SSL if already configured
./scripts/deploy-production.sh --skip-ssl
```

### Update Dependencies

```bash
# Update npm packages
npm update

# Rebuild containers
docker-compose -f docker-compose.production.yml build --no-cache

# Deploy
docker-compose -f docker-compose.production.yml up -d
```

### SSL Certificate Renewal

Certificates auto-renew via certbot. Manual renewal:

```bash
./scripts/deploy-production.sh --force-ssl
```
