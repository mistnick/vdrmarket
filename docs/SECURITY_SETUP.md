# Security Enhancements - Setup Guide

This document explains how to complete the setup after the security enhancements have been implemented.

## Prerequisites

The security enhancements have been implemented in the codebase but require some setup steps to activate them fully.

## Step 1: Run Database Migration

The database schema has been updated with new security fields. You need to apply the migration:

```bash
# Option 1: If you have DATABASE_URL configured
npm run db:migrate

# Option 2: Using Docker (if running in containers)
docker-compose exec app npm run db:migrate

# Option 3: Manual migration
npx prisma migrate deploy
```

This will add the following fields:
- **Links table**: `maxViews`, `viewCount`, `allowedDomains`
- **Teams table**: `maxFileSize`, `allowedFileTypes`
- **Documents table**: `scanStatus`, `scanResult`

## Step 2: Regenerate Prisma Client

After the migration, regenerate the Prisma client to get TypeScript types for the new fields:

```bash
npx prisma generate
```

This will resolve the TypeScript lint errors you may see in the IDE.

## Step 3: Install Dependencies (Already Done)

The required packages are already installed:
- ✅ `file-type` - for MIME type verification
- ✅ `nanoid` - for secure token generation

## Step 4: Configure Malware Scanning (Optional)

The malware scanner is currently running in stub mode. To enable actual scanning:

### Option A: ClamAV (Open Source, Recommended)

1. Install ClamAV:
   ```bash
   # macOS
   brew install clamav
   
   # Ubuntu/Debian
   sudo apt-get install clamav clamav-daemon
   ```

2. Start ClamAV daemon:
   ```bash
   # macOS
   brew services start clamav
   
   # Linux
   sudo systemctl start clamav-daemon
   ```

3. Install Node.js client:
   ```bash
   npm install clamscan
   ```

4. Enable in environment:
   ```bash
   # Add to .env
   CLAMAV_ENABLED=true
   ```

5. Update `/lib/security/malware-scanner.ts` to use actual ClamAV (implementation commented in code)

### Option B: VirusTotal API (Cloud-based)

1. Get API key from https://www.virustotal.com/

2. Add to environment:
   ```bash
   # Add to .env
   VIRUSTOTAL_API_KEY=your_api_key_here
   ```

3. Install client (optional, for production implementation):
   ```bash
   npm install virustotal-api-client
   ```

### Option C: Skip Malware Scanning

If you don't configure a scanner, uploads will NOT be blocked. The `scanStatus` will be set to `'skipped'`.

## Step 5: Test the Implementation

### Test 1: Secure Token Generation

Links now use 128-bit tokens (22 characters) instead of 10 characters:
```
Old: /view/abc123def4
New: /view/V1StG XR8_Z5jdHi6B-myT
```

### Test 2: Link Expiration

Create a link without specifying expiration:
```bash
# The link will automatically expire in 7 days
```

### Test 3: Max Views Limit

Create a link with `maxViews`:
```json
{
  "documentId": "...",
  "maxViews": 5
}
```

Access the link 6 times - the 6th attempt should be denied.

### Test 4: Domain Restrictions

Create a link with domain restrictions:
```json
{
  "documentId": "...",
  "allowedDomains": ["company.com", "partner.com"]
}
```

Try accessing with email from different domain - should be denied.

### Test 5: File Upload Validation

Try uploading:
- ❌ `.exe` file → Should be rejected
- ❌ File > 100MB → Should be rejected (if default limit)
- ❌ File with `../../../etc/passwd` filename → Should be sanitized
- ✅ Valid PDF → Should be accepted

### Test 6: Malware Scanning (if enabled)

Upload the EICAR test file:
```
https://secure.eicar.org/eicar.com
```

Should be detected and blocked.

## Step 6: Update Frontend UI (Optional)

To allow users to configure the new security options, update the link creation dialog:

**File**: `/components/links/create-link-dialog.tsx`

Add form fields for:
- Max views (number input)
- Allowed domains (comma-separated text input)
- Expiration date (date picker with 7-day default)

Example implementation is provided in the implementation plan.

## Troubleshooting

### Issue: Prisma client errors

**Solution**: Make sure you ran `npx prisma generate` after the migration.

### Issue: File uploads fail with "validation error"

**Solution**: Check the error message - it will specify if it's a file type, size, or MIME verification issue. Adjust team settings in database if needed:

```sql
-- Increase file size limit to 500MB for a specific team
UPDATE teams SET "maxFileSize" = 524288000 WHERE id = 'team-id';

-- Add custom allowed file types
UPDATE teams SET "allowedFileTypes" = '["application/pdf", "image/png"]' WHERE id = 'team-id';
```

### Issue: Malware scanner not working

**Solution**: 
1. Check if ClamAV daemon is running: `clamd --version`
2. Check environment variable: `echo $CLAMAV_ENABLED`
3. Review logs for scanner errors

## Security Configuration Options

### Team-level Settings

Teams can customize:
- `maxFileSize`: Maximum file size in bytes (default: 100MB)
- `allowedFileTypes`: Custom whitelist of MIME types (default: use global whitelist)

### Link-level Settings

When creating links, you can now configure:
- `expiresAt`: Expiration date (default: 7 days from creation)
- `maxViews`: Maximum number of views (default: unlimited)
- `allowedDomains`: Email domain restrictions (default: none)
- `password`: Password protection (already existed)
- `allowedEmails`: Specific email whitelist (already existed)

## Monitoring

### Check scan results

```sql
-- Count documents by scan status
SELECT "scanStatus", COUNT(*) 
FROM documents 
GROUP BY "scanStatus";

-- Find infected files
SELECT id, name, "scanResult"
FROM documents  
WHERE "scanStatus" = 'infected';
```

### Check link usage

```sql
-- Find links approaching view limit
SELECT id, slug, name, "viewCount", "maxViews"
FROM links
WHERE "maxViews" IS NOT NULL 
AND "viewCount" >= "maxViews" - 5;

-- Find expiring links
SELECT id, slug, name, "expiresAt"
FROM links
WHERE "expiresAt" < NOW() + INTERVAL '24 hours'
AND "expiresAt" > NOW();
```

## Next Steps

1. **Apply migration** to database
2. **Regenerate Prisma client** for TypeScript types
3. **(Optional) Configure malware scanning**
4. **Test the implementation** with sample files and links
5. **(Optional) Update frontend UI** to expose new options to users
6. **Monitor** scan results and link usage

For questions or issues, review the implementation files:
- `/lib/security/token.ts` - Token generation
- `/lib/security/file-validation.ts` - File validation
- `/lib/security/malware-scanner.ts` - Malware scanning
- `/lib/security/link-access.ts` - Link access validation
