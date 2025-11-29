# Changelog - 29 Novembre 2025

## Version 3.0.0 - DataRoom-based Architecture

### 🏗️ Architecture Restructure

**Breaking Change**: Removed `Team` entity in favor of `DataRoom`-centric architecture.

#### Old Architecture
```
Team (root entity)
├── TeamMember
├── Documents
└── Folders
```

#### New Architecture
```
DataRoom (root entity)
├── Groups (ADMINISTRATOR, USER, CUSTOM)
│   └── GroupMembers (owner, admin, member, viewer)
├── Documents
│   ├── DocumentGroupPermission
│   └── DocumentUserPermission
├── Folders
│   ├── FolderGroupPermission
│   └── FolderUserPermission
└── UserInvitation
```

### ✅ Changes Made

#### API Routes Updated (~20+ files)
All API routes have been updated to use the new DataRoom-based architecture:

- `documents/[documentId]/download/route.ts`
- `documents/[documentId]/metadata/route.ts`
- `documents/[documentId]/move/route.ts`
- `documents/[documentId]/tags/[tagId]/route.ts`
- `documents/[documentId]/tags/route.ts`
- `documents/[documentId]/versions/[versionId]/download/route.ts`
- `documents/[documentId]/versions/[versionId]/restore/route.ts`
- `documents/[documentId]/versions/route.ts`
- `documents/[documentId]/view/route.ts`
- `documents/download-archive/route.ts`
- `folders/[folderId]/move/route.ts`
- `links/[slug]/route.ts`
- `links/route.ts`
- `notifications/preferences/route.ts`
- `public/[slug]/route.ts`
- `public/[slug]/security-event/route.ts`
- `public/[slug]/watermarked/route.ts`
- `user/delete-account/route.ts`
- `users/[userId]/permissions/route.ts`
- `users/me/route.ts`

#### Authorization Pattern Changed
```typescript
// OLD
const teamMember = await prisma.teamMember.findFirst({
  where: { userId, teamId: document.teamId }
});

// NEW
const groupMember = await prisma.groupMember.findFirst({
  where: {
    userId,
    group: { dataRoomId: document.dataRoomId }
  }
});
```

#### New Permission System
Implemented granular permissions at document/folder level:

```typescript
// Group Permissions
DocumentGroupPermission / FolderGroupPermission:
- canFence
- canView
- canDownloadEncrypted
- canDownloadPdf
- canDownloadOriginal
- canUpload
- canManage

// User Override Permissions
DocumentUserPermission / FolderUserPermission
```

### 📦 New Files

#### `prisma/seed-permissions.ts`
Complete permission seeding script with:
- `GROUP_PERMISSION_PRESETS` - Default permissions per group type
- `ROLE_PERMISSION_PRESETS` - Default permissions per role
- `ensureDefaultGroupsExist()` - Creates Admin/User groups
- `seedDefaultGroupPermissions()` - Applies permissions to documents/folders

Usage:
```bash
npm run db:seed:permissions
```

### 🐳 Docker Updates

#### `docker-compose.yml` (Development)
- Added version header and comments
- Added network configuration for all services
- Optimized MinIO healthcheck
- Simplified volume configuration

#### `docker-compose.production.yml`
- Updated header with architecture notes
- Added version 3.0.0 identifier

#### `Dockerfile`
- Updated to version 3.0.0
- Improved labels
- Changed from `npm install` to `npm ci` for reproducible builds

#### `scripts/deploy-production.sh`
- Updated to version 3.0.0
- Added `--skip-seed` option
- Fixed table name queries (lowercase for Prisma mapping)
- Added permission seeding step
- Updated verification queries

### 📚 Documentation Updated

#### `docs/00-PROJECT-STATUS.md`
Complete rewrite with:
- New architecture diagram
- Permission model documentation
- Updated project structure
- Recent changes log

#### `docs/DEPLOYMENT.md`
Complete update with:
- New Docker commands
- Permission seeding instructions
- VDR configuration guide
- Updated troubleshooting

### 🔧 package.json
Added new script:
```json
"db:seed:permissions": "tsx prisma/seed-permissions.ts"
```

### 🧹 Code Cleanup
- Removed all `Team` / `TeamMember` references
- Updated `emailTeamInvitation` → `emailDataRoomInvitation` in notification preferences
- Fixed `teams` → `groupMemberships` in user endpoints

---

## Migration Guide

### For Existing Deployments

1. **Backup Database**
```bash
docker exec dataroom-postgres pg_dump -U postgres dataroom > backup_pre_v3.sql
```

2. **Update Code**
```bash
git pull origin main
```

3. **Run Migrations**
```bash
npm run db:push
# Or for production:
docker exec dataroom-app npx prisma migrate deploy
```

4. **Seed Permissions**
```bash
npm run db:seed:permissions
# Or for production:
docker exec dataroom-app npm run db:seed:permissions
```

5. **Verify**
```bash
# Check groups created
docker exec dataroom-postgres psql -U postgres -d dataroom -c "SELECT * FROM groups;"

# Check permissions
docker exec dataroom-postgres psql -U postgres -d dataroom -c "SELECT COUNT(*) FROM document_group_permissions;"
```

### Breaking Changes

| Old | New | Action |
|-----|-----|--------|
| `Team` model | Removed | Use `DataRoom` |
| `TeamMember` model | Removed | Use `GroupMember` |
| `teamId` field | Removed | Use `dataRoomId` |
| `session.user.teamId` | Removed | Query via `groupMember` |

---

## Next Steps

1. Update frontend components for new architecture
2. Create Group management UI
3. Create Permission management UI
4. Complete user invitation workflow
5. Add E2E tests for new features

---

**Author**: GitHub Copilot (Claude Opus 4.5)  
**Date**: 29 Novembre 2025  
**Build Status**: ✅ Passing
